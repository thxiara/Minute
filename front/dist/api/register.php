<?php

require_once __DIR__ . '/../../../api/config/db_connection.php';
require_once __DIR__ . '/../../../api/src/Utils/Response.php';
require_once __DIR__ . '/../../../api/src/Models/UserModel.php';
require_once __DIR__ . '/../../../api/src/Controllers/AuthController.php';

use App\Controllers\AuthController;
use App\Utils\Response;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    Response::json(false, 'Método no permitido.', [], 405);
}

$controller = new AuthController($conn);
$controller->register($_POST);
?>