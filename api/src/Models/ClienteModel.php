<?php
namespace App\Models;

class ClienteModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function contarClientes() {
        try {
            $stmt = $this->db->query('SELECT COUNT(*) AS total FROM Client');
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $fila['total'];
        } catch (\Exception $e) {
            return false; 
        }
    }

    // Socios activos (rol 4). Si se pasa $autorId, cada socio trae la nota que le dejó ese autor.
    public function listarSocios(int $autorId = 0, bool $bajas = false) {
        try {
            $stmt = $this->db->prepare(
                "SELECT
                        cl.id_client,
                        cl.name_client,
                        cl.ci,
                        cl.phone,
                        cr.email,
                        (
                            SELECT MAX(mm.expiry_date)
                            FROM member_membership mm
                            WHERE mm.fr_client = cl.id_client
                        ) AS expiry_date,
                        mn.note AS my_note
                  FROM Client cl
                  INNER JOIN Credentials cr ON cr.id_credentials = cl.fr_credentials
                  LEFT JOIN member_note mn ON mn.fr_client = cl.id_client AND mn.fr_author = :autor
                  WHERE cl.fr_role = 4 AND cl.active_client = :activo
                  ORDER BY cl.name_client ASC"
            );
            $stmt->execute(['autor' => $autorId, 'activo' => $bajas ? 0 : 1]);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }

    // Usuarios activos con un rol dado (ej. profesores para el formulario de clases).
    public function listarPorRol(int $rol): array {
        $stmt = $this->db->prepare(
            "SELECT id_client, name_client FROM Client
              WHERE fr_role = :rol AND active_client = 1 ORDER BY name_client"
        );
        $stmt->execute(['rol' => $rol]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    // true si el id corresponde a un socio (rol 4) activo.
    public function esSocio(int $id): bool {
        return $this->tieneRol($id, 4);
    }

    public function tieneRol(int $id, int $rol): bool {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM Client WHERE id_client = :id AND fr_role = :rol AND active_client = 1'
        );
        $stmt->execute(['id' => $id, 'rol' => $rol]);
        return (bool) $stmt->fetchColumn();
    }

    // ---------------------------------------------------------------- Notas sobre socios

    // ['score' => int|null, 'note' => string] o null si el autor todavía no escribió nada.
    public function nota(int $autorId, int $socioId): ?array {
        $stmt = $this->db->prepare(
            'SELECT score, note FROM member_note WHERE fr_author = :autor AND fr_client = :socio'
        );
        $stmt->execute(['autor' => $autorId, 'socio' => $socioId]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$fila) {
            return null;
        }
        return ['score' => $fila['score'] === null ? null : (int) $fila['score'], 'note' => $fila['note']];
    }

    // Guarda la nota del autor. $score = false deja la evaluación como estaba.
    public function guardarNota(int $autorId, int $socioId, string $nota, $score = false): bool {
        if ($score === false) {
            $stmt = $this->db->prepare(
                'INSERT INTO member_note (fr_author, fr_client, note) VALUES (:autor, :socio, :nota)
                 ON DUPLICATE KEY UPDATE note = VALUES(note)'
            );
            return $stmt->execute(['autor' => $autorId, 'socio' => $socioId, 'nota' => $nota]);
        }

        $stmt = $this->db->prepare(
            'INSERT INTO member_note (fr_author, fr_client, note, score) VALUES (:autor, :socio, :nota, :score)
             ON DUPLICATE KEY UPDATE note = VALUES(note), score = VALUES(score)'
        );
        return $stmt->execute(['autor' => $autorId, 'socio' => $socioId, 'nota' => $nota, 'score' => $score]);
    }
}
