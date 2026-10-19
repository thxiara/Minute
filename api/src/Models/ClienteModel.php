<?php
namespace App\Models;

class ClienteModel {
    private $db;

    # Se define la variable db a traves del constructor (el valor se ingresa como parametro al instanciar la clase ClienteModel).
    public function __construct($db) {
        $this->db = $db;
    }

    public function contarClientes() {
        try {
            # Lo que devuelve el query es una tabla de SQL con una sola fila y una sola columna la cual es referenciada por la variable $stmt,
            # que contiene el total de clientes en la base de datos.
            $stmt = $this->db->query('SELECT COUNT(*) AS total FROM Client');

            # Se obtiene la primera fila del resultado de la consulta y se traduce a un array.
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            # Se devuelve el valor de la única columna ('total') del array $fila como un entero. 
            return (int) $fila['total'];
        } 

        # La razon del por qué en el return hay false, es porque al utilizar valores booleanos se evita confundir al usuario, 
        # siendo que un valor entero de 0 puede ser interpretado tanto como que no hay clientes, como que hubo un error en la consulta.
        catch (\Exception $e) {
            return false; 
        }
    }
}