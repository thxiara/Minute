<?php

namespace App\Controllers;

use App\Models\ClienteModel;
use App\Models\EjercicioModel;
use App\Models\RutinaModel;
use App\Utils\Response;

class RutinaController
{
    private const ROL_ENTRENADOR = 2;
    private const ROL_SOCIO = 4;

    // Los mismos grupos que muestra el formulario de ejercicios.
    private const GRUPOS_MUSCULARES = ['Piernas', 'Pecho', 'Espalda', 'Hombros', 'Core'];

    private $db;
    private EjercicioModel $ejercicios;
    private RutinaModel $rutinas;

    public function __construct($db)
    {
        $this->db = $db;
        $this->ejercicios = new EjercicioModel($db);
        $this->rutinas = new RutinaModel($db);
    }

    // =====================================================================
    //  EJERCICIOS (entrenador)
    // =====================================================================

    // GET /api/ejercicios
    public function listarEjercicios(): void
    {
        $this->exigirRol(self::ROL_ENTRENADOR);

        Response::json(true, 'Ejercicios obtenidos.', [
            'grupos' => self::GRUPOS_MUSCULARES,
            'ejercicios' => $this->ejercicios->listar(),
        ]);
    }

    // POST /api/ejercicios   { name, muscle, equipment }
    public function crearEjercicio(): void
    {
        $this->exigirRol(self::ROL_ENTRENADOR);
        $data = $this->datos();

        $nombre = trim($data['name'] ?? '');
        $musculo = trim($data['muscle'] ?? '');
        $equipamiento = trim($data['equipment'] ?? '');

        if ($nombre === '' || $equipamiento === '') {
            Response::json(false, 'Completá el nombre y el equipamiento.', [], 400);
        }
        if (mb_strlen($nombre) > 30) {
            Response::json(false, 'El nombre puede tener hasta 30 caracteres.', [], 400);
        }
        if (mb_strlen($equipamiento) > 50) {
            Response::json(false, 'El equipamiento puede tener hasta 50 caracteres.', [], 400);
        }
        if (!in_array($musculo, self::GRUPOS_MUSCULARES, true)) {
            Response::json(false, 'Elegí un grupo muscular válido.', [], 400);
        }
        if ($this->ejercicios->existeNombre($nombre)) {
            Response::json(false, 'Ese ejercicio ya existe.', [], 409);
        }

        $id = $this->ejercicios->crear($nombre, $musculo, $equipamiento);
        Response::json(true, 'Ejercicio agregado.', ['id_exercise' => $id], 201);
    }

    // =====================================================================
    //  RUTINAS (entrenador: cada uno ve y edita las suyas)
    // =====================================================================

    // GET /api/rutinas
    public function listar(): void
    {
        $entrenadorId = $this->exigirRol(self::ROL_ENTRENADOR);

        Response::json(true, 'Rutinas obtenidas.', [
            'rutinas' => $this->rutinas->listarDeEntrenador($entrenadorId),
        ]);
    }

    // POST /api/rutinas   { name, items: [{ exercise_id, sets, reps }, ...] }
    public function crear(): void
    {
        $entrenadorId = $this->exigirRol(self::ROL_ENTRENADOR);
        [$nombre, $items] = $this->validarRutina($this->datos(), $entrenadorId);

        $id = $this->rutinas->crear($entrenadorId, $nombre, $items);
        Response::json(true, 'Rutina creada.', ['id_routine' => $id], 201);
    }

    // PUT /api/rutinas/:id
    public function actualizar(string $id): void
    {
        $entrenadorId = $this->exigirRol(self::ROL_ENTRENADOR);
        $rutinaId = $this->rutinaPropia($id, $entrenadorId);
        [$nombre, $items] = $this->validarRutina($this->datos(), $entrenadorId, $rutinaId);

        $this->rutinas->actualizar($rutinaId, $nombre, $items);
        Response::json(true, 'Rutina actualizada.');
    }

    // DELETE /api/rutinas/:id
    public function eliminar(string $id): void
    {
        $entrenadorId = $this->exigirRol(self::ROL_ENTRENADOR);
        $rutinaId = $this->rutinaPropia($id, $entrenadorId);

        $this->rutinas->eliminar($rutinaId);
        Response::json(true, 'Rutina eliminada.');
    }

    // =====================================================================
    //  ASIGNACIÓN (entrenador → socio)
    // =====================================================================

    // GET /api/socios/:id/rutinas  → ids de MIS rutinas que tiene ese socio
    public function asignadasASocio(string $id): void
    {
        $entrenadorId = $this->exigirRol(self::ROL_ENTRENADOR);
        $socioId = $this->socioValido($id);

        Response::json(true, 'Asignaciones obtenidas.', [
            'rutinas' => $this->rutinas->idsAsignadas($socioId, $entrenadorId),
        ]);
    }

