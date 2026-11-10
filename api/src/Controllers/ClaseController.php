<?php

namespace App\Controllers;

use App\Models\ClaseModel;
use App\Models\ClienteModel;
use App\Models\UserModel;
use App\Utils\Auth;
use App\Utils\Response;

class ClaseController
{
    private ClaseModel $clases;
    private ClienteModel $clientes;
    private UserModel $usuarios;

    public function __construct($db)
    {
        $this->clases = new ClaseModel($db);
        $this->clientes = new ClienteModel($db);
        $this->usuarios = new UserModel($db);
    }

    // =====================================================================
    //  ADMIN: crear y asignar clases
    // =====================================================================

    // GET /api/clases
    public function listar(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $clases = $this->clases->listar();
        Response::json(true, 'Clases obtenidas.', ['clases' => $clases, 'total' => count($clases)]);
    }

    // POST /api/clases { name, desc, days[], time, teacher_id }
    public function crear(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        [$nombre, $descripcion, $dias, $hora, $profesor] = $this->validarClase($this->datos());

        $id = $this->clases->crear($nombre, $descripcion, $dias, $hora, $profesor);
        Response::json(true, 'Clase creada.', ['id_course' => $id], 201);
    }

    // PUT /api/clases/:id
    public function actualizar(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $claseId = (int) $id;
        if (!$this->clases->existe($claseId)) {
            Response::json(false, 'Clase no encontrada.', [], 404);
        }
        [$nombre, $descripcion, $dias, $hora, $profesor] = $this->validarClase($this->datos(), $claseId);

        $this->clases->actualizar($claseId, $nombre, $descripcion, $dias, $hora, $profesor);
        Response::json(true, 'Clase actualizada.');
    }

    // DELETE /api/clases/:id
    public function eliminar(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        if (!$this->clases->eliminar((int) $id)) {
            Response::json(false, 'Clase no encontrada.', [], 404);
        }
        Response::json(true, 'Clase eliminada.');
    }

    // GET /api/socios/:id/clases → clases del socio (para su perfil en el panel admin).
    public function deSocio(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $socioId = $this->socioValido($id);

        $clases = $this->clases->clasesDeSocio($socioId);
        if ($clases === false) {
            Response::json(false, 'No se pudieron obtener las clases.', [], 500);
        }
        foreach ($clases as &$clase) {
            unset($clase['lessons']);
        }
        unset($clase);

        Response::json(true, 'Clases obtenidas.', ['clases' => $clases]);
    }

    // PUT /api/socios/:id/clases { clases: [ids] } → reemplaza las clases del socio.
    public function asignarASocio(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $socioId = $this->socioValido($id);

        $ids = $this->datos()['clases'] ?? [];
        if (!is_array($ids)) {
            Response::json(false, 'Formato inválido.', [], 400);
        }
        $ids = array_values(array_unique(array_filter(array_map('intval', $ids), fn($n) => $n > 0)));
        if ($this->clases->contarExistentes($ids) !== count($ids)) {
            Response::json(false, 'Alguna de las clases no existe.', [], 400);
        }

        if (!$this->clases->asignarASocio($socioId, $ids)) {
            Response::json(false, 'No se pudieron guardar las clases.', [], 500);
        }
        Response::json(true, 'Clases asignadas al socio.', ['total' => count($ids)]);
    }

    // =====================================================================
    //  SOCIO
    // =====================================================================

    // GET /api/mis-clases → clases del socio logueado, con sus encuentros.
    public function misClases(): void
    {
        $socioId = Auth::exigirRol(Auth::ROL_SOCIO);

        $clases = $this->clases->clasesDeSocio($socioId);
        if ($clases === false) {
            Response::json(false, 'No se pudieron obtener tus clases.', [], 500);
        }

        Response::json(true, 'Clases obtenidas.', [
            'clases' => $clases,
            'total' => count($clases),
        ]);
    }

    // =====================================================================
    //  PROFESOR
    // =====================================================================

