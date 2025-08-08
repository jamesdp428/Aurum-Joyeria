document.addEventListener("DOMContentLoaded", async () => {
  // Actualizar contador del carrito al cargar la página
  if (window.actualizarContadorCarrito) {
    window.actualizarContadorCarrito();
  }

  const urlParams = new URLSearchParams(window.location.search);
  const idProducto = parseInt(urlParams.get("id"));

  console.log("ID del producto:", idProducto);

  if (!idProducto) {
    mostrarError("ID de producto no válido");
    return;
  }

  // Mostrar estado de carga
  mostrarCargando();

  try {
    console.log("Intentando cargar productos...");
    const res = await fetch("../../data/productos.json");
    
    if (!res.ok) {
      throw new Error(`Error HTTP: ${res.status}`);
    }
    
    const productos = await res.json();
    console.log("Productos cargados:", productos.length);
    
    const producto = productos.find(p => p.id === idProducto);
    console.log("Producto encontrado:", producto);

    if (!producto) {
      mostrarError("Producto no encontrado");
      return;
    }

    // Cargar información del producto
    cargarInformacionProducto(producto);
    
    // Configurar imágenes
    configurarImagenes(producto);
    
    // Configurar botones de acción
    configurarBotones(producto);

  } catch (error) {
    console.error("Error al cargar producto:", error);
    mostrarError("Error al cargar el producto. Por favor, recarga la página.");
  }
});

function mostrarCargando() {
  // Solo actualizar elementos específicos sin alterar la estructura
  const nombreProducto = document.getElementById('nombreProducto');
  const descripcionProducto = document.getElementById('descripcionProducto');
  const stockProducto = document.getElementById('stockProducto');
  
  if (nombreProducto) nombreProducto.textContent = 'Cargando producto...';
  if (descripcionProducto) descripcionProducto.textContent = 'Cargando descripción...';
  if (stockProducto) stockProducto.textContent = 'Verificando stock...';
  
  // Mostrar imagen de placeholder mientras carga
  const imagenPrincipal = document.getElementById('imagenPrincipal');
  if (imagenPrincipal) {
    imagenPrincipal.style.opacity = '0.5';
  }
}

function mostrarError(mensaje) {
  console.error("Error:", mensaje);
  
  // Mostrar error solo en el contenido, manteniendo la estructura
  const nombreProducto = document.getElementById('nombreProducto');
  const descripcionProducto = document.getElementById('descripcionProducto');
  const stockProducto = document.getElementById('stockProducto');
  
  if (nombreProducto) {
    nombreProducto.textContent = 'Error al cargar producto';
    nombreProducto.style.color = '#ff6b6b';
  }
  
  if (descripcionProducto) {
    descripcionProducto.innerHTML = `<span style="color: #ff6b6b;">${mensaje}</span><br><button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #f9dc5e; color: #000; border: none; border-radius: 8px; cursor: pointer;">Recargar página</button>`;
  }
  
  if (stockProducto) {
    stockProducto.textContent = 'Error de carga';
    stockProducto.className = 'stock agotado';
  }

  // Deshabilitar botones pero mantener estructura
  const btnCarrito = document.getElementById('agregarCarrito');
  const btnWhatsApp = document.getElementById('comprarWhatsApp');
  
  if (btnCarrito) {
    btnCarrito.disabled = true;
    btnCarrito.textContent = 'Producto no disponible';
    btnCarrito.style.opacity = '0.5';
  }
  
  if (btnWhatsApp) {
    btnWhatsApp.style.pointerEvents = 'none';
    btnWhatsApp.style.opacity = '0.5';
  }
}