    // PUT /api/socios/:id/rutinas   { rutinas: [3, 7] }  (lista vacía = quitarle todas)
    public function asignarASocio(string $id): void
    {
        $entrenadorId = $this->exigirRol(self::ROL_ENTRENADOR);
        $socioId = $this->socioValido($id);
        $data = $this->datos();

        if (!isset($data['rutinas']) || !is_array($data['rutinas'])) {
            Response::json(false, 'Falta la lista de rutinas.', [], 400);
        }

        $ids = array_values(array_unique(array_map('intval', $data['rutinas'])));
        if ($this->rutinas->contarDeEntrenador($ids, $entrenadorId) !== count($ids)) {
            Response::json(false, 'Solo podés asignar rutinas creadas por vos.', [], 400);
        }

        $this->rutinas->reemplazarAsignaciones($socioId, $entrenadorId, $ids);
        Response::json(true, 'Rutinas asignadas.', ['total' => count($ids)]);
    }

    // =====================================================================
    //  SOCIO: sus propias rutinas
    // =====================================================================

    // GET /api/mis-rutinas
    public function misRutinas(): void
    {
        $socioId = $this->exigirRol(self::ROL_SOCIO);
        $rutinas = $this->rutinas->listarDeSocio($socioId);

        Response::json(true, 'Rutinas obtenidas.', [
            'rutinas' => $rutinas,
            'total' => count($rutinas),
        ]);
    }

    // =====================================================================
    //  Ayudantes privados
    // =====================================================================

    // Corta con 401/403 si no hay sesión o el rol no es el pedido. Devuelve el id del usuario.
    private function exigirRol(int $rol): int
    {
        if (empty($_SESSION['client_id'])) {
            Response::json(false, 'Tenés que iniciar sesión.', [], 401);
        }
        if ((int) ($_SESSION['role_id'] ?? 0) !== $rol) {
            Response::json(false, 'No autorizado.', [], 403);
        }

        return (int) $_SESSION['client_id'];
    }

    // Revisa nombre y ejercicios. Devuelve [nombre, items limpios] o corta con 400.
    private function validarRutina(array $data, int $entrenadorId, int $excepto = 0): array
    {
        $nombre = trim($data['name'] ?? '');
        if ($nombre === '') {
            Response::json(false, 'La rutina necesita un título.', [], 400);
        }
        if (mb_strlen($nombre) > 40) {
            Response::json(false, 'El título puede tener hasta 40 caracteres.', [], 400);
        }
        if ($this->rutinas->existeNombre($entrenadorId, $nombre, $excepto)) {
            Response::json(false, 'Ya tenés una rutina con ese título.', [], 409);
        }

        $items = [];
        foreach (($data['items'] ?? []) as $item) {
            $ejercicio = (int) ($item['exercise_id'] ?? 0);
            $series = (int) ($item['sets'] ?? 0);
            $reps = (int) ($item['reps'] ?? 0);

            if ($ejercicio <= 0 || $series < 1 || $series > 30 || $reps < 1 || $reps > 100) {
                Response::json(false, 'Revisá los ejercicios: series de 1 a 30 y repeticiones de 1 a 100.', [], 400);
            }
            $items[] = ['exercise_id' => $ejercicio, 'sets' => $series, 'reps' => $reps];
        }

        if (!$items) {
            Response::json(false, 'Agregá al menos un ejercicio.', [], 400);
        }

        $distintos = array_unique(array_column($items, 'exercise_id'));
        if ($this->ejercicios->contarExistentes($distintos) !== count($distintos)) {
            Response::json(false, 'Alguno de los ejercicios no existe.', [], 400);
        }

        return [$nombre, $items];
    }

    // La rutina existe y es de este entrenador; si no, 404 (no le contamos si es de otro).
    private function rutinaPropia(string $id, int $entrenadorId): int
    {
        $rutinaId = (int) $id;
        if (!$this->rutinas->perteneceA($rutinaId, $entrenadorId)) {
            Response::json(false, 'Rutina no encontrada.', [], 404);
        }

        return $rutinaId;
    }

    private function socioValido(string $id): int
    {
        $socioId = (int) $id;
        if (!(new ClienteModel($this->db))->esSocio($socioId)) {
            Response::json(false, 'Socio no encontrado.', [], 404);
        }

        return $socioId;
    }

    private function datos(): array
    {
        $decoded = json_decode(file_get_contents('php://input'), true);

        return is_array($decoded) ? $decoded : [];
    }
}
