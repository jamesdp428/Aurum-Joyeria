function mostrarRecomendados(categoria, productoActualId) {
  fetch("../../data/productos.json")
    .then(res => res.json())
    .then(data => {
      const otros = data
        .filter(p => p.categoria === categoria && p.id !== productoActualId)
        .slice(0, 4); // Mostrar solo 4

      const contenedor = document.getElementById("otros-productos");
      otros.forEach(p => {
        const card = document.createElement("div");
        card.className = "producto-card";
        card.innerHTML = `
          <img src="../../img/${p.imagen}" alt="${p.nombre}">
          <div class="info">
            <h3>${p.nombre}</h3>
            <p>$${p.precio.toLocaleString()}</p>
          </div>
          <a href="detalle_producto.html?id=${p.id}" class="ver-mas">Ver más</a>
        `;
        contenedor.appendChild(card);
      });
    });
}


mostrarRecomendados(producto.categoria, producto.id);
