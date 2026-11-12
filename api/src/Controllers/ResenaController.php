<?php

namespace App\Controllers;

use App\Utils\Auth;
use App\Utils\Entrada;
use App\Utils\Imagenes;
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
            "SELECT r.id_review, cl.id_client, cl.name_client, r.rating, r.desc_review, r.updated_review
               FROM Review r
               INNER JOIN Client cl ON cl.id_client = r.fr_client AND cl.active_client = 1
              ORDER BY r.updated_review DESC
              LIMIT 100"
        )->fetchAll(\PDO::FETCH_ASSOC);

        $resenas = array_map(fn($fila) => [
            'id_review' => (int) $fila['id_review'],
            // Foto del autor (null si no subió una). Es pública solo a través de la reseña:
            // no se expone la id del usuario.
            'photo' => $this->urlFoto((int) $fila['id_review'], (int) $fila['id_client']),
            // Solo el primer nombre: la página es pública.
            'name' => explode(' ', trim($fila['name_client']))[0],
            'rating' => (int) round((float) $fila['rating']),
            'text' => $fila['desc_review'] ?? '',
            'updated' => $fila['updated_review'],
        ], $filas);

        Response::json(true, 'Reseñas obtenidas.', ['resenas' => $resenas, 'total' => count($resenas)]);
    }

    // GET /api/resenas/:id/foto → foto de quien escribió la reseña (público, como las reseñas).
    public function foto(string $id): void
    {
        $stmt = $this->db->prepare(
            "SELECT cl.id_client FROM Review r
              INNER JOIN Client cl ON cl.id_client = r.fr_client AND cl.active_client = 1
              WHERE r.id_review = :id"
        );
        $stmt->execute(['id' => (int) $id]);
        $ruta = Imagenes::rutaPfp((int) $stmt->fetchColumn());
        if ($ruta === null) {
            Response::json(false, 'Sin foto.', [], 404);
        }

        Imagenes::enviar($ruta, 'image/jpeg');
    }

    private function urlFoto(int $resenaId, int $clienteId): ?string
    {
        $ruta = Imagenes::rutaPfp($clienteId);
        return $ruta !== null ? '/api/resenas/' . $resenaId . '/foto?v=' . filemtime($ruta) : null;
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
        $data = Entrada::json();

        $puntaje = (int) Entrada::texto($data, 'rating');
        $texto = Entrada::texto($data, 'text');
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
