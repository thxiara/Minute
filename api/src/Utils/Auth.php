<?php

namespace App\Utils;

// Chequeos de sesión para los endpoints de la API.
class Auth
{
    public const ROL_ADMIN = 1;
    public const ROL_ENTRENADOR = 2;
    public const ROL_PROFESOR = 3;
    public const ROL_SOCIO = 4;

    // Corta con 401 si no hay sesión, o con 403 si el rol no está entre los permitidos.
    // Devuelve el id del usuario logueado.
    public static function exigirRol(int ...$roles): int
    {
        if (empty($_SESSION['client_id'])) {
            Response::json(false, 'Tenés que iniciar sesión.', [], 401);
        }
        if (!in_array((int) ($_SESSION['role_id'] ?? 0), $roles, true)) {
            Response::json(false, 'No autorizado.', [], 403);
        }

        return (int) $_SESSION['client_id'];
    }
}
