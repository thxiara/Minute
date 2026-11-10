<?php

namespace App\Controllers;

use App\Models\ClienteModel;
use App\Utils\Auth;
use App\Utils\Response;

class SocioController
{
    private ClienteModel $clientes;

    public function __construct($db)
    {
        $this->clientes = new ClienteModel($db);
    }

    // GET /api/socios → listado de socios activos.
    // El admin lo usa para gestionarlos; el entrenador, para asignarles rutinas
    // (y en su caso cada socio trae la nota que él le dejó).
    public function listar(): void
    {
        $id = Auth::exigirRol(Auth::ROL_ADMIN, Auth::ROL_ENTRENADOR);
        $autor = (int) $_SESSION['role_id'] === Auth::ROL_ENTRENADOR ? $id : 0;

        // ?bajas=1 (solo admin) lista los socios dados de baja, para poder reactivarlos.
        $bajas = $autor === 0 && ($_GET['bajas'] ?? '') === '1';
        $socios = $this->clientes->listarSocios($autor, $bajas);
        if ($socios === false) {
            Response::json(false, 'No se pudieron obtener los socios.', [], 500);
        }

        Response::json(true, 'Socios obtenidos.', [
            'socios' => $socios,
            'total' => count($socios),
        ]);
    }

    // PUT /api/socios/:id/nota { note } → nota privada del entrenador sobre el socio.
    public function guardarNota(string $id): void
    {
        $entrenadorId = Auth::exigirRol(Auth::ROL_ENTRENADOR);
        $socioId = (int) $id;
        if (!$this->clientes->esSocio($socioId)) {
            Response::json(false, 'Socio no encontrado.', [], 404);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $nota = trim((string) (is_array($data) ? ($data['note'] ?? '') : ''));
        if (mb_strlen($nota) > 300) {
            Response::json(false, 'La nota puede tener hasta 300 caracteres.', [], 400);
        }

        if (!$this->clientes->guardarNota($entrenadorId, $socioId, $nota)) {
            Response::json(false, 'No se pudo guardar la nota.', [], 500);
        }
        Response::json(true, 'Nota guardada.', ['note' => $nota]);
    }

    // GET /api/profesores → profesores activos (para elegir quién da cada clase).
    public function profesores(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        Response::json(true, 'Profesores obtenidos.', [
            'profesores' => $this->clientes->listarPorRol(Auth::ROL_PROFESOR),
        ]);
    }
}
