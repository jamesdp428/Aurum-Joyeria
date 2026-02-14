// buscar.js - Funcionalidad de búsqueda de productos

let productosData = [];

// Cargar productos desde la API
async function cargarProductos() {
  try {
    const response = await fetch('/api/productos');
    productosData = await response.json();
  } catch (error) {
    console.error('Error al cargar productos:', error);
  }
}

// Función para buscar productos
function buscarProductos(termino) {
  if (!termino || termino.trim() === '') {
    return [];
  }

  const terminoLower = termino.toLowerCase().trim();
  
  return productosData.filter(producto => {
    const nombreMatch = producto.nombre.toLowerCase().includes(terminoLower);
    const categoriaMatch = producto.categoria.toLowerCase().includes(terminoLower);
    const descripcionMatch = producto.descripcion?.toLowerCase().includes(terminoLower);
    
    return nombreMatch || categoriaMatch || descripcionMatch;
  });
}

// Función para mostrar resultados
function mostrarResultados(resultados) {
  const searchResults = document.getElementById('searchResults');
  
  if (resultados.length === 0) {
    searchResults.innerHTML = '<div class="search-no-results">No se encontraron productos</div>';
    searchResults.classList.add('active');
    return;
  }

  // Mapeo de categorías a URLs (RUTAS CORREGIDAS - SIN /html/)
  const categoriasUrls = {
    'anillos': '/anillos',
    'pulseras': '/pulseras',
    'cadenas': '/cadenas',
    'aretes': '/aretes',
    'tobilleras': '/dijes',
    'otros': '/combos'
  };

  let html = '';
  resultados.forEach(producto => {
    const urlCategoria = categoriasUrls[producto.categoria] || '/';
    const imagenUrl = producto.imagen_url || '/static/img/placeholder.jpg';
    
    html += `
      <a href="${urlCategoria}" class="search-result-item" data-producto-id="${producto.id}">
        <img src="${imagenUrl}" 
             alt="${producto.nombre}" 
             class="search-result-img"
             onerror="this.src='/static/img/placeholder.jpg'">
        <div class="search-result-info">
          <p class="search-result-name">${producto.nombre}</p>
          <p class="search-result-category">${producto.categoria}</p>
        </div>
      </a>
    `;
  });

  searchResults.innerHTML = html;
  searchResults.classList.add('active');
}

// Función para ocultar resultados
function ocultarResultados() {
  const searchResults = document.getElementById('searchResults');
  searchResults.classList.remove('active');
}

// Inicializar búsqueda
document.addEventListener('DOMContentLoaded', async () => {
  // Cargar productos al iniciar
  await cargarProductos();

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const searchResults = document.getElementById('searchResults');

  // Búsqueda al escribir
  searchInput.addEventListener('input', (e) => {
    const termino = e.target.value;
    
    if (termino.trim() === '') {
      ocultarResultados();
      return;
    }

    const resultados = buscarProductos(termino);
    mostrarResultados(resultados);
  });

  // Búsqueda al hacer clic en el botón
  searchBtn.addEventListener('click', () => {
    const termino = searchInput.value;
    const resultados = buscarProductos(termino);
    mostrarResultados(resultados);
  });

  // Búsqueda al presionar Enter
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const termino = searchInput.value;
      const resultados = buscarProductos(termino);
      mostrarResultados(resultados);
    }
  });

  // Cerrar resultados al hacer clic fuera
  document.addEventListener('click', (e) => {
    const searchContainer = document.querySelector('.search-container');
    if (!searchContainer.contains(e.target)) {
      ocultarResultados();
    }
  });

  // Prevenir que se cierre al hacer clic dentro del contenedor de búsqueda
  searchResults.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Limpiar input cuando se ocultan los resultados
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim() !== '') {
      const resultados = buscarProductos(searchInput.value);
      mostrarResultados(resultados);
    }
  });
});