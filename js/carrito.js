// ===== CARRITO DE COMPRAS - VERSIÓN ESPECÍFICA PARA AURUM JOYERÍA =====

class CarritoCompras {
  constructor() {
    this.productos = this.cargarCarrito();
    this.baseUrl = 'https://jamesdp428.github.io/Aurum-Joyeria'; // URL fija para tu proyecto
    console.log('🌐 Base URL configurada:', this.baseUrl);
    this.init();
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

  // ===== FUNCIÓN ESPECÍFICA PARA TU ESTRUCTURA =====
  corregirRutaImagen(imagenPath) {
    if (!imagenPath) {
      return this.createSVGPlaceholder(120, 100, 'Sin imagen');
    }
    
    // Si ya es una URL completa, no modificar
    if (imagenPath.startsWith('http') || 
        imagenPath.startsWith('data:') || 
        imagenPath.startsWith('blob:')) {
      return imagenPath;
    }
    
    console.log('🖼️ Imagen original:', imagenPath);
    
    // Limpiar la ruta de imagen
    let rutaLimpia = imagenPath;
    
    // Remover ./ al inicio si existe
    if (rutaLimpia.startsWith('./')) {
      rutaLimpia = rutaLimpia.substring(2);
    }
    
    // Remover / al inicio si existe
    if (rutaLimpia.startsWith('/')) {
      rutaLimpia = rutaLimpia.substring(1);
    }
    
    // Construir URL absoluta
    const urlFinal = `${this.baseUrl}/${rutaLimpia}`;
    
    console.log('✅ URL final construida:', urlFinal);
    return urlFinal;
  }

  // ===== SVG PLACEHOLDER SIN EMOJIS (para evitar error btoa) =====
  createSVGPlaceholder(width = 120, height = 100, text = 'Sin imagen') {
    const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#2a2a2a;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg${Date.now()})" stroke="#f9dc5e" stroke-width="1" rx="8"/>
      <circle cx="${width/2}" cy="${height/2 - 10}" r="15" fill="#f9dc5e" opacity="0.7"/>
      <rect x="${width/2 - 8}" y="${height/2 - 5}" width="16" height="2" fill="#f9dc5e" opacity="0.7"/>
      <rect x="${width/2 - 1}" y="${height/2 - 12}" width="2" height="16" fill="#f9dc5e" opacity="0.7"/>
      <text x="50%" y="${height - 15}" text-anchor="middle" fill="#ccc" font-family="Arial, sans-serif" font-size="10">${text}</text>
    </svg>`;
    
    try {
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    } catch (error) {
      console.error('Error creando SVG:', error);
      // Fallback simple sin btoa
      return `data:image/svg+xml;charset=utf8,${encodeURIComponent(svg)}`;
    }
  }

  // ===== VERIFICACIÓN DE IMAGEN MEJORADA =====
  async verificarImagen(url) {
    console.log('🔍 Verificando imagen:', url);
    
    try {
      // Usar fetch para verificar si la imagen existe
      const response = await fetch(url, { 
        method: 'HEAD',
        mode: 'no-cors' // Para evitar problemas de CORS en GitHub Pages
      });
      
      // En modo no-cors, response.ok siempre es false, pero no debería dar error si existe
      console.log('📡 Respuesta de verificación recibida para:', url);
      return url; // Asumir que existe si no hay error
      
    } catch (error) {
      console.log('❌ Error en verificación:', error);
      
      // Intentar con diferentes extensiones como fallback
      const extensiones = ['.png', '.jpg', '.jpeg', '.webp'];
      const baseUrl = url.replace(/\.(png|jpg|jpeg|webp)$/i, '');
      
      for (let ext of extensiones) {
        const urlIntento = baseUrl + ext;
        try {
          await fetch(urlIntento, { method: 'HEAD', mode: 'no-cors' });
          console.log('✅ Encontrada variante:', urlIntento);
          return urlIntento;
        } catch (e) {
          console.log(`❌ Variante ${ext} no encontrada`);
        }
      }
      
      return null;
    }
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

  // ===== SETUP DE IMÁGENES =====
  async setupImagenes() {
    const imagenes = document.querySelectorAll('.producto-imagen[data-original-src]');
    
    console.log(`🖼️ Configurando ${imagenes.length} imágenes en el carrito...`);
    
    for (let img of imagenes) {
      const imagenOriginal = img.dataset.originalSrc;
      
      if (imagenOriginal) {
        const urlCorregida = this.corregirRutaImagen(imagenOriginal);
        
        // Intentar cargar la imagen directamente (más simple que verificar)
        this.cargarImagenDirecta(img, urlCorregida);
      }
    }
  }

  // ===== CARGA DIRECTA DE IMAGEN =====
  cargarImagenDirecta(imgElement, url) {
    console.log('🚀 Cargando imagen:', url);
    
    const tempImg = new Image();
    
    // Configurar crossOrigin para GitHub Pages
    tempImg.crossOrigin = 'anonymous';
    
    tempImg.onload = () => {
      console.log('✅ Imagen cargada exitosamente:', url);
      imgElement.src = url;
      imgElement.classList.remove('loading');
      imgElement.classList.add('loaded');
    };
    
    tempImg.onerror = () => {
      console.log('❌ Error al cargar imagen:', url);
      console.log('🔄 Usando placeholder...');
      
      const placeholder = this.createSVGPlaceholder(120, 100, 'No disponible');
      imgElement.src = placeholder;
      imgElement.classList.remove('loading');
      imgElement.classList.add('error');
    };
    
    // Timeout de seguridad (5 segundos)
    setTimeout(() => {
      if (imgElement.classList.contains('loading')) {
        console.log('⏰ Timeout en carga de imagen:', url);
        const placeholder = this.createSVGPlaceholder(120, 100, 'Timeout');
        imgElement.src = placeholder;
        imgElement.classList.remove('loading');
        imgElement.classList.add('timeout');
      }
    }, 5000);
    
    tempImg.src = url;
  }

  renderizarProducto(producto) {
    const placeholderSVG = this.createSVGPlaceholder(120, 100, 'Cargando...');
    
    return `
      <div class="producto-carrito" data-id="${producto.id}">
        <img src="${placeholderSVG}" 
             data-original-src="${producto.imagen || ''}"
             alt="${producto.nombre}" 
             class="producto-imagen loading" 
             style="min-width: 120px; min-height: 100px; object-fit: cover;" />
        
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
      setTimeout(() => {
        if (notificacion.parentNode) {
          notificacion.remove();
        }
      }, 300);
    }, 3000);
  }
}

