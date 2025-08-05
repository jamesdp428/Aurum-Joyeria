document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

  // Mostrar estado de carga
  if (contenedor) {
    contenedor.innerHTML = '<div class="loading">Cargando productos...</div>';
  }

  try {
    const respuesta = await fetch("../../data/productos.json");
    
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    
    const productos = await respuesta.json();

    // Obtener categoría actual desde el data attribute del body
    const categoriaActual = document.body.dataset.categoria;
    
    if (!categoriaActual) {
      throw new Error("No se pudo determinar la categoría actual");
    }

    // Filtrar productos por categoría
    let productosFiltrados = productos.filter(p => p.categoria === categoriaActual);
    
    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = '<div class="error">No se encontraron productos en esta categoría.</div>';
      return;
    }

    // Mostrar productos inicialmente
    mostrarProductos(productosFiltrados);

    // Event listener para el filtro de ordenamiento
    if (filtro) {
      filtro.addEventListener("change", () => {
        const tipoOrden = filtro.value;
        let productosOrdenados = [...productosFiltrados];

        switch (tipoOrden) {
          case "nombre-asc":
            productosOrdenados.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
          case "nombre-desc":
            productosOrdenados.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
          case "destacados":
            productosOrdenados.sort((a, b) => {
              if (a.destacado && !b.destacado) return -1;
              if (!a.destacado && b.destacado) return 1;
              return a.nombre.localeCompare(b.nombre);
            });
            break;
          case "stock-desc":
            productosOrdenados.sort((a, b) => b.stock - a.stock);
            break;
          default:
            // Orden por defecto (por ID)
            productosOrdenados.sort((a, b) => a.id - b.id);
        }

        mostrarProductos(productosOrdenados);
      });
    }

    function mostrarProductos(productos) {
      if (!contenedor) return;

      if (productos.length === 0) {
        contenedor.innerHTML = '<div class="error">No se encontraron productos.</div>';
        return;
      }

      contenedor.innerHTML = productos.map(producto => {
        const stockClass = producto.stock > 10 ? 'disponible' : 
                          producto.stock > 0 ? 'bajo-stock' : 'agotado';
        
        const stockText = producto.stock > 0 ? 
                          `Stock: ${producto.stock}` : 
                          'Agotado';

        const destacadoBadge = producto.destacado ? 
                              '<div class="destacado-badge">⭐ Destacado</div>' : '';

        return `
          <div class="producto-card" data-stock="${stockClass}">
            ${destacadoBadge}
            <img src="${producto.imagen}" 
                  alt="${producto.nombre}" 
                  loading="lazy"
                  onerror="this.src='../../img/placeholder.jpg'; this.onerror=null;" />
            <h3>${producto.nombre}</h3>
            <p class="descripcion">${producto.descripcion}</p>
            <p class="stock ${stockClass}">${stockText}</p>
            <a href="./producto.html?id=${producto.id}" class="ver-mas">Ver más</a>
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
        }, index * 100);
      });
    }

  } catch (error) {
    console.error("Error al cargar productos:", error);
    if (contenedor) {
      contenedor.innerHTML = `
        <div class="error">
          <p>Error al cargar los productos</p>
          <p>Por favor, recarga la página</p>
          <button onclick="window.location.reload()" class="ver-mas" style="margin-top: 15px;">
            Recargar página
          </button>
        </div>
      `;
    }
  }
});

// Función para búsqueda en tiempo real (opcional)
function filtrarProductosPorTexto(productos, texto) {
  if (!texto || texto.length < 2) return productos;
  
  const textoBusqueda = texto.toLowerCase();
  return productos.filter(producto => 
    producto.nombre.toLowerCase().includes(textoBusqueda) ||
    producto.descripcion.toLowerCase().includes(textoBusqueda)
  );
}