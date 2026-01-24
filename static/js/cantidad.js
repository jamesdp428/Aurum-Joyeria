// ========================================
// CONTROL DE CANTIDAD - MEJORADO
// ========================================

/**
 * Cambia la cantidad del producto
 * @param {number} cambio - Valor a incrementar/decrementar (-1 o +1)
 */
function cambiarCantidad(cambio) {
  const input = document.getElementById('cantidad');
  
  if (!input) {
    console.warn('⚠️ Input de cantidad no encontrado');
    return;
  }
  
  // Verificar si el input está deshabilitado
  if (input.disabled) {
    console.log('ℹ️ Control de cantidad deshabilitado (sin stock)');
    return;
  }
  
  const valorActual = parseInt(input.value) || 1;
  const min = parseInt(input.min) || 1;
  const max = parseInt(input.max) || 10;
  
  const nuevoValor = valorActual + cambio;
  
  // Validar límite mínimo
  if (nuevoValor < min) {
    input.value = min;
    mostrarFeedback('Cantidad mínima alcanzada', 'info');
    animarBoton(input, 'shake');
    return;
  }
  
  // Validar límite máximo
  if (nuevoValor > max) {
    input.value = max;
    mostrarFeedback(`Solo hay ${max} unidades disponibles`, 'warning');
    animarBoton(input, 'shake');
    return;
  }
  
  // Actualizar valor
  input.value = nuevoValor;
  
  // Animar el input
  animarBoton(input, 'pulse');
  
  console.log('🔢 Cantidad actualizada:', nuevoValor);
}

/**
 * Muestra feedback visual al usuario
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje (info, warning, error)
 */
function mostrarFeedback(mensaje, tipo = 'info') {
  // Si ya existe una función de notificación global, usarla
  if (typeof mostrarNotificacion === 'function') {
    mostrarNotificacion(mensaje, tipo);
    return;
  }
  
  // Sino, usar console
  console.log(`${tipo.toUpperCase()}: ${mensaje}`);
}

/**
 * Anima un elemento con un efecto específico
 * @param {HTMLElement} elemento - Elemento a animar
 * @param {string} animacion - Tipo de animación
 */
function animarBoton(elemento, animacion = 'pulse') {
  elemento.classList.add(`animate-${animacion}`);
  
  setTimeout(() => {
    elemento.classList.remove(`animate-${animacion}`);
  }, 300);
}

// ========================================
// VALIDACIÓN EN TIEMPO REAL
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('cantidad');
  
  if (!input) {
    console.warn('⚠️ Input de cantidad no encontrado en la página');
    return;
  }
  
  console.log('✅ Control de cantidad inicializado');
  
  // ========== VALIDACIÓN AL ESCRIBIR ==========
  input.addEventListener('input', function() {
    let valor = parseInt(this.value);
    const min = parseInt(this.min) || 1;
    const max = parseInt(this.max) || 10;
    
    // Si no es un número válido, establecer el mínimo
    if (isNaN(valor) || valor < min) {
      this.value = min;
      return;
    }
    
    // Si excede el máximo, establecer el máximo
    if (valor > max) {
      this.value = max;
      mostrarFeedback(`Solo hay ${max} unidades disponibles`, 'warning');
      animarBoton(this, 'shake');
    }
  });
  
  // ========== VALIDACIÓN AL PERDER EL FOCO ==========
  input.addEventListener('blur', function() {
    let valor = parseInt(this.value);
    const min = parseInt(this.min) || 1;
    
    // Si el campo está vacío o es inválido, establecer el mínimo
    if (isNaN(valor) || valor < min) {
      this.value = min;
      animarBoton(this, 'pulse');
    }
  });
  
  // ========== PREVENIR CARACTERES NO NUMÉRICOS ==========
  input.addEventListener('keypress', function(e) {
    // Permitir solo números
    const charCode = e.which ? e.which : e.keyCode;
    
    // Prevenir: punto (46), coma (44), más (43), menos (45), e (101), E (69)
    if (charCode === 46 || charCode === 44 || charCode === 43 || 
        charCode === 45 || charCode === 101 || charCode === 69) {
      e.preventDefault();
      return false;
    }
    
    // Permitir solo dígitos (48-57)
    if (charCode < 48 || charCode > 57) {
      e.preventDefault();
      return false;
    }
  });
  
  // ========== PREVENIR PEGAR TEXTO NO NUMÉRICO ==========
  input.addEventListener('paste', function(e) {
    e.preventDefault();
    
    // Obtener el texto pegado
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    
    // Extraer solo números
    const numeros = pastedText.replace(/\D/g, '');
    
    if (numeros) {
      const valor = parseInt(numeros);
      const min = parseInt(this.min) || 1;
      const max = parseInt(this.max) || 10;
      
      // Establecer el valor dentro de los límites
      if (valor < min) {
        this.value = min;
      } else if (valor > max) {
        this.value = max;
        mostrarFeedback(`Solo hay ${max} unidades disponibles`, 'warning');
      } else {
        this.value = valor;
      }
    }
  });
  
  // ========== ATAJOS DE TECLADO ==========
  input.addEventListener('keydown', function(e) {
    const min = parseInt(this.min) || 1;
    const max = parseInt(this.max) || 10;
    let valorActual = parseInt(this.value) || min;
    
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        cambiarCantidad(1);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        cambiarCantidad(-1);
        break;
        
      case 'Home':
        e.preventDefault();
        this.value = min;
        animarBoton(this, 'pulse');
        break;
        
      case 'End':
        e.preventDefault();
        this.value = max;
        animarBoton(this, 'pulse');
        mostrarFeedback('Cantidad máxima', 'info');
        break;
    }
  });
  
  // ========== BOTONES DE CANTIDAD ==========
  const botones = document.querySelectorAll('.btn-cantidad');
  
  botones.forEach(boton => {
    // Efecto visual al hacer click
    boton.addEventListener('click', function() {
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
      }, 100);
    });
  });
});

// ========================================
// ESTILOS DE ANIMACIÓN
// ========================================

const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
  }
  
  @keyframes shake {
    0%, 100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }
  
  .animate-pulse {
    animation: pulse 0.3s ease;
  }
  
  .animate-shake {
    animation: shake 0.3s ease;
  }
  
  /* Estilos para el input cuando está deshabilitado */
  #cantidad:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(145deg, #1a1a1a, #0d0d0d);
  }
  
  /* Estilos para botones deshabilitados */
  .btn-cantidad:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: linear-gradient(45deg, #666, #888);
  }
`;

if (!document.querySelector('style[data-cantidad-styles]')) {
  style.setAttribute('data-cantidad-styles', 'true');
  document.head.appendChild(style);
}

// ========================================
// EXPORTAR FUNCIÓN GLOBAL
// ========================================

if (typeof window !== 'undefined') {
  window.cambiarCantidad = cambiarCantidad;
  
  console.log('✅ cantidad.js cargado correctamente');
}