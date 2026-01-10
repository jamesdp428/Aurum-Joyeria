// ===== UTILIDADES PARA CARRITO - OPTIMIZACIÓN DE IMÁGENES =====

/**
 * Utilidades para mejorar la experiencia del carrito
 * Incluye: optimización de imágenes, lazy loading, fallbacks
 */

class CarritoUtils {
  constructor() {
    this.imageCache = new Map();
    this.lazyLoadObserver = null;
    this.init();
  }

  init() {
    this.setupLazyLoading();
    this.setupImageErrorHandling();
  }

  // ===== OPTIMIZACIÓN DE RUTAS DE IMÁGENES =====
  
  /**
   * Corrige la ruta de imagen según la ubicación actual
   */
  static corregirRutaImagen(imagenPath) {
    if (!imagenPath) return CarritoUtils.getPlaceholderImage();
    
    // Si es una URL completa o data URI, no modificar
    if (imagenPath.startsWith('http') || imagenPath.startsWith('data:') || imagenPath.startsWith('blob:')) {
      return imagenPath;
    }
    
    const currentPath = window.location.pathname;
    const fileName = window.location.pathname.split('/').pop();
    
    // Detectar contexto y ajustar ruta
    if (fileName === 'carrito.html' || currentPath.includes('/html/carrito.html')) {
      // Estamos en html/carrito.html
      if (imagenPath.startsWith('../img/')) {
        return imagenPath; // Ya está correcto
      } else if (imagenPath.startsWith('img/')) {
        return imagenPath.replace('img/', '../img/');
      } else if (!imagenPath.startsWith('../')) {
        return `../${imagenPath}`;
      }
    } else if (currentPath.includes('/html/categorias/')) {
      // Estamos en html/categorias/
      if (imagenPath.startsWith('../../img/')) {
        return imagenPath; // Ya está correcto
      } else if (imagenPath.startsWith('../img/')) {
        return imagenPath.replace('../img/', '../../img/');
      } else if (imagenPath.startsWith('img/')) {
        return imagenPath.replace('img/', '../../img/');
      }
    } else if (currentPath.includes('/html/')) {
      // Otras páginas en html/
      if (!imagenPath.startsWith('../')) {
        return imagenPath.startsWith('img/') ? imagenPath.replace('img/', '../img/') : `../${imagenPath}`;
      }
    } else {
      // Página principal (index.html)
      if (!imagenPath.startsWith('img/') && !imagenPath.startsWith('./')) {
        return `img/${imagenPath}`;
      }
    }
    
    return imagenPath;
  }

