<?php
namespace App\Utils;

class EnvLoader {
    public static function load($path) {
        if (!file_exists($path)) return;

        #Lee el env y separa sus lineas en items de un array
        #(Omitiendo lineas vacias y caracteres de nueva linea)
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            #Saca whitespace del principio y final de la linea
            $line = trim($line);
            #Si la linea quedo vacia o empieza con "#" (comentario)
            #se salta al siguiente bucle
            if ($line === '' || strpos($line, '#') === 0) continue;
            #Se separa la linea en un máximo de dos items en un array:
            #uno antes y otro despues del "=" (nombre y valor de variable)
            $parts = explode('=', $line, 2);
            if (count($parts) !== 2) continue;
            $name = trim($parts[0]);
            $value = trim($parts[1]);
            #Elimina BOM del archivo si lo contiene
            #(no preguntes que es BOM)
            $name = preg_replace('/^\xEF\xBB\xBF/', '', $name);
            if ($name === '') continue;

            #Si la variable no se encuentra definida en el entorno del servidor
            if (getenv($name) === false){
                #Se la define
                putenv($name . '=' . $value);
            }
            #(Sí si se continua)
        }
    }
}
