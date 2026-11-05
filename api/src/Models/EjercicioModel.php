<?php

namespace App\Models;

class EjercicioModel
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // Toda la biblioteca de ejercicios, ordenada por nombre.
    public function listar(): array
    {
        $query = "SELECT id_exercise, name_exercise, muscle_exercise, equipment_exercise
                    FROM Exercise
                   ORDER BY name_exercise ASC";

        return $this->db->query($query)->fetchAll(\PDO::FETCH_ASSOC);
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
