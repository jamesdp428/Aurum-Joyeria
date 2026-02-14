// ========================================
// SISTEMA DE PRODUCTOS DESTACADOS CON PAGINACIÓN
// Versión 2.0 - Para página de inicio
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  const productosGrid = document.querySelector('.productos-grid');
  
  console.log('🏠 Iniciando carga de productos destacados...');
  
  if (!productosGrid) {
    console.warn('⚠️ No se encontró .productos-grid - No estamos en la página de inicio');
    return;
  }
  
  // ===== VARIABLES DE ESTADO =====
  let paginaActual = 1;
  let itemsPorPagina = 12;
  let todosLosProductos = [];
  
  try {
    // ===== VERIFICAR API =====
    if (typeof productosAPI === 'undefined') {
      throw new Error('productosAPI no está definida. Asegúrate de que api.js se carga primero.');
    }
    
    console.log('✅ API disponible');
    
    // ===== MOSTRAR LOADING =====
    productosGrid.innerHTML = '<div class="loading">Cargando productos destacados...</div>';
    
    // ===== OBTENER PRODUCTOS DESDE API =====
    console.log('📡 Solicitando productos destacados...');
    todosLosProductos = await productosAPI.getAll({ destacado: true, activo: true });
    
    console.log(`✅ ${todosLosProductos.length} productos destacados recibidos`);
    
    // ===== VALIDAR PRODUCTOS =====
    if (!todosLosProductos || todosLosProductos.length === 0) {
      console.warn('⚠️ No hay productos destacados');
      productosGrid.innerHTML = `
        <div class="error">
          No hay productos destacados disponibles en este momento.
        </div>
      `;
      return;
    }
    
    // ===== ORDENAR POR DEFECTO (MÁS RECIENTES) =====
    todosLosProductos.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB - dateA;
    });
    
    // ===== RENDERIZAR PRIMERA PÁGINA =====
    renderizarProductosPaginados();
    
    console.log('✅ Productos destacados cargados con paginación');
    
  } catch (error) {
    console.error('❌ Error al cargar productos destacados:', error);
    productosGrid.innerHTML = `
      <div class="error">
        Error al cargar los productos. Por favor intenta de nuevo más tarde.
        <br><small>${error.message}</small>
      </div>
    `;
  }
  
  // ========================================
  // FUNCIÓN: RENDERIZAR PRODUCTOS PAGINADOS
  // ========================================
  function renderizarProductosPaginados() {
    console.log(`📄 Renderizando página ${paginaActual} de productos destacados`);
    
    // Limpiar grid
    productosGrid.innerHTML = '';
    
    // Calcular índices
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const productosPagina = todosLosProductos.slice(inicio, fin);
    
    console.log(`   → Mostrando ${productosPagina.length} productos (${inicio + 1}-${Math.min(fin, todosLosProductos.length)})`);
    
    // Renderizar cada producto
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
    
    // Scroll suave al inicio
    if (paginaActual > 1) {
      const productosSection = document.querySelector('.productos-destacados');
      if (productosSection) {
        productosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
  
  // ========================================
  // FUNCIÓN: CREAR TARJETA DE PRODUCTO
  // ========================================
  function crearProductoCard(producto) {
    const card = document.createElement('a');
    card.href = `/producto/${producto.id}`;
    card.className = 'producto-destacado';
    
    // Badge de destacado
    const badge = document.createElement('div');
    badge.className = 'destacado-badge';
    badge.textContent = 'Destacado';
    card.appendChild(badge);
    
    // Imagen
    const img = document.createElement('img');
    img.alt = producto.nombre;
    img.loading = 'lazy';
    
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
    
    // Precio
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
  
  // ========================================
  // FUNCIÓN: AGREGAR CONTROLES
  // ========================================
  function agregarControlesPaginacion() {
    const totalPaginas = Math.ceil(todosLosProductos.length / itemsPorPagina);
    
    // Si solo hay 1 página, no mostrar controles
    if (totalPaginas <= 1) return;
    
    const paginacionContainer = document.createElement('div');
    paginacionContainer.className = 'paginacion-container';
    
    const inicio = (paginaActual - 1) * itemsPorPagina + 1;
    const fin = Math.min(paginaActual * itemsPorPagina, todosLosProductos.length);
    
    paginacionContainer.innerHTML = `
      <div class="paginacion-info">
        Mostrando <strong>${inicio}-${fin}</strong> de <strong>${todosLosProductos.length}</strong> productos
      </div>
      
      <div class="paginacion-controles" id="paginacionControles"></div>
      
      <div class="items-per-page-container">
        <label for="itemsPerPage">Mostrar:</label>
        <select id="itemsPerPage" class="items-per-page-select">
          <option value="8" ${itemsPorPagina === 8 ? 'selected' : ''}>8</option>
          <option value="12" ${itemsPorPagina === 12 ? 'selected' : ''}>12</option>
          <option value="16" ${itemsPorPagina === 16 ? 'selected' : ''}>16</option>
          <option value="24" ${itemsPorPagina === 24 ? 'selected' : ''}>24</option>
          <option value="${todosLosProductos.length}" ${itemsPorPagina === todosLosProductos.length ? 'selected' : ''}>Todo</option>
        </select>
      </div>
    `;
    
    productosGrid.appendChild(paginacionContainer);
    
    // Generar botones
    generarBotonesPaginacion(totalPaginas);
    
    // Event listener
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
      itemsPorPagina = parseInt(e.target.value);
      paginaActual = 1;
      renderizarProductosPaginados();
    });
  }
  
  // ========================================
  // FUNCIÓN: GENERAR BOTONES
  // ========================================
  function generarBotonesPaginacion(totalPaginas) {
    const controlesContainer = document.getElementById('paginacionControles');
    controlesContainer.innerHTML = '';
    
    // Botón Anterior
    const btnAnterior = crearBotonNavegacion('prev', paginaActual > 1);
    btnAnterior.addEventListener('click', () => cambiarPagina(paginaActual - 1));
    controlesContainer.appendChild(btnAnterior);
    
    // Páginas
    const paginas = calcularPaginasAMostrar(paginaActual, totalPaginas);
    
    paginas.forEach((pagina) => {
      if (pagina === '...') {
        const ellipsis = document.createElement('button');
        ellipsis.className = 'paginacion-btn ellipsis';
        ellipsis.textContent = '⋯';
        ellipsis.disabled = true;
        controlesContainer.appendChild(ellipsis);
      } else {
        const btn = crearBotonNumero(pagina, pagina === paginaActual);
        btn.addEventListener('click', () => cambiarPagina(pagina));
        controlesContainer.appendChild(btn);
      }
    });
    
    // Botón Siguiente
    const btnSiguiente = crearBotonNavegacion('next', paginaActual < totalPaginas);
    btnSiguiente.addEventListener('click', () => cambiarPagina(paginaActual + 1));
    controlesContainer.appendChild(btnSiguiente);
  }
  
  // ========================================
  // FUNCIÓN: CALCULAR PÁGINAS
  // ========================================
  function calcularPaginasAMostrar(actual, total) {
    const delta = 2;
    const pages = [];
    
    pages.push(1);
    
    for (let i = Math.max(2, actual - delta); i <= Math.min(total - 1, actual + delta); i++) {
      if (pages[pages.length - 1] < i - 1) {
        pages.push('...');
      }
      pages.push(i);
    }
    
    if (pages[pages.length - 1] < total - 1) {
      pages.push('...');
    }
    
    if (total > 1) {
      pages.push(total);
    }
    
    return pages;
  }
  
  // ========================================
  // FUNCIÓN: CREAR BOTÓN NAVEGACIÓN
  // ========================================
  function crearBotonNavegacion(tipo, habilitado) {
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
  
  // ========================================
  // FUNCIÓN: CREAR BOTÓN NÚMERO
  // ========================================
  function crearBotonNumero(numero, activo) {
    const btn = document.createElement('button');
    btn.className = `paginacion-btn ${activo ? 'active' : ''}`;
    btn.textContent = numero;
    return btn;
  }
  
  // ========================================
  // FUNCIÓN: CAMBIAR PÁGINA
  // ========================================
  function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(todosLosProductos.length / itemsPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    renderizarProductosPaginados();
  }
});