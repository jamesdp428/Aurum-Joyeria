// ===== CARRITO DE COMPRAS - VERSIÓN GITHUB PAGES =====

class CarritoCompras {
  constructor() {
    this.productos = this.cargarCarrito();
    this.baseUrl = this.detectarBaseUrl();
    console.log('🌐 Base URL detectada:', this.baseUrl);
    this.init();
  }

  // ===== DETECCIÓN DE BASE URL PARA GITHUB PAGES =====
  detectarBaseUrl() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    console.log('Debug - Hostname:', hostname);
    console.log('Debug - Pathname:', pathname);
    
    // Si estamos en GitHub Pages
    if (hostname.includes('github.io')) {
      // Extraer el nombre del repositorio
      const pathParts = pathname.split('/').filter(part => part !== '');
      if (pathParts.length > 0) {
        const repoName = pathParts[0];
        return `https://${hostname}/${repoName}`;
      }
    }
    
    // Si estamos en localhost o dominio personalizado
    const origin = window.location.origin;
    return origin;
  }

  init() {
    this.actualizarContadorNavbar();
    this.renderizarCarrito();
    this.configurarEventListeners();
  }

  // ===== GESTIÓN DEL STORAGE =====
  cargarCarrito() {
    try {
      const carritoGuardado = localStorage.getItem('aurum_carrito');
      return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    } catch (error) {
      console.error('Error al cargar carrito:', error);
      return [];
    }
  }

  guardarCarrito() {
    try {
      localStorage.setItem('aurum_carrito', JSON.stringify(this.productos));
      this.actualizarContadorNavbar();
    } catch (error) {
      console.error('Error al guardar carrito:', error);
    }
  }

  // ===== FUNCIÓN ESPECÍFICA PARA RUTAS EN GITHUB PAGES =====
  corregirRutaImagen(imagenPath) {
    // Si no hay imagen, usar placeholder
    if (!imagenPath) {
      return this.getPlaceholderUrl();
    }
    
    // Si ya es una URL completa, no modificar
    if (imagenPath.startsWith('http') || 
        imagenPath.startsWith('data:') || 
        imagenPath.startsWith('blob:')) {
      return imagenPath;
    }
    
    const currentPath = window.location.pathname;
    const isCarritoPage = currentPath.includes('carrito.html');
    
    console.log('🖼️ Procesando imagen:', imagenPath);
    console.log('📍 Estamos en carrito:', isCarritoPage);
    
    // Construir URL absoluta basada en la base URL
    let rutaFinal;
    
    if (isCarritoPage) {
      // Desde carrito.html (/html/carrito.html), subir al root y entrar a img/
      if (imagenPath.startsWith('img/')) {
        rutaFinal = `${this.baseUrl}/${imagenPath}`;
      } else if (imagenPath.startsWith('../img/')) {
        rutaFinal = `${this.baseUrl}/${imagenPath.substring(3)}`;
      } else if (imagenPath.startsWith('./img/')) {
        rutaFinal = `${this.baseUrl}/${imagenPath.substring(2)}`;
      } else {
        // Asumir que es una ruta relativa desde root
        rutaFinal = `${this.baseUrl}/img/${imagenPath}`;
      }
    } else {
      // Desde otras páginas
      if (imagenPath.startsWith('img/')) {
        rutaFinal = `${this.baseUrl}/${imagenPath}`;
      } else {
        rutaFinal = `${this.baseUrl}/img/${imagenPath}`;
      }
    }
    
    console.log('✅ URL final de imagen:', rutaFinal);
    return rutaFinal;
  }

  // ===== PLACEHOLDER URL =====
  getPlaceholderUrl() {
    return `${this.baseUrl}/img/placeholder.jpg`;
  }

  // ===== SVG PLACEHOLDER MEJORADO =====
  createSVGPlaceholder(width = 120, height = 100, text = 'Sin imagen') {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" stroke="#f9dc5e" stroke-width="1" rx="8"/>
        <text x="50%" y="40%" text-anchor="middle" fill="#f9dc5e" font-family="Arial, sans-serif" font-size="20">
          🖼️
        </text>
        <text x="50%" y="65%" text-anchor="middle" fill="#ccc" font-family="Arial, sans-serif" font-size="8">
          ${text}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  }

  // ===== VERIFICACIÓN DE IMAGEN CON MÚLTIPLES INTENTOS =====
  async verificarImagen(url) {
    const intentos = [
      url,
      url.replace(/\.(jpg|jpeg|png|gif)$/i, '.jpg'),
      url.replace(/\.(jpg|jpeg|png|gif)$/i, '.jpeg'),
      url.replace(/\.(jpg|jpeg|png|gif)$/i, '.png'),
      url.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp')
    ];

    for (let intento of intentos) {
      try {
        const response = await fetch(intento, { method: 'HEAD' });
        if (response.ok) {
          console.log('✅ Imagen encontrada:', intento);
          return intento;
        }
      } catch (error) {
        console.log('❌ Fallo al verificar:', intento);
      }
    }
    
    console.log('🚫 Ninguna variante de imagen encontrada para:', url);
    return null;
  }

  // ===== OPERACIONES DEL CARRITO =====
  agregarProducto(producto, cantidad = 1) {
    const productoExistente = this.productos.find(p => p.id === producto.id);
    
    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + cantidad;
      
      if (nuevaCantidad > producto.stock) {
        this.mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'error');
        return false;
      }
      
      productoExistente.cantidad = nuevaCantidad;
    } else {
      if (cantidad > producto.stock) {
        this.mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'error');
        return false;
      }
      
      this.productos.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        imagen: producto.imagen,
        precio: producto.precio || 0,
        stock: producto.stock,
        categoria: producto.categoria,
        cantidad: cantidad
      });
    }

    this.guardarCarrito();
    this.renderizarCarrito();
    this.mostrarNotificacion(`${producto.nombre} agregado al carrito`, 'success');
    return true;
  }

  actualizarCantidad(id, nuevaCantidad) {
    const producto = this.productos.find(p => p.id === id);
    
    if (!producto) return;

    if (nuevaCantidad <= 0) {
      this.eliminarProducto(id);
      return;
    }

    if (nuevaCantidad > producto.stock) {
      this.mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'error');
      return;
    }

    producto.cantidad = nuevaCantidad;
    this.guardarCarrito();
    this.renderizarCarrito();
  }

  eliminarProducto(id) {
    const indice = this.productos.findIndex(p => p.id === id);
    
    if (indice !== -1) {
      const producto = this.productos[indice];
      this.productos.splice(indice, 1);
      this.guardarCarrito();
      this.renderizarCarrito();
      this.mostrarNotificacion(`${producto.nombre} eliminado del carrito`, 'success');
    }
  }

  vaciarCarrito() {
    if (this.productos.length === 0) return;
    
    if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
      this.productos = [];
      this.guardarCarrito();
      this.renderizarCarrito();
      this.mostrarNotificacion('Carrito vaciado', 'success');
    }
  }

  // ===== CÁLCULOS =====
  obtenerTotalProductos() {
    return this.productos.reduce((total, producto) => total + producto.cantidad, 0);
  }

  // ===== RENDERIZADO =====
  renderizarCarrito() {
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoConProductos = document.getElementById('carritoConProductos');
    const carritoResumen = document.getElementById('carritoResumen');
    const listaProductos = document.getElementById('listaProductos');

    if (this.productos.length === 0) {
      if (carritoVacio) carritoVacio.style.display = 'block';
      if (carritoConProductos) carritoConProductos.style.display = 'none';
      if (carritoResumen) carritoResumen.style.display = 'none';
    } else {
      if (carritoVacio) carritoVacio.style.display = 'none';
      if (carritoConProductos) carritoConProductos.style.display = 'block';
      if (carritoResumen) carritoResumen.style.display = 'block';

      if (listaProductos) {
        listaProductos.innerHTML = this.productos.map(producto => this.renderizarProducto(producto)).join('');
      }

      this.actualizarResumen();
      
      // Setup de imágenes después del render
      setTimeout(() => this.setupImagenes(), 100);
    }
  }

  // ===== SETUP DE IMÁGENES MEJORADO =====
  async setupImagenes() {
    const imagenes = document.querySelectorAll('.producto-imagen');
    
    console.log(`🖼️ Configurando ${imagenes.length} imágenes...`);
    
    for (let img of imagenes) {
      const imagenOriginal = img.dataset.originalSrc;
      console.log(`🔍 Procesando: ${imagenOriginal}`);
      
      if (imagenOriginal) {
        const urlCorregida = this.corregirRutaImagen(imagenOriginal);
        console.log(`📍 URL corregida: ${urlCorregida}`);
        
        // Verificar si la imagen existe
        const urlVerificada = await this.verificarImagen(urlCorregida);
        
        if (urlVerificada) {
          this.cargarImagen(img, urlVerificada);
        } else {
          console.log('❌ Imagen no encontrada, usando placeholder');
          img.src = this.createSVGPlaceholder(120, 100, 'No disponible');
          img.classList.add('error');
        }
      }
    }
  }

  // ===== CARGA DE IMAGEN =====
  cargarImagen(imgElement, url) {
    const tempImg = new Image();
    
    tempImg.onload = () => {
      console.log('✅ Imagen cargada exitosamente:', url);
      imgElement.src = url;
      imgElement.classList.remove('loading');
      imgElement.classList.add('loaded');
    };
    
    tempImg.onerror = () => {
      console.log('❌ Error al cargar imagen:', url);
      imgElement.src = this.createSVGPlaceholder(120, 100, 'Error al cargar');
      imgElement.classList.remove('loading');
      imgElement.classList.add('error');
    };
    
    // Timeout de seguridad
    setTimeout(() => {
      if (!imgElement.classList.contains('loaded')) {
        console.log('⏰ Timeout en carga de imagen:', url);
        imgElement.src = this.createSVGPlaceholder(120, 100, 'Timeout');
        imgElement.classList.remove('loading');
        imgElement.classList.add('error');
      }
    }, 10000); // 10 segundos
    
    tempImg.src = url;
  }

  renderizarProducto(producto) {
    return `
      <div class="producto-carrito" data-id="${producto.id}">
        <img src="${this.createSVGPlaceholder(120, 100, 'Cargando...')}" 
             data-original-src="${producto.imagen || ''}"
             alt="${producto.nombre}" 
             class="producto-imagen loading" />
        
        <div class="producto-info">
          <h4 class="producto-nombre">${producto.nombre}</h4>
          <p class="producto-descripcion">${producto.descripcion || 'Descripción no disponible'}</p>
          <p class="producto-precio">Consultar precio por WhatsApp</p>
        </div>

        <div class="producto-controles">
          <div class="cantidad-control-carrito">
            <button type="button" onclick="carrito.actualizarCantidad(${producto.id}, ${producto.cantidad - 1})" 
                    ${producto.cantidad <= 1 ? 'disabled' : ''}>-</button>
            <input type="number" 
                   value="${producto.cantidad}" 
                   min="1" 
                   max="${producto.stock}"
                   onchange="carrito.actualizarCantidad(${producto.id}, parseInt(this.value) || 1)"
                   onblur="if(!this.value || this.value < 1) this.value = 1">
            <button type="button" onclick="carrito.actualizarCantidad(${producto.id}, ${producto.cantidad + 1})"
                    ${producto.cantidad >= producto.stock ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn-eliminar" onclick="carrito.eliminarProducto(${producto.id})">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }

  actualizarResumen() {
    const totalProductos = this.obtenerTotalProductos();
    
    const totalProductosElement = document.getElementById('totalProductos');
    const subtotalElement = document.getElementById('subtotal');
    const totalFinalElement = document.getElementById('totalFinal');

    if (totalProductosElement) {
      totalProductosElement.textContent = totalProductos;
    }

    if (subtotalElement) {
      subtotalElement.textContent = 'Consultar por WhatsApp';
    }

    if (totalFinalElement) {
      totalFinalElement.innerHTML = '<strong>Consultar por WhatsApp</strong>';
    }
  }

  // ===== CONTADOR EN NAVBAR =====
  actualizarContadorNavbar() {
    const contadores = document.querySelectorAll('#carritoContador, .carrito-contador');
    const total = this.obtenerTotalProductos();
    
    contadores.forEach(contador => {
      if (total > 0) {
        contador.textContent = total > 99 ? '99+' : total;
        contador.style.display = 'flex';
      } else {
        contador.style.display = 'none';
      }
    });
  }

  // ===== EVENT LISTENERS =====
  configurarEventListeners() {
    const btnVaciar = document.getElementById('vaciarCarrito');
    if (btnVaciar) {
      btnVaciar.addEventListener('click', () => this.vaciarCarrito());
    }

    const btnProceder = document.getElementById('procederCompra');
    if (btnProceder) {
      btnProceder.addEventListener('click', () => this.procederWhatsApp());
    }

    const btnContinuar = document.getElementById('continuarComprando');
    if (btnContinuar) {
      btnContinuar.addEventListener('click', () => {
        window.location.href = `${this.baseUrl}/index.html`;
      });
    }
  }

  // ===== WHATSAPP =====
  procederWhatsApp() {
    if (this.productos.length === 0) {
      this.mostrarNotificacion('El carrito está vacío', 'error');
      return;
    }

    let mensaje = '¡Hola! Me interesa realizar un pedido:\n\n';
    
    this.productos.forEach((producto, index) => {
      mensaje += `${index + 1}. ${producto.nombre}\n`;
      mensaje += `   Cantidad: ${producto.cantidad}\n`;
      mensaje += `   Categoría: ${producto.categoria}\n\n`;
    });

    mensaje += `Total de productos: ${this.obtenerTotalProductos()}\n\n`;
    mensaje += '¿Podrías confirmar disponibilidad y precio total?\n\n';
    mensaje += '¡Gracias! 😊';

    const url = `https://wa.me/573217798612?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  }

  // ===== NOTIFICACIONES =====
  mostrarNotificacion(mensaje, tipo = 'success') {
    const notificacionExistente = document.querySelector('.notificacion');
    if (notificacionExistente) {
      notificacionExistente.remove();
    }

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    notificacion.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(45deg, ${tipo === 'success' ? '#4caf50, #45a049' : '#ff4757, #ff3838'});
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: bold;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 300px;
      font-family: 'Roboto Condensed', sans-serif;
    `;
    
    notificacion.textContent = mensaje;
    document.body.appendChild(notificacion);

    setTimeout(() => notificacion.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
      notificacion.style.transform = 'translateX(100%)';
      setTimeout(() => notificacion.parentNode?.remove(), 300);
    }, 3000);
  }
}

// ===== FUNCIONES GLOBALES =====

window.agregarAlCarrito = function(idProducto, cantidad = 1) {
  const baseUrl = window.carrito?.baseUrl || window.location.origin;
  const currentPath = window.location.pathname;
  
  let productosPath;
  if (currentPath.includes('/html/categorias/')) {
    productosPath = `${baseUrl}/data/productos.json`;
  } else if (currentPath.includes('/html/')) {
    productosPath = `${baseUrl}/data/productos.json`;
  } else {
    productosPath = `${baseUrl}/data/productos.json`;
  }

  console.log('📦 Cargando productos desde:', productosPath);

  fetch(productosPath)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(productos => {
      const producto = productos.find(p => p.id === parseInt(idProducto));
      if (producto && window.carrito) {
        return window.carrito.agregarProducto(producto, cantidad);
      }
      throw new Error('Producto no encontrado');
    })
    .catch(error => {
      console.error('Error al agregar al carrito:', error);
      if (window.mostrarNotificacionGlobal) {
        window.mostrarNotificacionGlobal('Error al agregar producto al carrito', 'error');
      }
    });
};

window.obtenerTotalCarrito = function() {
  try {
    const carritoGuardado = localStorage.getItem('aurum_carrito');
    if (!carritoGuardado) return 0;
    
    const productos = JSON.parse(carritoGuardado);
    return productos.reduce((total, producto) => total + producto.cantidad, 0);
  } catch (error) {
    console.error('Error al obtener total del carrito:', error);
    return 0;
  }
};

window.actualizarContadorCarrito = function() {
  const total = window.obtenerTotalCarrito();
  const contadores = document.querySelectorAll('#carritoContador, .carrito-contador');
  
  contadores.forEach(contador => {
    if (total > 0) {
      contador.textContent = total > 99 ? '99+' : total;
      contador.style.display = 'flex';
    } else {
      contador.style.display = 'none';
    }
  });
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  window.carrito = new CarritoCompras();
  
  console.log('🚀 Carrito inicializado');
  console.log('🌐 Base URL:', window.carrito.baseUrl);
  console.log('📦 Productos:', window.carrito.productos.length);
  
  window.actualizarContadorCarrito();
});

window.CarritoCompras = CarritoCompras;