<?php

namespace App\Models;

class UserModel
{
    private \mysqli $conn;

    public function __construct(\mysqli $conn)
    {
        $this->conn = $conn;
    }

    public function existsByUsernameOrEmail(string $username, string $email): bool
    {
        $query = "SELECT id FROM users WHERE username = ? OR email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ss", $username, $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $exists = $result->num_rows > 0;
        $stmt->close();

        return $exists;
    }

    public function create(string $username, string $email, string $hashedPassword): bool
    {
        $query = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("sss", $username, $email, $hashedPassword);
        $success = $stmt->execute();
        $stmt->close();

        return $success;
    }

    public function findByUsernameOrEmail(string $identifier): ?array
    {
        $query = "SELECT id, username, email, password FROM users WHERE username = ? OR email = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->bind_param("ss", $identifier, $identifier);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        $stmt->close();

        return $user ?: null;
    }
}
