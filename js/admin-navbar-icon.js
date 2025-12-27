// ========== ÍCONO DE ADMIN EN NAVBAR ==========

/**
 * Agrega un ícono de panel de admin en el navbar
 * Solo visible para usuarios con rol 'admin'
 * Versión alternativa al botón flotante
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  
  // Solo mostrar si es administrador
  if (!user || user.rol !== 'admin') {
    return;
  }
  
  agregarIconoAdminNavbar();
});

function agregarIconoAdminNavbar() {
  // Buscar el contenedor de íconos en el navbar
  const iconsContainer = document.querySelector('.icons');
  
  if (!iconsContainer) {
    console.warn('No se encontró el contenedor de íconos en el navbar');
    return;
  }
  
  // Verificar si ya existe el ícono
  if (document.getElementById('adminPanelIcon')) {
    return;
  }
  
  // Crear el ícono de admin
  const adminIcon = document.createElement('a');
  adminIcon.id = 'adminPanelIcon';
  adminIcon.href = getPanelUrl();
  adminIcon.title = 'Panel de Administración';
  adminIcon.style.cssText = `
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;
  
  adminIcon.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
    <span style="
      position: absolute;
      top: -6px;
      right: -8px;
      background: linear-gradient(45deg, #f9dc5e, #ffd700);
      color: #000;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 4px;
      border-radius: 8px;
      border: 1.5px solid #000;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    ">ADM</span>
  `;
  
  // Agregar efecto hover
  adminIcon.addEventListener('mouseenter', () => {
    adminIcon.querySelector('svg').style.transform = 'rotate(90deg)';
    adminIcon.querySelector('svg').style.transition = 'transform 0.3s ease';
  });
  
  adminIcon.addEventListener('mouseleave', () => {
    adminIcon.querySelector('svg').style.transform = 'rotate(0deg)';
  });
  
  // Insertar ANTES del ícono de usuario (primer ícono)
  const firstIcon = iconsContainer.firstElementChild;
  if (firstIcon) {
    iconsContainer.insertBefore(adminIcon, firstIcon);
  } else {
    iconsContainer.appendChild(adminIcon);
  }
}

function getPanelUrl() {
  const path = window.location.pathname;
  
  if (path.includes('/html/admin/')) {
    // Ya estamos en el panel
    return 'panel.html';
  } else if (path.includes('/html/categorias/')) {
    // Estamos en /html/categorias/ - subir y entrar a admin
    return '../admin/panel.html';
  } else if (path.includes('/html/')) {
    // Estamos en /html/ directamente
    return 'admin/panel.html';
  } else {
    // Estamos en la raíz (index.html)
    return 'html/admin/panel.html';
  }
}

// Exportar función
if (typeof window !== 'undefined') {
  window.agregarIconoAdminNavbar = agregarIconoAdminNavbar;
}