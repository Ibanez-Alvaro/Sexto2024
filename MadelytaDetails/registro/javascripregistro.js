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

    if (contraseña !== confirmarContraseña) {
        alert('Las contraseñas no coinciden.');
        return false;
    }

    // Aquí puedes agregar la lógica para registrar al usuario
    alert('Registro exitoso');
    return true;
}
