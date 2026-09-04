<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Utils\Response;


class AuthController
{
    private UserModel $userModel;

    public function __construct(\mysqli $conn)
    {
        $this->userModel = new UserModel($conn);
    }

    public function register(array $data): void
    {
        $username = trim($data['username'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';

        if ($username === '' || $email === '' || $password === '' || $confirmPassword === '') {
            Response::json(false, 'Todos los campos son obligatorios.', [], 400);
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(false, 'El correo electrónico no es válido.', [], 400);
        }

        if ($password !== $confirmPassword) {
            Response::json(false, 'Las contraseñas no coinciden.', [], 400);
        }

        if (strlen($password) < 8) {
            Response::json(false, 'La contraseña debe tener al menos 8 caracteres.', [], 400);
        }

        if ($this->userModel->existsByUsernameOrEmail($username, $email)) {
            Response::json(false, 'El usuario o el correo ya existen.', [], 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        if ($this->userModel->create($username, $email, $hashedPassword)) {
            Response::json(true, 'Usuario registrado correctamente.');
        } else {
            Response::json(false, 'Ocurrió un error al registrar el usuario.', [], 500);
        }
    }

    public function login(array $data): void
    {
        $identifier = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        if ($identifier === '' || $password === '') {
            Response::json(false, 'Todos los campos son obligatorios.', [], 400);
        }

        $user = $this->userModel->findByUsernameOrEmail($identifier);

        if (!$user || !password_verify($password, $user['password'])) {
            Response::json(false, 'Usuario o contraseña incorrectos.', [], 401);
        }

        session_regenerate_id(true);

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['email'] = $user['email'];

        Response::json(true, 'Inicio de sesión exitoso.');
    }
}
