<?php

namespace App\Controllers;

use App\Models\ClienteModel;
use App\Models\EjercicioModel;
use App\Models\RutinaModel;
use App\Utils\Entrada;
use App\Utils\Imagenes;
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

    // POST /api/ejercicios   { name, muscle, equipment, image? }
    public function crearEjercicio(): void
    {
        $this->exigirRol(self::ROL_ENTRENADOR);
        $data = $this->datos();

        $nombre = Entrada::texto($data, 'name');
        $musculo = Entrada::texto($data, 'muscle');
        $equipamiento = Entrada::texto($data, 'equipment');

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

        // La imagen se revisa antes de crear nada: si no sirve, no queda un ejercicio a medias.
        $imagen = null;
        if (($data['image'] ?? '') !== '') {
            $imagen = $this->leerImagen($data['image']);
        }

        $id = $this->ejercicios->crear($nombre, $musculo, $equipamiento);
        if ($imagen !== null) {
            $this->guardarGif($id, $imagen, 'El ejercicio se agregó, pero no se pudo guardar su imagen.');
        }

        Response::json(true, 'Ejercicio agregado.', ['id_exercise' => $id, 'has_gif' => $imagen !== null], 201);
    }

    // PUT /api/ejercicios/:id/gif   { image: "data:image/...;base64,..." }
    public function subirGif(string $id): void
    {
        $this->exigirRol(self::ROL_ENTRENADOR);
        $ejercicioId = (int) $id;
        if (!$this->ejercicios->existe($ejercicioId)) {
            Response::json(false, 'Ejercicio no encontrado.', [], 404);
        }

        $this->guardarGif($ejercicioId, $this->leerImagen($this->datos()['image'] ?? null), 'No se pudo guardar la imagen.');
        Response::json(true, 'Imagen del ejercicio actualizada.', ['id_exercise' => $ejercicioId, 'has_gif' => true]);
    }

    // GET /api/ejercicios/:id/gif → la animación (o 404 si no tiene). Cualquier usuario logueado:
    public function gif(string $id): void
    {
        if (empty($_SESSION['client_id'])) {
            Response::json(false, 'Tenés que iniciar sesión.', [], 401);
        }

        $ruta = Imagenes::rutaEjercicio((int) $id);
        if ($ruta === null) {
            Response::json(false, 'Sin imagen.', [], 404);
        }

        Imagenes::enviar($ruta, 'image/gif');
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
        $nombre = Entrada::texto($data, 'name');
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
        $recibidos = is_array($data['items'] ?? null) ? $data['items'] : [];
        foreach ($recibidos as $item) {
            $item = is_array($item) ? $item : [];
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

    private function leerImagen($dataUrl): string
    {
        try {
            $bytes = Imagenes::desdeDataUrl($dataUrl, Imagenes::MAX_BYTES_EJERCICIO);
            Imagenes::comprobar($bytes, Imagenes::MAX_BYTES_EJERCICIO);
            return $bytes;
        } catch (\InvalidArgumentException $e) {
            Response::json(false, $e->getMessage(), [], 400);
        } catch (\RuntimeException $e) {
            error_log('Imagen de ejercicio: ' . $e->getMessage());
            Response::json(false, 'No se pudo guardar la imagen.', [], 500);
        }
    }

    private function guardarGif(int $ejercicioId, string $bytes, string $mensajeSiFalla): void
    {
        try {
            Imagenes::guardarEjercicio($ejercicioId, $bytes);
        } catch (\InvalidArgumentException $e) {
            Response::json(false, $e->getMessage(), ['id_exercise' => $ejercicioId], 400);
        } catch (\RuntimeException $e) {
            error_log('Imagen de ejercicio: ' . $e->getMessage());
            Response::json(false, $mensajeSiFalla, ['id_exercise' => $ejercicioId], 500);
        }
    }

    private function datos(): array
    {
        return Entrada::json();
    }
}
