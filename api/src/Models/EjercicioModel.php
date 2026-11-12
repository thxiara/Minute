<?php

namespace App\Models;

use App\Utils\Imagenes;

class EjercicioModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // Toda la biblioteca de ejercicios, ordenada por nombre.
    // has_gif: si el ejercicio tiene animación, que es el archivo <id>.gif de la carpeta
    // EXERCISE_DIR (ver Utils\Imagenes); se pide en GET /api/ejercicios/:id/gif.
    public function listar(): array
    {
        $query = "SELECT id_exercise, name_exercise, muscle_exercise, equipment_exercise
                    FROM Exercise
                   ORDER BY name_exercise ASC";

        $ejercicios = $this->db->query($query)->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($ejercicios as &$ejercicio) {
            $ejercicio['id_exercise'] = (int) $ejercicio['id_exercise'];
            $ejercicio['has_gif'] = Imagenes::rutaEjercicio($ejercicio['id_exercise']) !== null;
        }
        unset($ejercicio);

        return $ejercicios;
    }

    public function existe(int $id): bool
    {
        $stmt = $this->db->prepare("SELECT 1 FROM Exercise WHERE id_exercise = :id");
        $stmt->execute(['id' => $id]);

        return (bool) $stmt->fetchColumn();
    }

    public function existeNombre(string $nombre): bool
    {
        $stmt = $this->db->prepare("SELECT id_exercise FROM Exercise WHERE LOWER(name_exercise) = LOWER(:nombre)");
        $stmt->execute(['nombre' => $nombre]);

        return (bool) $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    // Devuelve el id del ejercicio nuevo.
    public function crear(string $nombre, string $musculo, string $equipamiento): int
    {
        $stmt = $this->db->prepare(
            "INSERT INTO Exercise (name_exercise, muscle_exercise, equipment_exercise)
             VALUES (:nombre, :musculo, :equipamiento)"
        );
        $stmt->execute([
            'nombre' => $nombre,
            'musculo' => $musculo,
            'equipamiento' => $equipamiento,
        ]);

        return (int) $this->db->lastInsertId();
    }

    // Cuántos de estos ids existen de verdad (para validar los ejercicios de una rutina).
    public function contarExistentes(array $ids): int
    {
        if (!$ids) {
            return 0;
        }

        // Un "?" por cada id: IN (?, ?, ?)
        $marcas = implode(', ', array_fill(0, count($ids), '?'));
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM Exercise WHERE id_exercise IN ($marcas)");
        $stmt->execute(array_values($ids));

        return (int) $stmt->fetchColumn();
    }
}