function cargarInformacionProducto(producto) {
  console.log("Cargando información del producto:", producto.nombre);
  
  // Actualizar título de la página
  document.title = `${producto.nombre} | Aurum Joyería`;

  // Restaurar opacidad de imagen
  const imagenPrincipal = document.getElementById('imagenPrincipal');
  if (imagenPrincipal) {
    imagenPrincipal.style.opacity = '1';
  }

  // Cargar información básica - mantener estilos originales
  const elementos = {
    nombreProducto: producto.nombre,
    descripcionProducto: producto.descripcion,
    stockProducto: obtenerTextoStock(producto.stock),
    categoriaProducto: producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1),
    disponibilidadProducto: obtenerTextoStock(producto.stock)
  };

  Object.entries(elementos).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.textContent = valor;
      // Resetear estilos de error
      elemento.style.color = '';
    }
  });

  // Configurar breadcrumb
  const categoriaBreadcrumb = document.getElementById('categoriaBreadcrumb');
  const nombreBreadcrumb = document.getElementById('nombreBreadcrumb');
  
  if (categoriaBreadcrumb) {
    categoriaBreadcrumb.textContent = producto.categoria.charAt(0).toUpperCase() + producto.categoria.slice(1);
    categoriaBreadcrumb.href = `${producto.categoria}.html`;
  }
  
  if (nombreBreadcrumb) {
    nombreBreadcrumb.textContent = producto.nombre;
  }

  // Configurar clase de stock - importante para el CSS
  const stockElement = document.getElementById('stockProducto');
  if (stockElement) {
    const stockClass = obtenerClaseStock(producto.stock);
    stockElement.className = `stock ${stockClass}`;
  }

  // Mostrar badge de destacado si aplica - usar CSS original
  if (producto.destacado) {
    const infoProducto = document.querySelector('.info-producto');
    if (infoProducto && !infoProducto.querySelector('.destacado-badge')) {
      const badge = document.createElement('div');
      badge.className = 'destacado-badge';
      badge.textContent = '⭐ Producto Destacado';
      infoProducto.appendChild(badge);
    }
  }
}

// FUNCIÓN CORREGIDA PARA IMÁGENES
function configurarImagenes(producto) {
  const imagenPrincipal = document.getElementById("imagenPrincipal");
  const miniaturasContainer = document.getElementById("miniaturasContainer");

  if (!imagenPrincipal || !miniaturasContainer) {
    console.warn("No se encontraron elementos de imagen");
    return;
  }

  // CORRECCIÓN: Ajustar ruta de la imagen principal
  // Si la imagen viene como "./img/productos/anillo1.jpg", convertir a "../../img/productos/anillo1.jpg"
  const rutaImagen = ajustarRutaImagen(producto.imagen);
  console.log("Ruta de imagen ajustada:", rutaImagen);

  // Configurar imagen principal
  imagenPrincipal.src = rutaImagen;
  imagenPrincipal.alt = producto.nombre;
  imagenPrincipal.onerror = function() {
    console.warn("Error cargando imagen principal, usando placeholder");
    this.src = '../../img/placeholder.jpg';
    this.onerror = null;
  };

  // Configurar miniaturas - usar las clases CSS existentes
  const imagenes = producto.imagenes && producto.imagenes.length > 0 
    ? producto.imagenes 
    : [producto.imagen];

  miniaturasContainer.innerHTML = '';

  imagenes.forEach((img, index) => {
    const miniatura = document.createElement("img");
    const rutaMiniatura = ajustarRutaImagen(img);
    miniatura.src = rutaMiniatura;
    miniatura.alt = `${producto.nombre} - Vista ${index + 1}`;
    miniatura.loading = "lazy";
    
    if (index === 0) {
      miniatura.classList.add("active");
    }
    
    miniatura.addEventListener("click", () => {
      imagenPrincipal.src = rutaMiniatura;
      // Actualizar miniaturas activas usando clases CSS
      document.querySelectorAll(".miniaturas img").forEach(i => i.classList.remove("active"));
      miniatura.classList.add("active");
    });

    miniatura.onerror = function() {
      console.warn("Error cargando miniatura, usando placeholder");
      this.src = '../../img/placeholder.jpg';
      this.onerror = null;
    };

    miniaturasContainer.appendChild(miniatura);
  });
}

