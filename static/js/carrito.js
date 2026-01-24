// ========================================
// CARRITO UNIFICADO - AURUM JOYERÍA
// ========================================

class CarritoCompras {
  constructor() {
    this.productos = this.cargarCarrito();
    this.init();
  }

  init() {
    this.actualizarContadorNavbar();
    
    // Solo renderizar si estamos en la página de carrito
    if (document.getElementById('carritoVacio')) {
      this.renderizarCarrito();
      this.configurarEventListeners();
    }
  }

  // ===== GESTIÓN DEL STORAGE =====
  cargarCarrito() {
    try {
      const carritoGuardado = localStorage.getItem('carrito');
      return carritoGuardado ? JSON.parse(carritoGuardado) : [];
    } catch (error) {
      console.error('❌ Error al cargar carrito:', error);
      return [];
    }
  }

  guardarCarrito() {
    try {
      localStorage.setItem('carrito', JSON.stringify(this.productos));
      this.actualizarContadorNavbar();
      console.log('✅ Carrito guardado:', this.productos.length, 'productos');
    } catch (error) {
      console.error('❌ Error al guardar carrito:', error);
    }
  }

  // ===== OPERACIONES DEL CARRITO =====
  agregarProducto(producto, cantidad = 1) {
    console.log('🛒 Agregando producto:', producto);
    
    const productoExistente = this.productos.find(p => p.id === producto.id);
    
    if (productoExistente) {
      const nuevaCantidad = productoExistente.cantidad + cantidad;
      
      if (producto.stock && nuevaCantidad > producto.stock) {
        this.mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'error');
        return false;
      }
      
      productoExistente.cantidad = nuevaCantidad;
      console.log('📦 Producto actualizado:', productoExistente);
    } else {
      if (producto.stock && cantidad > producto.stock) {
        this.mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'error');
        return false;
      }
      
