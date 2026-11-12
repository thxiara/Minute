<?php
namespace App\Models;

class ProductoModel {
    private $db;

    private const COLUMNAS = "id_product AS id, name_product AS name, category, price, stock, desc_product AS description";

    public function __construct($db) {
        $this->db = $db;
    }

    public function listar(): array {
        $filas = $this->db->query("SELECT " . self::COLUMNAS . " FROM Product ORDER BY id_product DESC")
                          ->fetchAll(\PDO::FETCH_ASSOC);
        return array_map([$this, 'formatear'], $filas);
    }

    public function buscar(int $id): ?array {
        $stmt = $this->db->prepare("SELECT " . self::COLUMNAS . " FROM Product WHERE id_product = :id");
        $stmt->execute(['id' => $id]);
        $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $fila ? $this->formatear($fila) : null;
    }

    public function crear(array $p): int {
        $stmt = $this->db->prepare(
            "INSERT INTO Product (name_product, category, price, stock, desc_product)
             VALUES (:name, :category, :price, :stock, :description)"
        );
        $stmt->execute($p);
        return (int) $this->db->lastInsertId();
    }

    public function actualizar(int $id, array $p): bool {
        $stmt = $this->db->prepare(
            "UPDATE Product SET name_product = :name, category = :category, price = :price,
                                stock = :stock, desc_product = :description
              WHERE id_product = :id"
        );
        return $stmt->execute($p + ['id' => $id]);
    }

    public function eliminar(int $id): bool {
        $stmt = $this->db->prepare("DELETE FROM Product WHERE id_product = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->rowCount() > 0;
    }

    private function formatear(array $fila): array {
        $fila['id'] = (int) $fila['id'];
        $fila['price'] = (float) $fila['price'];
        $fila['stock'] = (int) $fila['stock'];
        return $fila;
    }
}
