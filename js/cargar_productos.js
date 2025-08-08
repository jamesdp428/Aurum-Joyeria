document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

  // Mostrar estado de carga
  if (contenedor) {
    contenedor.innerHTML = '<div class="loading">Cargando productos...</div>';
  }

  try {
    // Intentar diferentes rutas posibles para el archivo JSON
    let productos;
    const posiblesRutas = [
      "../../data/productos.json", // Desde html/categorias/ a data/ en la raíz
      "../data/productos.json",    // Un nivel arriba hacia data/
      "./data/productos.json",     // En carpeta data local
      "../../productos.json",      // Fallback: JSON en la raíz
      "../productos.json",         // Fallback: un nivel arriba
      "./productos.json"           // Fallback: carpeta local
    ];

    let respuesta;
    let rutaExitosa = null;

    for (const ruta of posiblesRutas) {
      try {
        console.log(`Intentando cargar desde: ${ruta}`);
        respuesta = await fetch(ruta);
        if (respuesta.ok) {
          rutaExitosa = ruta;
          break;
        }
      } catch (error) {
        console.log(`Error con ruta ${ruta}:`, error.message);
        continue;
      }
    }

    if (!rutaExitosa || !respuesta.ok) {
      throw new Error(`No se pudo cargar productos.json desde ninguna ruta. Último estado: ${respuesta?.status || 'Sin respuesta'}`);
    }

    console.log(`Productos cargados exitosamente desde: ${rutaExitosa}`);
    productos = await respuesta.json();

    if (!Array.isArray(productos) || productos.length === 0) {
      throw new Error("El archivo productos.json está vacío o no contiene un array válido");
    }

    // Obtener categoría actual desde el data attribute del body
    const categoriaActual = document.body.dataset.categoria;
    
    if (!categoriaActual) {
      console.error("No se encontró data-categoria en el body");
      // Intentar obtener de la URL como fallback
      const urlParams = new URLSearchParams(window.location.search);
      const categoriaUrl = urlParams.get('categoria');
      if (categoriaUrl) {
        console.log(`Usando categoría de URL: ${categoriaUrl}`);
        document.body.dataset.categoria = categoriaUrl;
      } else {
        throw new Error("No se pudo determinar la categoría actual. Asegúrate de que el body tenga data-categoria.");
      }
    }

    const categoria = document.body.dataset.categoria || categoriaUrl;
    console.log(`Filtrando productos por categoría: ${categoria}`);

    // Filtrar productos por categoría
    let productosFiltrados = productos.filter(p => p.categoria === categoria);
    
    console.log(`Productos encontrados en categoría '${categoria}': ${productosFiltrados.length}`);
    console.log("Categorías disponibles:", [...new Set(productos.map(p => p.categoria))]);

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = `
        <div class="error">
          <p>No se encontraron productos en la categoría "${categoria}".</p>
          <p>Categorías disponibles: ${[...new Set(productos.map(p => p.categoria))].join(', ')}</p>
        </div>
      `;
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
            <img src="../../${producto.imagen.replace('./', '')}" 
                  alt="${producto.nombre}" 
                  loading="lazy"
                  onerror="this.src='../../img/placeholder.jpg'; this.onerror=null;" />
            <h3>${producto.nombre}</h3>
            <p class="descripcion">${producto.descripcion}</p>
            <p class="stock ${stockClass}">${stockText}</p>
            <a href="../../html/producto.html?id=${producto.id}" class="ver-mas">Ver más</a>
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
    console.error("Error detallado al cargar productos:", error);
    if (contenedor) {
      contenedor.innerHTML = `
        <div class="error">
          <h3>Error al cargar los productos</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Posibles soluciones:</strong></p>
          <ul>
            <li>Verifica que el archivo productos.json esté en la ubicación correcta</li>
            <li>Asegúrate de que el body tenga el atributo data-categoria</li>
            <li>Comprueba que las imágenes estén en la carpeta img/productos/</li>
          </ul>
          <button onclick="window.location.reload()" class="ver-mas" style="margin-top: 15px;">
            Recargar página
          </button>
          <br><br>
          <details style="margin-top: 10px;">
            <summary>Información de depuración</summary>
            <p><strong>URL actual:</strong> ${window.location.href}</p>
            <p><strong>Categoría esperada:</strong> ${document.body.dataset.categoria || 'No definida'}</p>
            <p><strong>Error completo:</strong> ${error.stack}</p>
          </details>
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

// Función de utilidad para debug
function debugProductos() {
  console.log("=== DEBUG INFORMACIÓN ===");
  console.log("URL actual:", window.location.href);
  console.log("data-categoria del body:", document.body.dataset.categoria);
  console.log("Contenedor encontrado:", !!document.querySelector(".contenedor-productos"));
  console.log("Filtro encontrado:", !!document.getElementById("filtro"));
}