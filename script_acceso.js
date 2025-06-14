const accesoDropdown = document.getElementById('accesoDropdown');
  const flecha = document.getElementById('flechaAcceso');

  accesoDropdown.addEventListener('click', () => {
    accesoDropdown.classList.toggle('active');
  });

  // Opcional: cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!accesoDropdown.contains(e.target)) {
      accesoDropdown.classList.remove('active');
    }
  });