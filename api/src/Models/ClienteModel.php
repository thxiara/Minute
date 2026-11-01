<?php
namespace App\Models;

class ClienteModel {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function contarClientes() {
        try {
            $stmt = $this->db->query('SELECT COUNT(*) AS total FROM Client');
            $fila = $stmt->fetch(\PDO::FETCH_ASSOC);
            return (int) $fila['total'];
        } catch (\Exception $e) {
            return false; 
        }
    }

    // Socios = clientes con el rol 4 (ver api/config/init.sql).
    public function listarSocios() {
        try {
            $query = "SELECT
                            cl.id_client,
                            cl.name_client,
                            cl.ci,
                            cl.phone,
                            cr.email,
                            (
                                SELECT MAX(mm.expiry_date)
                                FROM member_membership mm
                                WHERE mm.fr_client = cl.id_client
                            ) AS expiry_date
                      FROM Client cl
                      INNER JOIN Credentials cr ON cr.id_credentials = cl.fr_credentials
                      WHERE cl.fr_role = 4
                      ORDER BY cl.name_client ASC";

            $stmt = $this->db->query($query);
            return $stmt->fetchAll(\PDO::FETCH_ASSOC);
        } catch (\Exception $e) {
            error_log($e->getMessage());
            return false;
        }
    }
}