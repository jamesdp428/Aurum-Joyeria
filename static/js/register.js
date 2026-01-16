// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const targetId = this.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const eyeIcon = this.querySelector('.eye-icon');
    const eyeSlashIcon = this.querySelector('.eye-slash-icon');
    
    if (input.type === 'password') {
      input.type = 'text';
      eyeIcon.style.display = 'none';
      eyeSlashIcon.style.display = 'block';
    } else {
      input.type = 'password';
      eyeIcon.style.display = 'block';
      eyeSlashIcon.style.display = 'none';
    }
  });
  
  button.addEventListener('mousedown', function(e) {
    e.preventDefault();
  });
});

// Verificar si ya está logueado
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (user) {
    console.log('Usuario ya logueado, redirigiendo...');
    window.location.href = '/';
  }
});

// Manejar el formulario de registro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const nombre = document.getElementById('registerNombre').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
  const registerBtn = document.getElementById('registerBtn');
  
  // Validaciones
  if (!nombre || !email || !password || !passwordConfirm) {
    showMessage('Por favor completa todos los campos', 'error');
    return;
  }
  
  if (nombre.length < 2) {
    showMessage('El nombre debe tener al menos 2 caracteres', 'error');
    return;
  }
  
  if (password.length < 6) {
    showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  
  if (password !== passwordConfirm) {
    showMessage('Las contraseñas no coinciden', 'error');
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showMessage('Por favor ingresa un email válido', 'error');
    return;
  }
  
  registerBtn.disabled = true;
  registerBtn.textContent = 'Registrando...';
  
  try {
    console.log('📝 Iniciando registro para:', email);
    
    const response = await authAPI.register(email, nombre, password);
    
    console.log('✅ Registro exitoso:', response);
    
    showMessage('¡Cuenta creada! Por favor verifica tu email.', 'success');
    
    // Limpiar formulario
    document.getElementById('registerForm').reset();
    
    // Mostrar modal de verificación
    setTimeout(() => {
      mostrarModalVerificacion(email);
    }, 1500);
    
  } catch (error) {
    console.error('❌ Error en registro:', error);
    
    let errorMessage = 'Error al crear la cuenta';
    
    if (error.message.includes('email ya está registrado') || 
        error.message.includes('already exists') ||
        error.message.includes('ya está registrado')) {
      errorMessage = 'Este email ya está registrado. Por favor usa otro o inicia sesión.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showMessage(errorMessage, 'error');
    
    registerBtn.disabled = false;
    registerBtn.textContent = 'Registrarse';
  }
});

