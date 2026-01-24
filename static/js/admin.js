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
    cargarCarrusel();
    
    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logoutFromPanel);
    document.getElementById('btnNuevoProducto').addEventListener('click', () => abrirModalProducto());
    document.getElementById('btnNuevoCarrusel').addEventListener('click', () => abrirModalCarrusel());
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
    
    // Modal Carrusel
    const modalCarrusel = document.getElementById('modalCarrusel');
    const btnCancelarCarrusel = document.getElementById('btnCancelarCarrusel');
    const formCarrusel = document.getElementById('formCarrusel');
    
    btnCancelarCarrusel.addEventListener('click', () => cerrarModal(modalCarrusel));
    formCarrusel.addEventListener('submit', guardarCarrusel);
    
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
    
    document.getElementById('carruselImagen').addEventListener('change', (e) => {
        previewImagen(e.target, 'carruselImagenPreview');
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

// 🔥 NUEVA: Preview para múltiples imágenes
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
        <td style="text-transform: capitalize;">${producto.categoria}</td>
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
        
        if (producto.imagen_url) {
            const preview = document.getElementById('imagenPreview');
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
    
    // 🔥 MÚLTIPLES IMÁGENES
    const imagenesFiles = imagenInput.files.length > 0 ? Array.from(imagenInput.files) : null;
    
    try {
        if (id) {
            // Editar - solo primera imagen por ahora
            const imagenFile = imagenesFiles && imagenesFiles.length > 0 ? imagenesFiles[0] : null;
            await productosAPI.update(id, productoData, imagenFile);
            alert('✅ Producto actualizado exitosamente');
        } else {
            // Crear - solo primera imagen por ahora
            const imagenFile = imagenesFiles && imagenesFiles.length > 0 ? imagenesFiles[0] : null;
            await productosAPI.create(productoData, imagenFile);
            alert('✅ Producto creado exitosamente');
        }
        
        cerrarModal(document.getElementById('modalProducto'));
        await cargarProductos(); // 🔥 AWAIT para asegurar recarga
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        alert('❌ Error al guardar el producto: ' + error.message);
    }
}

// 🔥 CORREGIDO: Manejo de respuesta del DELETE
async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await productosAPI.delete(id);
        
        // ✅ Verificar respuesta correcta
        if (response && (response.success === true || response.message)) {
            alert('✅ Producto eliminado exitosamente');
            await cargarProductos(); // 🔥 AWAIT para asegurar recarga
        } else {
            throw new Error('Respuesta inesperada del servidor');
        }
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('❌ Error al eliminar el producto: ' + error.message);
    }
}

// ========== CARRUSEL ==========

