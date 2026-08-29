<?php
include '../db_connection.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $email = $_POST["email"];
    $password = $_POST["password"];

    // Check if the username or email already exists
    $checkQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(["success" => false, "message" => "Username or email already exists."]);
        exit();
    }

    // Hash the password before storing it
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert the new user into the database
    $insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("sss", $username, $email, $hashedPassword);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "User registered successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Error: " . $stmt->error]);
    }

    $stmt->close();
}


?>