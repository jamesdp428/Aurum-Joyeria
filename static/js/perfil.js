// Verificar autenticación
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  cargarPerfil();
  configurarEventos();
});

// 🔥 CORREGIDO: Cargar información del perfil SIEMPRE desde la API
async function cargarPerfil() {
  try {
    // ✅ SIEMPRE obtener datos actualizados desde el servidor
    const perfil = await authAPI.getProfile();
    
    console.log('✅ Perfil cargado desde servidor:', perfil);
    
    // Mostrar información
    document.getElementById('perfilNombre').textContent = perfil.nombre;
    document.getElementById('perfilEmail').textContent = perfil.email;
    document.getElementById('perfilRol').textContent = perfil.rol === 'admin' ? 'Administrador' : 'Usuario';
    document.getElementById('perfilFecha').textContent = new Date(perfil.created_at).toLocaleDateString('es-CO');
    
    // Mostrar estado de verificación
    const verificadoSpan = document.getElementById('perfilVerificado');
    if (verificadoSpan) {
      verificadoSpan.textContent = perfil.email_verified ? '✅ Verificado' : '⚠️ No verificado';
      verificadoSpan.style.color = perfil.email_verified ? '#4CAF50' : '#ff9800';
    }
    
    // Mostrar/ocultar sección de verificación
    const seccionVerificacion = document.getElementById('seccionVerificacion');
    if (seccionVerificacion) {
      seccionVerificacion.style.display = perfil.email_verified ? 'none' : 'block';
    }
    
    // Prellenar formulario de edición
    document.getElementById('editNombre').value = perfil.nombre;
    document.getElementById('editEmail').value = perfil.email;
    
    // 🔥 IMPORTANTE: Actualizar localStorage con datos frescos del servidor
    const updatedUser = {
      id: perfil.id,
      email: perfil.email,
      nombre: perfil.nombre,
      rol: perfil.rol,
      email_verified: perfil.email_verified
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('✅ LocalStorage actualizado con datos del servidor');
    
  } catch (error) {
    console.error('❌ Error cargando perfil:', error);
    showMessage('profileMessage', 'Error al cargar el perfil: ' + error.message, 'error');
    
    // Si falla la API, intentar logout y redirigir a login
    if (error.message.includes('401') || error.message.includes('autenticado')) {
      setTimeout(() => {
        logout();
      }, 2000);
    }
  }
}

// Configurar eventos
function configurarEventos() {
  // Botón logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
    }
  });
  
  // Botón eliminar cuenta
  document.getElementById('btnEliminarCuenta').addEventListener('click', eliminarCuenta);
  
  // Mostrar formulario de edición
  document.getElementById('btnEditarPerfil').addEventListener('click', () => {
    document.querySelector('.registro-formulario:first-of-type').style.display = 'none';
    document.getElementById('formEditarPerfil').style.display = 'block';
  });
  
  // Cancelar edición
  document.getElementById('btnCancelar').addEventListener('click', () => {
    document.getElementById('formEditarPerfil').style.display = 'none';
    document.querySelector('.registro-formulario:first-of-type').style.display = 'block';
  });
  
  // Toggle campos de contraseña
  document.getElementById('cambiarPassword').addEventListener('change', (e) => {
    const passwordFields = document.getElementById('passwordFields');
    passwordFields.style.display = e.target.checked ? 'block' : 'none';
    
    ['editPasswordActual', 'editPasswordNueva', 'editPasswordConfirm'].forEach(id => {
      const input = document.getElementById(id);
      input.required = e.target.checked;
    });
  });
  
  // Verificar código desde perfil
  document.getElementById('btnVerificarCodigo')?.addEventListener('click', verificarCodigoPerfil);
  document.getElementById('codigoVerificacionPerfil')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verificarCodigoPerfil();
  });
  
  // Reenviar código desde perfil
  document.getElementById('btnReenviarCodigoPerfil')?.addEventListener('click', reenviarVerificacion);
  
  // Submit formulario
  document.getElementById('formEditarPerfil').addEventListener('submit', actualizarPerfil);
}