// ===== FUNCIONES GLOBALES =====

window.agregarAlCarrito = function(idProducto, cantidad = 1) {
  const baseUrl = 'https://jamesdp428.github.io/Aurum-Joyeria';
  const productosPath = `${baseUrl}/data/productos.json`;

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

window.mostrarNotificacionGlobal = function(mensaje, tipo = 'success') {
  const notificacionExistente = document.querySelector('.notificacion-global');
  if (notificacionExistente) {
    notificacionExistente.remove();
  }

  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion-global';
  
  const esMovil = window.innerWidth <= 768;
  notificacion.style.cssText = `
    position: fixed;
    ${esMovil ? 'top: 10px; left: 10px; right: 10px; max-width: none;' : 'top: 20px; right: 20px; max-width: 300px;'}
    background: linear-gradient(45deg, ${tipo === 'success' ? '#4caf50, #45a049' : '#ff4757, #ff3838'});
    color: white;
    padding: ${esMovil ? '12px 15px' : '15px 20px'};
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    font-weight: bold;
    transform: ${esMovil ? 'translateY(-100%)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    font-family: 'Roboto Condensed', sans-serif;
    text-align: ${esMovil ? 'center' : 'left'};
    font-size: ${esMovil ? '0.9rem' : '1rem'};
  `;
  
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);

  setTimeout(() => {
    notificacion.style.transform = esMovil ? 'translateY(0)' : 'translateX(0)';
  }, 100);

  setTimeout(() => {
    notificacion.style.transform = esMovil ? 'translateY(-100%)' : 'translateX(100%)';
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.remove();
      }
    }, 300);
  }, 3000);
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  window.carrito = new CarritoCompras();
  
  console.log('🚀 Carrito Aurum inicializado');
  console.log('🌐 Base URL:', window.carrito.baseUrl);
  console.log('📦 Productos en carrito:', window.carrito.productos.length);
  
  if (window.carrito.productos.length > 0) {
    console.log('🖼️ Imágenes a cargar:');
    window.carrito.productos.forEach((p, i) => {
      console.log(`${i+1}. ${p.nombre}: ${p.imagen}`);
    });
  }
  
  window.actualizarContadorCarrito();
});

window.CarritoCompras = CarritoCompras;