// Mostrar modal de verificación
function mostrarModalVerificacion(userEmail) {
  const modalHTML = `
    <div id="modalVerificacionRegistro" style="
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      justify-content: center;
      align-items: center;
      z-index: 10000;
    ">
      <div style="
        background: linear-gradient(145deg, #1e1e1e, #2a2a2a);
        border: 2px solid #f9dc5e;
        border-radius: 20px;
        padding: 40px;
        max-width: 500px;
        width: 90%;
      ">
        <h2 style="color: #f9dc5e; margin-bottom: 20px;">📧 Verifica tu email</h2>
        
        <p style="color: #ccc; margin-bottom: 20px;">
          Hemos enviado un código de verificación a:<br>
          <strong style="color: #f9dc5e;">${userEmail}</strong>
        </p>
        
        <div style="background: rgba(249, 220, 94, 0.1); border-left: 4px solid #f9dc5e; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 5px 0; color: #ccc;">
            <strong>Tienes 2 opciones:</strong>
          </p>
          <p style="margin: 5px 0; color: #aaa; font-size: 14px;">
            1️⃣ Haz clic en el botón del email<br>
            2️⃣ O pega el código aquí:
          </p>
        </div>
        
        <div id="verifyRegisterMessage" style="display: none; padding: 12px; border-radius: 8px; margin-bottom: 20px;"></div>
        
        <input 
          type="text" 
          id="codigoVerificacionRegistro" 
          placeholder="Pega el código aquí"
          style="
            width: 100%;
            padding: 12px;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 8px;
            color: white;
            margin-bottom: 20px;
            font-size: 16px;
            text-align: center;
          "
        >
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <button 
            id="btnVerificarRegistro"
            style="
              flex: 1;
              padding: 12px;
              background: linear-gradient(45deg, #f9dc5e, #ffd700);
              color: #000;
              border: none;
              border-radius: 8px;
              font-weight: 700;
              cursor: pointer;
            "
          >
            Verificar ahora
          </button>
          <button 
            id="btnReenviarRegistro"
            style="
              flex: 1;
              padding: 12px;
              background: transparent;
              color: #f9dc5e;
              border: 1px solid #f9dc5e;
              border-radius: 8px;
              cursor: pointer;
            "
          >
            Reenviar código
          </button>
        </div>
        
        <button 
          id="btnCerrarVerificacionRegistro"
          style="
            width: 100%;
            padding: 10px;
            background: #333;
            color: white;
            border: 1px solid #555;
            border-radius: 8px;
            cursor: pointer;
          "
        >
          Verificar más tarde
        </button>
        
        <p style="color: #888; font-size: 12px; margin-top: 15px; text-align: center;">
          Puedes verificar tu email en cualquier momento desde tu perfil
        </p>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Event listeners
  document.getElementById('btnVerificarRegistro').addEventListener('click', verificarEmailRegistro);
  document.getElementById('btnReenviarRegistro').addEventListener('click', reenviarCodigoRegistro);
  document.getElementById('btnCerrarVerificacionRegistro').addEventListener('click', cerrarModalRegistro);
  document.getElementById('codigoVerificacionRegistro').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') verificarEmailRegistro();
  });
}

// Verificar email desde registro
async function verificarEmailRegistro() {
  const codigo = document.getElementById('codigoVerificacionRegistro').value.trim();
  const btn = document.getElementById('btnVerificarRegistro');
  
  if (!codigo) {
    mostrarMensajeRegistro('Por favor ingresa el código', 'error');
    return;
  }
  
  btn.disabled = true;
  btn.textContent = 'Verificando...';
  
  try {
    await authAPI.verifyEmailWithCode(codigo);
    
    mostrarMensajeRegistro('✅ Email verificado exitosamente', 'success');
    
    setTimeout(() => {
      cerrarModalRegistro();
      window.location.href = '/';
    }, 2000);
    
  } catch (error) {
    console.error('Error verificando:', error);
    mostrarMensajeRegistro('Código inválido o expirado', 'error');
    btn.disabled = false;
    btn.textContent = 'Verificar ahora';
  }
}

// Reenviar código desde registro
async function reenviarCodigoRegistro() {
  const btn = document.getElementById('btnReenviarRegistro');
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = 'Enviando...';
  
  try {
    await authAPI.resendVerification();
    
    btn.style.background = '#4CAF50';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.textContent = '✓ Código enviado';
    
    setTimeout(() => {
      btn.style.background = 'transparent';
      btn.style.color = '#f9dc5e';
      btn.style.border = '1px solid #f9dc5e';
      btn.textContent = originalText;
      btn.disabled = false;
    }, 3000);
    
  } catch (error) {
    console.error('Error reenviando:', error);
    mostrarMensajeRegistro('Error al reenviar código', 'error');
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Cerrar modal de registro
function cerrarModalRegistro() {
  const modal = document.getElementById('modalVerificacionRegistro');
  if (modal) {
    modal.remove();
  }
  window.location.href = '/';
}

// Mostrar mensaje en modal de registro
function mostrarMensajeRegistro(text, type) {
  const messageBox = document.getElementById('verifyRegisterMessage');
  messageBox.textContent = text;
  messageBox.style.display = 'block';
  messageBox.style.background = type === 'success' ? '#4CAF50' : '#f44336';
  messageBox.style.color = 'white';
}

// Función para mostrar mensajes
function showMessage(text, type) {
  const messageBox = document.getElementById('registerMessage');
  messageBox.textContent = text;
  messageBox.className = `message-box ${type}`;
  messageBox.style.display = 'block';
  
  if (type !== 'success') {
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 5000);
  }
}

// Validación en tiempo real de contraseñas
document.getElementById('registerPasswordConfirm').addEventListener('input', (e) => {
  const password = document.getElementById('registerPassword').value;
  const passwordConfirm = e.target.value;
  
  if (passwordConfirm && password !== passwordConfirm) {
    e.target.style.borderColor = '#f44336';
  } else {
    e.target.style.borderColor = '#444';
  }
});