  /**
   * Obtiene imagen placeholder
   */
  static getPlaceholderImage() {
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/html/categorias/')) {
      return '../../img/placeholder.jpg';
    } else if (currentPath.includes('/html/')) {
      return '../img/placeholder.jpg';
    } else {
      return 'img/placeholder.jpg';
    }
  }

  /**
   * Crea un placeholder SVG dinámico
   */
  static createSVGPlaceholder(width = 120, height = 100, text = 'Imagen no disponible') {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#2a2a2a" stroke="#f9dc5e" stroke-width="2" rx="8"/>
        <text x="50%" y="40%" text-anchor="middle" fill="#f9dc5e" font-family="Arial, sans-serif" font-size="12">
          🖼️
        </text>
        <text x="50%" y="65%" text-anchor="middle" fill="#ccc" font-family="Arial, sans-serif" font-size="8">
          ${text}
        </text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // ===== LAZY LOADING =====
  
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      this.lazyLoadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.lazyLoadObserver.unobserve(entry.target);
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });
    }
  }

  /**
   * Configura imagen para lazy loading
   */
  setupLazyImage(img, src) {
    if (this.lazyLoadObserver) {
      img.dataset.src = src;
      img.src = CarritoUtils.createSVGPlaceholder(120, 100, 'Cargando...');
      img.classList.add('lazy-loading');
      this.lazyLoadObserver.observe(img);
    } else {
      // Fallback para navegadores sin IntersectionObserver
      this.loadImage(img, src);
    }
  }

  /**
   * Carga imagen con optimizaciones
   */
  async loadImage(img, src = null) {
    const imageSrc = src || img.dataset.src || img.src;
    const correctedSrc = CarritoUtils.corregirRutaImagen(imageSrc);
    
    try {
      // Verificar cache
      if (this.imageCache.has(correctedSrc)) {
        const cachedResult = this.imageCache.get(correctedSrc);
        if (cachedResult.success) {
          img.src = correctedSrc;
          img.classList.remove('lazy-loading');
          img.classList.add('loaded');
        } else {
          this.setFallbackImage(img);
        }
        return;
      }

      // Precargar imagen
      const tempImg = new Image();
      
      const loadPromise = new Promise((resolve, reject) => {
        tempImg.onload = () => {
          this.imageCache.set(correctedSrc, { success: true });
          img.src = correctedSrc;
          img.classList.remove('lazy-loading');
          img.classList.add('loaded');
          resolve();
        };
        
        tempImg.onerror = () => {
          this.imageCache.set(correctedSrc, { success: false });
          reject();
        };
      });

      tempImg.src = correctedSrc;
      await loadPromise;

    } catch (error) {
      console.warn('Error cargando imagen:', correctedSrc, error);
      this.setFallbackImage(img);
    }
  }

  /**
   * Establece imagen de fallback
   */
  setFallbackImage(img) {
    img.src = CarritoUtils.createSVGPlaceholder();
    img.classList.remove('lazy-loading');
    img.classList.add('error');
    img.alt = 'Imagen no disponible';
  }

  // ===== MANEJO DE ERRORES DE IMAGEN =====
  
  setupImageErrorHandling() {
    // Delegación de eventos para manejo de errores de imagen
    document.addEventListener('error', (e) => {
      if (e.target.tagName === 'IMG' && e.target.classList.contains('producto-imagen')) {
        this.handleImageError(e.target);
      }
    }, true);
  }

  handleImageError(img) {
    if (img.dataset.retryCount) {
      const retryCount = parseInt(img.dataset.retryCount);
      if (retryCount >= 2) {
        this.setFallbackImage(img);
        return;
      }
    }

    // Intentar nuevamente con ruta corregida
    const originalSrc = img.dataset.originalSrc || img.src;
    const correctedSrc = CarritoUtils.corregirRutaImagen(originalSrc);
    
    if (correctedSrc !== img.src) {
      img.dataset.retryCount = (parseInt(img.dataset.retryCount) || 0) + 1;
      img.dataset.originalSrc = originalSrc;
      img.src = correctedSrc;
    } else {
      this.setFallbackImage(img);
    }
  }

  // ===== UTILIDADES ADICIONALES =====
  
  /**
   * Optimiza todas las imágenes en el carrito
   */
  optimizeCarritoImages() {
    const images = document.querySelectorAll('.producto-imagen');
    images.forEach(img => {
      if (!img.classList.contains('optimized')) {
        const currentSrc = img.src || img.dataset.src;
        if (currentSrc && !currentSrc.startsWith('data:')) {
          this.setupLazyImage(img, currentSrc);
          img.classList.add('optimized');
        }
      }
    });
  }

  /**
   * Precargar imágenes importantes
   */
  preloadImportantImages(imageSrcs) {
    imageSrcs.forEach(src => {
      const correctedSrc = CarritoUtils.corregirRutaImagen(src);
      if (!this.imageCache.has(correctedSrc)) {
        const img = new Image();
        img.onload = () => this.imageCache.set(correctedSrc, { success: true });
        img.onerror = () => this.imageCache.set(correctedSrc, { success: false });
        img.src = correctedSrc;
      }
    });
  }

  /**
   * Limpia cache de imágenes
   */
  clearImageCache() {
    this.imageCache.clear();
  }

  /**
   * Obtiene estadísticas del cache
   */
  getCacheStats() {
    const total = this.imageCache.size;
    const successful = Array.from(this.imageCache.values()).filter(result => result.success).length;
    const failed = total - successful;
    
    return { total, successful, failed };
  }
}

// ===== MEJORAS DE CSS DINÁMICAS =====

/**
 * Añade estilos CSS adicionales para optimización de imágenes
 */
function addImageOptimizationCSS() {
  if (document.getElementById('carrito-image-optimization-css')) return;

  const css = `
    .producto-imagen.lazy-loading {
      background: linear-gradient(45deg, #2a2a2a 25%, transparent 25%),
                  linear-gradient(-45deg, #2a2a2a 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #2a2a2a 75%),
                  linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
      background-size: 8px 8px;
      background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
      animation: loading-shimmer 1s linear infinite;
    }

    .producto-imagen.loaded {
      animation: fadeInImage 0.3s ease-in;
    }

    .producto-imagen.error {
      border: 2px dashed #ff6b6b;
      background: rgba(255, 107, 107, 0.1);
    }

    @keyframes loading-shimmer {
      0% { background-position: 0 0, 0 4px, 4px -4px, -4px 0px; }
      100% { background-position: 8px 0, 8px 4px, 12px -4px, 4px 0px; }
    }

    @keyframes fadeInImage {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Mejoras responsive para imágenes */
    @media (max-width: 768px) {
      .producto-imagen {
        border-radius: 8px;
      }
    }

    @media (max-width: 480px) {
      .producto-imagen {
        border-radius: 6px;
        border-width: 1px;
      }
    }

    /* Mejoras de accesibilidad */
    .producto-imagen:focus {
      outline: 2px solid #f9dc5e;
      outline-offset: 2px;
    }

    /* Reducir animaciones si se prefiere menos movimiento */
    @media (prefers-reduced-motion: reduce) {
      .producto-imagen.lazy-loading {
        animation: none;
        background: #2a2a2a;
      }
      
      .producto-imagen.loaded {
        animation: none;
      }
    }
  `;

  const style = document.createElement('style');
  style.id = 'carrito-image-optimization-css';
  style.textContent = css;
  document.head.appendChild(style);
}

