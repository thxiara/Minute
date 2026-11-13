<?php

namespace App\Controllers;

use App\Models\ProductoModel;
use App\Utils\Auth;
use App\Utils\Entrada;
use App\Utils\Imagenes;
use App\Utils\Response;

// Catálogo de productos (panel de administración).
class ProductoController
{
    // Las mismas categorías que ofrece el formulario.
    private const CATEGORIAS = ['Suplementos', 'Accesorio', 'Ropa', 'Otros'];

    private ProductoModel $productos;

    public function __construct($db)
    {
        $this->productos = new ProductoModel($db);
    }

    // GET /api/productos
    public function listar(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $productos = $this->productos->listar();
        Response::json(true, 'Productos obtenidos.', ['productos' => $productos, 'total' => count($productos)]);
    }

    // GET /api/productos/:id
    public function ver(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $producto = $this->productos->buscar((int) $id);
        if (!$producto) {
            Response::json(false, 'No se encontró el producto.', [], 404);
        }
        Response::json(true, 'Producto obtenido.', ['producto' => $producto]);
    }

    // POST /api/productos
    public function crear(): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $id = $this->productos->crear($this->validar());
        Response::json(true, 'Producto creado.', ['producto' => $this->productos->buscar($id)], 201);
    }

    // PUT /api/productos/:id
    public function actualizar(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $productoId = (int) $id;
        if (!$this->productos->buscar($productoId)) {
            Response::json(false, 'No se encontró el producto que intentas editar.', [], 404);
        }
        $this->productos->actualizar($productoId, $this->validar());
        Response::json(true, 'Producto actualizado.', ['producto' => $this->productos->buscar($productoId)]);
    }

    // DELETE /api/productos/:id
    public function eliminar(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        try {
            $borrado = $this->productos->eliminar((int) $id);
        } catch (\PDOException $e) {
            error_log($e->getMessage());
            Response::json(false, 'No se pudo eliminar el producto.', [], 500);
        }
        if (!$borrado) {
            Response::json(false, 'No se encontró el producto que intentas eliminar.', [], 404);
        }
        Imagenes::borrarProducto((int) $id);
        Response::json(true, 'Producto eliminado correctamente.');
    }

    // PUT /api/productos/:id/imagen   { image: "data:image/...;base64,..." }
    public function subirImagen(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN);
        $productoId = (int) $id;
        if (!$this->productos->buscar($productoId)) {
            Response::json(false, 'No se encontró el producto.', [], 404);
        }

        try {
            $bytes = Imagenes::desdeDataUrl(Entrada::json()['image'] ?? null, Imagenes::MAX_BYTES_PRODUCTO);
            Imagenes::guardarProducto($productoId, $bytes);
        } catch (\InvalidArgumentException $e) {
            Response::json(false, $e->getMessage(), [], 400);
        } catch (\RuntimeException $e) {
            error_log('Imagen de producto: ' . $e->getMessage());
            Response::json(false, 'No se pudo guardar la imagen.', [], 500);
        }

        Response::json(true, 'Imagen del producto actualizada.', ['producto' => $this->productos->buscar($productoId)]);
    }

    // GET /api/productos/:id/imagen → la imagen (o 404 si no tiene). Cualquier usuario logueado.
    public function imagen(string $id): void
    {
        Auth::exigirRol(Auth::ROL_ADMIN, Auth::ROL_ENTRENADOR, Auth::ROL_PROFESOR, Auth::ROL_SOCIO);

        $ruta = Imagenes::rutaProducto((int) $id);
        if ($ruta === null) {
            Response::json(false, 'Sin imagen.', [], 404);
        }

        Imagenes::enviar($ruta, 'image/jpeg');
    }

    private function validar(): array
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $data = is_array($data) ? $data : [];

        $nombre = trim((string) ($data['name'] ?? ''));
        $categoria = trim((string) ($data['category'] ?? ''));
        $precio = $data['price'] ?? null;
        $stock = $data['stock'] ?? null;
        $descripcion = trim((string) ($data['description'] ?? ''));

        if ($nombre === '' || mb_strlen($nombre) > 40) {
            Response::json(false, 'El nombre tiene que tener entre 1 y 40 caracteres.', [], 400);
        }
        if (!in_array($categoria, self::CATEGORIAS, true)) {
            Response::json(false, 'Selecciona una categoría.', [], 400);
        }
        if (!is_numeric($precio) || $precio < 0 || $precio > 99999999) {
            Response::json(false, 'El precio debe ser un número mayor o igual a cero.', [], 400);
        }
        if (!is_numeric($stock) || (int) $stock != $stock || $stock < 0 || $stock > 999999) {
            Response::json(false, 'El stock debe ser un entero entre 0 y 999999.', [], 400);
        }
        if (mb_strlen($descripcion) > 240) {
            Response::json(false, 'La descripción puede tener hasta 240 caracteres.', [], 400);
        }

        return [
            'name' => $nombre,
            'category' => $categoria,
            'price' => round((float) $precio, 2),
            'stock' => (int) $stock,
            'description' => $descripcion,
        ];
    }
}
