document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

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

    // Obtener productos de la API
    let productosFiltrados;
    
    // Verificar si productosAPI está disponible
    if (typeof productosAPI === 'undefined') {
      throw new Error('La API de productos no está disponible. Asegúrate de cargar api.js antes de este script.');
    }

    // Mapeo de categorías DB a nombre visible
    const nombreCategoria = {
      'tobilleras': 'Dijes y Herrajes',
      'otros': 'Combos',
      'anillos': 'Anillos',
      'pulseras': 'Pulseras',
      'cadenas': 'Cadenas',
      'aretes': 'Aretes'
    };

    // Si la categoría es "otros" o "more-products", traer productos de varias categorías (ahora = Combos)
    if (categoriaActual === 'otros' || categoriaActual === 'more-products') {
      // Traer todos los productos y filtrar las categorías principales
      const todosProductos = await productosAPI.getAll({ activo: true });
      const categoriasExcluidas = ['anillos', 'aretes', 'pulseras', 'cadenas', 'tobilleras'];
      productosFiltrados = todosProductos.filter(p => !categoriasExcluidas.includes(p.categoria));
    } else if (categoriaActual === 'tobilleras') {
      // Dijes y Herrajes: traer productos con categoría tobilleras
      productosFiltrados = await productosAPI.getByCategoria('tobilleras');
    } else {
      // Traer productos de la categoría específica
      productosFiltrados = await productosAPI.getByCategoria(categoriaActual);
    }
    
    console.log(`Productos encontrados en categoría '${categoriaActual}': ${productosFiltrados.length}`);

    if (productosFiltrados.length === 0) {
      contenedor.innerHTML = `
        <div class="error">
          <p>No se encontraron productos en la categoría "${nombreCategoria[categoriaActual] || categoriaActual}".</p>
          <p>Intenta navegar a otra categoría o contacta al administrador.</p>
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
            // Orden por defecto (por fecha de creación, más recientes primero)
            productosOrdenados.sort((a, b) => {
              const dateA = new Date(a.created_at);
              const dateB = new Date(b.created_at);
              return dateB - dateA;
            });
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

        // Formatear precio
        let precioHTML = '';
        if (producto.precio && producto.precio > 0) {
          precioHTML = `<p class="precio">$${Number(producto.precio).toLocaleString('es-CO')}</p>`;
        } else {
          precioHTML = '<p class="precio consultar">Consultar precio</p>';
        }

        // 🔥 CRÍTICO: Imagen con placeholder y ruta correcta
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
            <li>Verifica que el servidor backend esté corriendo</li>
            <li>Asegúrate de que api.js esté cargado correctamente</li>
            <li>Comprueba que el body tenga el atributo data-categoria</li>
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
    (producto.descripcion && producto.descripcion.toLowerCase().includes(textoBusqueda))
  );
}