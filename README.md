### Acceso al sitio y a phpmyadmin
* El sitio por defecto es accesible a través del puerto 8080 de la red local si hosteado a través de docker, o del 80 si es a través del sistema directamente.
* La interfaz de phpmyadmin es accesible por defecto a tavés del puerto 8081 de la red local, la contraseña por defecto para el usuario root es "vitaminadedeficienciac.2026.com" si utilizado a través de docker, 80 si es a través del sistema directamente (localhost:80/phpMyAdmin).

>Cabe aclarar que si alguno de los puertos anteriores (más el 3306 asignado a mariaDB), se encuentra siendo utilizado por otro servicio al prender uno de los contenedores, este no iniciara correctamente, y si lo mismo es el caso cuando se hace el docker compose, las imagenes no serán capaz de enlazarse con sus puertos correspondientes, y los contenedores resultantes de ellas no serán funcionales.

### Imágenes subidas
* Las fotos de perfil y los gifs de los ejercicios se guardan en disco, fuera de la carpeta pública, en las carpetas indicadas por `PFP_DIR`, `EXERCISE_DIR` y `PRODUCT_DIR` (api/.env). El archivo se llama como la id: `<id del usuario>.jpg`, `<id del ejercicio>.gif` y `<id del producto>.jpg`, por lo que no hay columnas para imágenes en la base.
* Foto de perfil (`PUT /api/mi-foto`): se convierte a JPG, se recorta al centro en 1:1 y queda de 128 × 128 px. Subir otra reemplaza la anterior.
* Gif de ejercicio (`PUT /api/ejercicios/:id/gif`, o el campo `image` al crear el ejercicio): siempre se guarda como GIF y nunca se recorta. Un GIF se guarda tal cual (conserva la animación); un JPG, PNG o WEBP se convierte a GIF. Subir otro reemplaza el anterior.

### SETUP
Para instalar la aplicación será solo necesario ejecutar el script "INSTALL.sh" en install_scripts. Donde se van a pedir las credenciales para crear la base de datos, las carpetas de backups, de medios y el remote para interactuar con BackBlaze.
Si los scripts fallan o se necesitan instlar servicios o configuraciones más allá de lo que pueden hacer, se puede referir a la documentación en /docs:
* [Instalación manual (APP_INSTALL)](docs/APP_INSTALL.md)
* [Instalación con Docker (DOCKER_SETUP)](docs/DOCKER_SETUP.md)
* [Configuración de dominio y certificados con Cloudflare (DOMAIN_SETUP)](docs/DOMAIN_SETUP.md)
* [Firewall con nftables (NFT_SETUP)](docs/NFT_SETUP.md)
* [Endurecimiento de SSH (SSH_SETUP)](docs/SSH_SETUP.md)
* [Backups con ABML (ABML_BACKUP_SETUP)](docs/ABML_BACKUP_SETUP.md)
* [Automatización de backups con crontab (CRONTAB_SETUP)](docs/CRONTAB_SETUP.md)
