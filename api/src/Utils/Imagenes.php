<?php

namespace App\Utils;

class Imagenes
{
    public const LADO_PFP = 128;                      // px: las fotos de perfil quedan de 128 × 128
    public const MAX_BYTES_PFP = 5 * 1024 * 1024;
    public const MAX_BYTES_EJERCICIO = 5 * 1024 * 1024;
    public const MAX_BYTES_PRODUCTO = 5 * 1024 * 1024;

    private const CALIDAD_JPG = 85;
    private const MAX_LADO_ORIGINAL = 8000;           // px: más grande que esto no se intenta abrir
    private const MAX_PIXELES_ORIGINAL = 40000000;
    private const MAX_LADO_EJERCICIO = 800;           // px: las imágenes fijas se achican (sin recortar)
    private const MAX_LADO_PRODUCTO = 800;            // px: ídem para los productos
    private const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];


    public static function rutaPfp(int $id): ?string
    {
        return self::rutaSiExiste('PFP_DIR', $id, 'jpg');
    }

    public static function rutaEjercicio(int $id): ?string
    {
        return self::rutaSiExiste('EXERCISE_DIR', $id, 'gif');
    }

    public static function rutaProducto(int $id): ?string
    {
        return self::rutaSiExiste('PRODUCT_DIR', $id, 'jpg');
    }


    // Foto de perfil: se recorta al centro en un cuadrado (1:1), se lleva a 128 × 128
    // y se guarda como JPG en PFP_DIR/<id>.jpg.
    public static function guardarPfp(int $id, string $bytes): void
    {
        $info = self::inspeccionar($bytes, self::MAX_BYTES_PFP);
        $original = self::abrir($bytes, $info['mime']);

        $ancho = imagesx($original);
        $alto = imagesy($original);
        $lado = min($ancho, $alto);

        $foto = self::lienzoBlanco(self::LADO_PFP, self::LADO_PFP);
        imagecopyresampled(
            $foto, $original,
            0, 0, intdiv($ancho - $lado, 2), intdiv($alto - $lado, 2),
            self::LADO_PFP, self::LADO_PFP, $lado, $lado
        );

        self::escribir('PFP_DIR', $id, 'jpg', fn(string $temporal) => imagejpeg($foto, $temporal, self::CALIDAD_JPG));
    }

    // Imagen de un ejercicio: siempre termina siendo EXERCISE_DIR/<id>.gif y nunca se recorta.
    // Si ya es un GIF se guarda tal cual (así no pierde la animación); si es JPG, PNG o WEBP
    // se convierte a GIF de un solo cuadro.
    public static function guardarEjercicio(int $id, string $bytes): void
    {
        $info = self::inspeccionar($bytes, self::MAX_BYTES_EJERCICIO);
        // Se abre aunque sea GIF: confirma que el archivo se puede leer de verdad.
        $original = self::abrir($bytes, $info['mime']);

        if ($info['mime'] === 'image/gif') {
            self::escribir('EXERCISE_DIR', $id, 'gif', fn(string $temporal) => file_put_contents($temporal, $bytes) !== false);
            return;
        }

        $imagen = self::achicar($original, self::MAX_LADO_EJERCICIO);
        // GIF admite hasta 256 colores.
        imagetruecolortopalette($imagen, true, 255);

        self::escribir('EXERCISE_DIR', $id, 'gif', fn(string $temporal) => imagegif($imagen, $temporal));
    }

    // Imagen de un producto: se achica (sin recortar) y se guarda como JPG en PRODUCT_DIR/<id>.jpg.
    // Un GIF animado queda con su primer cuadro.
    public static function guardarProducto(int $id, string $bytes): void
    {
        $info = self::inspeccionar($bytes, self::MAX_BYTES_PRODUCTO);
        $imagen = self::achicar(self::abrir($bytes, $info['mime']), self::MAX_LADO_PRODUCTO);

        self::escribir('PRODUCT_DIR', $id, 'jpg', fn(string $temporal) => imagejpeg($imagen, $temporal, self::CALIDAD_JPG));
    }

    public static function borrarProducto(int $id): void
    {
        $ruta = self::rutaProducto($id);
        if ($ruta !== null && !@unlink($ruta)) {
            error_log("No se pudo borrar la imagen del producto $id ($ruta).");
        }
    }

    public static function comprobar(string $bytes, int $maxBytes): void
    {
        self::abrir($bytes, self::inspeccionar($bytes, $maxBytes)['mime']);
    }

    public static function desdeDataUrl($dataUrl, int $maxBytes): string
    {
        if (!is_string($dataUrl) || !preg_match('#^data:image/[a-z0-9.+-]+;base64,(.+)$#s', $dataUrl, $partes)) {
            throw new \InvalidArgumentException('El archivo tiene que ser una imagen JPG, PNG, WEBP o GIF.');
        }
        // En base64 cada 4 caracteres son 3 bytes: se corta antes de decodificar si ya se pasa.
        if (strlen($partes[1]) > (int) ceil($maxBytes / 3) * 4 + 4) {
            throw new \InvalidArgumentException(self::mensajeMuyPesada($maxBytes));
        }
        $bytes = base64_decode($partes[1], true);
        if ($bytes === false || $bytes === '') {
            throw new \InvalidArgumentException('El archivo no es una imagen válida.');
        }

        return $bytes;
    }


    public static function enviar(string $ruta, string $tipo): void
    {
        // El navegador puede guardar la imagen pero siempre pregunta si cambió:
        // si no cambió se responde 304 y no se vuelve a descargar.
        $etag = '"' . filemtime($ruta) . '-' . filesize($ruta) . '"';
        header('Cache-Control: private, no-cache');
        // La sesión de PHP agrega estas dos cabeceras para que nada se guarde: acá no aplican.
        header_remove('Pragma');
        header_remove('Expires');
        header('ETag: ' . $etag);
        header('X-Content-Type-Options: nosniff');

        if (trim((string) ($_SERVER['HTTP_IF_NONE_MATCH'] ?? '')) === $etag) {
            http_response_code(304);
            header_remove('Content-Type');
            exit();
        }

        http_response_code(200);
        header('Content-Type: ' . $tipo);
        header('Content-Length: ' . filesize($ruta));
        readfile($ruta);
        exit();
    }


    private static function carpeta(string $variable): string
    {
        $carpeta = trim((string) getenv($variable));
        if ($carpeta === '') {
            throw new \RuntimeException("Falta la variable $variable en api/.env.");
        }
        // Una ruta relativa se toma desde la carpeta api/.
        if ($carpeta[0] !== '/' && !preg_match('#^[A-Za-z]:[\\\\/]#', $carpeta)) {
            $carpeta = dirname(__DIR__, 2) . '/' . $carpeta;
        }
        $carpeta = rtrim($carpeta, '/\\');

        if (!is_dir($carpeta) && !@mkdir($carpeta, 0750, true) && !is_dir($carpeta)) {
            throw new \RuntimeException("No se pudo crear la carpeta de $variable ($carpeta).");
        }

        return $carpeta;
    }

    private static function rutaSiExiste(string $variable, int $id, string $extension): ?string
    {
        if ($id <= 0) {
            return null;
        }
        try {
            $ruta = self::carpeta($variable) . '/' . $id . '.' . $extension;
        } catch (\RuntimeException $e) {
            error_log($e->getMessage());
            return null;
        }

        return is_file($ruta) ? $ruta : null;
    }

    // Revisa peso, tipo y tamaño ANTES de abrir la imagen. Devuelve ['mime' => ...].
    private static function inspeccionar(string $bytes, int $maxBytes): array
    {
        if (!function_exists('imagecreatefromstring')) {
            throw new \RuntimeException('Falta la extensión GD de PHP: no se pueden procesar imágenes.');
        }
        if (strlen($bytes) > $maxBytes) {
            throw new \InvalidArgumentException(self::mensajeMuyPesada($maxBytes));
        }

        // No alcanza con lo que diga el nombre o el texto del pedido: se mira el contenido.
        $info = @getimagesizefromstring($bytes);
        if (!$info || !in_array($info['mime'], self::TIPOS, true)) {
            throw new \InvalidArgumentException('El archivo tiene que ser una imagen JPG, PNG, WEBP o GIF.');
        }
        [$ancho, $alto] = $info;
        if ($ancho < 1 || $alto < 1
            || max($ancho, $alto) > self::MAX_LADO_ORIGINAL
            || $ancho * $alto > self::MAX_PIXELES_ORIGINAL) {
            throw new \InvalidArgumentException('La imagen es demasiado grande.');
        }

        return ['mime' => $info['mime']];
    }

    private static function abrir(string $bytes, string $mime): \GdImage
    {
        $imagen = @imagecreatefromstring($bytes);
        if (!$imagen) {
            throw new \InvalidArgumentException('El archivo no es una imagen válida.');
        }

        // Las fotos de celular se guardan "acostadas" y anotan cómo girarlas.
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $exif = @exif_read_data('data://image/jpeg;base64,' . base64_encode($bytes));
            $giros = [3 => 180, 6 => -90, 8 => 90];
            $giro = $giros[(int) ($exif['Orientation'] ?? 0)] ?? 0;
            if ($giro !== 0) {
                $girada = imagerotate($imagen, $giro, 0);
                if ($girada) {
                    $imagen = $girada;
                }
            }
        }

        return $imagen;
    }

    // Copia la imagen en un lienzo blanco cuyo lado más largo mide como mucho $maxLado px.
    private static function achicar(\GdImage $original, int $maxLado): \GdImage
    {
        $ancho = imagesx($original);
        $alto = imagesy($original);
        $escala = min(1, $maxLado / max($ancho, $alto));
        $nuevoAncho = max(1, (int) round($ancho * $escala));
        $nuevoAlto = max(1, (int) round($alto * $escala));

        $imagen = self::lienzoBlanco($nuevoAncho, $nuevoAlto);
        imagecopyresampled($imagen, $original, 0, 0, 0, 0, $nuevoAncho, $nuevoAlto, $ancho, $alto);

        return $imagen;
    }

    // Ni JPG ni GIF (convertido) llevan transparencia: lo transparente queda blanco.
    private static function lienzoBlanco(int $ancho, int $alto): \GdImage
    {
        $lienzo = imagecreatetruecolor($ancho, $alto);
        imagefill($lienzo, 0, 0, imagecolorallocate($lienzo, 255, 255, 255));

        return $lienzo;
    }

    // Escribe primero un archivo temporal y después lo renombra: el archivo anterior se
    // reemplaza de una sola vez y nunca queda una imagen a medio escribir.
    private static function escribir(string $variable, int $id, string $extension, callable $escritor): void
    {
        if ($id <= 0) {
            throw new \RuntimeException('Id inválida para guardar la imagen.');
        }
        $carpeta = self::carpeta($variable);
        $destino = $carpeta . '/' . $id . '.' . $extension;
        $temporal = @tempnam($carpeta, 'tmp');

        // Si la carpeta no se puede escribir, tempnam() crea el archivo en la carpeta temporal del sistema.
        $enCarpeta = $temporal !== false && realpath(dirname($temporal)) === realpath($carpeta);
        if (!$enCarpeta || !$escritor($temporal) || !@rename($temporal, $destino)) {
            if ($temporal !== false) {
                @unlink($temporal);
            }
            throw new \RuntimeException("No se pudo escribir en la carpeta de $variable ($carpeta).");
        }
        @chmod($destino, 0644);
        clearstatcache(true, $destino);
    }

    private static function mensajeMuyPesada(int $maxBytes): string
    {
        return I18n::t('La imagen no puede pesar más de {mb} MB.', ['mb' => (int) floor($maxBytes / (1024 * 1024))]);
    }
}
