// ========== VERIFICAR ACCESO ADMIN ==========

document.addEventListener('DOMContentLoaded', () => {
    if (!isAdmin()) {
        alert('Acceso denegado. Solo administradores pueden acceder a esta página.');
        window.location.href = '../../index.html';
        return;
    }
    
    inicializarAdmin();
});

// Función logout personalizada para el panel de admin
function logoutFromPanel() {
  if (confirm('¿Estás seguro de cerrar sesión?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '../../index.html';
  }
}

// ========== INICIALIZACIÓN ==========

function inicializarAdmin() {
    configurarTabs();
    configurarModales();
    cargarProductos();
    
    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logoutFromPanel);
    document.getElementById('btnNuevoProducto').addEventListener('click', () => abrirModalProducto());
    document.getElementById('filterCategoria').addEventListener('change', cargarProductos);
    document.getElementById('filterDestacado').addEventListener('change', cargarProductos);
}

// ========== TABS ==========

function configurarTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            
            // Remover active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            
            // Activar seleccionado
            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// ========== MODALES ==========

function configurarModales() {
    // Modal Producto
    const modalProducto = document.getElementById('modalProducto');
    const btnCancelarProducto = document.getElementById('btnCancelarProducto');
    const formProducto = document.getElementById('formProducto');
    
    btnCancelarProducto.addEventListener('click', () => cerrarModal(modalProducto));
    formProducto.addEventListener('submit', guardarProducto);
    
    
    
    // Cerrar con X
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cerrarModal(e.target.closest('.modal'));
        });
    });
    
    // Cerrar al hacer click fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                cerrarModal(modal);
            }
        });
    });
    
    // Preview de imágenes - SOPORTE MÚLTIPLE
    document.getElementById('productoImagen').addEventListener('change', (e) => {
        previewImagenesMultiples(e.target, 'imagenPreview');
    });
}

function abrirModal(modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function cerrarModal(modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
    
    // Resetear formulario
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    // Ocultar previews
    modal.querySelectorAll('.imagen-preview').forEach(preview => {
        preview.classList.remove('show');
        preview.innerHTML = '';
    });
}

function previewImagen(input, previewId) {
    const preview = document.getElementById(previewId);
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            preview.classList.add('show');
        };
        
        reader.readAsDataURL(input.files[0]);
    }
}

