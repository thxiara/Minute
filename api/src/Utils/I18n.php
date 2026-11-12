<?php

namespace App\Utils;

// Traducción de los textos que manda el servidor (mensajes de la API y marcas de la landing).
// El texto en español es la clave: si un idioma no tiene traducción para un texto, sale en español.
// Los diccionarios están en api/lang/<idioma>.php.
class I18n
{
    public const IDIOMAS = ['es', 'en'];
    public const POR_DEFECTO = 'es';
    public const COOKIE = 'lang';

    private static ?string $idioma = null;
    private static array $diccionarios = [];

    // Idioma del pedido: primero la cookie "lang" (la escribe el selector de idioma del front)
    // y, si no está, el idioma preferido del navegador (cabecera Accept-Language).
    public static function idioma(): string
    {
        if (self::$idioma !== null) {
            return self::$idioma;
        }

        $cookie = $_COOKIE[self::COOKIE] ?? '';
        if (is_string($cookie) && in_array($cookie, self::IDIOMAS, true)) {
            return self::$idioma = $cookie;
        }

        // "en-US,en;q=0.9,es;q=0.8" → se prueban en el orden en que vienen.
        $cabecera = (string) ($_SERVER['HTTP_ACCEPT_LANGUAGE'] ?? '');
        foreach (explode(',', $cabecera) as $parte) {
            $codigo = strtolower(substr(trim($parte), 0, 2));
            if (in_array($codigo, self::IDIOMAS, true)) {
                return self::$idioma = $codigo;
            }
        }

        return self::$idioma = self::POR_DEFECTO;
    }

    // Traduce un texto. Los valores variables van como {nombre} en el texto y en $valores:
    // I18n::t('Panel de {nombre}', ['nombre' => 'Ana'])
    public static function t(string $texto, array $valores = []): string
    {
        $idioma = self::idioma();
        if ($idioma !== self::POR_DEFECTO) {
            $texto = self::diccionario($idioma)[$texto] ?? $texto;
        }
        foreach ($valores as $nombre => $valor) {
            $texto = str_replace('{' . $nombre . '}', (string) $valor, $texto);
        }

        return $texto;
    }

    private static function diccionario(string $idioma): array
    {
        if (!isset(self::$diccionarios[$idioma])) {
            $archivo = __DIR__ . '/../../lang/' . $idioma . '.php';
            $contenido = is_file($archivo) ? require $archivo : [];
            self::$diccionarios[$idioma] = is_array($contenido) ? $contenido : [];
        }

        return self::$diccionarios[$idioma];
    }
}
