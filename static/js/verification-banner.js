// ========== BANNER DE VERIFICACIÓN DE EMAIL ==========

/**
 * Muestra un banner si el usuario no ha verificado su email
 * Agregar este script a todas las páginas que requieren usuario logueado
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = getCurrentUser();
  
  // Solo verificar si hay usuario logueado
  if (!user) return;
  
  try {
    // Obtener perfil actualizado del servidor
    const perfil = await authAPI.getProfile();
    
    // Actualizar localStorage con datos frescos
    const currentUser = getCurrentUser();
    currentUser.email_verified = perfil.email_verified;
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    // Si no está verificado, mostrar banner
    if (!perfil.email_verified) {
      mostrarBannerVerificacion();
    }
    
  } catch (error) {
    console.error('Error verificando estado de usuario:', error);
  }
});

function mostrarBannerVerificacion() {
  // Verificar si el banner ya existe
  if (document.getElementById('verificationBanner')) {
    return;
  }
  
  // Crear banner
  const banner = document.createElement('div');
  banner.id = 'verificationBanner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(45deg, #ff9800, #ff5722);
    color: white;
    padding: 15px 20px;
    text-align: center;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    flex-wrap: wrap;
  `;
  
  banner.innerHTML = `
    <span style="font-weight: 600;">
      ⚠️ Tu email no ha sido verificado. Por favor verifica tu correo para acceder a todas las funciones.
    </span>
    <button 
      id="btnReenviarBanner" 
      style="
        background: white;
        color: #ff5722;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.2s;
      "
      onmouseover="this.style.transform='scale(1.05)'"
      onmouseout="this.style.transform='scale(1)'"
    >
      Reenviar código
    </button>
    <a 
      href="/html/perfil.html" 
      style="
        background: rgba(255,255,255,0.2);
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        border: 1px solid rgba(255,255,255,0.5);
      "
    >
      Ir a mi perfil
    </a>
    <button 
      id="btnCerrarBanner" 
      style="
        background: transparent;
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        padding: 0 10px;
        margin-left: auto;
      "
      title="Cerrar"
    >
      ×
    </button>
  `;
  
  // Insertar al inicio del body
  document.body.insertBefore(banner, document.body.firstChild);
  
  // Ajustar padding del contenido para que no quede detrás del banner
  if (document.body.style.paddingTop === '') {
    document.body.style.paddingTop = '70px';
  }
  
  // Event listeners
  document.getElementById('btnReenviarBanner').addEventListener('click', reenviarCodigoBanner);
  document.getElementById('btnCerrarBanner').addEventListener('click', cerrarBanner);
}

async function reenviarCodigoBanner() {
  const btn = document.getElementById('btnReenviarBanner');
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  
  try {
    await authAPI.resendVerification();
    
    btn.style.background = '#4CAF50';
    btn.style.color = 'white';
    btn.textContent = '✓ Código enviado';
    
    setTimeout(() => {
      btn.style.background = 'white';
      btn.style.color = '#ff5722';
      btn.textContent = originalText;
      btn.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error reenviando código:', error);
    
    btn.style.background = '#f44336';
    btn.style.color = 'white';
    btn.textContent = '✗ Error';
    
    setTimeout(() => {
      btn.style.background = 'white';
      btn.style.color = '#ff5722';
      btn.textContent = originalText;
      btn.disabled = false;
    }, 3000);
  }
}

function cerrarBanner() {
  const banner = document.getElementById('verificationBanner');
  if (banner) {
    banner.style.transition = 'opacity 0.3s, transform 0.3s';
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-100%)';
    
    setTimeout(() => {
      banner.remove();
      document.body.style.paddingTop = '0';
    }, 300);
  }
}

// Exportar funciones
if (typeof window !== 'undefined') {
  window.mostrarBannerVerificacion = mostrarBannerVerificacion;
  window.cerrarBanner = cerrarBanner;
}