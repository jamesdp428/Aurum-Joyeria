document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

  // Mostrar loading
  contenedor.innerHTML = '<div class="loading">Cargando productos...</div>';

  try {
    const respuesta = await fetch("../../data/productos.json");
    if (!respuesta.ok) throw new Error('Error al cargar productos');
    
    const productos = await respuesta.json();
    const categoriaActual = document.body.dataset.categoria;
    let filtrados = productos.filter(p => p.categoria === categoriaActual);

    // Ordenamiento inicial
    filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
    
    mostrarProductos(filtrados);

    // Event listener para filtros
    filtro?.addEventListener("change", () => {
      const tipo = filtro.value;
      const productosOrdenados = [...filtrados];
      
      switch(tipo) {
        case "precio-asc":
          productosOrdenados.sort((a, b) => a.precio - b.precio);
          break;
        case "precio-desc":
          productosOrdenados.sort((a, b) => b.precio - a.precio);
          break;
        case "nombre-asc":
          productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
          break;
        case "nombre-desc":
          productosOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
          break;
        default:
          productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      }

      mostrarProductos(productosOrdenados);
    });

    function mostrarProductos(productos) {
      if (productos.length === 0) {
        contenedor.innerHTML = '<div class="no-productos"><p>No se encontraron productos en esta categoría.</p></div>';
        return;
      }

      contenedor.innerHTML = productos.map(producto => {
        const stockClass = producto.stock > 10 ? 'disponible' : 
                          producto.stock > 0 ? 'bajo-stock' : 'agotado';
        const stockText = producto.stock > 10 ? `${producto.stock} disponibles` :
                         producto.stock > 0 ? `¡Últimas ${producto.stock} unidades!` : 'Agotado';
        
        return `
          <div class="producto-card" data-categoria="${producto.categoria}">
            <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy" />
            <div class="info">
              <h3>${producto.nombre}</h3>
              <p>${producto.precio.toLocaleString('es-CO')}</p>
              <div class="stock-indicator ${stockClass}">${stockText}</div>
              <a href="../producto.html?id=${producto.id}" class="ver-mas">Ver detalles</a>
            </div>
          </div>
        `;
      }).join("");

      // Animación de entrada
      const cards = contenedor.querySelectorAll('.producto-card');
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
      });
    }

  } catch (error) {
    console.error('Error al cargar productos:', error);
    contenedor.innerHTML = `
      <div class="error-container">
        <p>⚠️ Error al cargar productos</p>
        <button onclick="location.reload()" class="retry-btn">Reintentar</button>
      </div>
    `;
  }
});