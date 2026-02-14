// ========================================
// DETALLE DE PRODUCTO - MEJORADO
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔍 Iniciando carga de detalle de producto...');
  
  // Verificar que la API esté cargada
  const waitForAPI = () => {
    return new Promise((resolve, reject) => {
      const checkAPI = setInterval(() => {
        if (typeof productosAPI !== 'undefined') {
          clearInterval(checkAPI);
          resolve(true);
        }
      }, 100);
      
      // Timeout después de 5 segundos
      setTimeout(() => {
        clearInterval(checkAPI);
        reject(new Error('API no se cargó a tiempo'));
      }, 5000);
    });
  };
  
  try {
    await waitForAPI();
    console.log('✅ API de productos disponible');
  } catch (error) {
    mostrarError('La API de productos no está disponible. Por favor recarga la página.');
    return;
  }
  
  // Obtener ID del producto desde window.PRODUCTO_ID (pasado por el template)
  const productoId = window.PRODUCTO_ID;
  
  console.log('📦 ID del producto:', productoId);
  
  if (!productoId) {
    mostrarError('No se especificó un producto. Por favor, regresa y selecciona un producto.');
    return;
  }
  
  // Mostrar estado de carga
  mostrarCargando();
  
  try {
    // Cargar producto desde la API
    console.log('📡 Obteniendo producto de la API...');
    const producto = await productosAPI.getById(productoId);
    
    console.log('✅ Producto cargado:', producto);
    
    // Renderizar el producto
    renderizarProducto(producto);
    
    // Scroll suave al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
  } catch (error) {
    console.error('❌ Error al cargar producto:', error);
    mostrarError(`No se pudo cargar el producto: ${error.message}`);
  }
});

// ========================================
// MOSTRAR ESTADO DE CARGA
// ========================================

