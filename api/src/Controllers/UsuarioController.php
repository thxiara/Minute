<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Utils\Auth;
use App\Utils\Response;

// Gestión de usuarios desde el panel de administración.
class UsuarioController
{
    private UserModel $usuarios;

    public function __construct($db)
    {
        $this->usuarios = new UserModel($db);
    }

    // GET /api/usuarios/:id → datos de un usuario.
    public function ver(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);

        $usuario = $this->usuarios->findById((int) $id);
        if (!$usuario) {
            Response::json(false, 'Usuario no encontrado.', [], 404);
        }

        Response::json(true, 'Usuario obtenido.', ['usuario' => $usuario]);
    }

    // PUT /api/usuarios/:id → edita nombre, C.I., teléfono, correo y (opcional) contraseña.
    public function actualizar(string $id): void
    {
        $adminId = Auth::exigirRol(Auth::ROL_ADMIN);
        $usuarioId = (int) $id;

        if (!$this->usuarios->findById($usuarioId)) {
            Response::json(false, 'Usuario no encontrado.', [], 404);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $data = is_array($data) ? $data : [];

        $name = trim((string) ($data['name'] ?? ''));
        $email = trim((string) ($data['email'] ?? ''));
        // Igual que en el registro: solo dígitos.
        $phone = preg_replace('/\D+/', '', (string) ($data['phone'] ?? ''));
        $ci = trim((string) ($data['ci'] ?? ''));
        $password = (string) ($data['password'] ?? '');

        if ($name === '' || $email === '' || $phone === '' || $ci === '') {
            Response::json(false, 'Nombre, C.I., teléfono y correo son obligatorios.', [], 400);
        }
        if (mb_strlen($name) > 50) {
            Response::json(false, 'El nombre puede tener hasta 50 caracteres.', [], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::json(false, 'El correo electrónico no es válido.', [], 400);
        }
        if ($password !== '' && strlen($password) < 8) {
            Response::json(false, 'La contraseña debe tener al menos 8 caracteres.', [], 400);
        }

        if ($this->usuarios->datoEnUsoPorOtro('email', $email, $usuarioId)) {
            Response::json(false, 'Ese correo ya está registrado.', [], 409);
        }
        if ($this->usuarios->datoEnUsoPorOtro('ci', $ci, $usuarioId)) {
            Response::json(false, 'Esa C.I ya está registrada.', [], 409);
        }
        if ($this->usuarios->datoEnUsoPorOtro('phone', $phone, $usuarioId)) {
            Response::json(false, 'Ese teléfono ya está registrado.', [], 409);
        }

        $hash = $password !== '' ? password_hash($password, PASSWORD_DEFAULT) : null;
        if (!$this->usuarios->update($usuarioId, $name, $email, $phone, $ci, $hash)) {
            Response::json(false, 'No se pudo actualizar el usuario.', [], 500);
        }

        // Si el admin se editó a sí mismo, el header tiene que mostrar el nombre nuevo.
        if ($usuarioId === $adminId) {
            $_SESSION['name'] = $name;
            $_SESSION['email'] = $email;
        }

        Response::json(true, 'Usuario actualizado.', ['usuario' => $this->usuarios->findById($usuarioId)]);
    }

    // DELETE /api/usuarios/:id → da de baja (no borra: el historial queda y se puede reactivar).
    public function baja(string $id): void
    {
        $adminId = Auth::exigirRol(Auth::ROL_ADMIN);
        $usuarioId = (int) $id;

        if ($usuarioId === $adminId) {
            Response::json(false, 'No podés darte de baja a vos mismo.', [], 400);
        }
        if (!$this->usuarios->findById($usuarioId)) {
            Response::json(false, 'Usuario no encontrado.', [], 404);
        }
        if (!$this->usuarios->setActivo($usuarioId, false)) {
            Response::json(false, 'No se pudo dar de baja al usuario.', [], 500);
        }

        Response::json(true, 'Usuario dado de baja.');
    }

    // POST /api/usuarios/:id/reactivar
    public function reactivar(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $usuarioId = (int) $id;

        if (!$this->usuarios->findById($usuarioId)) {
            Response::json(false, 'Usuario no encontrado.', [], 404);
        }
        $this->usuarios->setActivo($usuarioId, true);

        Response::json(true, 'Usuario reactivado.', ['usuario' => $this->usuarios->findById($usuarioId)]);
    }

    // GET /api/membresias → planes disponibles.
    public function membresias(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        Response::json(true, 'Membresías obtenidas.', ['membresias' => $this->usuarios->listarMembresias()]);
    }

    // POST /api/usuarios/:id/membresia { membership } → renueva la membresía del socio.
    public function renovarMembresia(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $usuarioId = (int) $id;

        $usuario = $this->usuarios->findById($usuarioId);
        if (!$usuario || $usuario['role_id'] !== Auth::ROL_SOCIO) {
            Response::json(false, 'Socio no encontrado.', [], 404);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $plan = (int) (is_array($data) ? ($data['membership'] ?? 0) : 0);
        if (!$this->usuarios->existeMembresia($plan)) {
            Response::json(false, 'Seleccioná un plan válido.', [], 400);
        }
        if (!$this->usuarios->renovarMembresia($usuarioId, $plan)) {
            Response::json(false, 'No se pudo renovar la membresía.', [], 500);
        }

        Response::json(true, 'Membresía renovada.', ['usuario' => $this->usuarios->findById($usuarioId)]);
    }

    // GET /api/mi-perfil → datos del usuario logueado (cualquier rol).
    public function miPerfil(): void
    {
        $id = Auth::exigirRol(Auth::ROL_ADMIN, Auth::ROL_ENTRENADOR, Auth::ROL_PROFESOR, Auth::ROL_SOCIO);
        Response::json(true, 'Perfil obtenido.', ['usuario' => $this->usuarios->findById($id)]);
    }

    // GET /api/usuarios/:id/foto → la imagen (o 404 si no tiene). Cualquier usuario logueado.
    public function foto(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN, Auth::ROL_ENTRENADOR, Auth::ROL_PROFESOR, Auth::ROL_SOCIO);

        $foto = $this->usuarios->foto((int) $id);
        if (!$foto) {
            Response::json(false, 'Sin foto.', [], 404);
        }

        [$bytes, $tipo] = $foto;
        http_response_code(200);
        header('Content-Type: ' . $tipo);
        header('Cache-Control: private, no-cache');
        header('X-Content-Type-Options: nosniff');
        echo $bytes;
        exit();
    }

    // PUT /api/mi-foto { image: "data:image/jpeg;base64,..." } → cambia la foto propia.
    public function cambiarMiFoto(): void
    {
        $id = Auth::exigirRol(Auth::ROL_ADMIN, Auth::ROL_ENTRENADOR, Auth::ROL_PROFESOR, Auth::ROL_SOCIO);

        $data = json_decode(file_get_contents('php://input'), true);
        $imagen = is_array($data) ? (string) ($data['image'] ?? '') : '';

        if (!preg_match('#^data:image/(jpeg|png|webp);base64,(.+)$#', $imagen, $partes)) {
            Response::json(false, 'La foto tiene que ser una imagen JPG, PNG o WEBP.', [], 400);
        }
        $bytes = base64_decode($partes[2], true);
        if ($bytes === false || strlen($bytes) > 1024 * 1024) {
            Response::json(false, 'La foto no puede pesar más de 1 MB.', [], 400);
        }

        // Se confirma que de verdad sea una imagen (no basta con lo que dice el texto).
        $info = @getimagesizefromstring($bytes);
        $permitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (!$info || !in_array($info['mime'], $permitidos, true)) {
            Response::json(false, 'El archivo no es una imagen válida.', [], 400);
        }

        if (!$this->usuarios->guardarFoto($id, $bytes, $info['mime'])) {
            Response::json(false, 'No se pudo guardar la foto.', [], 500);
        }

        Response::json(true, 'Foto actualizada.');
    }
}
