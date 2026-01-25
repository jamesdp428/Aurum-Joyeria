// ========== CONFIGURACIÓN DE LA API ==========

function getApiBaseUrl() {
  const hostname = window.location.hostname;
  
  console.log('🌐 Hostname detectado:', hostname);
  console.log('🌐 Origin completo:', window.location.origin);
  
  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('✅ Modo: DESARROLLO LOCAL');
    return 'http://127.0.0.1:8000/api';
  }
  
  // Producción - Vercel (mismo dominio)
  console.log('✅ Modo: PRODUCCIÓN (Vercel)');
  return window.location.origin + '/api';
}

const API_BASE_URL = getApiBaseUrl();

console.log('🔗 API Base URL configurada:', API_BASE_URL);

// ========== UTILIDADES DE TOKEN ==========

function saveAuthData(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  console.log('💾 Datos guardados en localStorage:', {
    token: token ? 'presente' : 'ausente',
    user: user
  });
}

function getToken() {
  return localStorage.getItem('token');
}

function getCurrentUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.rol === 'admin';
}

async function logout() {
  try {
    await fetchAPI('/auth/logout', { method: 'POST' });
  } catch (error) {
    console.error('Error al cerrar sesión en el servidor:', error);
  }
  
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// ========== CLIENTE HTTP ==========

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  console.log(`📡 ${options.method || 'GET'} ${url}`);
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
    },
    credentials: 'include'
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Solo agregar Content-Type si NO es FormData
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  try {
    const response = await fetch(url, config);
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    // 🔥 CRÍTICO: Primero verificar si la respuesta está OK
    const isSuccess = response.ok; // status 200-299
    
    // Intentar leer el cuerpo
    let data = null;
    const contentType = response.headers.get('content-type');
    
    // Si hay content-type JSON, intentar parsear
    if (contentType && contentType.includes('application/json')) {
      try {
        const text = await response.text();
        if (text && text.trim().length > 0) {
          data = JSON.parse(text);
        } else {
          // Respuesta vacía pero exitosa
          data = { success: true, message: 'Operación exitosa' };
        }
      } catch (parseError) {
        console.warn('⚠️ Error parseando JSON, asumiendo éxito:', parseError);
        data = { success: true, message: 'Operación exitosa' };
      }
    } else {
      // No es JSON, leer como texto
      const text = await response.text();
      
      if (text && text.trim().length > 0) {
        // Intentar parsear como JSON de todas formas
        try {
          data = JSON.parse(text);
        } catch {
          // No es JSON, crear objeto de éxito
          data = { success: true, message: 'Operación exitosa' };
        }
      } else {
        // Sin contenido, asumir éxito si status OK
        data = { success: true, message: 'Operación exitosa' };
      }
    }
    
    // Ahora verificar si fue exitoso
    if (!isSuccess) {
      // Error HTTP
      if (response.status === 401) {
        console.warn('⚠️ Sesión expirada, limpiando datos...');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
        
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      
      // Otros errores
      const errorMessage = data?.detail || data?.message || `Error ${response.status}`;
      throw new Error(errorMessage);
    }
    
    // ✅ Respuesta exitosa
    console.log('✅ Respuesta exitosa:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error en fetchAPI:', error);
    throw error;
  }
}

// ========== API DE AUTENTICACIÓN ==========

