// Cargar productos destacados desde la API con paginación
document.addEventListener('DOMContentLoaded', async () => {
  const productosGrid = document.querySelector('.productos-grid');
  
  console.log('🔍 cargar_destacados.js iniciado');
  console.log('🔍 productosGrid encontrado:', !!productosGrid);
  
  if (!productosGrid) {
    console.warn('⚠️ No se encontró .productos-grid - no estamos en la página de inicio');
    return;
  }
  
  // Configuración de paginación
  let paginaActual = 1;
  let itemsPorPagina = 12;
  let todosLosProductos = [];
  
  try {
    // Verificar que la API esté disponible
    if (typeof productosAPI === 'undefined') {
      throw new Error('productosAPI no está definida. Asegúrate de que api.js se carga primero.');
    }
    
    console.log('✅ productosAPI está disponible');
    
    // Mostrar loading
    productosGrid.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    // Obtener productos destacados de la API
    console.log('📡 Llamando a la API para productos destacados...');
    todosLosProductos = await productosAPI.getAll({ destacado: true, activo: true });
    
    console.log('📦 Productos recibidos:', todosLosProductos.length);
    
    // Si no hay productos
    if (!todosLosProductos || todosLosProductos.length === 0) {
      console.warn('⚠️ No hay productos destacados');
      productosGrid.innerHTML = `
        <div class="error">
          No hay productos destacados disponibles en este momento.
        </div>
      `;
      return;
    }
    
    // Renderizar productos paginados
    renderizarProductosPaginados();
    
    console.log('✅ Productos renderizados con paginación');
    
  } catch (error) {
    console.error('❌ Error al cargar productos:', error);
    console.error('❌ Stack:', error.stack);
    
    productosGrid.innerHTML = `
      <div class="error">
        Error al cargar los productos. Por favor intenta de nuevo más tarde.
        <br><small>Error: ${error.message}</small>
      </div>
    `;
  }
  
  /**
   * Renderiza los productos de la página actual
   */
  function renderizarProductosPaginados() {
    // Limpiar grid
    productosGrid.innerHTML = '';
    
    // Calcular índices
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const productosPagina = todosLosProductos.slice(inicio, fin);
    
    // Renderizar productos de la página actual
    productosPagina.forEach((producto, index) => {
      const productoCard = crearProductoCard(producto);
      
      // Animación de entrada escalonada
      productoCard.style.opacity = '0';
      productoCard.style.transform = 'translateY(20px)';
      productosGrid.appendChild(productoCard);
      
      setTimeout(() => {
        productoCard.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        productoCard.style.opacity = '1';
        productoCard.style.transform = 'translateY(0)';
      }, index * 50);
    });
    
    // Agregar controles de paginación
    agregarControlesPaginacion();
    
    // Scroll suave al inicio de la sección
    if (paginaActual > 1) {
      const productosSection = document.querySelector('.productos-destacados');
      if (productosSection) {
        productosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  
  /**
   * Agrega los controles de paginación
   */
  function agregarControlesPaginacion() {
    const totalPaginas = Math.ceil(todosLosProductos.length / itemsPorPagina);
    
    // Si solo hay una página, no mostrar controles
    if (totalPaginas <= 1) return;
    
    const paginacionContainer = document.createElement('div');
    paginacionContainer.className = 'paginacion-container';
    
    // Información de paginación
    const inicio = (paginaActual - 1) * itemsPorPagina + 1;
    const fin = Math.min(paginaActual * itemsPorPagina, todosLosProductos.length);
    
    paginacionContainer.innerHTML = `
      <div class="paginacion-info">
        Mostrando <strong>${inicio}-${fin}</strong> de <strong>${todosLosProductos.length}</strong> productos
      </div>
      
      <div class="paginacion-controles" id="paginacionControles">
        <!-- Los botones se generan dinámicamente -->
      </div>
      
      <div class="items-per-page-container">
        <label for="itemsPerPage">Mostrar:</label>
        <select id="itemsPerPage" class="items-per-page-select">
          <option value="8" ${itemsPorPagina === 8 ? 'selected' : ''}>8</option>
          <option value="12" ${itemsPorPagina === 12 ? 'selected' : ''}>12</option>
          <option value="16" ${itemsPorPagina === 16 ? 'selected' : ''}>16</option>
          <option value="24" ${itemsPorPagina === 24 ? 'selected' : ''}>24</option>
          <option value="48" ${itemsPorPagina === 48 ? 'selected' : ''}>Todo</option>
        </select>
      </div>
    `;
    
    productosGrid.appendChild(paginacionContainer);
    
    // Generar botones de paginación
    generarBotonesPaginacion(totalPaginas);
    
    // Event listener para cambiar items por página
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
      itemsPorPagina = parseInt(e.target.value);
      paginaActual = 1;
      renderizarProductosPaginados();
    });
  }
  
  /**
   * Genera los botones de paginación con lógica de ellipsis
   */
  function generarBotonesPaginacion(totalPaginas) {
    const controlesContainer = document.getElementById('paginacionControles');
    controlesContainer.innerHTML = '';
    
    // Botón anterior
    const btnAnterior = crearBotonPaginacion('prev', paginaActual > 1);
    btnAnterior.addEventListener('click', () => cambiarPagina(paginaActual - 1));
    controlesContainer.appendChild(btnAnterior);
    
    // Lógica de páginas a mostrar
    const paginasAMostrar = calcularPaginasAMostrar(paginaActual, totalPaginas);
    
    paginasAMostrar.forEach((pagina, index) => {
      if (pagina === '...') {
        const ellipsis = document.createElement('button');
        ellipsis.className = 'paginacion-btn ellipsis';
        ellipsis.textContent = '⋯';
        ellipsis.disabled = true;
        controlesContainer.appendChild(ellipsis);
      } else {
        const btnPagina = crearBotonNumero(pagina, pagina === paginaActual);
        btnPagina.addEventListener('click', () => cambiarPagina(pagina));
        controlesContainer.appendChild(btnPagina);
      }
    });
    
    // Botón siguiente
    const btnSiguiente = crearBotonPaginacion('next', paginaActual < totalPaginas);
    btnSiguiente.addEventListener('click', () => cambiarPagina(paginaActual + 1));
    controlesContainer.appendChild(btnSiguiente);
  }
  
  /**
   * Calcula qué páginas mostrar con ellipsis
   */
  function calcularPaginasAMostrar(actual, total) {
    const delta = 2; // Páginas a mostrar alrededor de la actual
    const pages = [];
    
    // Siempre mostrar primera página
    pages.push(1);
    
    // Calcular rango alrededor de la página actual
    for (let i = Math.max(2, actual - delta); i <= Math.min(total - 1, actual + delta); i++) {
      // Agregar ellipsis si hay salto
      if (pages[pages.length - 1] < i - 1) {
        pages.push('...');
      }
      pages.push(i);
    }
    
    // Agregar ellipsis antes de la última si es necesario
    if (pages[pages.length - 1] < total - 1) {
      pages.push('...');
    }
    
    // Siempre mostrar última página (si hay más de una)
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  }
  
  /**
   * Crea un botón de navegación (anterior/siguiente)
   */
  function crearBotonPaginacion(tipo, habilitado) {
    const btn = document.createElement('button');
    btn.className = 'paginacion-btn paginacion-arrow';
    btn.disabled = !habilitado;
    
    if (tipo === 'prev') {
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        <span>Anterior</span>
      `;
    } else {
      btn.innerHTML = `
        <span>Siguiente</span>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      `;
    }
    
    return btn;
  }
  
  /**
   * Crea un botón de número de página
   */
  function crearBotonNumero(numero, activo) {
    const btn = document.createElement('button');
    btn.className = `paginacion-btn ${activo ? 'active' : ''}`;
    btn.textContent = numero;
    return btn;
  }
  
  /**
   * Cambia a una página específica
   */
  function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(todosLosProductos.length / itemsPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    renderizarProductosPaginados();
  }
});

/**
 * Crea una tarjeta de producto
 */
function crearProductoCard(producto) {
  console.log(`🗂️ Creando card para: ${producto.nombre}`);
  
  const card = document.createElement('a');
  card.href = `/producto/${producto.id}`;
  card.className = 'producto-destacado';
  
  // Badge de destacado
  const badge = document.createElement('div');
  badge.className = 'destacado-badge';
  badge.textContent = 'Destacado';
  card.appendChild(badge);
  
  // Imagen con placeholder online
  const img = document.createElement('img');
  img.alt = producto.nombre;
  img.loading = 'lazy';
  
  // Validar si tiene imagen
  if (producto.imagen_url && producto.imagen_url.trim() !== '') {
    img.src = producto.imagen_url;
    
    img.onerror = function() {
      this.src = 'https://via.placeholder.com/250x250/1a1a1a/f9dc5e?text=Sin+Imagen';
      this.onerror = null;
    };
  } else {
    img.src = 'https://via.placeholder.com/250x250/1a1a1a/f9dc5e?text=Sin+Imagen';
  }
  
  card.appendChild(img);
  
  // Título
  const titulo = document.createElement('h3');
  titulo.textContent = producto.nombre;
  card.appendChild(titulo);
  
  // Descripción
  const descripcion = document.createElement('p');
  descripcion.textContent = producto.descripcion || 'Sin descripción';
  card.appendChild(descripcion);
  
  // Precio o "Consultar"
  const precio = document.createElement('div');
  precio.className = 'producto-precio';
  if (producto.precio && producto.precio > 0) {
    precio.textContent = `$${Number(producto.precio).toLocaleString('es-CO')}`;
  } else {
    precio.textContent = 'Consultar precio';
    precio.style.fontStyle = 'italic';
  }
  card.appendChild(precio);
  
  // Botón
  const boton = document.createElement('span');
  boton.className = 'ver-mas';
  boton.textContent = 'Ver más';
  card.appendChild(boton);
  
  return card;
}