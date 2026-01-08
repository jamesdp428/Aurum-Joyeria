// ===== CARRITO GLOBAL - PARA INCLUIR EN TODAS LAS PÁGINAS =====

// Función para obtener total de productos en el carrito
function obtenerTotalCarrito() {
  try {
    const carritoGuardado = localStorage.getItem('aurum_carrito');
    if (!carritoGuardado) return 0;
    
    const productos = JSON.parse(carritoGuardado);
    return productos.reduce((total, producto) => total + producto.cantidad, 0);
  } catch (error) {
    console.error('Error al obtener total del carrito:', error);
    return 0;
  }
}

// Función para actualizar contador en navbar
function actualizarContadorCarrito() {
  const total = obtenerTotalCarrito();
  const contadores = document.querySelectorAll('#carritoContador, .carrito-contador');
  
  contadores.forEach(contador => {
    if (total > 0) {
      contador.textContent = total > 99 ? '99+' : total;
      contador.style.display = 'flex';
    } else {
      contador.style.display = 'none';
    }
  });
}

// Función para agregar el contador visual al carrito en navbar
function inicializarContadorCarrito() {
  const carritoIcons = document.querySelectorAll('svg[viewBox="0 0 24 24"]');
  
  carritoIcons.forEach(icon => {
    // Verificar si es el ícono del carrito
    const paths = icon.querySelectorAll('path, circle');
    let esCarrito = false;
    
    paths.forEach(path => {
      const d = path.getAttribute('d');
      if (d && (d.includes('M1 1h4l2.6 13.5') || d.includes('circle cx="9" cy="21"'))) {
        esCarrito = true;
      }
    });
    
    if (esCarrito) {
      const parent = icon.parentElement;
      
      // Verificar si ya tiene contador
      if (!parent.querySelector('.carrito-contador')) {
        parent.style.position = 'relative';
        
        const contador = document.createElement('span');
        contador.className = 'carrito-contador';
        contador.id = 'carritoContador';
        contador.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: linear-gradient(45deg, #ff4757, #ff3838);
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: none;
          align-items: center;
          justify-content: center;
          font-size: 0.7rem;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
          z-index: 10;
        `;
        
        parent.appendChild(contador);
        
        // Hacer el carrito clicable para ir a la página del carrito
        parent.style.cursor = 'pointer';
        parent.addEventListener('click', (e) => {
          e.preventDefault();
          // Detectar la ruta correcta según la ubicación actual
          const currentPath = window.location.pathname;
          let carritoPath = '';
          
          if (currentPath.includes('/categorias/')) {
            carritoPath = '../carrito.html';
          } else if (currentPath.includes('/html/')) {
            carritoPath = 'carrito.html';
          } else {
            carritoPath = 'html/carrito.html';
          }
          
          window.location.href = carritoPath;
        });
      }
    }
  });
}

// Función para simular agregar al carrito (para productos destacados en index)
function agregarAlCarritoRapido(idProducto, cantidad = 1) {
  // Determinar la ruta correcta para productos.json según la ubicación
  const currentPath = window.location.pathname;
  let productosPath = '';
  
  if (currentPath.includes('/categorias/')) {
    productosPath = '../../data/productos.json';
  } else if (currentPath.includes('/html/')) {
    productosPath = '../data/productos.json';
  } else {
    productosPath = 'data/productos.json';
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
      
      if (!producto) {
        mostrarNotificacionGlobal('Producto no encontrado', 'error');
        return;
      }

      // Obtener carrito actual
      let carrito = [];
      try {
        const carritoGuardado = localStorage.getItem('aurum_carrito');
        if (carritoGuardado) {
          carrito = JSON.parse(carritoGuardado);
        }
      } catch (error) {
        console.error('Error al cargar carrito:', error);
      }

      // Verificar stock
      if (producto.stock === 0) {
        mostrarNotificacionGlobal('Producto agotado', 'error');
        return;
      }

      // Buscar producto existente
      const productoExistente = carrito.find(p => p.id === producto.id);
      
      if (productoExistente) {
        const nuevaCantidad = productoExistente.cantidad + cantidad;
        
        if (nuevaCantidad > producto.stock) {
          mostrarNotificacionGlobal(`Solo hay ${producto.stock} unidades disponibles`, 'error');
          return;
        }
        
        productoExistente.cantidad = nuevaCantidad;
      } else {
        if (cantidad > producto.stock) {
          mostrarNotificacionGlobal(`Solo hay ${producto.stock} unidades disponibles`, 'error');
          return;
        }
        
        carrito.push({
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

      // Guardar carrito
      try {
        localStorage.setItem('aurum_carrito', JSON.stringify(carrito));
        actualizarContadorCarrito();
        mostrarNotificacionGlobal(`${producto.nombre} agregado al carrito! 🛒`, 'success');
      } catch (error) {
        console.error('Error al guardar carrito:', error);
        mostrarNotificacionGlobal('Error al agregar al carrito', 'error');
      }
    })
    .catch(error => {
      console.error('Error al cargar productos:', error);
      mostrarNotificacionGlobal('Error al cargar producto', 'error');
    });
}

// Función para mostrar notificaciones globales
function mostrarNotificacionGlobal(mensaje, tipo = 'success') {
  // Remover notificación existente
  const notificacionExistente = document.querySelector('.notificacion-global');
  if (notificacionExistente) {
    notificacionExistente.remove();
  }

  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion-global';
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

  // Animación de entrada
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

// Función para obtener información del carrito (útil para otras funcionalidades)
function obtenerInfoCarrito() {
  try {
    const carritoGuardado = localStorage.getItem('aurum_carrito');
    if (!carritoGuardado) return { productos: [], total: 0 };
    
    const productos = JSON.parse(carritoGuardado);
    const total = productos.reduce((acc, producto) => acc + producto.cantidad, 0);
    
    return { productos, total };
  } catch (error) {
    console.error('Error al obtener info del carrito:', error);
    return { productos: [], total: 0 };
  }
}

// Función para limpiar carrito (útil para testing o admin)
function limpiarCarrito() {
  try {
    localStorage.removeItem('aurum_carrito');
    actualizarContadorCarrito();
    mostrarNotificacionGlobal('Carrito limpiado', 'success');
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
  }
}

// Exportar funciones al objeto window para uso global
window.obtenerTotalCarrito = obtenerTotalCarrito;
window.actualizarContadorCarrito = actualizarContadorCarrito;
window.agregarAlCarritoRapido = agregarAlCarritoRapido;
window.mostrarNotificacionGlobal = mostrarNotificacionGlobal;
window.obtenerInfoCarrito = obtenerInfoCarrito;
window.limpiarCarrito = limpiarCarrito;

// Inicialización automática cuando se carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para asegurar que los elementos del DOM estén listos
  setTimeout(() => {
    inicializarContadorCarrito();
    actualizarContadorCarrito();
    
    // Debug info
    const infoCarrito = obtenerInfoCarrito();
    console.log(`Carrito inicializado: ${infoCarrito.total} productos`);
  }, 100);
});

// Actualizar contador cuando la página se enfoca (por si se modificó en otra pestaña)
window.addEventListener('focus', () => {
  actualizarContadorCarrito();
});

// También actualizar cuando se cambia el localStorage desde otra pestaña
window.addEventListener('storage', (e) => {
  if (e.key === 'aurum_carrito') {
    actualizarContadorCarrito();
  }
});