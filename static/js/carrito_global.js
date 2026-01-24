// ========================================
// CARRITO GLOBAL - FUNCIONES AUXILIARES
// ========================================

/**
 * Obtiene el total de productos en el carrito
 */
function obtenerTotalCarrito() {
  try {
    const carritoGuardado = localStorage.getItem('carrito');
    if (!carritoGuardado) return 0;
    
    const productos = JSON.parse(carritoGuardado);
    return productos.reduce((total, producto) => total + producto.cantidad, 0);
  } catch (error) {
    console.error('Error al obtener total del carrito:', error);
    return 0;
  }
}

/**
 * Actualiza el contador visual del carrito en el navbar
 */
function actualizarContadorCarrito() {
  const total = obtenerTotalCarrito();
  const contadores = document.querySelectorAll('#carritoContador, .carrito-contador');
  
  console.log('🔢 Actualizando contador:', total);
  
  contadores.forEach(contador => {
    if (total > 0) {
      contador.textContent = total > 99 ? '99+' : total;
      contador.style.display = 'flex';
    } else {
      contador.style.display = 'none';
    }
  });
}

/**
 * Inicializa el contador visual del carrito
 */
function inicializarContadorCarrito() {
  const carritoIcons = document.querySelectorAll('a[href="/carrito"]');
  
  carritoIcons.forEach(link => {
    // Verificar si ya tiene contador
    if (!link.querySelector('.carrito-contador')) {
      link.style.position = 'relative';
      
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
      
      link.appendChild(contador);
    }
  });
  
  // Actualizar contador inicial
  actualizarContadorCarrito();
}

/**
 * Muestra una notificación temporal
 */
function mostrarNotificacionGlobal(mensaje, tipo = 'success') {
  const notificacionExistente = document.querySelector('.notificacion-global');
  if (notificacionExistente) {
    notificacionExistente.remove();
  }

  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion-global';
  
  const esMovil = window.innerWidth <= 768;
  notificacion.style.cssText = `
    position: fixed;
    ${esMovil ? 'top: 80px; left: 10px; right: 10px; max-width: none;' : 'top: 100px; right: 20px; max-width: 350px;'}
    background: linear-gradient(45deg, ${tipo === 'success' ? '#4caf50, #45a049' : '#ff4757, #ff3838'});
    color: white;
    padding: ${esMovil ? '12px 15px' : '15px 25px'};
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    font-weight: 600;
    font-size: ${esMovil ? '0.9rem' : '1rem'};
    transform: ${esMovil ? 'translateY(-100%)' : 'translateX(100%)'};
    transition: transform 0.3s ease;
    font-family: 'Roboto Condensed', sans-serif;
    text-align: ${esMovil ? 'center' : 'left'};
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
}

/**
 * Obtiene información completa del carrito
 */
function obtenerInfoCarrito() {
  try {
    const carritoGuardado = localStorage.getItem('carrito');
    if (!carritoGuardado) return { productos: [], total: 0 };
    
    const productos = JSON.parse(carritoGuardado);
    const total = productos.reduce((acc, producto) => acc + producto.cantidad, 0);
    
    return { productos, total };
  } catch (error) {
    console.error('Error al obtener info del carrito:', error);
    return { productos: [], total: 0 };
  }
}

/**
 * Limpia el carrito completamente
 */
function limpiarCarrito() {
  try {
    localStorage.removeItem('carrito');
    actualizarContadorCarrito();
    mostrarNotificacionGlobal('Carrito limpiado', 'success');
    
    // Recargar si estamos en la página de carrito
    if (window.location.pathname.includes('/carrito')) {
      window.location.reload();
    }
  } catch (error) {
    console.error('Error al limpiar carrito:', error);
  }
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

if (typeof window !== 'undefined') {
  window.obtenerTotalCarrito = obtenerTotalCarrito;
  window.actualizarContadorCarrito = actualizarContadorCarrito;
  window.mostrarNotificacionGlobal = mostrarNotificacionGlobal;
  window.obtenerInfoCarrito = obtenerInfoCarrito;
  window.limpiarCarrito = limpiarCarrito;
}

// ========================================
// INICIALIZACIÓN AUTOMÁTICA
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando carrito global...');
  
  // Pequeño delay para asegurar que el DOM esté listo
  setTimeout(() => {
    inicializarContadorCarrito();
    actualizarContadorCarrito();
    
    const info = obtenerInfoCarrito();
    console.log(`✅ Carrito global inicializado: ${info.total} productos`);
  }, 100);
});

// Actualizar contador cuando la página se enfoca
window.addEventListener('focus', () => {
  actualizarContadorCarrito();
});

// Actualizar cuando cambia el localStorage
window.addEventListener('storage', (e) => {
  if (e.key === 'carrito') {
    actualizarContadorCarrito();
  }
});