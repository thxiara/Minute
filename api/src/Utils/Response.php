<?php

namespace App\Utils;

class Response
{
    public static function json(bool $success, string $message, array $extra = [], int $statusCode = 200): void
    {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array_merge(
            ['success' => $success, 'message' => $message],
            $extra
        ));
        exit();
    }
}