// 🔥 Preview para múltiples imágenes
function previewImagenesMultiples(input, previewId) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = '';
    
    if (input.files && input.files.length > 0) {
        Array.from(input.files).forEach((file, index) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.style.cssText = 'display: inline-block; margin: 5px; position: relative;';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #f9dc5e;">
                    <span style="position: absolute; top: -5px; right: -5px; background: #f9dc5e; color: #000; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${index + 1}</span>
                `;
                preview.appendChild(imgContainer);
            };
            
            reader.readAsDataURL(file);
        });
        
        preview.classList.add('show');
    }
}

// ========== PRODUCTOS ==========

async function cargarProductos() {
    const tbody = document.querySelector('#productosTable tbody');
    tbody.innerHTML = '<tr><td colspan="8" class="loading">Cargando productos...</td></tr>';
    
    try {
        const categoria = document.getElementById('filterCategoria').value;
        const destacado = document.getElementById('filterDestacado').checked ? true : undefined;
        
        const filters = {
            activo: undefined  // Mostrar todos (activos e inactivos)
        };
        
        if (categoria) filters.categoria = categoria;
        if (destacado !== undefined) filters.destacado = destacado;
        
        const productos = await productosAPI.getAll(filters);
        
        if (productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No hay productos</td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        productos.forEach(producto => {
            const row = crearFilaProducto(producto);
            tbody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        tbody.innerHTML = '<tr><td colspan="8" class="error-message">Error al cargar productos</td></tr>';
    }
}

function crearFilaProducto(producto) {
    const tr = document.createElement('tr');
    
    const precio = producto.precio ? `$${Number(producto.precio).toLocaleString('es-CO')}` : 'Consultar';
    
    const nombreCategoria = {
        'tobilleras': 'Dijes y Herrajes',
        'otros': 'Combos',
        'anillos': 'Anillos',
        'pulseras': 'Pulseras',
        'cadenas': 'Cadenas',
        'aretes': 'Aretes'
    };
    const categoriaMostrar = nombreCategoria[producto.categoria] || producto.categoria;
    
    // Crear celda de imagen con placeholder
    const imagenCell = document.createElement('td');
    const img = document.createElement('img');
    img.alt = producto.nombre;
    img.style.width = '60px';
    img.style.height = '60px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    img.style.border = '2px solid #f9dc5e';
    
    if (producto.imagen_url) {
        img.src = producto.imagen_url;
        img.onerror = function() {
            this.src = 'https://via.placeholder.com/60x60/1a1a1a/f9dc5e?text=Sin+Imagen';
        };
    } else {
        img.src = 'https://via.placeholder.com/60x60/1a1a1a/f9dc5e?text=Sin+Imagen';
    }
    
    imagenCell.appendChild(img);
    tr.appendChild(imagenCell);
    
    // Resto de las celdas
    tr.innerHTML += `
        <td>${producto.nombre}</td>
        <td>${categoriaMostrar}</td>
        <td>${precio}</td>
        <td>${producto.stock}</td>
        <td>
            <span class="status-badge ${producto.destacado ? 'active' : 'inactive'}">
                ${producto.destacado ? 'Sí' : 'No'}
            </span>
        </td>
        <td>
            <span class="status-badge ${producto.activo ? 'active' : 'inactive'}">
                ${producto.activo ? 'Activo' : 'Inactivo'}
            </span>
        </td>
        <td class="actions-cell">
            <button class="btn-primary btn-small btn-edit" onclick="editarProducto('${producto.id}')">
                Editar
            </button>
            <button class="btn-primary btn-small btn-delete" onclick="eliminarProducto('${producto.id}')">
                Eliminar
            </button>
        </td>
    `;
    
    return tr;
}

function abrirModalProducto(producto = null) {
    const modal = document.getElementById('modalProducto');
    const titulo = document.getElementById('modalProductoTitulo');
    const form = document.getElementById('formProducto');
    
    form.reset();
    document.getElementById('imagenPreview').classList.remove('show');
    document.getElementById('imagenPreview').innerHTML = '';
    
    if (producto) {
        titulo.textContent = 'Editar Producto';
        document.getElementById('productoId').value = producto.id;
        document.getElementById('productoNombre').value = producto.nombre;
        document.getElementById('productoCategoria').value = producto.categoria;
        document.getElementById('productoDescripcion').value = producto.descripcion || '';
        document.getElementById('productoPrecio').value = producto.precio || '';
        document.getElementById('productoStock').value = producto.stock;
        document.getElementById('productoDestacado').checked = producto.destacado;
        document.getElementById('productoActivo').checked = producto.activo;
        
        // 🔥 Mostrar preview de TODAS las imágenes si existen
        const preview = document.getElementById('imagenPreview');
        
        if (producto.imagenes_urls) {
            try {
                const urls = JSON.parse(producto.imagenes_urls);
                urls.forEach((url, index) => {
                    const imgContainer = document.createElement('div');
                    imgContainer.style.cssText = 'display: inline-block; margin: 5px; position: relative;';
                    imgContainer.innerHTML = `
                        <img src="${url}" alt="Imagen ${index + 1}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #f9dc5e;" onerror="this.src='https://via.placeholder.com/100x100/1a1a1a/f9dc5e?text=Sin+Imagen'">
                        <span style="position: absolute; top: -5px; right: -5px; background: #f9dc5e; color: #000; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">${index + 1}</span>
                    `;
                    preview.appendChild(imgContainer);
                });
                preview.classList.add('show');
            } catch (e) {
                // Si falla, mostrar solo la imagen principal
                if (producto.imagen_url) {
                    preview.innerHTML = `<img src="${producto.imagen_url}" alt="Preview" onerror="this.src='https://via.placeholder.com/300x300/1a1a1a/f9dc5e?text=Sin+Imagen'">`;
                    preview.classList.add('show');
                }
            }
        } else if (producto.imagen_url) {
            // Solo imagen principal
            preview.innerHTML = `<img src="${producto.imagen_url}" alt="Preview" onerror="this.src='https://via.placeholder.com/300x300/1a1a1a/f9dc5e?text=Sin+Imagen'">`;
            preview.classList.add('show');
        }
    } else {
        titulo.textContent = 'Nuevo Producto';
        document.getElementById('productoActivo').checked = true;
    }
    
    abrirModal(modal);
}

async function editarProducto(id) {
    try {
        const producto = await productosAPI.getById(id);
        abrirModalProducto(producto);
    } catch (error) {
        console.error('Error cargando producto:', error);
        alert('Error al cargar el producto');
    }
}

async function guardarProducto(e) {
    e.preventDefault();
    
    const id = document.getElementById('productoId').value;
    const nombre = document.getElementById('productoNombre').value;
    const categoria = document.getElementById('productoCategoria').value;
    const descripcion = document.getElementById('productoDescripcion').value;
    const precio = document.getElementById('productoPrecio').value;
    const stock = document.getElementById('productoStock').value;
    const destacado = document.getElementById('productoDestacado').checked;
    const activo = document.getElementById('productoActivo').checked;
    const imagenInput = document.getElementById('productoImagen');
    
    const productoData = {
        nombre,
        categoria,
        descripcion: descripcion || null,
        precio: precio ? parseFloat(precio) : null,
        stock: parseInt(stock),
        destacado,
        activo
    };
    
    // 🔥 MÚLTIPLES IMÁGENES - Convertir FileList a Array
    const imagenesFiles = imagenInput.files.length > 0 ? Array.from(imagenInput.files) : null;
    
    try {
        if (id) {
            // Editar - Por defecto AGREGAR imágenes nuevas a las existentes
            // Para REEMPLAZAR todas, cambiar el tercer parámetro a false
            await productosAPI.update(id, productoData, imagenesFiles, true);
            alert('✅ Producto actualizado exitosamente');
        } else {
            // Crear
            await productosAPI.create(productoData, imagenesFiles);
            alert('✅ Producto creado exitosamente');
        }
        
        cerrarModal(document.getElementById('modalProducto'));
        await cargarProductos();
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        alert('❌ Error al guardar el producto: ' + error.message);
    }
}

// ✅ CORREGIDO: Manejo robusto de DELETE
async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await productosAPI.delete(id);
        
        // ✅ Verificar que fue exitoso (debería ser true por el nuevo fetchAPI)
        console.log('Respuesta de eliminación:', response);
        
        alert('✅ Producto eliminado exitosamente');
        await cargarProductos();
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('❌ Error al eliminar el producto: ' + error.message);
    }
}