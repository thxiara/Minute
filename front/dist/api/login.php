<?php
header('Content-Type: application/json; charset=utf-8');
session_start();
include 'db_connection.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $identifier = $_POST["username"];
    $password = $_POST["password"];

    $query = "SELECT id, username, email, password FROM users WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("ss", $identifier, $identifier);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos."]);
        exit();
    }

    $user = $result->fetch_assoc();

    if (!password_verify($password, $user["password"])) {
        echo json_encode(["success" => false, "message" => "Usuario o contraseña incorrectos."]);
        exit();
    }

    $_SESSION["user_id"] = $user["id"];
    $_SESSION["username"] = $user["username"];
    $_SESSION["email"] = $user["email"];

    echo json_encode(["success" => true, "message" => "Inicio de sesión exitoso."]);

    $stmt->close();
    $conn->close();
}
?>