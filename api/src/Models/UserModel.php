<?php

namespace App\Models;

use PDO;
use PDOException;

class UserModel
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function existsByEmail(string $email): bool
    {
        $query = "SELECT id_credentials FROM credentials WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['email' => $email]);

        return (bool) $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create(string $name, string $email, string $hashedPassword, ?string $phone = null): bool
    {
        try {
            $this->db->beginTransaction();

            $stmtCredentials = $this->db->prepare(
                "INSERT INTO credentials (email, password) VALUES (:email, :password)"
            );
            $stmtCredentials->execute([
                'email' => $email,
                'password' => $hashedPassword,
            ]);
            $credentialsId = $this->db->lastInsertId();

            $stmtClient = $this->db->prepare(
                "INSERT INTO client (name_client, phone, fr_credentials) VALUES (:name, :phone, :fr_credentials)"
            );
            $stmtClient->execute([
                'name' => $name,
                'phone' => $phone,
                'fr_credentials' => $credentialsId,
            ]);

            $this->db->commit();

            return true;
        } catch (PDOException $e) {
            $this->db->rollBack();

            return false;
        }
    }

    public function findByEmail(string $email): ?array
    {
        $query = "SELECT
                        cl.id_client,
                        cl.name_client,
                        cl.phone,
                        cr.id_credentials,
                        cr.email,
                        cr.password
                   FROM credentials cr
                   INNER JOIN client cl ON cl.fr_credentials = cr.id_credentials
                   WHERE cr.email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        return $user ?: null;
    }
}
