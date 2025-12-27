// ========== CONFIGURACIÓN DE LA API ==========
// Detectar automáticamente si estamos en local o en producción
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:8000/api'
  : window.location.origin + '/api';

// ========== UTILIDADES DE TOKEN ==========

function saveAuthData(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
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

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Detectar ubicación actual para redirigir correctamente
  const path = window.location.pathname;
  
  if (path.includes('/html/admin/')) {
    window.location.href = '../../index.html';
  } else if (path.includes('/html/')) {
    window.location.href = '../index.html';
  } else {
    window.location.href = '/index.html';
  }
}

// ========== CLIENTE HTTP ==========

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      ...options.headers,
    }
  };
  
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  try {
    const response = await fetch(url, config);
    
    if (response.status === 204) {
      return null;
    }
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        logout();
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      
      throw new Error(data.detail || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error('Error en fetchAPI:', error);
    throw error;
  }
}

// ========== API DE AUTENTICACIÓN ==========

const authAPI = {
  async register(email, nombre, password) {
    const response = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, nombre, password })
    });
    
    saveAuthData(response.access_token, response.user);
    return response;
  },
  
  async login(email, password) {
    const response = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    saveAuthData(response.access_token, response.user);
    return response;
  },
  
  async getProfile() {
    return await fetchAPI('/auth/me');
  },
  
  // NUEVO: Actualizar perfil
  async updateProfile(data) {
    const params = new URLSearchParams();
    if (data.nombre) params.append('nombre', data.nombre);
    
    const response = await fetchAPI(`/auth/me?${params.toString()}`, {
      method: 'PUT'
    });
    
    // Actualizar localStorage
    const user = getCurrentUser();
    if (data.nombre) user.nombre = data.nombre;
    localStorage.setItem('user', JSON.stringify(user));
    
    return response;
  },
  
  // NUEVO: Cambiar contraseña
  async changePassword(currentPassword, newPassword) {
    return await fetchAPI('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
  },
  
  // NUEVO: Solicitar cambio de email
  async requestEmailChange(newEmail) {
    return await fetchAPI('/auth/request-email-change', {
      method: 'POST',
      body: JSON.stringify({ new_email: newEmail })
    });
  },
  
  // NUEVO: Confirmar cambio de email
  async confirmEmailChange(code) {
    const response = await fetchAPI('/auth/confirm-email-change', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
    
    // Actualizar email en localStorage si es exitoso
    const user = getCurrentUser();
    const profile = await this.getProfile();
    user.email = profile.email;
    user.email_verified = profile.email_verified;
    localStorage.setItem('user', JSON.stringify(user));
    
    return response;
  },
  
  // NUEVO: Reenviar código de verificación
  async resendVerification() {
    return await fetchAPI('/auth/resend-verification', {
      method: 'POST'
    });
  },
  
  // NUEVO: Verificar email con código manual
  async verifyEmailWithCode(code) {
    return await fetchAPI('/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },
  
  // NUEVO: Eliminar cuenta
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
    return await fetchAPI(`/productos/categoria/${categoria}`);
  },
  
  async create(productoData, imagenFile = null) {
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
    
    if (imagenFile) {
      formData.append('imagen', imagenFile);
    }
    
    return await fetchAPI('/productos', {
      method: 'POST',
      body: formData
    });
  },
  
  async update(id, productoData, imagenFile = null) {
    const formData = new FormData();
    
    if (productoData.nombre) formData.append('nombre', productoData.nombre);
    if (productoData.descripcion !== undefined) formData.append('descripcion', productoData.descripcion);
    if (productoData.precio !== undefined && productoData.precio !== null && productoData.precio !== '') {
      formData.append('precio', productoData.precio);
    }
    if (productoData.categoria) formData.append('categoria', productoData.categoria);
    if (productoData.stock !== undefined) formData.append('stock', productoData.stock);
    if (productoData.destacado !== undefined) formData.append('destacado', productoData.destacado);
    if (productoData.activo !== undefined) formData.append('activo', productoData.activo);
    if (imagenFile) formData.append('imagen', imagenFile);
    
    return await fetchAPI(`/productos/${id}`, {
      method: 'PUT',
      body: formData
    });
  },
  
  async delete(id) {
    return await fetchAPI(`/productos/${id}`, {
      method: 'DELETE'
    });
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
  
  async delete(id) {
    return await fetchAPI(`/carrusel/${id}`, {
      method: 'DELETE'
    });
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