    // GET /api/profesor/clases → sus clases con alumnos y encuentros.
    public function deProfesor(): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $clases = $this->clases->clasesDeProfesor($profesorId);
        Response::json(true, 'Clases obtenidas.', ['clases' => $clases, 'total' => count($clases)]);
    }

    // PUT /api/profesor/clases/:id/encuentros/:fecha { note } → nota para los alumnos (fecha futura).
    public function guardarNotaEncuentro(string $id, string $fecha): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $clase = $this->claseDelProfesor($id, $profesorId);
        $fecha = $this->fechaDeClase($clase, $fecha);
        if ($fecha <= date('Y-m-d')) {
            Response::json(false, 'Las notas son para fechas futuras.', [], 400);
        }

        $nota = trim((string) ($this->datos()['note'] ?? ''));
        if ($nota === '' || mb_strlen($nota) > 240) {
            Response::json(false, 'La nota tiene que tener entre 1 y 240 caracteres.', [], 400);
        }
        $actual = $this->clases->encuentro($clase['id_course'], $fecha);
        if ($actual && $actual['state_lesson'] === 'cancelled') {
            Response::json(false, 'Ese encuentro está cancelado.', [], 409);
        }

        $this->clases->guardarEncuentro($clase['id_course'], $fecha, null, $nota);
        Response::json(true, 'Nota guardada.');
    }

    // POST /api/profesor/clases/:id/encuentros/:fecha/cancelar
    public function cancelarEncuentro(string $id, string $fecha): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $clase = $this->claseDelProfesor($id, $profesorId);
        $fecha = $this->fechaDeClase($clase, $fecha);
        if ($fecha <= date('Y-m-d')) {
            Response::json(false, 'Solo se pueden cancelar encuentros futuros.', [], 400);
        }

        $this->clases->guardarEncuentro($clase['id_course'], $fecha, 'cancelled', null);
        Response::json(true, 'Encuentro cancelado.');
    }

    // GET /api/profesor/clases/:id/encuentros/:fecha/asistencia
    public function verAsistencia(string $id, string $fecha): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $clase = $this->claseDelProfesor($id, $profesorId);
        $fecha = $this->fechaParaAsistencia($clase, $fecha);

        Response::json(true, 'Asistencia obtenida.', [
            'alumnos' => $this->clases->asistencia($clase['id_course'], $fecha),
        ]);
    }

    // PUT /api/profesor/clases/:id/encuentros/:fecha/asistencia { presentes: [ids] }
    public function guardarAsistencia(string $id, string $fecha): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $clase = $this->claseDelProfesor($id, $profesorId);
        $fecha = $this->fechaParaAsistencia($clase, $fecha);

        $presentes = $this->datos()['presentes'] ?? [];
        if (!is_array($presentes)) {
            Response::json(false, 'Formato inválido.', [], 400);
        }

        if (!$this->clases->guardarAsistencia($clase['id_course'], $fecha, $presentes)) {
            Response::json(false, 'No se pudo guardar la asistencia.', [], 500);
        }
        Response::json(true, 'Asistencia guardada.');
    }

    // GET /api/profesor/alumnos → alumnos de sus clases con asistencia del mes y su evaluación.
    public function alumnosDeProfesor(): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $alumnos = $this->clases->alumnosDeProfesor($profesorId);
        Response::json(true, 'Alumnos obtenidos.', ['alumnos' => $alumnos, 'total' => count($alumnos)]);
    }

    // GET /api/profesor/alumnos/:id → perfil de un alumno suyo.
    public function alumnoDeProfesor(string $id): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $socioId = (int) $id;

        $resumen = $this->clases->alumnoDeProfesor($profesorId, $socioId);
        if (!$resumen) {
            Response::json(false, 'Ese socio no está en tus clases.', [], 404);
        }

        Response::json(true, 'Alumno obtenido.', [
            'alumno' => array_merge($this->usuarios->findById($socioId), $resumen),
            'clases' => $this->clases->clasesDeAlumno($profesorId, $socioId),
        ]);
    }

    // PUT /api/profesor/alumnos/:id/evaluacion { score, note }
    public function evaluarAlumno(string $id): void
    {
        $profesorId = Auth::exigirRol(Auth::ROL_PROFESOR);
        $socioId = (int) $id;
        if (!$this->clases->alumnoDeProfesor($profesorId, $socioId)) {
            Response::json(false, 'Ese socio no está en tus clases.', [], 404);
        }

        $data = $this->datos();
        $score = $data['score'] ?? null;
        if ($score === '' || $score === null) {
            $score = null;
        } elseif (!is_numeric($score) || (int) $score != $score || $score < 0 || $score > 10) {
            Response::json(false, 'La evaluación tiene que ser un número entero de 0 a 10.', [], 400);
        } else {
            $score = (int) $score;
        }

        $nota = trim((string) ($data['note'] ?? ''));
        if (mb_strlen($nota) > 300) {
            Response::json(false, 'La nota puede tener hasta 300 caracteres.', [], 400);
        }

        if (!$this->clientes->guardarNota($profesorId, $socioId, $nota, $score)) {
            Response::json(false, 'No se pudo guardar la evaluación.', [], 500);
        }
        Response::json(true, 'Evaluación guardada.', ['score' => $score, 'note' => $nota]);
    }

    // =====================================================================
    //  Ayudantes
    // =====================================================================

    // Devuelve [nombre, descripción, días, hora, profesor] o corta con 400.
    private function validarClase(array $data, int $excepto = 0): array
    {
        $nombre = trim((string) ($data['name'] ?? ''));
        if ($nombre === '' || mb_strlen($nombre) > 30) {
            Response::json(false, 'El nombre tiene que tener entre 1 y 30 caracteres.', [], 400);
        }
        if ($this->clases->existeNombre($nombre, $excepto)) {
            Response::json(false, 'Ya existe una clase con ese nombre.', [], 409);
        }

        $descripcion = trim((string) ($data['desc'] ?? ''));
        if (mb_strlen($descripcion) > 500) {
            Response::json(false, 'La descripción puede tener hasta 500 caracteres.', [], 400);
        }

        $dias = $data['days'] ?? [];
        if (!is_array($dias)) {
            $dias = [];
        }
        $dias = array_values(array_unique(array_map('intval', $dias)));
        sort($dias);
        if (!$dias || min($dias) < 0 || max($dias) > 6) {
            Response::json(false, 'Seleccioná al menos un día.', [], 400);
        }

        $hora = (string) ($data['time'] ?? '');
        if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $hora)) {
            Response::json(false, 'El horario no es válido.', [], 400);
        }

        $profesor = (int) ($data['teacher_id'] ?? 0);
        if (!$this->clientes->tieneRol($profesor, Auth::ROL_PROFESOR)) {
            Response::json(false, 'Elegí un profesor válido.', [], 400);
        }

        return [$nombre, $descripcion, $dias, $hora, $profesor];
    }

    private function claseDelProfesor(string $id, int $profesorId): array
    {
        $clase = $this->clases->claseDeProfesor((int) $id, $profesorId);
        if (!$clase) {
            Response::json(false, 'Clase no encontrada.', [], 404);
        }
        return $clase;
    }

    // La fecha tiene que ser AAAA-MM-DD y caer en uno de los días de la clase.
    private function fechaDeClase(array $clase, string $fecha): string
    {
        $dt = \DateTime::createFromFormat('!Y-m-d', $fecha);
        if (!$dt || $dt->format('Y-m-d') !== $fecha) {
            Response::json(false, 'Fecha inválida.', [], 400);
        }
        if (!in_array((int) $dt->format('w'), $clase['days'], true)) {
            Response::json(false, 'Esa clase no se dicta ese día.', [], 400);
        }
        return $fecha;
    }

    private function fechaParaAsistencia(array $clase, string $fecha): string
    {
        $fecha = $this->fechaDeClase($clase, $fecha);
        if ($fecha > date('Y-m-d')) {
            Response::json(false, 'La asistencia solo se toma para hoy o fechas pasadas.', [], 400);
        }
        $encuentro = $this->clases->encuentro($clase['id_course'], $fecha);
        if ($encuentro && $encuentro['state_lesson'] === 'cancelled') {
            Response::json(false, 'Ese encuentro fue cancelado.', [], 409);
        }
        return $fecha;
    }

    private function socioValido(string $id): int
    {
        $socioId = (int) $id;
        if (!$this->clientes->esSocio($socioId)) {
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
