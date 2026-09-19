INSERT INTO Credentials (email, password)
VALUES ('admin@fitpower.com', '$2y$10$K3l3EEsn2SoB7cwF/xkWcO9Gk2NoSEXO/bQ8.c41wwREcVz0C7yIq');

INSERT INTO Client (name_client, phone, fr_credentials, fr_role, `C.I`)
VALUES ('Nombre Apellido', '099123456', LAST_INSERT_ID(), 1, '11111111');
