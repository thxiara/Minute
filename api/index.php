<?php

#No se muestran errores en el header enviado al usuario, solo se muestran en el log del servidor
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

#Si algo falla sin que nadie lo atrape (ej. a la base le falta una columna porque no se corrió
#la migración), se responde un JSON con el error en vez de una respuesta vacía.
set_exception_handler(function (Throwable $e) {
    error_log('Error no controlado: ' . $e->getMessage());
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    $traducir = fn(string $texto) => class_exists('\\App\\Utils\\I18n') ? \App\Utils\I18n::t($texto) : $texto;
    $faltaMigracion = $e instanceof PDOException && in_array($e->getCode(), ['42S22', '42S02'], true);
    echo json_encode([
        'success' => false,
        'message' => $traducir($faltaMigracion
            ? 'La base de datos está desactualizada: recreá la base con api/config/init.sql.'
            : 'Error interno del servidor.'),
    ]);
});

#Las fechas ("hoy", vencimientos, etc.) se calculan con la hora de Uruguay
date_default_timezone_set('America/Montevideo');

#Se activa el buffer de salida para que este guarde todos los datos que se van a mandar al usuario, que estos puedan ser gestionados antes de su envio, y que el envio tenga que ser especificamente habilitado con una instrucción en el código
ob_start(); 

#Se especifican las cabeceras por defecto (el tipo de contenido podrá ser alterado para enviar otros tipos de datos, ya que el buffer no se enviara hasta que se lo indiquemos)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

#Si el request es un options, lo responde directamente en vez de seguir con la ejecución (como si se haría con un get, post, etc.)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

#El servidor rechaza ids de sesión que el no haya generado y solo manda ids de sesión a través del header de cookies
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');

#Se configuran las cookies de PHPSESSID, estas serán:
session_set_cookie_params([
    #validas en cualquier parte del sitio
    'path'     => '/',
    #no legibles por javascript
    'httponly' => true,
    #Protección contra CSRF (que un cliente externo malicioso haga acciones con la sesión de un usuario de confianza sin su conocimiento)
    'samesite' => 'Lax',
    #para que viajen seguras a través de https (agregar a futuro),
    #'secure' => true, 
]);

#Carga la sesión correspondiente a la id enviada por el cliente o crea una nueva si no cuenta con una
session_start();

#Se carga el autoloader, haciendo que se puedan referenciar funciones y argumentos de otros archivos sin requerirlos (mientras se otorgue la ruta hasta estos en la referencia)
require_once (__DIR__ . '/autoload.php');

#Se carga el env que contiene las credenciales para acceder a la base de datos (se debe rellenar manualmente)
\App\Utils\EnvLoader::load(__DIR__ . '/.env');

#Se carga el archivo de configuración de la base de datos
require_once (__DIR__ . '/config/database.php');

#Se trata de hacer la conexión con la base de datos a través de PDO utilizando las credenciales del env
try {
    $db = (new Database())->getConnection();
} catch (Throwable $e) {
    #si la conexión con la bd falla:

    #descarta salidas previas
    ob_clean();

    #imprime el error en los logs del servidor
    error_log('DB connection failed: ' . $e->getMessage());

    #y manda un mensaje de error sin detalles internos al cliente
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => \App\Utils\I18n::t('Error crítico de BD: no se pudo conectar a la base de datos'),
    ]);

    exit;
}


#Si hay sesión, se confirma que el usuario siga activo y se refresca su rol
#(así, si el admin lo da de baja, pierde el acceso en el siguiente pedido)
if (!empty($_SESSION['client_id'])) {
    $stmt = $db->prepare('SELECT fr_role FROM Client WHERE id_client = :id AND active_client = 1');
    $stmt->execute(['id' => $_SESSION['client_id']]);
    $rolActual = $stmt->fetchColumn();
    if ($rolActual === false) {
        $_SESSION = [];
        session_destroy();
    } else {
        $_SESSION['role_id'] = (int) $rolActual;
    }
}

#Se instancia el router y se le pasa la conexión a la db, la cuál despues podrá pasar al controlador correspondiente a la ruta recibida
$router = new \App\Utils\Router($db);

#Se requiere el listado de controladores que manejaran pedidos a las ruta de la aplicación (diferenciandose el método con que se hagan estos pedidos)
require_once (__DIR__ . '/routes.php');

#Cierra el buffer y borra sus contenidos
ob_end_clean(); 

#Compara la URI y su método con la lista de routes, si hay una coincidencia carga el controlador correspondiente. Si no hay coincidencia con la lista de routes envía un 404 al cliente
$router->run();