async function cargarCarrusel() {
    const grid = document.getElementById('carruselGrid');
    grid.innerHTML = '<div class="loading">Cargando carrusel...</div>';
    
    try {
        const items = await carruselAPI.getAll(undefined);
        
        if (items.length === 0) {
            grid.innerHTML = '<div class="empty-state">No hay imágenes en el carrusel</div>';
            return;
        }
        
        grid.innerHTML = '';
        
        items.forEach(item => {
            const card = crearCardCarrusel(item);
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error cargando carrusel:', error);
        grid.innerHTML = '<div class="error-message">Error al cargar el carrusel</div>';
    }
}

function crearCardCarrusel(item) {
    const card = document.createElement('div');
    card.className = 'carrusel-item';
    
    const img = document.createElement('img');
    img.alt = item.titulo || 'Carrusel';
    
    if (item.imagen_url) {
        img.src = item.imagen_url;
        img.onerror = function() {
            this.src = 'https://via.placeholder.com/300x200/1a1a1a/f9dc5e?text=Sin+Imagen';
        };
    } else {
        img.src = 'https://via.placeholder.com/300x200/1a1a1a/f9dc5e?text=Sin+Imagen';
    }
    
    card.appendChild(img);
    
    const content = document.createElement('div');
    content.className = 'carrusel-item-content';
    content.innerHTML = `
        <h3>${item.titulo || 'Sin título'}</h3>
        <p>${item.descripcion || 'Sin descripción'}</p>
        <div class="carrusel-item-info">
            <span>Orden: ${item.orden}</span>
            <span class="status-badge ${item.activo ? 'active' : 'inactive'}">
                ${item.activo ? 'Activo' : 'Inactivo'}
            </span>
        </div>
        <div class="carrusel-item-actions">
            <button class="btn-primary btn-small btn-edit" onclick="editarCarrusel('${item.id}')">
                Editar
            </button>
            <button class="btn-primary btn-small btn-delete" onclick="eliminarCarrusel('${item.id}')">
                Eliminar
            </button>
        </div>
    `;
    
    card.appendChild(content);
    return card;
}

function abrirModalCarrusel(item = null) {
    const modal = document.getElementById('modalCarrusel');
    const titulo = document.getElementById('modalCarruselTitulo');
    const form = document.getElementById('formCarrusel');
    
    form.reset();
    document.getElementById('carruselImagenPreview').classList.remove('show');
    document.getElementById('carruselImagenPreview').innerHTML = '';
    
    if (item) {
        titulo.textContent = 'Editar Imagen del Carrusel';
        document.getElementById('carruselId').value = item.id;
        document.getElementById('carruselTitulo').value = item.titulo || '';
        document.getElementById('carruselDescripcion').value = item.descripcion || '';
        document.getElementById('carruselOrden').value = item.orden;
        document.getElementById('carruselActivo').checked = item.activo;
        document.getElementById('carruselImagen').removeAttribute('required');
        
        if (item.imagen_url) {
            const preview = document.getElementById('carruselImagenPreview');
            preview.innerHTML = `<img src="${item.imagen_url}" alt="Preview" onerror="this.src='https://via.placeholder.com/300x200/1a1a1a/f9dc5e?text=Sin+Imagen'">`;
            preview.classList.add('show');
        }
    } else {
        titulo.textContent = 'Nueva Imagen del Carrusel';
        document.getElementById('carruselActivo').checked = true;
        document.getElementById('carruselImagen').setAttribute('required', 'required');
    }
    
    abrirModal(modal);
}

async function editarCarrusel(id) {
    try {
        const item = await carruselAPI.getById(id);
        abrirModalCarrusel(item);
    } catch (error) {
        console.error('Error cargando item del carrusel:', error);
        alert('Error al cargar el item del carrusel');
    }
}

async function guardarCarrusel(e) {
    e.preventDefault();
    
    const id = document.getElementById('carruselId').value;
    const titulo = document.getElementById('carruselTitulo').value;
    const descripcion = document.getElementById('carruselDescripcion').value;
    const orden = document.getElementById('carruselOrden').value;
    const activo = document.getElementById('carruselActivo').checked;
    const imagenInput = document.getElementById('carruselImagen');
    
    const carruselData = {
        titulo: titulo || null,
        descripcion: descripcion || null,
        orden: parseInt(orden),
        activo
    };
    
    const imagenFile = imagenInput.files[0] || null;
    
    if (!id && !imagenFile) {
        alert('Debes seleccionar una imagen');
        return;
    }
    
    try {
        if (id) {
            await carruselAPI.update(id, carruselData, imagenFile);
            alert('✅ Carrusel actualizado exitosamente');
        } else {
            await carruselAPI.create(carruselData, imagenFile);
            alert('✅ Imagen agregada al carrusel exitosamente');
        }
        
        cerrarModal(document.getElementById('modalCarrusel'));
        await cargarCarrusel(); // 🔥 AWAIT para asegurar recarga
        
    } catch (error) {
        console.error('Error guardando carrusel:', error);
        alert('❌ Error al guardar el carrusel: ' + error.message);
    }
}

// 🔥 CORREGIDO: Manejo de respuesta del DELETE
async function eliminarCarrusel(id) {
    if (!confirm('¿Estás seguro de eliminar esta imagen del carrusel? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await carruselAPI.delete(id);
        
        // ✅ Verificar respuesta correcta
        if (response && (response.success === true || response.message)) {
            alert('✅ Imagen eliminada exitosamente');
            await cargarCarrusel(); // 🔥 AWAIT para asegurar recarga
        } else {
            throw new Error('Respuesta inesperada del servidor');
        }
        
    } catch (error) {
        console.error('Error eliminando carrusel:', error);
        alert('❌ Error al eliminar la imagen: ' + error.message);
    }
}