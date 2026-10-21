<?php

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

#Arranca el Output Buffering, esto hace que cuando se ejecuta un archivo de php, no se mande al usuario como output directamente el html, whitespace, y prints/echos. En vez de eso se guarda el output en un buffer y se espera a que se indique especificamente que este tiene que ser enviado.
ob_start(); 

##Determina los headers (metadatos) que van a ser devueltos a un cliente que le haga un request
#Se determina el tipo de contenido que se va a devolver
header("Content-Type: application/json; charset=UTF-8");
#Se permite a sitios o aplicaciones externas (que no esten en la misma ip y/o puerto que nuestro sitio) recibir y procesar el contenido que devolvamos.
header("Access-Control-Allow-Origin: *");
#Se identifican los metodos que pueden contener los requests de un cliente
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
#se identifican los headers que pueden contener los requests de un cleinte
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

#Se procesan los metodos de tipo options, estos son realizados por el cliente para chequear si el request que quiere hacer esta permitido (si los metodos, headers y origen que utiliza fueron aprobados). En caso de que estos esten permitidos (segun lo definido en los headers de access-control arriba) el servidor manda una respuesta de 200 (OK), indicandole al cliente que efectivamente tiene permiso de haceir su verdadero request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

#Se carga el autoload, este procesara automaticamente las rutas dadas cuando se quieren utilizar recursos encontrados en una clase externa al archivo; asi evitamos tener que requerir cada una individualmente
require_once 'autoload.php';

\App\Utils\EnvLoader::load(__DIR__ . '/.env');

require_once 'config/database.php';

try {
    $db = (new Database())->getConnection();
} catch (Throwable $e) {
    ob_clean();
    error_log('DB connection failed: ' . $e->getMessage());
    http_response_code(500);
    $isLocalHost = isset($_SERVER['HTTP_HOST'])
        && (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false
            || strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);
    $clientMsg = $isLocalHost
        ? ('Error crítico de BD: ' . $e->getMessage())
        : 'Error crítico de BD: no se pudo conectar al servidor de datos';
    echo json_encode([
        'status' => 'error',
        'message' => $clientMsg,
    ]);
    exit;
}

$base = '/api';

$router = new \App\Utils\Router($base, $db);

require_once 'routes.php';

$basura = ob_get_clean(); 

$router->run();
