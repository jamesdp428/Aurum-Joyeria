document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idProducto = parseInt(urlParams.get("id"));

  if (!idProducto) {
    document.body.innerHTML = "<p>Producto no encontrado.</p>";
    return;
  }

  try {
    const res = await fetch("../../data/productos.json");
    const productos = await res.json();

    const producto = productos.find(p => p.id === idProducto);
    if (!producto) {
      document.body.innerHTML = "<p>Producto no encontrado.</p>";
      return;
    }

    const imagenPrincipal = document.getElementById("imagenPrincipal");
    const miniaturasContainer = document.getElementById("miniaturasContainer");
    const cantidadInput = document.getElementById("cantidad");

    // Asignar valores
    imagenPrincipal.src = producto.imagen;
    imagenPrincipal.alt = producto.nombre;

    document.getElementById("nombreProducto").textContent = producto.nombre;
    document.getElementById("descripcionProducto").textContent = producto.descripcion;
    document.getElementById("precioProducto").textContent = `$${producto.precio.toLocaleString()}`;
    document.getElementById("stockProducto").textContent = producto.stock > 0
      ? `Disponibles: ${producto.stock}`
      : "Agotado";

    // Cargar miniaturas (aquí suponemos que hay un array de imágenes)
    const imagenes = producto.imagenes || [producto.imagen];
    imagenes.forEach((img, index) => {
      const mini = document.createElement("img");
      mini.src = img;
      if (index === 0) mini.classList.add("active");
      mini.addEventListener("click", () => {
        imagenPrincipal.src = img;
        document.querySelectorAll(".miniaturas img").forEach(i => i.classList.remove("active"));
        mini.classList.add("active");
      });
      miniaturasContainer.appendChild(mini);
    });

    // Botón WhatsApp
    const btnWhatsApp = document.getElementById("comprarWhatsApp");
    btnWhatsApp.href = `https://wa.me/573001234567?text=Hola! Quiero comprar ${producto.nombre} (ID: ${producto.id}) x${cantidadInput.value}`;
    cantidadInput.addEventListener("input", () => {
      btnWhatsApp.href = `https://wa.me/573001234567?text=Hola! Quiero comprar ${producto.nombre} (ID: ${producto.id}) x${cantidadInput.value}`;
    });

    // Agregar al carrito (solo muestra por ahora)
    document.getElementById("agregarCarrito").addEventListener("click", () => {
      alert(`"${producto.nombre}" x${cantidadInput.value} agregado al carrito!`);
    });

  } catch (error) {
    document.body.innerHTML = "<p>Error al cargar el producto.</p>";
    console.error(error);
  }
});
