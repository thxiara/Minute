<?php

namespace App\Utils;

// Lectura y límites de los datos que llegan en los pedidos.
class Entrada
{
    // Largo máximo (en caracteres) de cada tipo de campo. Los formularios del front
    // usan los mismos números en sus atributos maxlength.
    public const MAX_EMAIL = 50;
    public const MAX_PASSWORD = 50;
    public const MIN_PASSWORD = 8;
    public const MAX_NOMBRE = 30;
    public const MAX_TELEFONO = 20;
    public const MAX_CI = 20;

    // Cuerpo JSON del pedido como array ([] si no vino o no es un objeto JSON).
    public static function json(): array
    {
        $datos = json_decode((string) file_get_contents('php://input'), true);

        return is_array($datos) ? $datos : [];
    }

    // Devuelve el campo SIEMPRE como string: si el cliente mandó un número
    // (ej. {"ci": 12345678} o {"password": 12345678}) se guarda como el texto "12345678".
    // Lo que no es texto ni número (listas, objetos, true/false, null) cuenta como vacío.
    public static function texto(array $datos, string $campo, bool $recortar = true): string
    {
        $valor = $datos[$campo] ?? '';
        if (is_int($valor)) {
            $valor = (string) $valor;
        } elseif (is_float($valor)) {
            // Un número sin decimales se escribe entero: 99123456.0 → "99123456" (no "9.9123456E+7").
            $valor = (is_finite($valor) && floor($valor) === $valor && abs($valor) < 1e15)
                ? number_format($valor, 0, '', '')
                : (string) $valor;
        } elseif (!is_string($valor)) {
            return '';
        }

        return $recortar ? trim($valor) : $valor;
    }

    // Teléfono: solo dígitos, así "099 123 456" y "099-123-456" se guardan igual
    // y conservan el 0 inicial (por eso es texto y no número).
    public static function telefono(array $datos, string $campo): string
    {
        return preg_replace('/\D+/', '', self::texto($datos, $campo));
    }

    public static function largo(string $texto): int
    {
        return mb_strlen($texto, 'UTF-8');
    }
}
