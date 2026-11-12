<?php
namespace App\Models;

// Clases grupales:
//   Course          → la clase (nombre, profesor, días de la semana y horario).
//   student_course  → qué socios están anotados en cada clase.
//   Lesson          → un encuentro concreto (un día). Se crea cuando el profesor deja
//                     una nota, lo cancela o toma asistencia.
//   student_lesson  → asistencia de cada socio a cada encuentro.
class ClaseModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    // ================================================================ Clases (admin)

    public function listar(): array {
        $filas = $this->db->query(
            "SELECT c.id_course, c.name_course, c.desc_course, c.days_course, c.time_course,
                    c.fr_teacher AS teacher_id, t.name_client AS teacher_name,
                    (SELECT COUNT(*) FROM student_course sc
                       INNER JOIN Client s ON s.id_client = sc.fr_client AND s.active_client = 1
                      WHERE sc.fr_course = c.id_course) AS student_count
               FROM Course c
               INNER JOIN Client t ON t.id_client = c.fr_teacher
              ORDER BY c.name_course"
        )->fetchAll(\PDO::FETCH_ASSOC);

        return array_map([$this, 'formatearClase'], $filas);
    }

    public function crear(string $nombre, string $descripcion, array $dias, string $hora, int $profesorId): int {
        $stmt = $this->db->prepare(
            "INSERT INTO Course (fr_teacher, name_course, desc_course, days_course, time_course)
             VALUES (:profesor, :nombre, :descripcion, :dias, :hora)"
        );
        $stmt->execute([
            'profesor' => $profesorId,
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'dias' => implode(',', $dias),
            'hora' => $hora,
        ]);
        return (int) $this->db->lastInsertId();
    }

    public function actualizar(int $id, string $nombre, string $descripcion, array $dias, string $hora, int $profesorId): bool {
        $stmt = $this->db->prepare(
            "UPDATE Course SET fr_teacher = :profesor, name_course = :nombre, desc_course = :descripcion,
                               days_course = :dias, time_course = :hora
              WHERE id_course = :id"
        );
        return $stmt->execute([
            'profesor' => $profesorId,
            'nombre' => $nombre,
            'descripcion' => $descripcion,
            'dias' => implode(',', $dias),
            'hora' => $hora,
            'id' => $id,
        ]);
    }

    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM Course WHERE id_course = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    public function existe(int $id): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM Course WHERE id_course = :id");
        $stmt->execute(['id' => $id]);
        return (bool) $stmt->fetchColumn();
    }

    public function existeNombre(string $nombre, int $excepto = 0): bool {
        $stmt = $this->db->prepare("SELECT 1 FROM Course WHERE name_course = :nombre AND id_course <> :id");
        $stmt->execute(['nombre' => $nombre, 'id' => $excepto]);
        return (bool) $stmt->fetchColumn();
    }

    // ================================================================ Socio ↔ clases

    // Clases del socio con todos sus encuentros y lo que el profesor cargó para él.
    public function clasesDeSocio(int $socioId) {
        try {
            $stmt = $this->db->prepare(
                "SELECT c.id_course, c.name_course, c.desc_course, c.days_course, c.time_course,
                        c.fr_teacher AS teacher_id, t.name_client AS teacher_name
                   FROM student_course sc
                   INNER JOIN Course c ON c.id_course = sc.fr_course
                   INNER JOIN Client t ON t.id_client = c.fr_teacher
                  WHERE sc.fr_client = :socio
                  ORDER BY c.name_course ASC"
            );
            $stmt->execute(['socio' => $socioId]);
            $clases = array_map([$this, 'formatearClase'], $stmt->fetchAll(\PDO::FETCH_ASSOC));
            if (!$clases) {
                return [];
            }

            $stmt = $this->db->prepare(
                "SELECT l.id_lesson, l.fr_course, l.name_lesson, l.desc_lesson,
                        l.date_lesson, l.state_lesson,
                        sl.assistance, sl.grade, sl.notes
                   FROM Lesson l
                   INNER JOIN student_course sc
                           ON sc.fr_course = l.fr_course AND sc.fr_client = :socio
                   LEFT JOIN student_lesson sl
                          ON sl.fr_lesson = l.id_lesson AND sl.fr_client = :socio2
                  ORDER BY l.date_lesson ASC, l.id_lesson ASC"
            );
            $stmt->execute(['socio' => $socioId, 'socio2' => $socioId]);

            $porClase = [];
            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $encuentro) {
                $porClase[(int) $encuentro['fr_course']][] = [
                    'id_lesson' => (int) $encuentro['id_lesson'],
                    'name_lesson' => $encuentro['name_lesson'],
                    'desc_lesson' => $encuentro['desc_lesson'],
                    'date_lesson' => $encuentro['date_lesson'],
                    'state_lesson' => $encuentro['state_lesson'],
                    // null = el profesor todavía no cargó nada para este encuentro.
                    'assistance' => $encuentro['assistance'] === null ? null : (bool) $encuentro['assistance'],
                    'grade' => $encuentro['grade'] === null ? null : (float) $encuentro['grade'],
                    'notes' => $encuentro['notes'],
                ];
            }

            foreach ($clases as &$clase) {
                $clase['lessons'] = $porClase[$clase['id_course']] ?? [];
            }
            unset($clase);

            return $clases;
        } catch (\Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // Reemplaza las clases del socio por las de la lista.
    public function asignarASocio(int $socioId, array $claseIds): bool {
        try {
            $this->db->beginTransaction();
            $this->db->prepare("DELETE FROM student_course WHERE fr_client = :socio")
                     ->execute(['socio' => $socioId]);

            $stmt = $this->db->prepare("INSERT INTO student_course (fr_client, fr_course) VALUES (:socio, :clase)");
            foreach ($claseIds as $claseId) {
                $stmt->execute(['socio' => $socioId, 'clase' => $claseId]);
            }
            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }

    public function contarExistentes(array $ids): int {
        if (!$ids) {
            return 0;
        }
        $marcas = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM Course WHERE id_course IN ($marcas)");
        $stmt->execute(array_values($ids));
        return (int) $stmt->fetchColumn();
    }

    // ================================================================ Profesor

    // Clases del profesor, cada una con sus alumnos activos y sus encuentros.
    public function clasesDeProfesor(int $profesorId): array {
        $stmt = $this->db->prepare(
            "SELECT c.id_course, c.name_course, c.desc_course, c.days_course, c.time_course,
                    c.fr_teacher AS teacher_id
               FROM Course c WHERE c.fr_teacher = :profesor ORDER BY c.name_course"
        );
        $stmt->execute(['profesor' => $profesorId]);
        $clases = array_map([$this, 'formatearClase'], $stmt->fetchAll(\PDO::FETCH_ASSOC));
        if (!$clases) {
            return [];
        }

        $stmt = $this->db->prepare(
            "SELECT sc.fr_course, s.id_client, s.name_client
               FROM student_course sc
               INNER JOIN Course c ON c.id_course = sc.fr_course AND c.fr_teacher = :profesor
               INNER JOIN Client s ON s.id_client = sc.fr_client AND s.active_client = 1
              ORDER BY s.name_client"
        );
        $stmt->execute(['profesor' => $profesorId]);
        $alumnos = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $fila) {
            $alumnos[(int) $fila['fr_course']][] = [
                'id_client' => (int) $fila['id_client'],
                'name_client' => $fila['name_client'],
            ];
        }

        $stmt = $this->db->prepare(
            "SELECT l.id_lesson, l.fr_course, l.date_lesson, l.state_lesson, l.desc_lesson
               FROM Lesson l
               INNER JOIN Course c ON c.id_course = l.fr_course AND c.fr_teacher = :profesor
              ORDER BY l.date_lesson"
        );
        $stmt->execute(['profesor' => $profesorId]);
        $encuentros = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $fila) {
            $encuentros[(int) $fila['fr_course']][] = [
                'id_lesson' => (int) $fila['id_lesson'],
                'date_lesson' => $fila['date_lesson'],
                'state_lesson' => $fila['state_lesson'],
                'desc_lesson' => $fila['desc_lesson'],
            ];
        }

        foreach ($clases as &$clase) {
            $clase['students'] = $alumnos[$clase['id_course']] ?? [];
            $clase['lessons'] = $encuentros[$clase['id_course']] ?? [];
        }
        unset($clase);

        return $clases;
    }

    // La clase si es de ese profesor; null si no existe o es de otro.
    public function claseDeProfesor(int $claseId, int $profesorId): ?array {
        $stmt = $this->db->prepare(
            "SELECT id_course, name_course, desc_course, days_course, time_course, fr_teacher AS teacher_id
               FROM Course WHERE id_course = :id AND fr_teacher = :profesor"
        );
        $stmt->execute(['id' => $claseId, 'profesor' => $profesorId]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $fila ? $this->formatearClase($fila) : null;
    }

    public function encuentro(int $claseId, string $fecha): ?array {
        $stmt = $this->db->prepare(
            "SELECT id_lesson, state_lesson, desc_lesson FROM Lesson WHERE fr_course = :clase AND date_lesson = :fecha"
        );
        $stmt->execute(['clase' => $claseId, 'fecha' => $fecha]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $fila ?: null;
    }

    // Crea el encuentro si no existe y le cambia estado y/o nota. Devuelve su id.
    public function guardarEncuentro(int $claseId, string $fecha, ?string $estado, ?string $nota): int {
        $stmt = $this->db->prepare(
            "INSERT INTO Lesson (fr_course, name_lesson, date_lesson, state_lesson, desc_lesson)
             SELECT id_course, name_course, :fecha, COALESCE(:estado, 'active'), :nota
               FROM Course WHERE id_course = :clase
             ON DUPLICATE KEY UPDATE
                state_lesson = COALESCE(:estado2, state_lesson),
                desc_lesson  = COALESCE(:nota2, desc_lesson)"
        );
        $stmt->execute([
            'fecha' => $fecha, 'estado' => $estado, 'nota' => $nota, 'clase' => $claseId,
            'estado2' => $estado, 'nota2' => $nota,
        ]);

        return (int) $this->encuentro($claseId, $fecha)['id_lesson'];
    }

    // Alumnos de la clase con su asistencia a ese día (false si todavía no se tomó).
    public function asistencia(int $claseId, string $fecha): array {
        $stmt = $this->db->prepare(
            "SELECT s.id_client, s.name_client, COALESCE(sl.assistance, 0) AS assistance
               FROM student_course sc
               INNER JOIN Client s ON s.id_client = sc.fr_client AND s.active_client = 1
               LEFT JOIN Lesson l ON l.fr_course = sc.fr_course AND l.date_lesson = :fecha
               LEFT JOIN student_lesson sl ON sl.fr_lesson = l.id_lesson AND sl.fr_client = s.id_client
              WHERE sc.fr_course = :clase
              ORDER BY s.name_client"
        );
        $stmt->execute(['clase' => $claseId, 'fecha' => $fecha]);

        return array_map(fn($fila) => [
            'id_client' => (int) $fila['id_client'],
            'name_client' => $fila['name_client'],
            'assistance' => (bool) $fila['assistance'],
        ], $stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // Guarda presentes/ausentes de todos los alumnos de la clase y marca el encuentro como dado.
    public function guardarAsistencia(int $claseId, string $fecha, array $presentes): bool {
        try {
            $this->db->beginTransaction();
            $encuentroId = $this->guardarEncuentro($claseId, $fecha, 'given', null);

            $stmt = $this->db->prepare(
                "INSERT INTO student_lesson (fr_client, fr_lesson, assistance)
                 SELECT sc.fr_client, :encuentro, sc.fr_client IN (" . $this->listaEnteros($presentes) . ")
                   FROM student_course sc WHERE sc.fr_course = :clase
                 ON DUPLICATE KEY UPDATE assistance = VALUES(assistance)"
            );
            $stmt->execute(['encuentro' => $encuentroId, 'clase' => $claseId]);

            $this->db->commit();
            return true;
        } catch (\PDOException $e) {
            $this->db->rollBack();
            error_log($e->getMessage());
            return false;
        }
    }

    // Alumnos (socios activos) de todas las clases del profesor, con la asistencia del mes
    // en esas clases y la evaluación/nota que él les puso.
    public function alumnosDeProfesor(int $profesorId): array {
        $stmt = $this->db->prepare(
            "SELECT s.id_client, s.name_client, s.phone,
                    mn.score, mn.note,
                    (SELECT COUNT(*) FROM student_lesson sl
                       INNER JOIN Lesson l ON l.id_lesson = sl.fr_lesson
                       INNER JOIN Course c2 ON c2.id_course = l.fr_course AND c2.fr_teacher = :p2
                      WHERE sl.fr_client = s.id_client AND sl.assistance = 1
                        AND l.date_lesson >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS attended_month,
                    (SELECT COUNT(*) FROM student_lesson sl
                       INNER JOIN Lesson l ON l.id_lesson = sl.fr_lesson
                       INNER JOIN Course c3 ON c3.id_course = l.fr_course AND c3.fr_teacher = :p3
                      WHERE sl.fr_client = s.id_client
                        AND l.date_lesson >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS lessons_month
               FROM Client s
               LEFT JOIN member_note mn ON mn.fr_client = s.id_client AND mn.fr_author = :p4
              WHERE s.active_client = 1 AND s.id_client IN (
                    SELECT sc.fr_client FROM student_course sc
                     INNER JOIN Course c ON c.id_course = sc.fr_course
                     WHERE c.fr_teacher = :p1)
              ORDER BY s.name_client"
        );
        $stmt->execute(['p1' => $profesorId, 'p2' => $profesorId, 'p3' => $profesorId, 'p4' => $profesorId]);

        return array_map(fn($fila) => [
            'id_client' => (int) $fila['id_client'],
            'name_client' => $fila['name_client'],
            'phone' => $fila['phone'],
            'score' => $fila['score'] === null ? null : (int) $fila['score'],
            'note' => $fila['note'] ?? '',
            'attended_month' => (int) $fila['attended_month'],
            'lessons_month' => (int) $fila['lessons_month'],
        ], $stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // Una fila de alumnosDeProfesor, o null si ese socio no está en ninguna clase del profesor.
    public function alumnoDeProfesor(int $profesorId, int $socioId): ?array {
        foreach ($this->alumnosDeProfesor($profesorId) as $alumno) {
            if ($alumno['id_client'] === $socioId) {
                return $alumno;
            }
        }
        return null;
    }

    // Las clases del profesor en las que está anotado el socio.
    public function clasesDeAlumno(int $profesorId, int $socioId): array {
        $stmt = $this->db->prepare(
            "SELECT c.id_course, c.name_course, c.desc_course, c.days_course, c.time_course, c.fr_teacher AS teacher_id
               FROM Course c
               INNER JOIN student_course sc ON sc.fr_course = c.id_course AND sc.fr_client = :socio
              WHERE c.fr_teacher = :profesor
              ORDER BY c.name_course"
        );
        $stmt->execute(['socio' => $socioId, 'profesor' => $profesorId]);
        return array_map([$this, 'formatearClase'], $stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // ================================================================ Ayudantes

    // Pasa los tipos de la base a lo que espera el front: días como lista y hora "HH:MM".
    private function formatearClase(array $fila): array {
        $fila['id_course'] = (int) $fila['id_course'];
        if (isset($fila['teacher_id'])) {
            $fila['teacher_id'] = (int) $fila['teacher_id'];
        }
        if (isset($fila['student_count'])) {
            $fila['student_count'] = (int) $fila['student_count'];
        }
        $fila['days'] = $fila['days_course'] === '' ? [] : array_map('intval', explode(',', $fila['days_course']));
        $fila['time'] = substr($fila['time_course'], 0, 5);
        unset($fila['days_course'], $fila['time_course']);
        return $fila;
    }

    // "1,2,3" a partir de enteros (seguro para meter en un IN; si está vacía, "0").
    private function listaEnteros(array $ids): string {
        $ids = array_map('intval', $ids);
        return $ids ? implode(',', $ids) : '0';
    }
}
