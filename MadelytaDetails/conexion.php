<?php
// Conexión a la base de datos
$servername = "localhost"; // Cambia esto si tu servidor es diferente
$username = "u108684593_paco"; // Tu usuario de MySQL
$password = "Madelytapaco2020"; // Tu contraseña de MySQL
$dbname = "u108684593_madelyta"; // El nombre de tu base de datos

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Conexión fallida: " . $conn->connect_error);
}
?>
