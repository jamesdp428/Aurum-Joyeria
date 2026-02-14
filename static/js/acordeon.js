// ========================================
// SISTEMA DE ACORDEONES
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🎵 Inicializando acordeones...');
  
  // Seleccionar todos los acordeones
  const acordeonItems = document.querySelectorAll('.acordeon-item');
  
  if (acordeonItems.length === 0) {
    console.warn('⚠️ No se encontraron acordeones en la página');
    return;
  }
  
  console.log(`✅ ${acordeonItems.length} acordeones encontrados`);
  
  // Agregar event listener a cada acordeón
  acordeonItems.forEach((item, index) => {
    const header = item.querySelector('.acordeon-header');
    const contenido = item.querySelector('.acordeon-contenido');
    
    if (!header || !contenido) {
      console.warn(`⚠️ Acordeón ${index + 1} incompleto`);
      return;
    }
    
    // Event listener para el click
    header.addEventListener('click', () => {
      console.log(`🎵 Toggle acordeón ${index + 1}`);
      toggleAcordeon(item);
    });
    
    // Event listener para accesibilidad (Enter/Space)
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleAcordeon(item);
      }
    });
    
    // Hacer el header focusable para accesibilidad
    header.setAttribute('tabindex', '0');
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
  });
  
  /**
   * Alterna el estado de un acordeón
   */
  function toggleAcordeon(item) {
    const header = item.querySelector('.acordeon-header');
    const isActive = item.classList.contains('active');
    
    // Opcional: Cerrar otros acordeones (comportamiento de acordeón exclusivo)
    // Descomenta las siguientes líneas si quieres que solo uno esté abierto a la vez
    /*
    acordeonItems.forEach(otherItem => {
      if (otherItem !== item && otherItem.classList.contains('active')) {
        otherItem.classList.remove('active');
        otherItem.querySelector('.acordeon-header').setAttribute('aria-expanded', 'false');
      }
    });
    */
    
    // Toggle del acordeón actual
    if (isActive) {
      // Cerrar
      item.classList.remove('active');
      header.setAttribute('aria-expanded', 'false');
      console.log('📕 Acordeón cerrado');
    } else {
      // Abrir
      item.classList.add('active');
      header.setAttribute('aria-expanded', 'true');
      console.log('📖 Acordeón abierto');
      
      // Scroll suave al acordeón recién abierto (opcional)
      setTimeout(() => {
        const headerTop = header.getBoundingClientRect().top + window.pageYOffset;
        const offset = 100; // Espacio desde el top
        
        window.scrollTo({
          top: headerTop - offset,
          behavior: 'smooth'
        });
      }, 100);
    }
  }
  
  /**
   * Función para abrir un acordeón específico (útil para deep linking)
   */
  window.abrirAcordeon = function(index) {
    if (index >= 0 && index < acordeonItems.length) {
      const item = acordeonItems[index];
      if (!item.classList.contains('active')) {
        toggleAcordeon(item);
      }
    }
  };
  
  /**
   * Función para abrir todos los acordeones
   */
  window.abrirTodosAcordeones = function() {
    acordeonItems.forEach(item => {
      if (!item.classList.contains('active')) {
        item.classList.add('active');
        item.querySelector('.acordeon-header').setAttribute('aria-expanded', 'true');
      }
    });
    console.log('📖 Todos los acordeones abiertos');
  };
  
  /**
   * Función para cerrar todos los acordeones
   */
  window.cerrarTodosAcordeones = function() {
    acordeonItems.forEach(item => {
      if (item.classList.contains('active')) {
        item.classList.remove('active');
        item.querySelector('.acordeon-header').setAttribute('aria-expanded', 'false');
      }
    });
    console.log('📕 Todos los acordeones cerrados');
  };
  
  console.log('✅ Sistema de acordeones inicializado');
  console.log('💡 Funciones disponibles: abrirAcordeon(index), abrirTodosAcordeones(), cerrarTodosAcordeones()');
});