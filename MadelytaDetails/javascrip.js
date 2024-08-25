function registrar() {
    const nombreUsuario = document.getElementById('nombreUsuario').value;
    const edad = document.getElementById('edad').value;
    const correo = document.getElementById('correo').value;
    const contraseña = document.getElementById('contraseña').value;
    const confirmarContraseña = document.getElementById('confirmarContraseña').value;

    if (!nombreUsuario || !edad || !correo || !contraseña || !confirmarContraseña) {
        alert('Por favor, completa todos los campos.');
        return false;
    }

    if (isNaN(edad) || edad <= 0) {
        alert('Por favor, ingresa una edad válida.');
        return false;
    }

    if (contraseña !== confirmarContraseña) {
        alert('Las contraseñas no coinciden.');
        return false;
    }

    // Verificar formato de correo
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(correo)) {
        alert('Por favor, ingresa un correo electrónico válido.');
        return false;
    }

    alert('Registro exitoso');
    return true;
}

document.getElementById('botonRegistrar').addEventListener('click', function(event) {
    if (!registrar()) {
        event.preventDefault();
    }
});


