<?php

namespace App\Controllers;

use App\Models\UserModel;
use App\Utils\Auth;
use App\Utils\Entrada;
use App\Utils\Imagenes;
use App\Utils\Response;

// Gestión de usuarios desde el panel de administración.
class UsuarioController
{
    private UserModel $usuarios;

    public function __construct($db)
    {
        $this->usuarios = new UserModel($db);
    }

    // GET /api/admin/usuarios[?role=all|socio|profesor|entrenador|admin][&bajas=1]
    // Listado de todos los usuarios para el panel de administración.
    public function listar(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);

        $rol = (string) ($_GET['role'] ?? 'all');
        $bajas = ($_GET['bajas'] ?? '') === '1';
        $usuarios = $this->usuarios->listarTodos($rol, $bajas);

        Response::json(true, 'Usuarios obtenidos.', [
            'usuarios' => $usuarios,
            'total' => count($usuarios),
        ]);
    }

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

        $data = Entrada::json();

        $name = Entrada::texto($data, 'name');
        $email = Entrada::texto($data, 'email');
        // Igual que en el registro: solo dígitos.
        $phone = Entrada::telefono($data, 'phone');
        $ci = Entrada::texto($data, 'ci');
        // La contraseña no se recorta: los espacios también cuentan.
        $password = Entrada::texto($data, 'password', false);

        if ($name === '' || $email === '' || $phone === '' || $ci === '') {
            Response::json(false, 'Nombre, C.I., teléfono y correo son obligatorios.', [], 400);
        }
        AuthController::validarDatosDeUsuario($name, $email, $phone, $ci);
        if ($password !== '') {
            AuthController::validarPassword($password);
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

        $plan = (int) Entrada::texto(Entrada::json(), 'membership');
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

        $ruta = Imagenes::rutaPfp((int) $id);
        if ($ruta === null) {
            Response::json(false, 'Sin foto.', [], 404);
        }

        Imagenes::enviar($ruta, 'image/jpeg');
    }

    // PUT /api/mi-foto { image: "data:image/...;base64,..." } → cambia la foto propia.
    public function cambiarMiFoto(): void
    {
        $id = Auth::exigirRol(Auth::ROL_ADMIN, Auth::ROL_ENTRENADOR, Auth::ROL_PROFESOR, Auth::ROL_SOCIO);

        try {
            $bytes = Imagenes::desdeDataUrl(Entrada::json()['image'] ?? null, Imagenes::MAX_BYTES_PFP);
            Imagenes::guardarPfp($id, $bytes);
        } catch (\InvalidArgumentException $e) {
            Response::json(false, $e->getMessage(), [], 400);
        } catch (\RuntimeException $e) {
            error_log('Foto de perfil: ' . $e->getMessage());
            Response::json(false, 'No se pudo guardar la foto.', [], 500);
        }

        Response::json(true, 'Foto actualizada.', ['id_client' => $id]);
    }
}
