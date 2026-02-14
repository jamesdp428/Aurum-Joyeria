document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

  // Configuración de paginación
  let paginaActual = 1;
  let itemsPorPagina = 12;
  let productosFiltrados = [];

  // Mostrar estado de carga
  if (contenedor) {
    contenedor.innerHTML = '<div class="loading">Cargando productos...</div>';
  }

  try {
    // Obtener categoría actual desde el data attribute del body
    const categoriaActual = document.body.dataset.categoria;
    
    if (!categoriaActual) {
      throw new Error("No se pudo determinar la categoría actual. Asegúrate de que el body tenga data-categoria.");
    }

    console.log(`Cargando productos de la categoría: ${categoriaActual}`);

    // Verificar si productosAPI está disponible
    if (typeof productosAPI === 'undefined') {
      throw new Error('La API de productos no está disponible. Asegúrate de cargar api.js antes de este script.');
    }

    // Traer productos de la categoría específica
    productosFiltrados = await productosAPI.getByCategoria(categoriaActual);
    
    console.log(`Productos encontrados en categoría '${categoriaActual}': ${productosFiltrados.length}`);

    if (productosFiltrados.length === 0) {
      const nombreCategoria = {
        'tobilleras': 'Dijes y Herrajes',
        'otros': 'Combos',
        'anillos': 'Anillos',
        'pulseras': 'Pulseras',
        'cadenas': 'Cadenas',
        'aretes': 'Aretes'
      };
      
      contenedor.innerHTML = `
        <div class="error">
          <p>No se encontraron productos en la categoría "${nombreCategoria[categoriaActual] || categoriaActual}".</p>
          <p>Intenta navegar a otra categoría o contacta al administrador.</p>
        </div>
      `;
      return;
    }

    // Mostrar productos inicialmente
    mostrarProductosPaginados();

    // Event listener para el filtro de ordenamiento
    if (filtro) {
      filtro.addEventListener("change", () => {
        ordenarProductos(filtro.value);
        paginaActual = 1; // Resetear a primera página al ordenar
        mostrarProductosPaginados();
      });
    }

  } catch (error) {
    console.error("Error detallado al cargar productos:", error);
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

  /**
   * Ordena los productos según el tipo seleccionado
   */
  function ordenarProductos(tipoOrden) {
    switch (tipoOrden) {
      case "nombre-asc":
        productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case "nombre-desc":
        productosFiltrados.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      case "destacados":
        productosFiltrados.sort((a, b) => {
          if (a.destacado && !b.destacado) return -1;
          if (!a.destacado && b.destacado) return 1;
          return a.nombre.localeCompare(b.nombre);
        });
        break;
      case "stock-desc":
        productosFiltrados.sort((a, b) => b.stock - a.stock);
        break;
      default:
        // Orden por defecto (por fecha de creación, más recientes primero)
        productosFiltrados.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateB - dateA;
        });
    }
  }

  /**
   * Muestra los productos de la página actual con paginación
   */
  function mostrarProductosPaginados() {
    if (!contenedor) return;

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="error">No se encontraron productos.</div>';
      return;
    }

    // Calcular índices
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const productosPagina = productosFiltrados.slice(inicio, fin);

    // Renderizar productos
    contenedor.innerHTML = productosPagina.map(producto => {
      const stockClass = producto.stock > 10 ? 'disponible' : 
                        producto.stock > 0 ? 'bajo-stock' : 'agotado';
      
      const stockText = producto.stock > 0 ? 
                        `Stock: ${producto.stock}` : 
                        'Agotado';

      const destacadoBadge = producto.destacado ? 
                            '<div class="destacado-badge">⭐ Destacado</div>' : '';

      // Formatear precio
      let precioHTML = '';
      if (producto.precio && producto.precio > 0) {
        precioHTML = `<p class="precio">$${Number(producto.precio).toLocaleString('es-CO')}</p>`;
      } else {
        precioHTML = '<p class="precio consultar">Consultar precio</p>';
      }

      // Imagen con placeholder
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

    // Agregar animación de entrada
    const cards = contenedor.querySelectorAll('.producto-card');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 50);
    });

    // Agregar controles de paginación
    agregarControlesPaginacion();

    // Scroll suave al inicio de la categoría
    if (paginaActual > 1) {
      const categoriaMain = document.querySelector('.categoria-main');
      if (categoriaMain) {
        categoriaMain.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * Agrega los controles de paginación
   */
  function agregarControlesPaginacion() {
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
    
    // Si solo hay una página, no mostrar controles
    if (totalPaginas <= 1) return;
    
    const paginacionContainer = document.createElement('div');
    paginacionContainer.className = 'paginacion-container';
    
    // Información de paginación
    const inicio = (paginaActual - 1) * itemsPorPagina + 1;
    const fin = Math.min(paginaActual * itemsPorPagina, productosFiltrados.length);
    
    paginacionContainer.innerHTML = `
      <div class="paginacion-info">
        Mostrando <strong>${inicio}-${fin}</strong> de <strong>${productosFiltrados.length}</strong> productos
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
    
    contenedor.appendChild(paginacionContainer);
    
    // Generar botones de paginación
    generarBotonesPaginacion(totalPaginas);
    
    // Event listener para cambiar items por página
    document.getElementById('itemsPerPage').addEventListener('change', (e) => {
      itemsPorPagina = parseInt(e.target.value);
      paginaActual = 1;
      mostrarProductosPaginados();
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
    
    paginasAMostrar.forEach((pagina) => {
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
    const totalPaginas = Math.ceil(productosFiltrados.length / itemsPorPagina);
    
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    
    paginaActual = nuevaPagina;
    mostrarProductosPaginados();
  }
});