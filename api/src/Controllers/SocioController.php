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
        // Solo el administrador (rol 1) puede ver el listado completo.
        if (empty($_SESSION['client_id']) || (int) ($_SESSION['role_id'] ?? 0) !== 1) {
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
