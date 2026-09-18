<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Utils\Response;

class AuthController
{
    private $db;
    private userModel $userModel;

    public function __construct($db)
    {
        $this->db = $db;
        $this->userModel = new UserModel($db);
    }

    public function register(): void
    {
        
        $data = $this->getRequestData();

        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirm_password'] ?? '';
        $phone = trim($data['phone'] ?? '') ?: null;
        $ci = trim($data['ci'] ?? '');
        $roleId = (int)($data['role'] ?? 1);

        if ($name === '' || $email === '' || $password === '' || $confirmPassword === '') {
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
        
        $usuario = $this->userModel->existsByEmail($email);
        if ($usuario) {
            Response::json(false, 'Ese correo ya está registrado.', [], 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $creado = $this->userModel->create($name, $email, $hashedPassword, $phone, $roleId, $ci);
        if ($creado) {
            Response::json(true, 'Usuario registrado correctamente.');
        } else {
            Response::json(false, 'Ocurrió un error al registrar el usuario.', [], 500);
        }
    }

    public function login(): void
    {
        $data = $this->getRequestData();

        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if ($email === '' || $password === '') {
            Response::json(false, 'Todos los campos son obligatorios.', [], 400);
        }
        
        $user = $this->userModel->findByEmail($email);

        if (!$user || !password_verify($password, $user['password'])) {
            Response::json(false, 'Correo o contraseña incorrectos.', [], 401);
        }

        session_regenerate_id(true);

        $_SESSION['client_id'] = $user['id_client'];
        $_SESSION['credentials_id'] = $user['id_credentials'];
        $_SESSION['name'] = $user['name_client'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role_id'] = (int) $user['role_id'];

        Response::json(true, 'Inicio de sesión exitoso.');
    }

    public function me(): void
    {
        if (empty($_SESSION['client_id'])) {
            Response::json(false, 'No hay sesión activa.', ['logged_in' => false], 401);
        }

        Response::json(true, 'Sesión activa.', [
            'logged_in' => true,
            'client_id' => $_SESSION['client_id'],
            'name' => $_SESSION['name'] ?? null,
            'email' => $_SESSION['email'] ?? null,
            'role_id' => $_SESSION['role_id'] ?? null,
        ]);
    }

    public function logout(): void
    {
        $_SESSION = [];
        session_destroy();

        Response::json(true, 'Sesión cerrada.');
    }

    private function getRequestData(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (stripos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);

            return is_array($decoded) ? $decoded : [];
        }

        return $_POST;
    }
}
