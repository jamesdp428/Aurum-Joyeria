document.addEventListener("DOMContentLoaded", async () => {
  const contenedor = document.querySelector(".contenedor-productos");
  const filtro = document.getElementById("filtro");

  try {
    const respuesta = await fetch("../../data/productos.json");
    const productos = await respuesta.json();

    const categoriaActual = document.body.dataset.categoria;
    let filtrados = productos.filter(p => p.categoria === categoriaActual);

    mostrarProductos(filtrados);

    filtro?.addEventListener("change", () => {
      const tipo = filtro.value;
      if (tipo === "precio-asc") filtrados.sort((a, b) => a.precio - b.precio);
      if (tipo === "precio-desc") filtrados.sort((a, b) => b.precio - a.precio);
      if (tipo === "nombre-asc") filtrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      if (tipo === "nombre-desc") filtrados.sort((a, b) => b.nombre.localeCompare(a.nombre));

      mostrarProductos(filtrados);
    });

    function mostrarProductos(productos) {
      contenedor.innerHTML = productos.map(producto => `
        <div class="producto-card">
          <img src="${producto.imagen}" alt="${producto.nombre}" />
          <h3>${producto.nombre}</h3>
          <p>$${producto.precio.toLocaleString()}</p>
          <a href="producto.html?id=${producto.id}" class="ver-mas">Ver más</a>
        </div>
      `).join("");
    }

  } catch (error) {
    contenedor.innerHTML = "<p>Error al cargar productos.</p>";
    console.error(error);
  }
});
