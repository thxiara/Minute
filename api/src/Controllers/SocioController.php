<?php

namespace App\Controllers;

use App\Models\ClienteModel;
use App\Utils\Response;

class SocioController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // GET /api/socios → listado de socios para el panel de administración.
    public function listar(): void
    {
        // El administrador (rol 1) y el entrenador (rol 2) pueden ver el listado.
        // El entrenador lo necesita para asignarle rutinas a cada socio.
        if (empty($_SESSION['client_id']) || !in_array((int) ($_SESSION['role_id'] ?? 0), [1, 2], true)) {
            Response::json(false, 'No autorizado.', [], 403);
        }

        $clienteModel = new ClienteModel($this->db);
        $socios = $clienteModel->listarSocios();

        if ($socios === false) {
            Response::json(false, 'No se pudieron obtener los socios.', [], 500);
        }

        Response::json(true, 'Socios obtenidos.', [
            'socios' => $socios,
            'total' => count($socios),
        ]);
    }
}