// NUEVA FUNCIÓN: Ajustar rutas de imágenes
function ajustarRutaImagen(rutaOriginal) {
  if (!rutaOriginal) {
    return '../../img/placeholder.jpg';
  }

  // Si ya tiene la ruta completa, usar como está
  if (rutaOriginal.startsWith('http') || rutaOriginal.startsWith('//')) {
    return rutaOriginal;
  }

  // Si empieza con './', remover el './'
  let rutaLimpia = rutaOriginal.replace(/^\.\//, '');

  // Si no empieza con '../../', agregarle
  if (!rutaLimpia.startsWith('../../')) {
    rutaLimpia = '../../' + rutaLimpia;
  }

  return rutaLimpia;
}

function configurarBotones(producto) {
  const cantidadInput = document.getElementById("cantidad");
  const btnWhatsApp = document.getElementById("comprarWhatsApp");
  const btnCarrito = document.getElementById("agregarCarrito");

  // Restaurar estado normal de botones
  if (btnCarrito) {
    btnCarrito.disabled = false;
    btnCarrito.textContent = 'Agregar al carrito';
    btnCarrito.style.opacity = '1';
  }
  
  if (btnWhatsApp) {
    btnWhatsApp.style.pointerEvents = 'auto';
    btnWhatsApp.style.opacity = '1';
  }

  // Configurar WhatsApp
  if (btnWhatsApp && cantidadInput) {
    function actualizarWhatsApp() {
      const cantidad = cantidadInput.value || 1;
      const mensaje = `Hola! Estoy interesado en ${producto.nombre} (ID: ${producto.id}) - Cantidad: ${cantidad}. ¿Podrías darme más información sobre el precio y disponibilidad?`;
      btnWhatsApp.href = `https://wa.me/573217798612?text=${encodeURIComponent(mensaje)}`;
    }

    actualizarWhatsApp();
    cantidadInput.addEventListener("input", actualizarWhatsApp);
    cantidadInput.addEventListener("change", actualizarWhatsApp);
  }

  // Configurar botón de carrito - INTEGRACIÓN CON CARRITO
  if (btnCarrito && cantidadInput) {
    // Remover event listeners previos
    btnCarrito.removeEventListener("click", btnCarrito._clickHandler);
    
    btnCarrito._clickHandler = async (e) => {
      e.preventDefault();
      const cantidad = parseInt(cantidadInput.value) || 1;
      
      if (producto.stock === 0) {
        mostrarNotificacion("Lo sentimos, este producto está agotado.", "error");
        return;
      }

      if (cantidad > producto.stock) {
        mostrarNotificacion(`Solo hay ${producto.stock} unidades disponibles.`, "error");
        cantidadInput.value = producto.stock;
        return;
      }

      // NUEVA FUNCIONALIDAD: Integración con carrito
      try {
        // Simular agregar al carrito usando localStorage
        let carrito = [];
        try {
          const carritoGuardado = localStorage.getItem('aurum_carrito');
          if (carritoGuardado) {
            carrito = JSON.parse(carritoGuardado);
          }
        } catch (error) {
          console.error('Error al cargar carrito:', error);
        }

        // Buscar si el producto ya existe en el carrito
        const productoExistente = carrito.find(p => p.id === producto.id);
        
        if (productoExistente) {
          const nuevaCantidad = productoExistente.cantidad + cantidad;
          
          if (nuevaCantidad > producto.stock) {
            mostrarNotificacion(`Solo puedes agregar ${producto.stock - productoExistente.cantidad} unidades más`, "error");
            return;
          }
          
          productoExistente.cantidad = nuevaCantidad;
        } else {
          carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            imagen: ajustarRutaImagen(producto.imagen), // USAR RUTA AJUSTADA
            precio: producto.precio || 0,
            stock: producto.stock,
            categoria: producto.categoria,
            cantidad: cantidad
          });
        }

        // Guardar en localStorage
        localStorage.setItem('aurum_carrito', JSON.stringify(carrito));
        
        // Actualizar contador en navbar
        if (window.actualizarContadorCarrito) {
          window.actualizarContadorCarrito();
        }

        // Mostrar notificación de éxito
        mostrarNotificacion(`"${producto.nombre}" x${cantidad} agregado al carrito! 🛒`, "success");
        
        // Opcional: Mostrar botón para ir al carrito
        setTimeout(() => {
          const irCarrito = confirm("¿Quieres ver tu carrito ahora?");
          if (irCarrito) {
            window.location.href = "../carrito.html";
          }
        }, 1000);

      } catch (error) {
        console.error('Error al agregar al carrito:', error);
        mostrarNotificacion("Error al agregar el producto al carrito", "error");
      }
    };
    
    btnCarrito.addEventListener("click", btnCarrito._clickHandler);
  }

  // Configurar controles de cantidad
  configurarControlesCantidad(producto);
}

