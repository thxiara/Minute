<?php
$servername = "nombrequequiera_db";
$username = "usuario"; 
$password = "password"; 
$dbname = "fitpower_db"; 

// Crear la conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Comprobar la conexión
if ($conn->connect_error) {
    echo json_encode(["success" => false, "message" => "Error de conexión: " . $conn->connect_error]);
    exit();
}
?>