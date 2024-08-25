<?php
// Incluir el archivo de conexión
include 'conexion.php';

// Obtener datos del formulario y sanitizarlos
$nombreUsuario = htmlspecialchars($_POST['nombreUsuario']);
$edad = (int)$_POST['edad'];
$correo = filter_var($_POST['correo'], FILTER_SANITIZE_EMAIL);
$contraseña = $_POST['contraseña'];
$confirmarContraseña = $_POST['confirmarContraseña'];

// Verificar que las contraseñas coincidan
if ($contraseña !== $confirmarContraseña) {
    echo "<script>alert('Las contraseñas no coinciden.'); window.history.back();</script>";
    exit();
}

// Encriptar la contraseña
$contraseñaEncriptada = password_hash($contraseña, PASSWORD_BCRYPT);

// Verificar si el correo ya está registrado
$sql = "SELECT * FROM usuarios WHERE correo = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $correo);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo "<script>alert('El correo ya está registrado.'); window.history.back();</script>";
    exit();
} else {
    // Insertar nuevo usuario
    $sql = "INSERT INTO usuarios (nombreUsuario, edad, correo, contraseña) VALUES (?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("siss", $nombreUsuario, $edad, $correo, $contraseñaEncriptada);

    if ($stmt->execute()) {
        echo "<script>alert('Registro exitoso'); window.location.href='registro.html';</script>";
    } else {
        echo "Error: " . $stmt->error;
    }
}

// Cerrar declaración y conexión
$stmt->close();
$conn->close();
?>