function mostrarCargando() {
  const nombreProducto = document.getElementById('nombreProducto');
  if (nombreProducto) {
    nombreProducto.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 30px; height: 30px; border: 3px solid #f9dc5e; border-top: 3px solid transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span>Cargando...</span>
      </div>
    `;
  }
}

// ========================================
// RENDERIZAR PRODUCTO
// ========================================

function renderizarProducto(producto) {
  console.log('🎨 Renderizando producto:', producto.nombre);
  
  // BREADCRUMB
  actualizarBreadcrumb(producto);
  
  // TÍTULO
  const nombreProducto = document.getElementById('nombreProducto');
  if (nombreProducto) {
    nombreProducto.textContent = producto.nombre;
  }
  
  // CATEGORÍA
  const categoriaProducto = document.getElementById('categoriaProducto');
  if (categoriaProducto) {
    // Mapeo de categorías DB a nombre visible
    const categoriasNombres = {
      'tobilleras': 'Dijes y Herrajes',
      'otros': 'Combos',
      'anillos': 'Anillos',
      'pulseras': 'Pulseras',
      'cadenas': 'Cadenas',
      'aretes': 'Aretes'
    };
    categoriaProducto.textContent = categoriasNombres[producto.categoria] || capitalizar(producto.categoria);
  }
  
  // DESCRIPCIÓN
  const descripcionProducto = document.getElementById('descripcionProducto');
  if (descripcionProducto) {
    descripcionProducto.textContent = producto.descripcion || 'Sin descripción disponible.';
  }
  
  // IMAGEN PRINCIPAL
  cargarImagenPrincipal(producto);
  
  // MINIATURAS
  cargarMiniaturas(producto);
  
  // STOCK
  actualizarStock(producto);
  
  // CONFIGURAR INPUT DE CANTIDAD
  configurarCantidad(producto);
  
  // BOTÓN AGREGAR AL CARRITO
  configurarBotonCarrito(producto);
  
  // WHATSAPP
  configurarWhatsApp(producto);
  
  console.log('✅ Producto renderizado completamente');
}

// ========================================
// BREADCRUMB
// ========================================

function actualizarBreadcrumb(producto) {
  const categoriaBreadcrumb = document.getElementById('categoriaBreadcrumb');
  const nombreBreadcrumb = document.getElementById('nombreBreadcrumb');
  
  // Mapeo de categorías DB a nombre visible y URL
  const categoriasMap = {
    'tobilleras': { nombre: 'Dijes y Herrajes', url: '/dijes' },
    'otros': { nombre: 'Combos', url: '/combos' },
    'anillos': { nombre: 'Anillos', url: '/anillos' },
    'pulseras': { nombre: 'Pulseras', url: '/pulseras' },
    'cadenas': { nombre: 'Cadenas', url: '/cadenas' },
    'aretes': { nombre: 'Aretes', url: '/aretes' }
  };
  
  const categoriaInfo = categoriasMap[producto.categoria] || { 
    nombre: capitalizar(producto.categoria), 
    url: `/${producto.categoria}` 
  };
  
  if (categoriaBreadcrumb) {
    categoriaBreadcrumb.textContent = categoriaInfo.nombre;
    categoriaBreadcrumb.href = categoriaInfo.url;
  }
  
  if (nombreBreadcrumb) {
    nombreBreadcrumb.textContent = producto.nombre;
  }
}

// ========================================
// IMAGEN PRINCIPAL
// ========================================

function cargarImagenPrincipal(producto) {
  const imagenPrincipal = document.getElementById('imagenPrincipal');
  
  if (!imagenPrincipal) return;
  
  if (producto.imagen_url && producto.imagen_url.trim() !== '') {
    imagenPrincipal.src = producto.imagen_url;
    imagenPrincipal.alt = producto.nombre;
    
    imagenPrincipal.onerror = function() {
      console.warn('⚠️ Error cargando imagen principal');
      this.src = 'https://via.placeholder.com/600x600/1a1a1a/f9dc5e?text=Sin+Imagen';
    };
    
    imagenPrincipal.onload = function() {
      console.log('✅ Imagen principal cargada');
    };
  } else {
    imagenPrincipal.src = 'https://via.placeholder.com/600x600/1a1a1a/f9dc5e?text=Sin+Imagen';
    imagenPrincipal.alt = 'Sin imagen disponible';
  }
}

// ========================================
// MINIATURAS
// ========================================

function cargarMiniaturas(producto) {
  const miniaturasContainer = document.getElementById('miniaturasContainer');
  
  if (!miniaturasContainer) return;
  
  // Por ahora solo mostramos la imagen principal como miniatura
  if (producto.imagen_url && producto.imagen_url.trim() !== '') {
    miniaturasContainer.innerHTML = `
      <img 
        src="${producto.imagen_url}" 
        alt="${producto.nombre}" 
        class="active"
        onclick="cambiarImagenPrincipal('${producto.imagen_url}')"
        onerror="this.src='https://via.placeholder.com/100x100/1a1a1a/f9dc5e?text=Sin+Imagen'"
      >
    `;
  } else {
    miniaturasContainer.innerHTML = `
      <img 
        src="https://via.placeholder.com/100x100/1a1a1a/f9dc5e?text=Sin+Imagen" 
        alt="Sin imagen" 
        class="active"
      >
    `;
  }
}

// ========================================
// CAMBIAR IMAGEN PRINCIPAL
// ========================================

function cambiarImagenPrincipal(src) {
  const imagenPrincipal = document.getElementById('imagenPrincipal');
  
  if (imagenPrincipal) {
    imagenPrincipal.src = src;
    
    // Actualizar clase active en miniaturas
    const miniaturas = document.querySelectorAll('#miniaturasContainer img');
    miniaturas.forEach(img => {
      img.classList.toggle('active', img.src === src);
    });
  }
}

// ========================================
// STOCK
// ========================================

function actualizarStock(producto) {
  const stockProducto = document.getElementById('stockProducto');
  
  if (!stockProducto) return;
  
  if (producto.stock > 10) {
    stockProducto.textContent = `✅ En stock (${producto.stock} disponibles)`;
    stockProducto.className = 'stock disponible';
  } else if (producto.stock > 0) {
    stockProducto.textContent = `⚠️ Últimas unidades (${producto.stock} disponibles)`;
    stockProducto.className = 'stock bajo-stock';
  } else {
    stockProducto.textContent = '❌ Agotado';
    stockProducto.className = 'stock agotado';
  }
}

// ========================================
// CONFIGURAR CANTIDAD
// ========================================

function configurarCantidad(producto) {
  const cantidadInput = document.getElementById('cantidad');
  
  if (!cantidadInput) return;
  
  cantidadInput.max = Math.max(1, producto.stock);
  cantidadInput.value = 1;
  
  // Conectar botones + y - directamente aquí (evita problema de orden con defer)
  const btnMenos = document.getElementById('btnMenos');
  const btnMas = document.getElementById('btnMas');
  
  if (btnMenos) {
    btnMenos.onclick = () => {
      const val = parseInt(cantidadInput.value) || 1;
      const min = parseInt(cantidadInput.min) || 1;
      if (val > min) cantidadInput.value = val - 1;
    };
  }
  
  if (btnMas) {
    btnMas.onclick = () => {
      const val = parseInt(cantidadInput.value) || 1;
      const max = parseInt(cantidadInput.max) || 99;
      if (val < max) cantidadInput.value = val + 1;
    };
  }
  
  // Deshabilitar si no hay stock
  if (producto.stock === 0) {
    cantidadInput.disabled = true;
    cantidadInput.value = 0;
    
    const botonesCantidad = document.querySelectorAll('.btn-cantidad');
    botonesCantidad.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }
}

// ========================================
// BOTÓN AGREGAR AL CARRITO
// ========================================

function configurarBotonCarrito(producto) {
  const btnAgregarCarrito = document.getElementById('agregarCarrito');
  
  if (!btnAgregarCarrito) return;
  
  if (producto.stock === 0) {
    btnAgregarCarrito.disabled = true;
    btnAgregarCarrito.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>Sin stock disponible</span>
    `;
  } else {
    btnAgregarCarrito.disabled = false;
    btnAgregarCarrito.onclick = () => agregarAlCarrito(producto);
  }
}