// ===== INTEGRACIÓN CON EL CARRITO =====

/**
 * Extiende la clase CarritoCompras para incluir optimizaciones
 */
function extendCarritoWithImageOptimization() {
  if (window.CarritoCompras && !window.CarritoCompras.prototype._imageOptimizationAdded) {
    const originalRenderizarProducto = window.CarritoCompras.prototype.renderizarProducto;
    
    window.CarritoCompras.prototype.renderizarProducto = function(producto) {
      const html = originalRenderizarProducto.call(this, producto);
      
      // Optimizar imágenes después del render
      setTimeout(() => {
        if (window.carritoUtils) {
          window.carritoUtils.optimizeCarritoImages();
        }
      }, 100);
      
      return html;
    };

    window.CarritoCompras.prototype._imageOptimizationAdded = true;
  }
}

// ===== INICIALIZACIÓN =====

document.addEventListener('DOMContentLoaded', () => {
  // Añadir estilos CSS
  addImageOptimizationCSS();
  
  // Crear instancia global de utilidades
  window.carritoUtils = new CarritoUtils();
  
  // Extender CarritoCompras si existe
  if (window.CarritoCompras) {
    extendCarritoWithImageOptimization();
  } else {
    // Esperar a que se cargue CarritoCompras
    const checkCarrito = setInterval(() => {
      if (window.CarritoCompras) {
        extendCarritoWithImageOptimization();
        clearInterval(checkCarrito);
      }
    }, 100);
  }
  
  // Optimizar imágenes existentes
  setTimeout(() => {
    window.carritoUtils.optimizeCarritoImages();
  }, 500);
  
  console.log('Utilidades de carrito inicializadas');
});

// ===== FUNCIONES DE UTILIDAD GLOBAL =====

/**
 * Función global para corregir rutas de imagen
 * Para usar desde otros scripts
 */
window.corregirRutaImagen = CarritoUtils.corregirRutaImagen;

/**
 * Función para crear placeholders dinámicos
 */
window.createImagePlaceholder = CarritoUtils.createSVGPlaceholder;

/**
 * Función para verificar si una imagen existe
 */
window.checkImageExists = function(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = CarritoUtils.corregirRutaImagen(src);
  });
};

// ===== DEBUGGING Y MONITOREO =====

/**
 * Herramientas de debugging para desarrollo
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.carritoDebug = {
    // Mostrar estadísticas de cache
    showCacheStats: () => {
      if (window.carritoUtils) {
        console.log('Cache Stats:', window.carritoUtils.getCacheStats());
      }
    },
    
    // Verificar todas las rutas de imagen
    checkAllImagePaths: () => {
      const images = document.querySelectorAll('.producto-imagen');
      console.log('Verificando rutas de imagen...');
      
      images.forEach((img, index) => {
        const originalSrc = img.src || img.dataset.src;
        const correctedSrc = CarritoUtils.corregirRutaImagen(originalSrc);
        
        console.log(`Imagen ${index + 1}:`);
        console.log(`  Original: ${originalSrc}`);
        console.log(`  Corregida: ${correctedSrc}`);
        console.log(`  Mismo: ${originalSrc === correctedSrc}`);
      });
    },
    
    // Simular error de imagen
    simulateImageError: (index = 0) => {
      const images = document.querySelectorAll('.producto-imagen');
      if (images[index]) {
        images[index].src = 'ruta-inexistente.jpg';
      }
    },
    
    // Limpiar cache
    clearCache: () => {
      if (window.carritoUtils) {
        window.carritoUtils.clearImageCache();
        console.log('Cache limpiado');
      }
    },
    
    // Mostrar información del carrito
    showCarritoInfo: () => {
      if (window.carrito) {
        console.log('Productos en carrito:', window.carrito.productos.length);
        console.log('Total productos:', window.carrito.obtenerTotalProductos());
        window.carrito.productos.forEach((producto, index) => {
          console.log(`${index + 1}. ${producto.nombre} - Cantidad: ${producto.cantidad} - Imagen: ${producto.imagen}`);
        });
      }
    }
  };
  
  console.log('Herramientas de debug disponibles en window.carritoDebug');
}