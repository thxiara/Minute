<?php
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/src/';
    $len = strlen($prefix);
# se compara si el prefijo de la ruta recibida es correspondiente a la de este autoloader (prefix)
    if (strncmp($prefix, $class, $len) !== 0) return;
#Quita el prefijo de la ruta recibida para poder referenciarla
    $relative_class = substr($class, $len);
#Cambia todos los separadores de namescpace (\) por separadores de directorio (/)
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
#Se chequea si el archivo existe y no es un directorio, si es así se lo requiere
    if (is_file($file)) require $file;
    else error_log("Autoload: $class dirige al archivo $file, el cual no existe"); 
});
