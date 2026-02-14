// ========================================
// SISTEMA DE PRODUCTOS CON PAGINACIÓN
// Versión 2.0 - Con filtrado sincronizado
// ========================================

document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

  // ===== VARIABLES DE ESTADO =====
  let paginaActual = 1;
  let itemsPorPagina = 12;
  let todosLosProductos = []; // Array original completo (NUNCA modificar)
  let productosFiltrados = []; // Array con filtro/orden aplicado

  // Mostrar estado de carga inicial
  if (contenedor) {
    contenedor.innerHTML = '<div class="loading">Cargando productos...</div>';
  }

  try {
    // ===== OBTENER CATEGORÍA =====
    const categoriaActual = document.body.dataset.categoria;
    
    if (!categoriaActual) {
      throw new Error("No se pudo determinar la categoría actual. Asegúrate de que el body tenga data-categoria.");
    }

    console.log(`📂 Cargando productos de la categoría: ${categoriaActual}`);

    // ===== VERIFICAR API =====
    if (typeof productosAPI === 'undefined') {
      throw new Error('La API de productos no está disponible. Asegúrate de cargar api.js antes de este script.');
    }

    // Mapeo de categorías
    const nombreCategoria = {
      'tobilleras': 'Dijes y Herrajes',
      'otros': 'Combos',
      'anillos': 'Anillos',
      'pulseras': 'Pulseras',
      'cadenas': 'Cadenas',
      'aretes': 'Aretes'
    };

    // ===== CARGAR PRODUCTOS DESDE API =====
    todosLosProductos = await productosAPI.getByCategoria(categoriaActual);
    productosFiltrados = [...todosLosProductos]; // Copia inicial
    
    console.log(`✅ ${todosLosProductos.length} productos encontrados en '${categoriaActual}'`);

    if (todosLosProductos.length === 0) {
      contenedor.innerHTML = `
        <div class="error">
          <p>No se encontraron productos en la categoría "${nombreCategoria[categoriaActual] || categoriaActual}".</p>
          <p>Intenta navegar a otra categoría o contacta al administrador.</p>
        </div>
      `;
      return;
    }

    // ===== MOSTRAR PRODUCTOS INICIALES =====
    mostrarProductosPaginados();
    actualizarEstadisticasFiltro();

    // ===== EVENT LISTENER DEL FILTRO =====
    if (filtro) {
      filtro.addEventListener("change", () => {
        const valorFiltro = filtro.value;
        console.log(`🔄 Aplicando filtro: ${valorFiltro}`);
        
        // Aplicar ordenamiento
        aplicarOrdenamiento(valorFiltro);
        
        // IMPORTANTE: Resetear a página 1
        paginaActual = 1;
        
        // Actualizar vista
        actualizarEstadisticasFiltro();
        mostrarProductosPaginados();
        
        console.log(`✅ Mostrando ${productosFiltrados.length} productos filtrados`);
      });
    }

  } catch (error) {
    console.error("❌ Error al cargar productos:", error);
    if (contenedor) {
      contenedor.innerHTML = `
        <div class="error">
          <h3>Error al cargar los productos</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Posibles soluciones:</strong></p>
          <ul>
            <li>Verifica que el servidor backend esté corriendo</li>
            <li>Asegúrate de que api.js esté cargado correctamente</li>
            <li>Comprueba que el body tenga el atributo data-categoria</li>
          </ul>
          <button onclick="window.location.reload()" class="ver-mas" style="margin-top: 15px;">
            Recargar página
          </button>
        </div>
      `;
    }
  }

  // ========================================
  // FUNCIÓN: APLICAR ORDENAMIENTO
  // ========================================
  function aplicarOrdenamiento(tipoOrden) {
    // Siempre partir del array original
    productosFiltrados = [...todosLosProductos];
    
    console.log(`📊 Ordenando ${productosFiltrados.length} productos por: ${tipoOrden}`);
    
    switch (tipoOrden) {
      case "nombre-asc":
        productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
        
      case "nombre-desc":
        productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
        
      case "precio-asc":
        productosFiltrados.sort((a, b) => {
          const precioA = a.precio || 0;
          const precioB = b.precio || 0;
          return precioA - precioB;
        });
        break;
        
      case "precio-desc":
        productosFiltrados.sort((a, b) => {
          const precioA = a.precio || 0;
          const precioB = b.precio || 0;
          return precioB - precioA;
        });
        break;
        
      case "destacados":
        productosFiltrados.sort((a, b) => {
          // Primero destacados
          if (a.destacado && !b.destacado) return -1;
          if (!a.destacado && b.destacado) return 1;
          // Luego por nombre
          return a.nombre.localeCompare(b.nombre);
        });
        break;
        
      case "stock-desc":
        productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
        
      default:
        // Orden por defecto: más recientes primero
        productosFiltrados.sort((a, b) => {
          const dateA = new Date(a.created_at || 0);
          const dateB = new Date(b.created_at || 0);
          return dateB - dateA;
        });
    }
  }

  // ========================================
  // FUNCIÓN: MOSTRAR PRODUCTOS PAGINADOS
  // ========================================
  function mostrarProductosPaginados() {
    if (!contenedor) return;

    console.log(`📄 Renderizando página ${paginaActual} (${productosFiltrados.length} productos totales)`);

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="error">No se encontraron productos.</div>';
      return;
    }

    // Calcular productos de esta página
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const productosPagina = productosFiltrados.slice(inicio, fin);
    
    console.log(`   → Mostrando ${productosPagina.length} productos (${inicio + 1}-${Math.min(fin, productosFiltrados.length)})`);

    // Renderizar productos
    contenedor.innerHTML = productosPagina.map(producto => {
      const stockClass = producto.stock > 10 ? 'disponible' : 
                        producto.stock > 0 ? 'bajo-stock' : 'agotado';
      
      const stockText = producto.stock > 0 ? `Stock: ${producto.stock}` : 'Agotado';
      const destacadoBadge = producto.destacado ? '<div class="destacado-badge">⭐ Destacado</div>' : '';

      // Precio
      let precioHTML = '';
      if (producto.precio && producto.precio > 0) {
        precioHTML = `<p class="precio">$${Number(producto.precio).toLocaleString('es-CO')}</p>`;
      } else {
        precioHTML = '<p class="precio consultar">Consultar precio</p>';
      }

      // Imagen
      const imagenUrl = producto.imagen_url || 'https://via.placeholder.com/300x300/1a1a1a/f9dc5e?text=Sin+Imagen';

      return `
        <div class="producto-card" data-stock="${stockClass}">
          ${destacadoBadge}
          <img src="${imagenUrl}" 
                alt="${producto.nombre}" 
                loading="lazy"
                onerror="this.src='https://via.placeholder.com/300x300/1a1a1a/f9dc5e?text=Sin+Imagen'; this.onerror=null;" />
          <h3>${producto.nombre}</h3>
          <p class="descripcion">${producto.descripcion || 'Sin descripción'}</p>
          ${precioHTML}
          <p class="stock ${stockClass}">${stockText}</p>
          <a href="/producto/${producto.id}" class="ver-mas">Ver más</a>
        </div>
      `;
    }).join("");

    // Animación de entrada
    const cards = contenedor.querySelectorAll('.producto-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 50);
    });

    // Agregar controles de paginación
    agregarControlesPaginacion();

    // Scroll suave al cambiar de página
    if (paginaActual > 1) {
      const categoriaMain = document.querySelector('.categoria-main');
      if (categoriaMain) {
        categoriaMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // ========================================
  // FUNCIÓN: AGREGAR CONTROLES DE PAGINACIÓN
  // ========================================
  function agregarControlesPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
    
    // Si solo hay 1 página, no mostrar controles
    if (totalPaginas <= 1) return;
    
    const paginacionContainer = document.createElement('div');
    paginacionContainer.className = 'paginacion-container';
    
    const inicio = (paginaActual - 1) * itemsPorPagina + 1;
    const fin = Math.min(paginaActual * itemsPorPagina, productosFiltrados.length);
    
    paginacionContainer.innerHTML = `
      <div class="paginacion-info">
        Mostrando <strong>${inicio}-${fin}</strong> de <strong>${productosFiltrados.length}</strong> productos
      </div>
      
      <div class="paginacion-controles" id="paginacionControles"></div>
      
      <div class="items-per-page-container">
        <label for="itemsPerPage">Mostrar:</label>
        <select id="itemsPerPage" class="items-per-page-select">
          <option value="8" ${itemsPorPagina === 8 ? 'selected' : ''}>8</option>
          <option value="12" ${itemsPorPagina === 12 ? 'selected' : ''}>12</option>
          <option value="16" ${itemsPorPagina === 16 ? 'selected' : ''}>16</option>
          <option value="24" ${itemsPorPagina === 24 ? 'selected' : ''}>24</option>
          <option value="${productosFiltrados.length}" ${itemsPorPagina === productosFiltrados.length ? 'selected' : ''}>Todo</option>
        </select>
      </div>
    `;
    
    contenedor.appendChild(paginacionContainer);
    
    // Generar botones
    generarBotonesPaginacion(totalPaginas);
    
    // Event listener para cambiar items/página
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
      itemsPorPagina = parseInt(e.target.value);
      paginaActual = 1;
      mostrarProductosPaginados();
    });
  }

  // ========================================
  // FUNCIÓN: GENERAR BOTONES DE PAGINACIÓN
  // ========================================
  function generarBotonesPaginacion(totalPaginas) {
    const controlesContainer = document.getElementById('paginacionControles');
    controlesContainer.innerHTML = '';
    
    // Botón Anterior
    const btnAnterior = crearBotonNavegacion('prev', paginaActual > 1);
    btnAnterior.addEventListener('click', () => cambiarPagina(paginaActual - 1));
    controlesContainer.appendChild(btnAnterior);
    
    // Páginas con ellipsis
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
  // FUNCIÓN: CALCULAR PÁGINAS A MOSTRAR
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
  // FUNCIÓN: CREAR BOTÓN DE NAVEGACIÓN
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
  // FUNCIÓN: CREAR BOTÓN DE NÚMERO
  // ========================================
  function crearBotonNumero(numero, activo) {
    const btn = document.createElement('button');
    btn.className = `paginacion-btn ${activo ? 'active' : ''}`;
    btn.textContent = numero;
    return btn;
  }

  // ========================================
  // FUNCIÓN: CAMBIAR DE PÁGINA
  // ========================================
  function cambiarPagina(nuevaPagina) {
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    mostrarProductosPaginados();
  }

  // ========================================
  // FUNCIÓN: ACTUALIZAR ESTADÍSTICAS
  // ========================================
  function actualizarEstadisticasFiltro() {
    const statsContainer = document.getElementById('filtroStats');
    if (!statsContainer) return;
    
    const totalProductos = todosLosProductos.length;
    const productosDestacados = todosLosProductos.filter(p => p.destacado).length;
    const productosConStock = todosLosProductos.filter(p => p.stock > 0).length;
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
    
    const filtroSelect = document.getElementById('filtro');
    const filtroActual = filtroSelect ? filtroSelect.options[filtroSelect.selectedIndex].text : 'Más recientes';
    
    // Animación
    statsContainer.classList.add('updating');
    setTimeout(() => statsContainer.classList.remove('updating'), 300);
    
    statsContainer.innerHTML = `
      <p>
        <span class="stat-label">Total:</span>
        <strong>${totalProductos}</strong>
      </p>
      <p>
        <span class="stat-label">Mostrando:</span>
        <strong>${productosFiltrados.length}</strong>
      </p>
      <hr>
      <p>
        <span class="stat-label">Destacados:</span>
        <strong>${productosDestacados}</strong>
      </p>
      <p>
        <span class="stat-label">Con stock:</span>
        <strong>${productosConStock}</strong>
      </p>
      <p>
        <span class="stat-label">Páginas:</span>
        <strong>${totalPaginas}</strong>
      </p>
      ${filtroSelect && filtroSelect.value !== 'default' ? `
        <div class="filtro-activo-badge">
          📊 ${filtroActual}
        </div>
      ` : ''}
    `;
  }
});