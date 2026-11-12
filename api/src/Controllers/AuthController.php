<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Utils\Entrada;
use App\Utils\Imagenes;
use App\Utils\I18n;
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
        // Solo el admin crea usuarios: si no, cualquiera podría registrarse como admin
        // y entrar a /dash/admin.
        \App\Utils\Auth::exigirRol(\App\Utils\Auth::ROL_ADMIN);

        $data = $this->getRequestData();

        $name = Entrada::texto($data, 'name');
        $email = Entrada::texto($data, 'email');
        // La contraseña no se recorta: los espacios también cuentan.
        $password = Entrada::texto($data, 'password', false);
        $confirmPassword = Entrada::texto($data, 'confirm_password', false);
        // Solo dígitos: "099 123 456" y "099-123-456" se guardan igual y conservan el 0 inicial.
        $phone = Entrada::telefono($data, 'phone');
        $ci = Entrada::texto($data, 'ci');
        $roleId = (int) Entrada::texto($data, 'role');
        if (!isset(self::DASHBOARDS[$roleId])) {
            Response::json(false, 'El tipo de usuario no es válido.', [], 400);
        }

        if ($name === '' || $email === '' || $password === '' || $confirmPassword === '' || $phone === '' || $ci === '') {
            Response::json(false, 'Todos los campos son obligatorios.', [], 400);
        }

        self::validarDatosDeUsuario($name, $email, $phone, $ci);

        if ($password !== $confirmPassword) {
            Response::json(false, 'Las contraseñas no coinciden.', [], 400);
        }
        self::validarPassword($password);

        $usuario = $this->userModel->existsByEmail($email);
        if ($usuario) {
            Response::json(false, 'Ese correo ya está registrado.', [], 409);
        }

        if ($this->userModel->existsByCi($ci)) {
            Response::json(false, 'Esa C.I ya está registrada.', [], 409);
        }

        if ($this->userModel->existsByPhone($phone)) {
            Response::json(false, 'Ese teléfono ya está registrado.', [], 409);
        }

        // Fecha de nacimiento (opcional): AAAA-MM-DD y no en el futuro.
        $birth = Entrada::texto($data, 'birth');
        if ($birth !== '') {
            $fecha = \DateTime::createFromFormat('!Y-m-d', $birth);
            if (!$fecha || $fecha->format('Y-m-d') !== $birth || $birth > date('Y-m-d')) {
                Response::json(false, 'La fecha de nacimiento no es válida.', [], 400);
            }
        }

        // Los socios arrancan con una membresía; el resto de los roles no tiene.
        $membershipId = null;
        if ($roleId === \App\Utils\Auth::ROL_SOCIO) {
            $membershipId = (int) Entrada::texto($data, 'membership');
            if (!$this->userModel->existeMembresia($membershipId)) {
                Response::json(false, 'Seleccioná el plan de membresía del socio.', [], 400);
            }
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $creado = $this->userModel->create($name, $email, $hashedPassword, $phone, $roleId, $ci,
            $birth !== '' ? $birth : null, $membershipId);
        if ($creado) {
            Response::json(true, 'Usuario registrado correctamente.');
        } else {
            Response::json(false, 'Ocurrió un error al registrar el usuario.', [], 500);
        }
    }

    public static function validarDatosDeUsuario(string $name, string $email, string $phone, string $ci): void
    {
        if (Entrada::largo($name) > Entrada::MAX_NOMBRE) {
            Response::json(false, 'El nombre puede tener hasta {max} caracteres.', [], 400, ['max' => Entrada::MAX_NOMBRE]);
        }
        if (Entrada::largo($ci) > Entrada::MAX_CI) {
            Response::json(false, 'La C.I. puede tener hasta {max} caracteres.', [], 400, ['max' => Entrada::MAX_CI]);
        }
        if (Entrada::largo($phone) > Entrada::MAX_TELEFONO) {
            Response::json(false, 'El teléfono puede tener hasta {max} dígitos.', [], 400, ['max' => Entrada::MAX_TELEFONO]);
        }
        if (Entrada::largo($email) > Entrada::MAX_EMAIL) {
            Response::json(false, 'El correo puede tener hasta {max} caracteres.', [], 400, ['max' => Entrada::MAX_EMAIL]);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(false, 'El correo electrónico no es válido.', [], 400);
        }
    }

    public static function validarPassword(string $password): void
    {
        if (Entrada::largo($password) < Entrada::MIN_PASSWORD) {
            Response::json(false, 'La contraseña debe tener al menos {min} caracteres.', [], 400, ['min' => Entrada::MIN_PASSWORD]);
        }
        if (Entrada::largo($password) > Entrada::MAX_PASSWORD) {
            Response::json(false, 'La contraseña puede tener hasta {max} caracteres.', [], 400, ['max' => Entrada::MAX_PASSWORD]);
        }
    }

    public function login(): void
    {
        $data = $this->getRequestData();

        $email = Entrada::texto($data, 'email');
        $password = Entrada::texto($data, 'password', false);

        if ($email === '' || $password === '') {
            Response::json(false, 'Todos los campos son obligatorios.', [], 400);
        }

        // Nadie pudo registrarse con algo más largo que los límites: ni se consulta la base.
        $muyLargo = Entrada::largo($email) > Entrada::MAX_EMAIL || Entrada::largo($password) > Entrada::MAX_PASSWORD;
        $user = $muyLargo ? null : $this->userModel->findByEmail($email);

        if (!$user || !password_verify($password, $user['password'])) {
            Response::json(false, 'Correo o contraseña incorrectos.', [], 401);
        }

        if (!$user['active_client']) {
            Response::json(false, 'Tu cuenta fue dada de baja. Consultá en recepción.', [], 403);
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
        $this->destruirSesion();

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
    
    // GET /resenas → página pública de reseñas. El formulario solo se muestra a socios.
    public function paginaResenas(): void {
        $esSocio = (int) ($_SESSION['role_id'] ?? 0) === \App\Utils\Auth::ROL_SOCIO && !empty($_SESSION['client_id']);
        $this->enviarHtml('dist/paginas/resenas.html', [
            '{{es_socio}}' => $esSocio ? '1' : '0',
        ]);
    }

    // GET /logout → cierra la sesión y vuelve al inicio.
    public function salir(): void {
        $this->destruirSesion();
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
    public function panelAdminClases(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/admin-clases.html'); }
    public function panelAdminProductos(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/admin-productos.html'); }
    public function panelAdminProducto(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/admin-producto.html'); }
    public function panelAdminPerfil(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/adminperfil.html'); }
    public function panelAdminResenas(): void { $this->servirPanel(1, 'dist/paginas/roles/admin/admin-resenas.html'); }
    public function panelEntrenador(): void { $this->servirPanel(2, 'dist/paginas/roles/entrenador/entrenador.html'); }
    public function panelEntrenadorEjercicios(): void { $this->servirPanel(2, 'dist/paginas/roles/entrenador/ejercicios.html'); }
    public function panelEntrenadorRutinas(): void { $this->servirPanel(2, 'dist/paginas/roles/entrenador/rutinas.html'); }
    public function panelProfesor(): void { $this->servirPanel(3, 'dist/paginas/roles/profesor/profesor.html'); }
    public function panelProfesorSeleccionarClase(): void { $this->servirPanel(3, 'dist/paginas/roles/profesor/seleccionar-clase.html'); }
    public function panelProfesorClases(): void { $this->servirPanel(3, 'dist/paginas/roles/profesor/clases.html'); }
    public function panelProfesorClase(): void { $this->servirPanel(3, 'dist/paginas/roles/profesor/clase.html'); }
    public function panelProfesorPerfil(): void { $this->servirPanel(3, 'dist/paginas/roles/profesor/perfi.html'); }
    public function panelSocio(): void { $this->servirPanel(4, 'dist/paginas/roles/usuario/usuario.html'); }
    
    public function landing(): void {
        $miPanel = $this->panelDeLaSesion();
        $nombre = $_SESSION['name'] ?? '';

        // Botón de acceso del header: con sesión lleva al panel, sin sesión al login.
        $this->enviarHtml('index.html', [
            '{{nombre}}' => $nombre,
            '{{foto_url}}' => $this->fotoDeLaSesion(),
            '{{acceso_url}}' => $miPanel !== null ? '/dash' : '/login',
            '{{acceso_texto}}' => I18n::t($miPanel !== null ? 'IR AL DASHBOARD' : 'INICIAR SESIÓN'),
            '{{acceso_titulo}}' => $miPanel !== null
                ? ($nombre !== '' ? I18n::t('Panel de {nombre}', ['nombre' => $nombre]) : I18n::t('Ir al dashboard'))
                : I18n::t('Iniciar sesión'),
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

    // El ?v=<fecha del archivo> hace que el navegador pida la foto nueva cuando cambia.
    private function fotoDeLaSesion(): string {
        $id = (int) ($_SESSION['client_id'] ?? 0);
        $ruta = $id > 0 ? Imagenes::rutaPfp($id) : null;
        return $ruta !== null
            ? '/api/usuarios/' . $id . '/foto?v=' . filemtime($ruta)
            : '/front/dist/assets/imagenes/img6.jpg';
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
        header('Content-Language: ' . I18n::idioma());
    
        // no-store: después de cerrar sesión, el botón "atrás" no puede mostrar el panel guardado.
        header('Cache-Control: no-store');
        echo $html;
        exit();
    }

    private function redirigir(string $url): void {
        header('Location: ' . $url, true, 302);
        exit();
    }

    // Cierra la sesión y borra la cookie del navegador.
    private function destruirSesion(): void {
        $_SESSION = [];

        if (ini_get('session.use_cookies')) {
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }

        session_destroy();
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
