<?php

namespace App\Controllers;

use App\Utils\Auth;
use App\Utils\Response;

// Reseñas de los socios: las ve cualquiera, solo un socio puede escribir (una por socio).
class ResenaController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    // GET /api/resenas → todas las reseñas de socios activos, las más nuevas primero (público).
    public function listar(): void
    {
        $filas = $this->db->query(
            "SELECT r.id_review, cl.id_client, cl.name_client, r.rating, r.desc_review, r.updated_review,
                    (cl.photo_client IS NOT NULL) AS has_photo
               FROM Review r
               INNER JOIN Client cl ON cl.id_client = r.fr_client AND cl.active_client = 1
              ORDER BY r.updated_review DESC
              LIMIT 100"
        )->fetchAll(\PDO::FETCH_ASSOC);

        $resenas = array_map(fn($fila) => [
            'id_review' => (int) $fila['id_review'],
            // Solo el primer nombre: la página es pública.
            'name' => explode(' ', trim($fila['name_client']))[0],
            'rating' => (int) round((float) $fila['rating']),
            'text' => $fila['desc_review'] ?? '',
            'updated' => $fila['updated_review'],
        ], $filas);

        Response::json(true, 'Reseñas obtenidas.', ['resenas' => $resenas, 'total' => count($resenas)]);
    }

    // GET /api/mi-resena → la reseña del socio logueado (o null).
    public function mia(): void
    {
        $socioId = Auth::exigirRol(Auth::ROL_SOCIO);
        $stmt = $this->db->prepare("SELECT rating, desc_review FROM Review WHERE fr_client = :id");
        $stmt->execute(['id' => $socioId]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);

        Response::json(true, 'Reseña obtenida.', [
            'resena' => $fila ? ['rating' => (int) round((float) $fila['rating']), 'text' => $fila['desc_review'] ?? ''] : null,
        ]);
    }

    // PUT /api/mi-resena { rating, text } → crea o modifica la reseña del socio logueado.
    public function guardar(): void
    {
        $socioId = Auth::exigirRol(Auth::ROL_SOCIO);
        $data = json_decode(file_get_contents('php://input'), true);
        $data = is_array($data) ? $data : [];

        $puntaje = (int) ($data['rating'] ?? 0);
        $texto = trim((string) ($data['text'] ?? ''));
        if ($puntaje < 1 || $puntaje > 5) {
            Response::json(false, 'Elegí una calificación de 1 a 5 estrellas.', [], 400);
        }
        if ($texto === '' || mb_strlen($texto) > 300) {
            Response::json(false, 'La reseña tiene que tener entre 1 y 300 caracteres.', [], 400);
        }

        $stmt = $this->db->prepare(
            "INSERT INTO Review (fr_client, rating, desc_review) VALUES (:id, :rating, :texto)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating), desc_review = VALUES(desc_review)"
        );
        $stmt->execute(['id' => $socioId, 'rating' => $puntaje, 'texto' => $texto]);

        Response::json(true, 'Tu reseña fue guardada.');
    }
}
