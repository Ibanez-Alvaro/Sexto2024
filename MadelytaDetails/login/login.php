<?php
// Mostrar errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Incluir el archivo de conexión
include '../conexion.php';

// Verificar si se enviaron los datos del formulario
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Obtener datos del formulario
    $usuario = $_POST['usuario'];
    $contraseña = $_POST['contraseña'];

    // Mostrar los datos obtenidos para depuración
    echo "<script>console.log('Usuario: " . $usuario . "');</script>";
    echo "<script>console.log('Contraseña: " . $contraseña . "');</script>";

    // Verificar si el usuario existe
    $sql = "SELECT * FROM usuarios WHERE nombreUsuario = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $usuario); // 's' indica que el parámetro es de tipo string (VARCHAR)

    // Mostrar la consulta SQL para depuración
    echo "<script>console.log('Consulta SQL: " . $sql . "');</script>";

    // Ejecutar la consulta
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // El usuario existe, verificar la contraseña
        $row = $result->fetch_assoc();
        if (password_verify($contraseña, $row['contraseña'])) {
            echo "<script>window.location.href='bienvenida.html';</script>";
        } else {
            echo "<script>alert('Contraseña incorrecta'); window.history.back();</script>";
        }
    } else {
        echo "<script>alert('El usuario no existe'); window.history.back();</script>";
    }

    // Cerrar la declaración y la conexión
    $stmt->close();
    $conn->close();
} else {
    echo "<script>alert('Método de solicitud no válido'); window.history.back();</script>";
}
?>
