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

  // ===== FUNCIÓN PARA CORREGIR RUTAS DE IMÁGENES =====
  corregirRutaImagen(imagenPath) {
    if (!imagenPath) return '../img/placeholder.jpg';
    
    // Si la imagen ya es una ruta absoluta o relativa correcta, no la modifiques
    if (imagenPath.startsWith('http') || imagenPath.startsWith('data:')) {
      return imagenPath;
    }
    
    // Detectar la página actual para ajustar la ruta
    const currentPath = window.location.pathname;
    
    // Si estamos en la página del carrito (html/carrito.html)
    if (currentPath.includes('/html/carrito.html') || currentPath.endsWith('carrito.html')) {
      // Si la imagen no empieza con ../, agregarla
      if (!imagenPath.startsWith('../')) {
        // Si empieza con img/, reemplazarla con ../img/
        if (imagenPath.startsWith('img/')) {
          return imagenPath.replace('img/', '../img/');
        }
        // Si no, agregar ../
        return `../${imagenPath}`;
      }
      return imagenPath;
    }
    
    // Para otras páginas, mantener la ruta original
    return imagenPath;
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
    }
  }

  renderizarProducto(producto) {
    const imagenCorregida = this.corregirRutaImagen(producto.imagen);
    
    return `
      <div class="producto-carrito" data-id="${producto.id}">
        <img src="${imagenCorregida}" 
             alt="${producto.nombre}" 
             class="producto-imagen"
             onerror="this.src='../img/placeholder.jpg'; this.onerror=null;" />
        
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
        return window.carrito.agregarProducto(producto, cantidad);
      }
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

// Función para actualizar contador en navbar (para usar en todas las páginas)
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

// Función para mostrar notificaciones globales mejorada
window.mostrarNotificacionGlobal = function(mensaje, tipo = 'success') {
  // Remover notificación existente
  const notificacionExistente = document.querySelector('.notificacion-global');
  if (notificacionExistente) {
    notificacionExistente.remove();
  }

  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion-global';
  
  // Estilos responsivos mejorados
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
  
  // Debug info
  if (window.location.pathname.includes('carrito.html')) {
    console.log('Página de carrito cargada con', window.carrito.productos.length, 'productos');
    
    // Verificar que todas las imágenes se carguen correctamente
    setTimeout(() => {
      const imagenes = document.querySelectorAll('.producto-imagen');
      imagenes.forEach((img, index) => {
        if (img.complete && img.naturalHeight === 0) {
          console.warn(`Imagen ${index + 1} no se cargó correctamente:`, img.src);
        }
      });
    }, 1000);
  }
  
  // Actualizar contador en navbar
  window.actualizarContadorCarrito();
  
  // Manejar cambios de tamaño de ventana para notificaciones responsivas
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Reposicionar notificaciones si existen
      const notificacionExistente = document.querySelector('.notificacion-global');
      if (notificacionExistente) {
        const esMovil = window.innerWidth <= 768;
        notificacionExistente.style.cssText = notificacionExistente.style.cssText.replace(
          /top: \d+px; (left: \d+px; )?right: \d+px; max-width: [\w\d]*;?/,
          esMovil ? 'top: 10px; left: 10px; right: 10px; max-width: none;' : 'top: 20px; right: 20px; max-width: 300px;'
        );
      }
    }, 250);
  });
});

// ===== EXPORTAR FUNCIONES PARA USO EXTERNO =====
window.CarritoCompras = CarritoCompras;