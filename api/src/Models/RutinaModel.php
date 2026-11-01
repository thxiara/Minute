<?php

namespace App\Models;

class RutinaModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // ------------------------------------------------------------------
    //  Lectura
    // ------------------------------------------------------------------

    // Rutinas creadas por un entrenador, cada una con sus ejercicios.
    public function listarDeEntrenador(int $entrenadorId): array
    {
        $stmt = $this->db->prepare(
            "SELECT id_routine, name_routine, desc_routine
               FROM Routine
              WHERE fr_trainer = :entrenador
              ORDER BY id_routine ASC"
        );
        $stmt->execute(['entrenador' => $entrenadorId]);

        return $this->agregarEjercicios($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // Rutinas asignadas a un socio (de cualquier entrenador), con ejercicios y nombre del entrenador.
    public function listarDeSocio(int $socioId): array
    {
        $stmt = $this->db->prepare(
            "SELECT r.id_routine, r.name_routine, r.desc_routine, cl.name_client AS trainer_name
               FROM member_routine mr
              INNER JOIN Routine r ON r.id_routine = mr.fr_routine
              INNER JOIN Client cl ON cl.id_client = r.fr_trainer
              WHERE mr.fr_client = :socio
              ORDER BY mr.id_member_routine ASC"
        );
        $stmt->execute(['socio' => $socioId]);

        return $this->agregarEjercicios($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // Ids de las rutinas DE ESTE entrenador que tiene asignadas un socio.
    public function idsAsignadas(int $socioId, int $entrenadorId): array
    {
        $stmt = $this->db->prepare(
            "SELECT mr.fr_routine
               FROM member_routine mr
              INNER JOIN Routine r ON r.id_routine = mr.fr_routine
              WHERE mr.fr_client = :socio AND r.fr_trainer = :entrenador"
        );
        $stmt->execute(['socio' => $socioId, 'entrenador' => $entrenadorId]);

        return array_map('intval', $stmt->fetchAll(\PDO::FETCH_COLUMN));
    }

    public function perteneceA(int $rutinaId, int $entrenadorId): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM Routine WHERE id_routine = :id AND fr_trainer = :entrenador");
        $stmt->execute(['id' => $rutinaId, 'entrenador' => $entrenadorId]);

        return (bool) $stmt->fetchColumn();
    }

    // ¿Este entrenador ya tiene otra rutina con ese nombre? ($excepto: la que se está editando)
    public function existeNombre(int $entrenadorId, string $nombre, int $excepto = 0): bool
    {
        $stmt = $this->db->prepare(
            "SELECT 1 FROM Routine
              WHERE fr_trainer = :entrenador AND LOWER(name_routine) = LOWER(:nombre) AND id_routine <> :excepto"
        );
        $stmt->execute(['entrenador' => $entrenadorId, 'nombre' => $nombre, 'excepto' => $excepto]);

        return (bool) $stmt->fetchColumn();
    }

    // Cuántos de estos ids son rutinas de este entrenador.
    public function contarDeEntrenador(array $ids, int $entrenadorId): int
    {
        if (!$ids) {
            return 0;
        }

        $marcas = implode(', ', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM Routine WHERE fr_trainer = ? AND id_routine IN ($marcas)"
        );
        $stmt->execute(array_merge([$entrenadorId], array_values($ids)));

        return (int) $stmt->fetchColumn();
    }

    // ------------------------------------------------------------------
    //  Escritura (todo en transacción: o se guarda completo o no se guarda nada)
    // ------------------------------------------------------------------

    // $items = [['exercise_id' => 1, 'sets' => 4, 'reps' => 10], ...]  → devuelve el id nuevo.
    public function crear(int $entrenadorId, string $nombre, array $items): int
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO Routine (fr_trainer, name_routine) VALUES (:entrenador, :nombre)"
            );
            $stmt->execute(['entrenador' => $entrenadorId, 'nombre' => $nombre]);
            $id = (int) $this->db->lastInsertId();

            $this->guardarItems($id, $items);
            $this->db->commit();

            return $id;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Cambia el nombre y reemplaza la lista de ejercicios.
    public function actualizar(int $rutinaId, string $nombre, array $items): void
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare("UPDATE Routine SET name_routine = :nombre WHERE id_routine = :id");
            $stmt->execute(['nombre' => $nombre, 'id' => $rutinaId]);

            $stmt = $this->db->prepare("DELETE FROM routine_exercise WHERE fr_routine = :id");
            $stmt->execute(['id' => $rutinaId]);

            $this->guardarItems($rutinaId, $items);
            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // Los ejercicios y las asignaciones se borran solos (ON DELETE CASCADE en init.sql).
    public function eliminar(int $rutinaId): void
    {
        $stmt = $this->db->prepare("DELETE FROM Routine WHERE id_routine = :id");
        $stmt->execute(['id' => $rutinaId]);
    }

    // Deja al socio con exactamente estas rutinas de este entrenador.
    // Las rutinas que le asignaron otros entrenadores no se tocan.
    public function reemplazarAsignaciones(int $socioId, int $entrenadorId, array $rutinaIds): void
    {
        $this->db->beginTransaction();
        try {
            $stmt = $this->db->prepare(
                "DELETE mr FROM member_routine mr
                  INNER JOIN Routine r ON r.id_routine = mr.fr_routine
                  WHERE mr.fr_client = :socio AND r.fr_trainer = :entrenador"
            );
            $stmt->execute(['socio' => $socioId, 'entrenador' => $entrenadorId]);

            $stmt = $this->db->prepare("INSERT INTO member_routine (fr_client, fr_routine) VALUES (:socio, :rutina)");
            foreach ($rutinaIds as $rutinaId) {
                $stmt->execute(['socio' => $socioId, 'rutina' => $rutinaId]);
            }

            $this->db->commit();
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ------------------------------------------------------------------
    //  Ayudantes privados
    // ------------------------------------------------------------------

    private function guardarItems(int $rutinaId, array $items): void
    {
        $stmt = $this->db->prepare(
            "INSERT INTO routine_exercise (fr_routine, fr_exercise, sets, repetitions)
             VALUES (:rutina, :ejercicio, :series, :reps)"
        );
        foreach ($items as $item) {
            $stmt->execute([
                'rutina' => $rutinaId,
                'ejercicio' => $item['exercise_id'],
                'series' => $item['sets'],
                'reps' => $item['reps'],
            ]);
        }
    }

    // Le agrega a cada rutina su lista "items" con los ejercicios, en el orden en que se cargaron.
    private function agregarEjercicios(array $rutinas): array
    {
        if (!$rutinas) {
            return [];
        }

        $ids = array_column($rutinas, 'id_routine');
        $marcas = implode(', ', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare(
            "SELECT re.fr_routine, re.fr_exercise AS exercise_id, e.name_exercise AS exercise_name,
                    re.sets, re.repetitions AS reps
               FROM routine_exercise re
              INNER JOIN Exercise e ON e.id_exercise = re.fr_exercise
              WHERE re.fr_routine IN ($marcas)
              ORDER BY re.id_routine_exercise ASC"
        );
        $stmt->execute($ids);

        $porRutina = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $fila) {
            $porRutina[$fila['fr_routine']][] = [
                'exercise_id' => (int) $fila['exercise_id'],
                'exercise_name' => $fila['exercise_name'],
                'sets' => (int) $fila['sets'],
                'reps' => (int) $fila['reps'],
            ];
        }

        foreach ($rutinas as &$rutina) {
            $rutina['id_routine'] = (int) $rutina['id_routine'];
            $rutina['items'] = $porRutina[$rutina['id_routine']] ?? [];
        }
        unset($rutina);

        return $rutinas;
    }
}