// ========================================
// AGREGAR AL CARRITO
// ========================================

function agregarAlCarrito(producto) {
  const cantidadInput = document.getElementById('cantidad');
  const cantidad = parseInt(cantidadInput.value) || 1;
  
  // Validaciones
  if (cantidad <= 0) {
    mostrarNotificacion('Por favor selecciona una cantidad válida', 'error');
    return;
  }
  
  if (cantidad > producto.stock) {
    mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles`, 'error');
    return;
  }
  
  // Obtener carrito actual
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Buscar si el producto ya existe
  const indiceExistente = carrito.findIndex(item => item.id === producto.id);
  
  if (indiceExistente !== -1) {
    // Si existe, actualizar cantidad
    const nuevaCantidad = carrito[indiceExistente].cantidad + cantidad;
    
    if (nuevaCantidad > producto.stock) {
      mostrarNotificacion(`Solo puedes agregar ${producto.stock} unidades en total`, 'error');
      return;
    }
    
    carrito[indiceExistente].cantidad = nuevaCantidad;
  } else {
    // Si no existe, agregar nuevo
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen_url: producto.imagen_url,
      cantidad: cantidad,
      stock: producto.stock
    });
  }
  
  // Guardar carrito
  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  // Mostrar confirmación
  mostrarNotificacion(`✅ ${cantidad} ${producto.nombre}(s) agregado(s) al carrito`, 'success');
  
  // Actualizar contador del carrito si existe
  if (typeof actualizarContadorCarrito === 'function') {
    actualizarContadorCarrito();
  }
  
  // Resetear cantidad a 1
  cantidadInput.value = 1;
  
  console.log('🛒 Carrito actualizado:', carrito);
}

// ========================================
// CONFIGURAR WHATSAPP
// ========================================

function configurarWhatsApp(producto) {
  const btnWhatsApp = document.getElementById('comprarWhatsApp');
  
  if (!btnWhatsApp) return;
  
  // Mapeo de categorías para mensaje
  const categoriasNombres = {
    'tobilleras': 'Dijes y Herrajes',
    'otros': 'Combos',
    'anillos': 'Anillos',
    'pulseras': 'Pulseras',
    'cadenas': 'Cadenas',
    'aretes': 'Aretes'
  };
  
  const nombreCategoria = categoriasNombres[producto.categoria] || capitalizar(producto.categoria);
  
  const telefono = '573217798612'; // Número de WhatsApp
  const mensaje = `¡Hola! Estoy interesado en el producto: *${producto.nombre}*\n\n` +
                  `Categoría: ${nombreCategoria}\n` +
                  (producto.precio ? `Precio: $${Number(producto.precio).toLocaleString('es-CO')}\n` : '') +
                  `\n¿Podrías darme más información?`;
  
  const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  
  btnWhatsApp.href = urlWhatsApp;
}

// ========================================
// NOTIFICACIONES
// ========================================

function mostrarNotificacion(mensaje, tipo = 'info') {
  // Crear elemento de notificación
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion notificacion-${tipo}`;
  notificacion.textContent = mensaje;
  
  // Estilos inline para la notificación
  Object.assign(notificacion.style, {
    position: 'fixed',
    top: '100px',
    right: '20px',
    padding: '16px 24px',
    backgroundColor: tipo === 'success' ? '#8cff9b' : tipo === 'error' ? '#ff6464' : '#f9dc5e',
    color: '#000',
    borderRadius: '12px',
    fontWeight: '600',
    fontSize: '1rem',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
    zIndex: '10000',
    animation: 'slideInRight 0.3s ease',
    maxWidth: '300px',
    wordWrap: 'break-word'
  });
  
  document.body.appendChild(notificacion);
  
  // Eliminar después de 3 segundos
  setTimeout(() => {
    notificacion.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      document.body.removeChild(notificacion);
    }, 300);
  }, 3000);
}

// ========================================
// MOSTRAR ERROR
// ========================================

function mostrarError(mensaje) {
  console.error('💥 Error:', mensaje);
  
  const productoContainer = document.querySelector('.producto-container');
  
  if (productoContainer) {
    productoContainer.innerHTML = `
      <div class="error-state" style="grid-column: 1 / -1;">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <h2>Error al cargar el producto</h2>
        <p>${mensaje}</p>
        <button onclick="history.back()">
          ← Volver atrás
        </button>
      </div>
    `;
  }
}

// ========================================
// UTILIDADES
// ========================================

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

// ========================================
// EXPORTAR FUNCIONES GLOBALES
// ========================================

if (typeof window !== 'undefined') {
  window.cambiarImagenPrincipal = cambiarImagenPrincipal;
  window.agregarAlCarrito = agregarAlCarrito;
}

// ========================================
// ANIMACIONES CSS
// ========================================

const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);