document.addEventListener("DOMContentLoaded", async () => {
  const productosGrid = document.querySelector(".productos-grid");

  // Solo ejecutar si estamos en la página de inicio y existe el contenedor
  if (!productosGrid) return;

  // Mostrar estado de carga
  productosGrid.innerHTML = '<div class="loading">Cargando productos destacados...</div>';

  try {
    const respuesta = await fetch("data/productos.json");
    
    if (!respuesta.ok) {
      throw new Error(`Error HTTP: ${respuesta.status}`);
    }
    
    const productos = await respuesta.json();

    // Filtrar solo productos destacados
    const productosDestacados = productos.filter(producto => producto.destacado === true);

    if (productosDestacados.length === 0) {
      productosGrid.innerHTML = '<div class="error">No hay productos destacados disponibles.</div>';
      return;
    }

    // Limitar a máximo 6 productos destacados
    const productosAMostrar = productosDestacados.slice(0, 6);

    // Generar HTML para productos destacados
    productosGrid.innerHTML = productosAMostrar.map(producto => {
      const stockClass = producto.stock > 10 ? 'disponible' : 
                        producto.stock > 0 ? 'bajo-stock' : 'agotado';

      return `
        <a href="html/categorias/producto.html?id=${producto.id}" class="producto-destacado">
          <div class="destacado-badge">⭐ Destacado</div>
          <img src="${producto.imagen}" 
               alt="${producto.nombre}" 
               loading="lazy"
               onerror="this.src='img/placeholder.jpg'; this.onerror=null;" />
          <h3>${producto.nombre}</h3>
          <p>${producto.descripcion}</p>
          <span class="ver-mas">Ver detalles</span>
        </a>
      `;
    }).join("");

    // Agregar animación de entrada
    const cards = productosGrid.querySelectorAll('.producto-destacado');
    cards.forEach((card, index) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      setTimeout(() => {
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 150);
    });

  } catch (error) {
    console.error("Error al cargar productos destacados:", error);
    productosGrid.innerHTML = `
      <div class="error">
        <p>Error al cargar los productos destacados</p>
        <p>Por favor, recarga la página</p>
        <button onclick="window.location.reload()" class="btn-ver-mas" style="margin-top: 15px;">
          Recargar página
        </button>
      </div>
    `;
  }
});

// Función opcional para rotar productos destacados cada cierto tiempo
function rotarProductosDestacados() {
  // Esta función podría implementarse para mostrar diferentes productos destacados
  // cada vez que se carga la página o después de cierto tiempo
  console.log("Función de rotación de productos destacados disponible");
}

// Llamar la función de rotación si se desea
// setInterval(rotarProductosDestacados, 30000); // Cada 30 segundos