// FUNCIÓN CORREGIDA - Esta es la clave del fix
function configurarControlesCantidad(producto) {
  const cantidadInput = document.getElementById("cantidad");

  if (!cantidadInput) return;

  // Establecer valores iniciales
  cantidadInput.min = 1;
  cantidadInput.max = producto.stock;
  cantidadInput.value = 1;

  // Variable global para el stock máximo
  window.stockMaximo = producto.stock;

  // SOLO configurar validación del input, NO los botones aquí
  // Los botones se manejan en la función global cambiarCantidad

  // Validar input manual - CORREGIDO
  cantidadInput.addEventListener('input', function(e) {
    // Permitir que el usuario borre completamente el campo
    if (this.value === '') {
      return; // No hacer nada si está vacío
    }

    let valor = parseInt(this.value);
    
    // Solo validar si hay un valor numérico
    if (!isNaN(valor)) {
      if (valor < 1) {
        this.value = 1;
      } else if (valor > producto.stock) {
        this.value = producto.stock;
        mostrarNotificacion(`Máximo ${producto.stock} unidades disponibles`, "error");
      }
    }
  });

  // Validar al perder foco - CORREGIDO
  cantidadInput.addEventListener('blur', function() {
    if (!this.value || this.value === '' || parseInt(this.value) < 1) {
      this.value = 1;
    }
  });

  // Prevenir caracteres no numéricos
  cantidadInput.addEventListener('keypress', function(e) {
    // Solo permitir números
    if (!/[0-9]/.test(e.key) && 
        !['Backspace', 'Delete', 'Tab', 'Escape', 'Enter'].includes(e.key)) {
      e.preventDefault();
    }
  });
}

function obtenerTextoStock(stock) {
  if (stock === 0) return "Agotado";
  if (stock <= 5) return `Últimas ${stock} unidades`;
  return `${stock} disponibles`;
}

function obtenerClaseStock(stock) {
  if (stock === 0) return "agotado";
  if (stock <= 5) return "bajo-stock";
  return "disponible";
}

function mostrarNotificacion(mensaje, tipo = "success") {
  // Remover notificación existente
  const notificacionExistente = document.querySelector('.notificacion-detalle');
  if (notificacionExistente) {
    notificacionExistente.remove();
  }

  // Crear notificación temporal
  const notificacion = document.createElement('div');
  notificacion.className = 'notificacion-detalle';
  notificacion.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(45deg, ${tipo === 'success' ? '#4caf50, #45a049' : '#ff4757, #ff3838'});
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    font-weight: bold;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
  `;
  
  notificacion.textContent = mensaje;
  document.body.appendChild(notificacion);

  // Animación de entrada
  setTimeout(() => {
    notificacion.style.transform = 'translateX(0)';
  }, 100);

  // Remover después de 4 segundos
  setTimeout(() => {
    notificacion.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notificacion.parentNode) {
        notificacion.remove();
      }
    }, 300);
  }, 4000);
}

// FUNCIÓN GLOBAL CORREGIDA - Esta es la clave
window.cambiarCantidad = function(cambio) {
  const cantidadInput = document.getElementById("cantidad");
  if (!cantidadInput) return;
  
  let valorActual = parseInt(cantidadInput.value) || 1;
  let maxStock = window.stockMaximo || parseInt(cantidadInput.max) || 99;
  let nuevoValor = valorActual + cambio;

  // Validar límites
  if (nuevoValor < 1) {
    nuevoValor = 1;
  } else if (nuevoValor > maxStock) {
    nuevoValor = maxStock;
    mostrarNotificacion(`Máximo ${maxStock} unidades disponibles`, "error");
  }

  // Actualizar valor
  cantidadInput.value = nuevoValor;
  
  // Disparar evento change para actualizar WhatsApp
  cantidadInput.dispatchEvent(new Event('change', { bubbles: true }));
};