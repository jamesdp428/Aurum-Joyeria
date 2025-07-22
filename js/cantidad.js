function cambiarCantidad(cambio) {
  const input = document.getElementById('cantidad');
  let valor = parseInt(input.value);
  if (valor + cambio >= 1) {
    input.value = valor + cambio;
  }
}
