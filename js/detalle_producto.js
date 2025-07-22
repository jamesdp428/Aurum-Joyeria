document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const idProducto = parseInt(urlParams.get("id"));

  if (!idProducto) {
    mostrarError("Producto no encontrado. ID no válido.");
    return;
  }

  try {
    const res = await fetch("../../data/productos.json");
    if (!res.ok) throw new Error('Error al cargar datos');
    
    const productos = await res.json();
    const producto = productos.find(p => p.id === idProducto);
    
    if (!producto) {
      mostrarError("Producto no encontrado.");
      return;
    }

    cargarProducto(producto);
    cargarRecomendaciones(productos, producto);
    
  } catch (error) {
    console.error('Error:', error);
    mostrarError("Error al cargar el producto. Por favor, inténtalo de nuevo.");
  }
});

function cargarProducto(producto) {
  const imagenPrincipal = document.getElementById("imagenPrincipal");
  const miniaturasContainer = document.getElementById("miniaturasContainer");
  const cantidadInput = document.getElementById("cantidad");

  // Configurar imagen principal
  imagenPrincipal.src = producto.imagen;
  imagenPrincipal.alt = producto.nombre;

  // Configurar información básica
  document.getElementById("nombreProducto").textContent = producto.nombre;
  document.getElementById("descripcionProducto").textContent = producto.descripcion || "Descripción no disponible";
  
  // Configurar precio con formato
  const precioElement = document.getElementById("precioProducto");
  precioElement.textContent = `$${producto.precio.toLocaleString('es-CO')}`;
  
  // Agregar precio anterior si hay descuento
  if (producto.precioAnterior) {
    const descuento = Math.round(((producto.precioAnterior - producto.precio) / producto.precioAnterior) * 100);
    precioElement.innerHTML = `
      $${producto.precio.toLocaleString('es-CO')}
      <span class="precio-anterior">$${producto.precioAnterior.toLocaleString('es-CO')}</span>
      <span class="descuento-porcentaje">-${descuento}%</span>
    `;
  }

  // Configurar stock
  const stockElement = document.getElementById("stockProducto");
  const stockClass = producto.stock > 10 ? 'disponible' : 
                    producto.stock > 0 ? 'bajo-stock' : 'agotado';
  const stockText = producto.stock > 10 ? `Disponibles: ${producto.stock}` :
                   producto.stock > 0 ? `¡Últimas ${producto.stock} unidades!` : 'Agotado';
  
  stockElement.textContent = stockText;
  stockElement.className = `stock ${stockClass}`;

  // Configurar cantidad máxima
  cantidadInput.max = producto.stock || 0;
  cantidadInput.disabled = producto.stock === 0;

  // Cargar miniaturas
  cargarMiniaturas(producto, imagenPrincipal, miniaturasContainer);
  
  // Configurar botones de acción
  configurarBotones(producto, cantidadInput);
  
  // Cargar características si existen
  cargarCaracteristicas(producto);
  
  // Agregar rating si existe
  cargarRating(producto);
}

function cargarMiniaturas(producto, imagenPrincipal, container) {
  container.innerHTML = '';
  const imagenes = producto.imagenes || [producto.imagen];
  
  imagenes.forEach((img, index) => {
    const miniatura = document.createElement("img");
    miniatura.src = img;
    miniatura.alt = `${producto.nombre} - Vista ${index + 1}`;
    miniatura.loading = "lazy";
    
    if (index === 0) miniatura.classList.add("active");
    
    miniatura.addEventListener("click", () => {
      imagenPrincipal.src = img;
      container.querySelectorAll("img").forEach(i => i.classList.remove("active"));
      miniatura.classList.add("active");
    });
    
    container.appendChild(miniatura);
  });
}

function configurarBotones(producto, cantidadInput) {
  // Botones de cantidad
  const btnMenos = document.querySelector('[onclick="cambiarCantidad(-1)"]');
  const btnMas = document.querySelector('[onclick="cambiarCantidad(1)"]');
  
  if (btnMenos) {
    btnMenos.onclick = () => cambiarCantidad(-1, producto.stock);
  }
  
  if (btnMas) {
    btnMas.onclick = () => cambiarCantidad(1, producto.stock);
  }

  // Botón WhatsApp
  const btnWhatsApp = document.getElementById("comprarWhatsApp");
  if (btnWhatsApp) {
    actualizarEnlaceWhatsApp(producto, cantidadInput);
    
    cantidadInput.addEventListener("input", () => {
      actualizarEnlaceWhatsApp(producto, cantidadInput);
    });
  }

  // Botón agregar al carrito
  const btnCarrito = document.getElementById("agregarCarrito");
  if (btnCarrito) {
    btnCarrito.addEventListener("click", () => {
      if (producto.stock === 0) {
        mostrarNotificacion("Producto agotado", "error");
        return;
      }
      
      const cantidad = parseInt(cantidadInput.value);
      agregarAlCarrito(producto, cantidad);
      mostrarNotificacion(`"${producto.nombre}" x${cantidad} agregado al carrito`, "success");
    });
  }
}

function cambiarCantidad(cambio, stockMaximo) {
  const input = document.getElementById('cantidad');
  let valor = parseInt(input.value) || 1;
  const nuevoValor = valor + cambio;
  
  if (nuevoValor >= 1 && nuevoValor <= stockMaximo) {
    input.value = nuevoValor;
    
    // Actualizar enlace de WhatsApp si existe
    const evento = new Event('input');
    input.dispatchEvent(evento);
  }
}

