// Cargar productos destacados desde la API
document.addEventListener('DOMContentLoaded', async () => {
  const productosGrid = document.querySelector('.productos-grid');
  
  console.log('🔍 cargar_destacados.js iniciado');
  console.log('🔍 productosGrid encontrado:', !!productosGrid);
  
  if (!productosGrid) {
    console.warn('⚠️ No se encontró .productos-grid - no estamos en la página de inicio');
    return;
  }
  
  try {
    // Verificar que la API esté disponible
    if (typeof productosAPI === 'undefined') {
      throw new Error('productosAPI no está definida. Asegúrate de que api.js se carga primero.');
    }
    
    console.log('✅ productosAPI está disponible');
    
    // Mostrar loading
    productosGrid.innerHTML = '<div class="loading">Cargando productos...</div>';
    
    // Obtener productos destacados de la API
    console.log('📡 Llamando a la API para productos destacados...');
    const productos = await productosAPI.getAll({ destacado: true, activo: true });
    
    console.log('📦 Productos recibidos:', productos.length);
    console.log('📦 Datos:', productos);
    
    // Limpiar loading
    productosGrid.innerHTML = '';
    
    // Si no hay productos
    if (!productos || productos.length === 0) {
      console.warn('⚠️ No hay productos destacados');
      productosGrid.innerHTML = `
        <div class="error">
          No hay productos destacados disponibles en este momento.
        </div>
      `;
      return;
    }
    
    // Renderizar productos
    productos.forEach((producto, index) => {
      console.log(`🎨 Renderizando producto ${index + 1}:`, producto.nombre);
      console.log(`   Imagen URL:`, producto.imagen_url);
      
      const productoCard = crearProductoCard(producto);
      productosGrid.appendChild(productoCard);
    });
    
    console.log('✅ Todos los productos renderizados');
    
  } catch (error) {
    console.error('❌ Error al cargar productos:', error);
    console.error('❌ Stack:', error.stack);
    
    productosGrid.innerHTML = `
      <div class="error">
        Error al cargar los productos. Por favor intenta de nuevo más tarde.
        <br><small>Error: ${error.message}</small>
      </div>
    `;
  }
});

/**
 * Crea una tarjeta de producto
 */
function crearProductoCard(producto) {
  console.log(`🗂️ Creando card para: ${producto.nombre}`);
  
  const card = document.createElement('a');
  // 🔥 CRÍTICO: Usar ruta correcta sin /html/
  card.href = `/producto/${producto.id}`;
  card.className = 'producto-destacado';
  
  // Badge de destacado
  const badge = document.createElement('div');
  badge.className = 'destacado-badge';
  badge.textContent = 'Destacado';
  card.appendChild(badge);
  
  // Imagen con placeholder online
  const img = document.createElement('img');
  img.alt = producto.nombre;
  img.loading = 'lazy';
  
  // Debug: verificar imagen
  console.log(`  🖼️ Procesando imagen para ${producto.nombre}:`);
  console.log(`     URL original: "${producto.imagen_url}"`);
  console.log(`     ¿Tiene URL?: ${!!producto.imagen_url}`);
  console.log(`     ¿URL válida?: ${producto.imagen_url && producto.imagen_url.trim() !== ''}`);
  
  // Validar si tiene imagen
  if (producto.imagen_url && producto.imagen_url.trim() !== '') {
    console.log(`  ✅ Asignando URL de imagen: ${producto.imagen_url}`);
    img.src = producto.imagen_url;
    
    // Si falla la carga, usar placeholder online
    img.onerror = function() {
      console.warn(`  ⚠️ Error cargando imagen para: ${producto.nombre}`);
      console.warn(`     URL que falló: ${this.src}`);
      this.src = 'https://via.placeholder.com/250x250/1a1a1a/f9dc5e?text=Sin+Imagen';
      this.onerror = null; // Evitar loop infinito
      console.log(`  🔄 Cambiado a placeholder`);
    };
    
    img.onload = function() {
      console.log(`  ✅ Imagen cargada exitosamente: ${producto.nombre}`);
    };
  } else {
    // No tiene imagen, usar placeholder directamente
    console.log(`  ℹ️ Sin imagen, usando placeholder para: ${producto.nombre}`);
    img.src = 'https://via.placeholder.com/250x250/1a1a1a/f9dc5e?text=Sin+Imagen';
  }
  
  card.appendChild(img);
  
  // Título
  const titulo = document.createElement('h3');
  titulo.textContent = producto.nombre;
  card.appendChild(titulo);
  
  // Descripción
  const descripcion = document.createElement('p');
  descripcion.textContent = producto.descripcion || 'Sin descripción';
  card.appendChild(descripcion);
  
  // Precio o "Consultar"
  const precio = document.createElement('div');
  precio.className = 'producto-precio';
  if (producto.precio && producto.precio > 0) {
    precio.textContent = `$${Number(producto.precio).toLocaleString('es-CO')}`;
  } else {
    precio.textContent = 'Consultar precio';
    precio.style.fontStyle = 'italic';
  }
  card.appendChild(precio);
  
  // Botón
  const boton = document.createElement('span');
  boton.className = 'ver-mas';
  boton.textContent = 'Ver más';
  card.appendChild(boton);
  
  console.log(`  ✅ Card creada para: ${producto.nombre}`);
  
  return card;
}

/**
 * Función auxiliar para formatear precios
 */
function formatearPrecio(precio) {
  if (!precio || precio <= 0) {
    return 'Consultar';
  }
  return `$${Number(precio).toLocaleString('es-CO')}`;
}