const authAPI = {
  async register(email, nombre, password) {
    console.log('📝 Iniciando registro...');
    const response = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, nombre, password })
    });
    
    console.log('✅ Registro exitoso:', response);
    saveAuthData(response.access_token, response.user);
    return response;
  },
  
  async login(email, password) {
    console.log('🔐 Iniciando login...');
    const response = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    console.log('✅ Login exitoso:', response);
    saveAuthData(response.access_token, response.user);
    return response;
  },
  
  async getProfile() {
    return await fetchAPI('/auth/me');
  },
  
  async updateProfile(data) {
    const params = new URLSearchParams();
    if (data.nombre) params.append('nombre', data.nombre);
    
    const response = await fetchAPI(`/auth/me?${params.toString()}`, {
      method: 'PUT'
    });
    
    const user = getCurrentUser();
    if (data.nombre) user.nombre = data.nombre;
    localStorage.setItem('user', JSON.stringify(user));
    
    return response;
  },
  
  async changePassword(currentPassword, newPassword) {
    return await fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
  },
  
  async verifyEmailWithCode(code) {
    const response = await fetchAPI('/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    const user = getCurrentUser();
    if (user) {
      user.email_verified = true;
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return response;
  },
  
  async deleteAccount() {
    return await fetchAPI('/auth/delete-account', {
      method: 'DELETE'
    });
  }
};

// ========== API DE PRODUCTOS ==========

const productosAPI = {
  async getAll(filters = {}) {
    const params = new URLSearchParams();
    
    if (filters.categoria) params.append('categoria', filters.categoria);
    if (filters.destacado !== undefined) params.append('destacado', filters.destacado);
    if (filters.activo !== undefined) params.append('activo', filters.activo);
    if (filters.skip) params.append('skip', filters.skip);
    if (filters.limit) params.append('limit', filters.limit);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return await fetchAPI(`/productos${query}`);
  },
  
  async getById(id) {
    return await fetchAPI(`/productos/${id}`);
  },
  
  async getByCategoria(categoria) {
    return await fetchAPI(`/productos?categoria=${categoria}&activo=true`);
  },
  
  // 🔥 NUEVO: Soporte para múltiples imágenes
  async create(productoData, imagenesFiles = null) {
    const formData = new FormData();
    
    formData.append('nombre', productoData.nombre);
    formData.append('categoria', productoData.categoria);
    formData.append('stock', productoData.stock || 0);
    formData.append('destacado', productoData.destacado || false);
    formData.append('activo', productoData.activo !== undefined ? productoData.activo : true);
    
    if (productoData.descripcion) {
      formData.append('descripcion', productoData.descripcion);
    }
    
    if (productoData.precio !== null && productoData.precio !== undefined && productoData.precio !== '') {
      formData.append('precio', productoData.precio);
    }
    
    // 🔥 MÚLTIPLES IMÁGENES
    if (imagenesFiles) {
      // Puede ser un solo File o un array de Files
      const files = Array.isArray(imagenesFiles) ? imagenesFiles : [imagenesFiles];
      
      files.forEach(file => {
        if (file && file instanceof File) {
          formData.append('imagenes', file);
        }
      });
    }
    
    return await fetchAPI('/productos', {
      method: 'POST',
      body: formData
    });
  },
  
  // 🔥 ACTUALIZADO: Soporte para múltiples imágenes
  async update(id, productoData, imagenesFiles = null, mantenerImagenes = true) {
    const formData = new FormData();
    
    if (productoData.nombre !== undefined) formData.append('nombre', productoData.nombre);
    if (productoData.descripcion !== undefined) formData.append('descripcion', productoData.descripcion);
    if (productoData.precio !== undefined && productoData.precio !== null && productoData.precio !== '') {
      formData.append('precio', productoData.precio);
    }
    if (productoData.categoria !== undefined) formData.append('categoria', productoData.categoria);
    if (productoData.stock !== undefined) formData.append('stock', productoData.stock);
    if (productoData.destacado !== undefined) formData.append('destacado', productoData.destacado);
    if (productoData.activo !== undefined) formData.append('activo', productoData.activo);
    
    formData.append('mantener_imagenes', mantenerImagenes);
    
    // 🔥 MÚLTIPLES IMÁGENES
    if (imagenesFiles) {
      const files = Array.isArray(imagenesFiles) ? imagenesFiles : [imagenesFiles];
      
      files.forEach(file => {
        if (file && file instanceof File) {
          formData.append('imagenes', file);
        }
      });
    }
    
    return await fetchAPI(`/productos/${id}`, {
      method: 'PUT',
      body: formData
    });
  },
  
  // ✅ DELETE corregido
  async delete(id) {
    console.log('🗑️ Eliminando producto:', id);
    const response = await fetchAPI(`/productos/${id}`, {
      method: 'DELETE'
    });
    console.log('✅ Producto eliminado:', response);
    return response;
  },
  
  async getCategorias() {
    return await fetchAPI('/productos/categorias/list');
  }
};

// ========== API DE CARRUSEL ==========

const carruselAPI = {
  async getAll(activoFilter = true) {
    const params = new URLSearchParams();
    if (activoFilter !== undefined) {
      params.append('activo', activoFilter);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return await fetchAPI(`/carrusel${query}`);
  },
  
  async getById(id) {
    return await fetchAPI(`/carrusel/${id}`);
  },
  
  async create(carruselData, imagenFile) {
    const formData = new FormData();
    
    if (!imagenFile) {
      throw new Error('La imagen es requerida');
    }
    
    formData.append('imagen', imagenFile);
    formData.append('orden', carruselData.orden || 0);
    formData.append('activo', carruselData.activo !== undefined ? carruselData.activo : true);
    
    if (carruselData.titulo) {
      formData.append('titulo', carruselData.titulo);
    }
    
    if (carruselData.descripcion) {
      formData.append('descripcion', carruselData.descripcion);
    }
    
    return await fetchAPI('/carrusel', {
      method: 'POST',
      body: formData
    });
  },
  
  async update(id, carruselData, imagenFile = null) {
    const formData = new FormData();
    
    if (carruselData.titulo !== undefined) formData.append('titulo', carruselData.titulo);
    if (carruselData.descripcion !== undefined) formData.append('descripcion', carruselData.descripcion);
    if (carruselData.orden !== undefined) formData.append('orden', carruselData.orden);
    if (carruselData.activo !== undefined) formData.append('activo', carruselData.activo);
    if (imagenFile) formData.append('imagen', imagenFile);
    
    return await fetchAPI(`/carrusel/${id}`, {
      method: 'PUT',
      body: formData
    });
  },
  
  // ✅ DELETE corregido
  async delete(id) {
    console.log('🗑️ Eliminando carrusel:', id);
    const response = await fetchAPI(`/carrusel/${id}`, {
      method: 'DELETE'
    });
    console.log('✅ Carrusel eliminado:', response);
    return response;
  }
};

// ========== EXPORTAR PARA USO GLOBAL ==========
if (typeof window !== 'undefined') {
  window.authAPI = authAPI;
  window.productosAPI = productosAPI;
  window.carruselAPI = carruselAPI;
  window.getToken = getToken;
  window.getCurrentUser = getCurrentUser;
  window.isAdmin = isAdmin;
  window.logout = logout;
  window.saveAuthData = saveAuthData;
  
  window.API_LOADED = true;
  console.log('✅ API de Aurum Joyería cargada correctamente');
}