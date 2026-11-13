<?php
namespace App\Utils;

class Router {
    private $routes = [];
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    #funciones que serán referenciadas cuando se requiere el routes.php
    #ejecutan addRoute con los parametros correspondientes para cada entrada (de routes)
    public function get($path, $handler) { $this->addRoute('GET', $path, $handler); }
    public function post($path, $handler) { $this->addRoute('POST', $path, $handler); }
    public function put($path, $handler) { $this->addRoute('PUT', $path, $handler); }
    public function delete($path, $handler) { $this->addRoute('DELETE', $path, $handler); }

    #Añade rutas con su método y controlador correspondiente en el array $routes
    #Las rutas recibidas a través de run serán comparadas con las encontradas en este array
    private function addRoute($method, $path, $handler) {
        #se guarda la estructura básica de la ruta, y se reemplaza de un ":" para adelante con un patrón de regex 
        #(o hasta un "/" o "." reemplazando nuevamente hacía adelante si se encuentra con otro ":") 
	#este patrón permitira que se puedan recibir valores dinamicos en el espacio ahora ocupado por el patrón
        $pattern = preg_replace('/:[a-zA-Z0-9]+/', '([a-zA-Z0-9_-]+)', $path);

        #Se agrega una nueva entrada al array de routes 
        $this->routes[] = [
            'method' => $method,
            #Se suma sintaxis a $pattern al guardarlo en el array, para que sea un regex
            #este hará match ante cualquier ruta recibida que cumpla la estructura básica guardada
            #(sin importar el texto que tenga después del ":" ya que este será dinámico).
            #También hará match sin importar si la ruta termina con o sin un "/"
            'pattern' => "#^" . $pattern . "/?$#",
            'handler' => $handler 
        ];
    }

    public function run() {
	#Extrae solo la ruta de la uri recibida (saca https://...)
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

        $method = $_SERVER['REQUEST_METHOD'];

	#Elimina "/index.php" en caso de que la ruta lo contenga
        $uri = str_replace('/index.php', '', $uri);

	#Cambia la uri a "/" en caso de que este vacia
        if (empty($uri)) {
            $uri = '/';
        }

        foreach ($this->routes as $route) {
            #Se ejecuta si el método y url es igual al de una entrada en $routes
            #Se guardará en matches[0] el texto completo que haya coincidido
            #Y en matches[1] en adelante cada coincidencia a un patrón entre paréntesis dentro del regex
            #(Una entrada por cada match al contenido que va dentro del paréntesis)
            if ($route['method'] === $method && preg_match($route['pattern'], $uri, $matches)) {
                #Elimina matches[0] y mueve todas las entradas un paso atras
                #(ya que matches[0] contiene el match completo del texto, y solo nos interesa el match que hicieron los paréntesis)
                array_shift($matches); 
                return $this->resolve($route['handler'], $matches);
            }
        }
        #404 en caso de que la ejecución de arriba no hizo return
        #(La url ingresada no se encontraba en routes)
        http_response_code(404);

        #Si no es una ruta de la API (ej. /dash/algo-que-no-existe) la pidió un navegador:
        #se le muestra la página 404 en vez de un JSON
        if (!preg_match('#^/api(/|$)#', $uri)) {
            header('Content-Type: text/html; charset=UTF-8');
            header('Cache-Control: no-store');
            readfile(__DIR__ . '/../../../front/404.html');
            return;
        }

        echo json_encode([
            "status" => "error", 
            "message" => I18n::t("Ruta no encontrada en la API"),
        ]);
    }

    private function resolve($handler, $params) {
        #Separa el handler en una variable de controlador y una de método
        #(Se separa el string donde se encuentre un "@",
        #se asigna cada string resultante a una entrada en un array,
        #y se asigna cada entrada en orden a una de la variables del list 
        list($controllerName, $method) = explode('@', $handler);

        #Se hace una variable con la ruta al controlador a ser usado
        #(El cuál deberá estar dentro de /api/src/Controllers/)
        $controllerClass = "App\\Controllers\\" . $controllerName;

        if (class_exists($controllerClass)) {
            #Se crea un objeto con el controlador, y se le da el PDO como parámetro
            $controller = new $controllerClass($this->db);

            if (method_exists($controller, $method)) {
                #Se llama a la función (method) indicada dentro del objeto creado con el controlador 
                #Dandole como parámetro a la función el array de ids obtendidas de la ruta
                return call_user_func_array([$controller, $method], $params);
            }
        }
        #500 si la ejecución de arriba no hizo return
        #(el controlador o método a ser usados no fueron encontrados)
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Error interno: Controlador ($controllerName) o método ($method) no válido"
        ]);
    }
}