      this.productos.push({
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        imagen_url: producto.imagen_url || '',
        precio: producto.precio || 0,
        stock: producto.stock || 0,
        categoria: producto.categoria || '',
        cantidad: cantidad
      });
      console.log('➕ Producto nuevo agregado');
    }

    this.guardarCarrito();
    this.renderizarCarrito();
    this.mostrarNotificacion(`✅ ${producto.nombre} agregado al carrito`, 'success');
    return true;
  }

  actualizarCantidad(id, nuevaCantidad) {
    console.log('🔢 Actualizando cantidad:', id, nuevaCantidad);
    
    const producto = this.productos.find(p => p.id === id);
    
    if (!producto) {
      console.warn('⚠️ Producto no encontrado:', id);
      return;
    }

    if (nuevaCantidad <= 0) {
      this.eliminarProducto(id);
      return;
    }

    if (producto.stock && nuevaCantidad > producto.stock) {
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
      console.log('🗑️ Producto eliminado');
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

    if (!carritoVacio || !carritoConProductos) {
      console.log('ℹ️ No estamos en la página de carrito');
      return;
    }

    if (this.productos.length === 0) {
      carritoVacio.style.display = 'block';
      carritoConProductos.style.display = 'none';
      if (carritoResumen) carritoResumen.style.display = 'none';
    } else {
      carritoVacio.style.display = 'none';
      carritoConProductos.style.display = 'block';
      if (carritoResumen) carritoResumen.style.display = 'block';

      if (listaProductos) {
        listaProductos.innerHTML = this.productos.map(producto => this.renderizarProducto(producto)).join('');
      }

      this.actualizarResumen();
    }
  }

  renderizarProducto(producto) {
    const imagenUrl = producto.imagen_url || 'https://via.placeholder.com/120x100/1a1a1a/f9dc5e?text=Sin+Imagen';
    
    return `
      <div class="producto-carrito" data-id="${producto.id}">
        <img src="${imagenUrl}" 
             alt="${producto.nombre}" 
             class="producto-imagen"
             onerror="this.src='https://via.placeholder.com/120x100/1a1a1a/f9dc5e?text=Sin+Imagen'" />
        
        <div class="producto-info">
          <h4 class="producto-nombre">${producto.nombre}</h4>
          <p class="producto-descripcion">${producto.descripcion || 'Sin descripción'}</p>
          <p class="producto-categoria">Categoría: ${producto.categoria || 'General'}</p>
          ${producto.precio && producto.precio > 0 
            ? `<p class="producto-precio">$${Number(producto.precio).toLocaleString('es-CO')}</p>` 
            : '<p class="producto-precio">Consultar por WhatsApp</p>'}
        </div>

        <div class="producto-controles">
          <div class="cantidad-control-carrito">
            <button type="button" onclick="carrito.actualizarCantidad('${producto.id}', ${producto.cantidad - 1})" 
                    ${producto.cantidad <= 1 ? 'disabled' : ''}>-</button>
            <input type="number" 
                   value="${producto.cantidad}" 
                   min="1" 
                   max="${producto.stock || 99}"
                   onchange="carrito.actualizarCantidad('${producto.id}', parseInt(this.value) || 1)">
            <button type="button" onclick="carrito.actualizarCantidad('${producto.id}', ${producto.cantidad + 1})"
                    ${producto.stock && producto.cantidad >= producto.stock ? 'disabled' : ''}>+</button>
          </div>
          <button class="btn-eliminar" onclick="carrito.eliminarProducto('${producto.id}')">
            🗑️ Eliminar
          </button>
        </div>
      </div>
    `;
  }

  actualizarResumen() {
    const totalProductos = this.obtenerTotalProductos();
    
    const totalProductosElement = document.getElementById('totalProductos');
    if (totalProductosElement) {
      totalProductosElement.textContent = totalProductos;
    }

    // Calcular total si hay precios
    const subtotal = this.productos.reduce((sum, p) => {
      return sum + ((p.precio || 0) * p.cantidad);
    }, 0);

    const subtotalElement = document.getElementById('subtotal');
    const totalFinalElement = document.getElementById('totalFinal');

    if (subtotal > 0) {
      if (subtotalElement) {
        subtotalElement.textContent = `$${subtotal.toLocaleString('es-CO')}`;
      }
      if (totalFinalElement) {
        totalFinalElement.innerHTML = `<strong>$${subtotal.toLocaleString('es-CO')}</strong>`;
      }
    } else {
      if (subtotalElement) {
        subtotalElement.textContent = 'Consultar por WhatsApp';
      }
      if (totalFinalElement) {
        totalFinalElement.innerHTML = '<strong>Consultar por WhatsApp</strong>';
      }
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
        window.location.href = '/';
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
      mensaje += `   Categoría: ${producto.categoria}\n`;
      if (producto.precio && producto.precio > 0) {
        mensaje += `   Precio: $${Number(producto.precio).toLocaleString('es-CO')}\n`;
      }
      mensaje += '\n';
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
      top: 100px;
      right: 20px;
      background: linear-gradient(45deg, ${tipo === 'success' ? '#4caf50, #45a049' : '#ff4757, #ff3838'});
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      z-index: 10000;
      font-weight: 600;
      font-size: 1rem;
      transform: translateX(100%);
      transition: transform 0.3s ease;
      max-width: 350px;
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

// ===== FUNCIONES GLOBALES PARA AGREGAR AL CARRITO =====

/**
 * Función global para agregar productos al carrito desde cualquier página
 * @param {Object} producto - Objeto con datos del producto
 * @param {number} cantidad - Cantidad a agregar
 */
window.agregarAlCarrito = function(producto, cantidad = 1) {
  console.log('🎯 agregarAlCarrito llamado:', producto);
  
  if (!window.carrito) {
    console.error('❌ Carrito no inicializado');
    window.carrito = new CarritoCompras();
  }
  
  return window.carrito.agregarProducto(producto, cantidad);
};

/**
 * Función para obtener el total del carrito
 */
window.obtenerTotalCarrito = function() {
  if (!window.carrito) {
    window.carrito = new CarritoCompras();
  }
  return window.carrito.obtenerTotalProductos();
};

/**
 * Función para actualizar el contador del carrito
 */
window.actualizarContadorCarrito = function() {
  if (!window.carrito) {
    window.carrito = new CarritoCompras();
  }
  window.carrito.actualizarContadorNavbar();
};

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancia global del carrito
  window.carrito = new CarritoCompras();
  
  console.log('✅ Carrito inicializado');
  console.log('📦 Productos en carrito:', window.carrito.productos.length);
  
  // Actualizar contador
  window.actualizarContadorCarrito();
});

// Exportar clase para uso global
window.CarritoCompras = CarritoCompras;