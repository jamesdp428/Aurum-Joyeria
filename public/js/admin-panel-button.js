// ========== BOTÓN FLOTANTE PARA PANEL DE ADMINISTRACIÓN ==========

/**
 * Muestra un botón flotante para acceder al panel de admin
 * Solo visible para usuarios con rol 'admin'
 * Agregar este script a todas las páginas HTML
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  
  // Solo mostrar si es administrador
  if (!user || user.rol !== 'admin') {
    return;
  }
  
  mostrarBotonAdminPanel();
});

function mostrarBotonAdminPanel() {
  // Verificar si el botón ya existe
  if (document.getElementById('adminPanelButton')) {
    return;
  }
  
  // Crear el botón
  const button = document.createElement('a');
  button.id = 'adminPanelButton';
  button.href = getPanelUrl();
  button.title = 'Panel de Administración';
  button.setAttribute('aria-label', 'Ir al panel de administración');
  
  button.style.cssText = `
    position: fixed;
    bottom: 80px;
    right: 20px;
    width: 60px;
    height: 60px;
    background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
    border: 2px solid #f9dc5e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(249, 220, 94, 0.3);
    z-index: 9999;
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
  `;
  
  // Agregar ícono SVG de settings/gear
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#f9dc5e" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v6m0 6v6m5.5-13.5l-4.2 4.2m-2.6 2.6l-4.2 4.2m13.5-5.5l-4.2-4.2m-2.6 2.6l-4.2 4.2"/>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
    </svg>
  `;
  
  // Agregar badge con texto "ADMIN"
  const badge = document.createElement('div');
  badge.style.cssText = `
    position: absolute;
    top: -8px;
    right: -8px;
    background: linear-gradient(45deg, #f9dc5e, #ffd700);
    color: #000;
    font-size: 9px;
    font-weight: 700;
    padding: 3px 6px;
    border-radius: 10px;
    border: 2px solid #1e1e1e;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  badge.textContent = 'ADMIN';
  button.appendChild(badge);
  
  // Efectos hover
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1) rotate(90deg)';
    button.style.boxShadow = '0 6px 20px rgba(249, 220, 94, 0.5)';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1) rotate(0deg)';
    button.style.boxShadow = '0 4px 15px rgba(249, 220, 94, 0.3)';
  });
  
  // Agregar al body
  document.body.appendChild(button);
}

function getPanelUrl() {
  // Detectar la ruta actual para calcular la ruta relativa al panel
  const path = window.location.pathname;
  
  if (path.includes('/html/admin/')) {
    // Ya estamos en el panel (dentro de /html/admin/)
    return 'panel.html';
  } else if (path.includes('/html/categorias/')) {
    // Estamos en /html/categorias/ - necesitamos subir y entrar a admin
    return '../admin/panel.html';
  } else if (path.includes('/html/')) {
    // Estamos en /html/ directamente (perfil, carrito, etc)
    return 'admin/panel.html';
  } else {
    // Estamos en la raíz (index.html)
    return 'html/admin/panel.html';
  }
}

// Exportar función
if (typeof window !== 'undefined') {
  window.mostrarBotonAdminPanel = mostrarBotonAdminPanel;
}