// Verificar código desde el perfil
async function verificarCodigoPerfil() {
  const codigo = document.getElementById('codigoVerificacionPerfil').value.trim();
  const btn = document.getElementById('btnVerificarCodigo');
  
  if (!codigo) {
    showMessage('profileMessage', 'Por favor ingresa el código', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  
  try {
    await authAPI.verifyEmailWithCode(codigo);
    
    showMessage('profileMessage', '✅ Email verificado exitosamente', 'success');
    
    setTimeout(() => {
      location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('Error verificando código:', error);
    showMessage('profileMessage', 'Código inválido o expirado: ' + error.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Verificar';
  }
}

// Reenviar código de verificación
async function reenviarVerificacion() {
  const btn = document.getElementById('btnReenviarCodigoPerfil');
  
  btn.disabled = true;
  btn.textContent = 'Reenviando...';
  
  try {
    await authAPI.resendVerification();
    showMessage('profileMessage', '✅ Código de verificación reenviado a tu email', 'success');
    
    setTimeout(() => {
      document.getElementById('profileMessage').style.display = 'none';
    }, 5000);
    
  } catch (error) {
    console.error('Error reenviando verificación:', error);
    showMessage('profileMessage', 'Error al reenviar el código: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reenviar código';
  }
}

// Eliminar cuenta
async function eliminarCuenta() {
  const confirmacion = confirm(
    '⚠️ ¿Estás COMPLETAMENTE SEGURO de eliminar tu cuenta?\n\n' +
    'Esta acción es IRREVERSIBLE y se eliminarán:\n' +
    '• Todos tus datos personales\n' +
    '• Tu historial de pedidos\n' +
    '• Toda tu información de la cuenta\n\n' +
    'Escribe "ELIMINAR" para confirmar'
  );
  
  if (!confirmacion) return;
  
  const confirmText = prompt('Por favor escribe "ELIMINAR" en mayúsculas para confirmar:');
  
  if (confirmText !== 'ELIMINAR') {
    alert('Cancelado. Tu cuenta no ha sido eliminada.');
    return;
  }
  
  try {
    await authAPI.deleteAccount();
    
    alert('Tu cuenta ha sido eliminada exitosamente.');
    logout();
    
  } catch (error) {
    console.error('Error eliminando cuenta:', error);
    alert('Error al eliminar la cuenta: ' + error.message);
  }
}

// 🔥 CORREGIDO: Actualizar perfil con recarga desde servidor
async function actualizarPerfil(e) {
  e.preventDefault();
  
  const nombre = document.getElementById('editNombre').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const cambiarPass = document.getElementById('cambiarPassword').checked;
  const btnGuardar = document.getElementById('btnGuardar');
  
  const currentUser = getCurrentUser();
  const emailCambiado = email !== currentUser.email;
  
  // Validaciones
  if (!nombre || !email) {
    showMessage('editMessage', 'Por favor completa todos los campos', 'error');
    return;
  }
  
  if (cambiarPass) {
    const passActual = document.getElementById('editPasswordActual').value;
    const passNueva = document.getElementById('editPasswordNueva').value;
    const passConfirm = document.getElementById('editPasswordConfirm').value;
    
    if (!passActual || !passNueva || !passConfirm) {
      showMessage('editMessage', 'Completa todos los campos de contraseña', 'error');
      return;
    }
    
    if (passNueva.length < 6) {
      showMessage('editMessage', 'La nueva contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    
    if (passNueva !== passConfirm) {
      showMessage('editMessage', 'Las contraseñas no coinciden', 'error');
      return;
    }
  }
  
  btnGuardar.disabled = true;
  btnGuardar.textContent = 'Guardando...';
  
  try {
    // Actualizar nombre
    if (nombre !== currentUser.nombre) {
      await authAPI.updateProfile({ nombre });
      showMessage('editMessage', '✅ Nombre actualizado', 'success');
    }
    
    // Cambiar contraseña si se solicitó
    if (cambiarPass) {
      const passActual = document.getElementById('editPasswordActual').value;
      const passNueva = document.getElementById('editPasswordNueva').value;
      
      await authAPI.changePassword(passActual, passNueva);
      showMessage('editMessage', '✅ Contraseña actualizada', 'success');
      
      document.getElementById('editPasswordActual').value = '';
      document.getElementById('editPasswordNueva').value = '';
      document.getElementById('editPasswordConfirm').value = '';
      document.getElementById('cambiarPassword').checked = false;
      document.getElementById('passwordFields').style.display = 'none';
    }
    
    // Cambiar email si se modificó
    if (emailCambiado) {
      await authAPI.requestEmailChange(email);
      showMessage('editMessage', '✅ Se ha enviado un código de verificación a tu nuevo email. Por favor revisa tu bandeja de entrada y pégalo en la sección de verificación.', 'success');
      
      setTimeout(() => {
        document.getElementById('formEditarPerfil').style.display = 'none';
        document.querySelector('.registro-formulario:first-of-type').style.display = 'block';
        // 🔥 Recargar perfil desde servidor
        cargarPerfil();
      }, 3000);
    } else {
      setTimeout(() => {
        document.getElementById('formEditarPerfil').style.display = 'none';
        document.querySelector('.registro-formulario:first-of-type').style.display = 'block';
        // 🔥 Recargar perfil desde servidor
        cargarPerfil();
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    showMessage('editMessage', 'Error: ' + error.message, 'error');
  } finally {
    btnGuardar.disabled = false;
    btnGuardar.textContent = 'Guardar Cambios';
  }
}

// Función para mostrar mensajes
function showMessage(elementId, text, type) {
  const messageBox = document.getElementById(elementId);
  messageBox.textContent = text;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = 'block';
  
  if (type !== 'success') {
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 5000);
  }
}