function actualizarEnlaceWhatsApp(producto, cantidadInput) {
  const btnWhatsApp = document.getElementById("comprarWhatsApp");
  const cantidad = parseInt(cantidadInput.value) || 1;
  const mensaje = `Hola! Estoy interesado en comprar:\n\n` +
                  `📦 Producto: ${producto.nombre}\n` +
                  `🔢 Cantidad: ${cantidad}\n` +
                  `💰 Precio unitario: $${producto.precio.toLocaleString('es-CO')}\n` +
                  `💵 Total: $${(producto.precio * cantidad).toLocaleString('es-CO')}\n\n` +
                  `¿Podrías darme más información?`;
  
  btnWhatsApp.href = `https://wa.me/573217798612?text=${encodeURIComponent(mensaje)}`;
}

function cargarCaracteristicas(producto) {
  const caracteristicasContainer = document.querySelector('.caracteristicas ul');
  if (!caracteristicasContainer || !producto.caracteristicas) return;
  
  caracteristicasContainer.innerHTML = '';
  Object.entries(producto.caracteristicas).forEach(([key, value]) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${key}:</strong> <span>${value}</span>`;
    caracteristicasContainer.appendChild(li);
  });
}

function cargarRating(producto) {
  const ratingContainer = document.querySelector('.rating');
  if (!ratingContainer || !producto.rating) return;
  
  const rating = producto.rating;
  const totalReviews = producto.totalReviews || 0;
  
  const starsHtml = '★'.repeat(Math.floor(rating)) + 
                   (rating % 1 !== 0 ? '☆' : '') + 
                   '☆'.repeat(5 - Math.ceil(rating));
  
  ratingContainer.innerHTML = `
    <div class="stars">${starsHtml}</div>
    <div class="rating-text">(${rating}/5 - ${totalReviews} reseñas)</div>
  `;
}

function cargarRecomendaciones(productos, productoActual) {
  const recomendacionesContainer = document.getElementById("otros-productos");
  if (!recomendacionesContainer) return;
  
  const recomendados = productos
    .filter(p => p.categoria === productoActual.categoria && p.id !== productoActual.id)
    .slice(0, 4);
  
  recomendacionesContainer.innerHTML = '';
  
  recomendados.forEach(producto => {
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <img src="${producto.imagen}" alt="${producto.nombre}" loading="lazy">
      <div class="info">
        <h3>${producto.nombre}</h3>
        <p>$${producto.precio.toLocaleString('es-CO')}</p>
      </div>
      <a href="?id=${producto.id}" class="ver-mas">Ver más</a>
    `;
    recomendacionesContainer.appendChild(card);
  });
}

function agregarAlCarrito(producto, cantidad) {
  // Obtener carrito actual del localStorage
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  // Buscar si el producto ya existe en el carrito
  const index = carrito.findIndex(item => item.id === producto.id);
  
  if (index !== -1) {
    // Si existe, actualizar cantidad
    carrito[index].cantidad += cantidad;
  } else {
    // Si no existe, agregar nuevo item
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen,
      cantidad: cantidad
    });
  }
  
  // Guardar en localStorage
  localStorage.setItem('carrito', JSON.stringify(carrito));
  
  // Actualizar contador del carrito si existe
  actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const contador = document.querySelector('.carrito-contador');
  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  
  if (contador) {
    contador.textContent = totalItems;
    contador.style.display = totalItems > 0 ? 'block' : 'none';
  }
}

function mostrarError(mensaje) {
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #0d0d0d; color: #fff; text-align: center; padding: 20px;">
      <div style="background: linear-gradient(145deg, #1e1e1e, #2a2a2a); padding: 40px; border-radius: 20px; border: 1px solid rgba(249, 220, 94, 0.1);">
        <h2 style="color: #f9dc5e; margin-bottom: 20px;">⚠️ ${mensaje}</h2>
        <button onclick="history.back()" style="background: linear-gradient(45deg, #f9dc5e, #ffd700); color: #000; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 700; cursor: pointer;">
          Volver atrás
        </button>
      </div>
    </div>
  `;
}

function mostrarNotificacion(mensaje, tipo = 'info') {
  const notificacion = document.createElement('div');
  notificacion.className = `notificacion ${tipo}`;
  notificacion.textContent = mensaje;
  
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === 'success' ? 'linear-gradient(45deg, #27ae60, #2ecc71)' : 
                 tipo === 'error' ? 'linear-gradient(45deg, #e74c3c, #c0392b)' : 
                 'linear-gradient(45deg, #3498db, #2980b9)'};
    color: white;
    padding: 15px 20px;
    border-radius: 12px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    transform: translateX(400px);
    transition: transform 0.3s ease;
  `;
  
  document.body.appendChild(notificacion);
  
  // Animación de entrada
  setTimeout(() => {
    notificacion.style.transform = 'translateX(0)';
  }, 100);
  
  // Remover después de 3 segundos
  setTimeout(() => {
    notificacion.style.transform = 'translateX(400px)';
    setTimeout(() => notificacion.remove(), 300);
  }, 3000);
}

// Inicializar contador del carrito al cargar la página
document.addEventListener('DOMContentLoaded', actualizarContadorCarrito);