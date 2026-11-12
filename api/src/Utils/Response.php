<?php

namespace App\Utils;

class Response
{
    // $message se escribe en español y sale traducido al idioma del pedido (ver I18n).
    // $valores reemplaza las marcas {nombre} del mensaje.
    public static function json(bool $success, string $message, array $extra = [], int $statusCode = 200, array $valores = []): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Language: ' . I18n::idioma());
        // La misma URL responde distinto según el idioma: que ningún caché las mezcle.
        header('Vary: Cookie, Accept-Language');
        echo json_encode(array_merge(
            ['success' => $success, 'message' => I18n::t($message, $valores)],
            $extra
        ));
        exit();
    }
}
