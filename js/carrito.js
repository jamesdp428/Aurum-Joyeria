// ===== CARRITO DE COMPRAS FUNCIONAL CORREGIDO =====

class CarritoCompras {
  constructor() {
    this.productos = this.cargarCarrito();
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

  // ===== FUNCIÓN MEJORADA PARA CORREGIR RUTAS DE IMÁGENES =====
  corregirRutaImagen(imagenPath) {
    // Si no hay imagen o es vacía, usar placeholder
    if (!imagenPath) {
      return this.getPlaceholderImage();
    }
    
    // Si la imagen ya es una URL completa, data URI o blob, no la modifiques
    if (imagenPath.startsWith('http') || 
        imagenPath.startsWith('data:') || 
        imagenPath.startsWith('blob:') ||
        imagenPath.startsWith('//')) {
      return imagenPath;
    }
    
    // Obtener información sobre la ubicación actual
    const currentPath = window.location.pathname;
    const isCarritoPage = currentPath.includes('carrito.html') || currentPath.endsWith('carrito.html');
    
    console.log('Debug - Ruta actual:', currentPath);
    console.log('Debug - Imagen original:', imagenPath);
    console.log('Debug - Es página carrito:', isCarritoPage);
    
    let rutaCorregida = imagenPath;
    
    if (isCarritoPage) {
      // Estamos en /html/carrito.html, necesitamos subir un nivel para llegar a /img/
      if (imagenPath.startsWith('img/')) {
        // Cambiar img/ por ../img/
        rutaCorregida = imagenPath.replace('img/', '../img/');
      } else if (imagenPath.startsWith('./img/')) {
        // Cambiar ./img/ por ../img/
        rutaCorregida = imagenPath.replace('./img/', '../img/');
      } else if (!imagenPath.startsWith('../img/') && !imagenPath.startsWith('/')) {
        // Si no empieza con ../img/ ni es absoluta, asumimos que es relativa desde root
        rutaCorregida = `../img/${imagenPath}`;
      }
    }
    
    console.log('Debug - Ruta corregida:', rutaCorregida);
    return rutaCorregida;
  }

  // ===== FUNCIÓN PARA OBTENER PLACEHOLDER =====
  getPlaceholderImage() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('carrito.html')) {
      return '../img/placeholder.jpg';
    } else if (currentPath.includes('/html/')) {
      return '../img/placeholder.jpg';
    } else {
      return 'img/placeholder.jpg';
    }
  }

  // ===== FUNCIÓN PARA CREAR SVG PLACEHOLDER =====
  createSVGPlaceholder(width = 120, height = 100, text = 'Sin imagen') {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#2a2a2a" stroke="#f9dc5e" stroke-width="2" rx="8"/>
        <text x="50%" y="40%" text-anchor="middle" fill="#f9dc5e" font-family="Arial, sans-serif" font-size="24">
          🖼️
        </text>
        <text x="50%" y="70%" text-anchor="middle" fill="#ccc" font-family="Arial, sans-serif" font-size="10">
          ${text}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // ===== OPERACIONES DEL CARRITO =====
  agregarProducto(producto, cantidad = 1) {
    const productoExistente = this.productos.find(p => p.id === producto.id);
    
    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + cantidad;
      
      // Verificar stock disponible
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

  obtenerSubtotal() {
    return 0; // Los precios se manejan por WhatsApp
  }

  // ===== RENDERIZADO CORREGIDO =====
  renderizarCarrito() {
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoConProductos = document.getElementById('carritoConProductos');
    const carritoResumen = document.getElementById('carritoResumen');
    const listaProductos = document.getElementById('listaProductos');

    if (this.productos.length === 0) {
      // Mostrar carrito vacío
      if (carritoVacio) carritoVacio.style.display = 'block';
      if (carritoConProductos) carritoConProductos.style.display = 'none';
      if (carritoResumen) carritoResumen.style.display = 'none';
    } else {
      // Mostrar productos
      if (carritoVacio) carritoVacio.style.display = 'none';
      if (carritoConProductos) carritoConProductos.style.display = 'block';
      if (carritoResumen) carritoResumen.style.display = 'block';

      if (listaProductos) {
        listaProductos.innerHTML = this.productos.map(producto => this.renderizarProducto(producto)).join('');
      }

      this.actualizarResumen();
      
      // Aplicar lazy loading y manejo de errores después del render
      setTimeout(() => this.setupImageHandling(), 100);
    }
  }

  // ===== SETUP MEJORADO PARA MANEJO DE IMÁGENES =====
  setupImageHandling() {
    const imagenes = document.querySelectorAll('.producto-imagen');
    
    imagenes.forEach((img, index) => {
      // Aplicar corrección de ruta
      const originalSrc = img.src;
      const correctedSrc = this.corregirRutaImagen(img.dataset.originalSrc || originalSrc);
      
      console.log(`Imagen ${index + 1}:`);
      console.log('- Original:', originalSrc);
      console.log('- Corregida:', correctedSrc);
      
      // Precargar imagen para verificar si existe
      this.loadImageWithFallback(img, correctedSrc);
    });
  }

  // ===== CARGA DE IMAGEN CON FALLBACK =====
  loadImageWithFallback(imgElement, src) {
    const tempImg = new Image();
    
    tempImg.onload = () => {
      console.log('✅ Imagen cargada correctamente:', src);
      imgElement.src = src;
      imgElement.classList.add('loaded');
    };
    
    tempImg.onerror = () => {
      console.warn('❌ Error al cargar imagen:', src);
      console.log('🔄 Intentando con placeholder SVG...');
      imgElement.src = this.createSVGPlaceholder();
      imgElement.classList.add('error');
    };
    
    // Iniciar carga
    tempImg.src = src;
  }

  renderizarProducto(producto) {
    // No corregir la ruta aquí, se hará en setupImageHandling
    const imagenOriginal = producto.imagen || '';
    
    return `
      <div class="producto-carrito" data-id="${producto.id}">
        <img src="${this.createSVGPlaceholder(120, 100, 'Cargando...')}" 
             data-original-src="${imagenOriginal}"
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
    // Vaciar carrito
    const btnVaciar = document.getElementById('vaciarCarrito');
    if (btnVaciar) {
      btnVaciar.addEventListener('click', () => this.vaciarCarrito());
    }

    // Proceder con WhatsApp
    const btnProceder = document.getElementById('procederCompra');
    if (btnProceder) {
      btnProceder.addEventListener('click', () => this.procederWhatsApp());
    }

    // Continuar comprando
    const btnContinuar = document.getElementById('continuarComprando');
    if (btnContinuar) {
      btnContinuar.addEventListener('click', () => {
        window.location.href = '../index.html';
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
    // Remover notificaciones existentes
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

    // Mostrar con animación
    setTimeout(() => {
      notificacion.style.transform = 'translateX(0)';
    }, 100);

    // Remover después de 3 segundos
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

// ===== FUNCIONES GLOBALES CORREGIDAS =====

// Función para agregar productos desde otras páginas
window.agregarAlCarrito = function(idProducto, cantidad = 1) {
  // Detectar ruta correcta para productos.json
  const currentPath = window.location.pathname;
  let productosPath = 'data/productos.json';
  
  if (currentPath.includes('/html/categorias/')) {
    productosPath = '../../data/productos.json';
  } else if (currentPath.includes('/html/')) {
    productosPath = '../data/productos.json';
  }

  console.log('Cargando productos desde:', productosPath);

  fetch(productosPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(productos => {
      const producto = productos.find(p => p.id === parseInt(idProducto));
      if (producto && window.carrito) {
        console.log('Producto encontrado:', producto);
        return window.carrito.agregarProducto(producto, cantidad);
      }
      console.error('Producto no encontrado con ID:', idProducto);
      return false;
    })
    .catch(error => {
      console.error('Error al agregar al carrito:', error);
      mostrarNotificacionGlobal('Error al agregar producto al carrito', 'error');
      return false;
    });
};

// Función para obtener total de productos (para navbar)
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

// Función para actualizar contador en navbar
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

// Función para mostrar notificaciones globales
window.mostrarNotificacionGlobal = function(mensaje, tipo = 'success') {
  // Remover notificación existente
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

  // Animación de entrada
  setTimeout(() => {
    notificacion.style.transform = esMovil ? 'translateY(0)' : 'translateX(0)';
  }, 100);

  // Remover después de 3 segundos
  setTimeout(() => {
    notificacion.style.transform = esMovil ? 'translateY(-100%)' : 'translateX(100%)';
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.remove();
      }
    }, 300);
  }, 3000);
};

// ===== INICIALIZACIÓN MEJORADA =====
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancia global del carrito
  window.carrito = new CarritoCompras();
  
  // Debug info detallado
  if (window.location.pathname.includes('carrito.html')) {
    console.log('🛒 Página de carrito cargada');
    console.log('📦 Productos en carrito:', window.carrito.productos.length);
    console.log('🖼️ Verificando rutas de imágenes...');
    
    window.carrito.productos.forEach((producto, index) => {
      console.log(`Producto ${index + 1}:`, {
        nombre: producto.nombre,
        imagenOriginal: producto.imagen,
        imagenCorregida: window.carrito.corregirRutaImagen(producto.imagen)
      });
    });
  }
  
  // Actualizar contador en navbar
  window.actualizarContadorCarrito();
});

// ===== EXPORTAR FUNCIONES PARA USO EXTERNO =====
window.CarritoCompras = CarritoCompras;