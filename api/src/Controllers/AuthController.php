<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Utils\Response;

class AuthController
{
    private $db;
    private userModel $userModel;
    private const CARPETA_VISTAS = __DIR__ . '/../../../front/';

    private const DASHBOARDS = [
        1 => '/dash/admin',
        2 => '/dash/entrenador',
        3 => '/dash/profesor',
        4 => '/dash/socio',
    ];

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

        Response::json(true, 'Inicio de sesión exitoso.', [
            'role_id' => (int) $user['role_id'],
            'redirect' => self::DASHBOARDS[(int) $user['role_id']] ?? '/',
        ]);
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
            'dashboard' => self::DASHBOARDS[$_SESSION['role_id'] ?? 0] ?? null,
        ]);
    }

    public function logout(): void
    {
        $_SESSION = [];
        session_destroy();

        Response::json(true, 'Sesión cerrada.');
    }

        // GET /login → si ya hay sesión te manda a tu panel, si no muestra el formulario.
    public function paginaLogin(): void {
        $miPanel = $this->panelDeLaSesion();
        if ($miPanel !== null) {
            $this->redirigir($miPanel);
        }
        $this->enviarHtml('dist/paginas/login.html');
    }
    
    // GET /logout → cierra la sesión y vuelve al inicio.
    public function salir(): void {
        $_SESSION = [];
        session_destroy();
        $this->redirigir('/');
    }

    // GET /dash → te manda al panel que te corresponde.
    public function miPanel(): void {
        $this->redirigir($this->panelDeLaSesion() ?? '/login');
    }
    
    // Un método por panel: cada uno dice qué rol puede verlo y qué archivo mostrar.
    // La URL de cada uno está en routes.php.
    public function panelAdmin(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/admin.html'); }
    public function panelAdminRegistrar(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/adminregistrar.html'); }
    public function panelEntrenador(): void { $this->servirPanel(2, 'dist/paginas/roles/entrenador/entrenador.html'); }
    public function panelProfesor(): void { $this->servirPanel(3, 'dist/paginas/roles/profesor/profesor.html'); }
    public function panelSocio(): void { $this->servirPanel(4, 'dist/paginas/roles/usuario/usuario.html'); }
    
    public function landing(): void {
        $this->enviarHtml('index.html', [
            '{{nombre}}' => $_SESSION['name'] ?? '',
        ]); 
        }
    
    // El guardia: chequea sesión y rol; si todo está bien manda el HTML con el nombre ya puesto.
    private function servirPanel(int $rolPermitido, string $archivo): void {
    
        // Sin sesión → al login.
        if (empty($_SESSION['client_id'])) {
            $this->redirigir('/login');
        }

        // Con sesión pero no es su panel → al panel que sí le corresponde.
        if ((int) ($_SESSION['role_id'] ?? 0) !== $rolPermitido) {
            $this->redirigir($this->panelDeLaSesion() ?? '/');
        }
        
        $this->enviarHtml($archivo, [
            '{{nombre}}' => $_SESSION['name'] ?? '',
        ]);
    }

    // URL del panel del usuario logueado, o null si no hay sesión (o el rol no tiene panel).
    private function panelDeLaSesion(): ?string {
        if (empty($_SESSION['client_id'])) {
            return null;
        }
        return self::DASHBOARDS[(int) ($_SESSION['role_id'] ?? 0)] ?? null;
    }
    // Lee un HTML de front/dist/paginas, reemplaza las marcas {{...}} y lo envía.
    private function enviarHtml(string $archivo, array $reemplazos = []): void {
        $html = file_get_contents(self::CARPETA_VISTAS . $archivo);
        foreach ($reemplazos as $marca => $valor) {
            // htmlspecialchars: si alguien se llama "<script>", se muestra como texto y no se ejecuta.
            $html = str_replace($marca, htmlspecialchars($valor, ENT_QUOTES, 'UTF-8'), $html);
        }
        
        http_response_code(200);
        header('Content-Type: text/html; charset=UTF-8');
    
        // no-store: después de cerrar sesión, el botón "atrás" no puede mostrar el panel guardado.
        header('Cache-Control: no-store');
        echo $html;
        exit();
    }

    private function redirigir(string $url): void {
        header('Location: ' . $url, true, 302);
        exit();
    }

    private function getRequestData(): array {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (stripos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $decoded = json_decode($raw, true);

            return is_array($decoded) ? $decoded : [];
        }

        return $_POST;
    }
}
