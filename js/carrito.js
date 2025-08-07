// ===== CARRITO DE COMPRAS FUNCIONAL =====

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
        precio: producto.precio || 0, // Precio se maneja por WhatsApp
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
    // Como los precios se manejan por WhatsApp, retornamos 0
    return 0;
  }

  // ===== RENDERIZADO =====
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
    return `
      <div class="producto-carrito" data-id="${producto.id}">
        <img src="${producto.imagen}" 
             alt="${producto.nombre}" 
             class="producto-imagen"
             onerror="this.src='../img/placeholder.jpg'; this.onerror=null;" />
        
        <div class="producto-info">
          <h4 class="producto-nombre">${producto.nombre}</h4>
          <p class="producto-descripcion">${producto.descripcion}</p>
          <p class="producto-precio">Consultar precio por WhatsApp</p>
        </div>

        <div class="producto-controles">
          <div class="cantidad-control-carrito">
            <button onclick="carrito.actualizarCantidad(${producto.id}, ${producto.cantidad - 1})">-</button>
            <input type="number" 
                   value="${producto.cantidad}" 
                   min="1" 
                   max="${producto.stock}"
                   onchange="carrito.actualizarCantidad(${producto.id}, parseInt(this.value))"
                   onblur="if(!this.value || this.value < 1) this.value = 1">
            <button onclick="carrito.actualizarCantidad(${producto.id}, ${producto.cantidad + 1})">+</button>
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
    notificacion.textContent = mensaje;

    document.body.appendChild(notificacion);

    // Mostrar con animación
    setTimeout(() => {
      notificacion.classList.add('show');
    }, 100);

    // Remover después de 3 segundos
    setTimeout(() => {
      notificacion.classList.remove('show');
      setTimeout(() => {
        if (notificacion.parentNode) {
          notificacion.remove();
        }
      }, 300);
    }, 3000);
  }
}

// ===== FUNCIONES GLOBALES PARA USAR DESDE OTRAS PÁGINAS =====

// Función para agregar productos desde otras páginas
window.agregarAlCarrito = function(idProducto, cantidad = 1) {
  // Esta función se llamará desde detalle_producto.js
  fetch('../../data/productos.json')
    .then(response => response.json())
    .then(productos => {
      const producto = productos.find(p => p.id === parseInt(idProducto));
      if (producto && window.carrito) {
        return window.carrito.agregarProducto(producto, cantidad);
      }
      return false;
    })
    .catch(error => {
      console.error('Error al agregar al carrito:', error);
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

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancia global del carrito
  window.carrito = new CarritoCompras();
  
  // Si estamos en la página del carrito, hacer foco en ella
  if (window.location.pathname.includes('carrito.html')) {
    console.log('Página de carrito cargada con', window.carrito.productos.length, 'productos');
  }
  
  // Actualizar contador en navbar para todas las páginas
  window.actualizarContadorCarrito();
});

// ===== EXPORTAR FUNCIONES PARA USO EXTERNO =====
window.CarritoCompras = CarritoCompras;