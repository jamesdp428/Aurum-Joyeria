// ========== CONTROL DE CANTIDAD ==========

function cambiarCantidad(cambio) {
  const input = document.getElementById('cantidad');
  
  if (!input) return;
  
  const valorActual = parseInt(input.value) || 1;
  const min = parseInt(input.min) || 1;
  const max = parseInt(input.max) || 10;
  
  const nuevoValor = valorActual + cambio;
  
  // Validar límites
  if (nuevoValor < min) {
    input.value = min;
    return;
  }
  
  if (nuevoValor > max) {
    alert(`Solo hay ${max} unidades disponibles`);
    input.value = max;
    return;
  }
  
  input.value = nuevoValor;
}

// Validación del input manual
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('cantidad');
  
  if (input) {
    input.addEventListener('input', function() {
      const valor = parseInt(this.value);
      const min = parseInt(this.min) || 1;
      const max = parseInt(this.max) || 10;
      
      if (isNaN(valor) || valor < min) {
        this.value = min;
      } else if (valor > max) {
        this.value = max;
        alert(`Solo hay ${max} unidades disponibles`);
      }
    });
    
    // Evitar valores negativos
    input.addEventListener('keypress', function(e) {
      if (e.key === '-' || e.key === '+' || e.key === 'e') {
        e.preventDefault();
      }
    });
  }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.cambiarCantidad = cambiarCantidad;
}