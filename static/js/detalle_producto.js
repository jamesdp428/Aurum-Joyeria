// ========== CARGAR DETALLE DEL PRODUCTO ==========

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔍 Iniciando carga de detalle de producto...');
  
  // Verificar que la API esté cargada
  if (typeof productosAPI === 'undefined') {
    mostrarError('La API de productos no está disponible. Recarga la página.');
    return;
  }
  
  // Obtener ID del producto desde window.PRODUCTO_ID (pasado por el template)
  const productoId = window.PRODUCTO_ID;
  
  console.log('📦 ID del producto:', productoId);
  
  if (!productoId) {
    mostrarError('No se especificó un producto. Por favor, regresa y selecciona un producto.');
    return;
  }
  
  try {
    // Cargar producto desde la API
    console.log('📡 Obteniendo producto de la API...');
    const producto = await productosAPI.getById(productoId);
    
    console.log('✅ Producto cargado:', producto);
    
    // Renderizar el producto
    renderizarProducto(producto);
    
  } catch (error) {
    console.error('❌ Error al cargar producto:', error);
    mostrarError(`No se pudo cargar el producto: ${error.message}`);
  }
});

// ========== RENDERIZAR PRODUCTO ==========

function renderizarProducto(producto) {
  console.log('🎨 Renderizando producto:', producto.nombre);
  
  // BREADCRUMB
  const categoriaBreadcrumb = document.getElementById('categoriaBreadcrumb');
  const nombreBreadcrumb = document.getElementById('nombreBreadcrumb');
  
  if (categoriaBreadcrumb) {
    categoriaBreadcrumb.textContent = capitalizar(producto.categoria);
    categoriaBreadcrumb.href = `/${producto.categoria}`;
  }
  
  if (nombreBreadcrumb) {
    nombreBreadcrumb.textContent = producto.nombre;
  }
  
  // TÍTULO
  const nombreProducto = document.getElementById('nombreProducto');
  if (nombreProducto) {
    nombreProducto.textContent = producto.nombre;
  }
  
  // DESCRIPCIÓN
  const descripcionProducto = document.getElementById('descripcionProducto');
  if (descripcionProducto) {
    descripcionProducto.textContent = producto.descripcion || 'Sin descripción disponible.';
  }
  
  // CATEGORÍA
  const categoriaProducto = document.getElementById('categoriaProducto');
  if (categoriaProducto) {
    categoriaProducto.textContent = capitalizar(producto.categoria);
  }
  
  // IMAGEN PRINCIPAL
  const imagenPrincipal = document.getElementById('imagenPrincipal');
  if (imagenPrincipal) {
    if (producto.imagen_url) {
      imagenPrincipal.src = producto.imagen_url;
      imagenPrincipal.alt = producto.nombre;
      imagenPrincipal.onerror = function() {
        this.src = 'https://via.placeholder.com/500x500/1a1a1a/f9dc5e?text=Sin+Imagen';
      };
    } else {
      imagenPrincipal.src = 'https://via.placeholder.com/500x500/1a1a1a/f9dc5e?text=Sin+Imagen';
      imagenPrincipal.alt = 'Sin imagen disponible';
    }
  }
  
  // MINIATURAS (por ahora solo mostramos la imagen principal)
  const miniaturasContainer = document.getElementById('miniaturasContainer');
  if (miniaturasContainer && producto.imagen_url) {
    miniaturasContainer.innerHTML = `
      <img src="${producto.imagen_url}" 
           alt="${producto.nombre}" 
           class="active"
           onclick="cambiarImagenPrincipal('${producto.imagen_url}')"
           onerror="this.src='https://via.placeholder.com/100x100/1a1a1a/f9dc5e?text=Sin+Imagen'">
    `;
  }
  
  // STOCK
  const stockProducto = document.getElementById('stockProducto');
  
  if (stockProducto) {
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
  
  // CONFIGURAR INPUT DE CANTIDAD
  const cantidadInput = document.getElementById('cantidad');
  if (cantidadInput) {
    cantidadInput.max = Math.max(1, producto.stock);
    cantidadInput.value = 1;
    
    // Deshabilitar si no hay stock
    if (producto.stock === 0) {
      cantidadInput.disabled = true;
      cantidadInput.value = 0;
    }
  }
  
  // BOTÓN AGREGAR AL CARRITO
  const btnAgregarCarrito = document.getElementById('agregarCarrito');
  if (btnAgregarCarrito) {
    if (producto.stock === 0) {
      btnAgregarCarrito.disabled = true;
      btnAgregarCarrito.textContent = 'Sin stock disponible';
      btnAgregarCarrito.style.opacity = '0.5';
      btnAgregarCarrito.style.cursor = 'not-allowed';
    } else {
      btnAgregarCarrito.disabled = false;
      btnAgregarCarrito.onclick = () => agregarAlCarrito(producto);
    }
  }
  
  // WHATSAPP
  configurarWhatsApp(producto);
  
  console.log('✅ Producto renderizado completamente');
}

// ========== AGREGAR AL CARRITO ==========

function agregarAlCarrito(producto) {
  const cantidadInput = document.getElementById('cantidad');
  const cantidad = parseInt(cantidadInput.value) || 1;
  
  if (cantidad <= 0) {
    alert('Por favor selecciona una cantidad válida');
    return;
  }
  
  if (cantidad > producto.stock) {
    alert(`Solo hay ${producto.stock} unidades disponibles`);
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
      alert(`Solo puedes agregar ${producto.stock} unidades en total`);
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
  alert(`✅ ${cantidad} ${producto.nombre}(s) agregado(s) al carrito`);
  
  // Actualizar contador del carrito si existe
  if (typeof actualizarContadorCarrito === 'function') {
    actualizarContadorCarrito();
  }
  
  console.log('🛒 Carrito actualizado:', carrito);
}

// ========== CONFIGURAR WHATSAPP ==========

function configurarWhatsApp(producto) {
  const btnWhatsApp = document.getElementById('comprarWhatsApp');
  
  if (!btnWhatsApp) return;
  
  const telefono = '573217798612'; // Número de WhatsApp
  const mensaje = `Hola! Estoy interesado en el producto: *${producto.nombre}*\n\n` +
                  `Categoría: ${capitalizar(producto.categoria)}\n` +
                  (producto.precio ? `Precio: $${Number(producto.precio).toLocaleString('es-CO')}\n` : '') +
                  `\n¿Podrías darme más información?`;
  
  const urlWhatsApp = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  
  btnWhatsApp.href = urlWhatsApp;
}

// ========== CAMBIAR IMAGEN PRINCIPAL ==========

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

// ========== UTILIDADES ==========

function capitalizar(texto) {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

function mostrarError(mensaje) {
  console.error('💥 Error:', mensaje);
  
  const mainContent = document.querySelector('.detalle-producto');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div style="
        width: 100%;
        max-width: 600px;
        margin: 100px auto;
        padding: 40px;
        background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
        border-radius: 20px;
        text-align: center;
        border: 2px solid #f44336;
      ">
        <h2 style="color: #f44336; margin-bottom: 20px;">❌ Error</h2>
        <p style="color: #ccc; font-size: 18px; margin-bottom: 30px;">${mensaje}</p>
        <button 
          onclick="history.back()" 
          style="
            background: linear-gradient(45deg, #f9dc5e, #ffd700);
            color: #000;
            border: none;
            padding: 15px 40px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s;
          "
          onmouseover="this.style.transform='scale(1.05)'"
          onmouseout="this.style.transform='scale(1)'"
        >
          ← Volver atrás
        </button>
      </div>
    `;
  }
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.cambiarImagenPrincipal = cambiarImagenPrincipal;
  window.agregarAlCarrito = agregarAlCarrito;
}