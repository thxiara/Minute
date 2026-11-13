### Acceso al sitio y a phpmyadmin
* El sitio por defecto es accesible a través del puerto 8080 de la red local si hosteado a través de docker, o del 80 si es a través del sistema directamente.
* La interfaz de phpmyadmin es accesible por defecto a tavés del puerto 8081 de la red local, la contraseña por defecto para el usuario root es "vitaminadedeficienciac.2026.com" si utilizado a través de docker, 80 si es a través del sistema directamente (localhost:80/phpMyAdmin).

>Cabe aclarar que si alguno de los puertos anteriores (más el 3306 asignado a mariaDB), se encuentra siendo utilizado por otro servicio al prender uno de los contenedores, este no iniciara correctamente, y si lo mismo es el caso cuando se hace el docker compose, las imagenes no serán capaz de enlazarse con sus puertos correspondientes, y los contenedores resultantes de ellas no serán funcionales.
### Setup para Docker
* Se debrá crear un archivo .env dentro de la raíz del proyecto y dentro de este asignar un valor a la variable APP_NAME
	`APP_NAME=nombre`
* Luego se debe crear otro .env dentro de api, incluyendo el host, base de datos y credenciales que debera usar la api para conectarse con la base de datos (ejemplo en env.example, también dentro de api)
	`DB_HOST=db `
	`DB_NAME=minute_db`
	`DB_USER=usuario`
	`DB_PASS=password`
	`EXERCISE_DIR=/var/lib/minute/exercises`
	`PFP_DIR=/var/lib/minute/pfp`
	`PRODUCT_DIR=/var/lib/minute/products`
> EXERCISE_DIR, PFP_DIR y PRODUCT_DIR son las carpetas donde se guardan los gifs de los ejercicios (`<id>.gif`), las fotos de perfil (`<id>.jpg`) y las imágenes de los productos (`<id>.jpg`). Deben estar fuera de la carpeta pública del servidor y el usuario de Apache debe poder escribir en ellas. Con Docker, `/var/lib/minute` ya se crea en la imagen y se conserva en el volumen `media`; si la imagen fue construida antes de este cambio hay que reconstruirla (`sudo docker compose up -d --build`), ya que ahora también instala la extensión GD de PHP.
* Hecho esto se deberá navegar al directorio del repositorio (Minute), y ejecutar el siguiente comando:
	`sudo docker compose up -d` 
Esto creara todas las imagenes (y contenedores a partir de estas), para poder ejecutar la aplicación web correctamente.

>En caso de que docker compose no este instalado, se deberá agregar el repositorio de docker siguiendo los pasos listados para tu distribución en [el doc oficial de Docker](https://docs.docker.com/desktop/setup/install/linux/). Una vez agregado, deberas instalar el paquete.
	`sudo apt install docker-compose # Ejemplo instalación para Debian y derivados`

### Setup para OpenSuse
* Se deberá clonar el repositorio dentro de /srv/www/ (creando los directorios si aún no existen)
	`sudo mkdir -p /srv/www/`
	`sudo git clone https://github.com/thxiara/Minute.git htdocs`
* Se deberá ejecutar el archivo "opensuse_dep_install.sh" como administrador para descargar e instalar todas las dependencias para hostear el sitio.
* Luego se deberá ejecutar el archivo "opensuse_service_setup.sh" como administrador para prender y configurar los servicios interactivamente (las credenciales serán guardadas en api/.env, junto con las carpetas de imágenes EXERCISE_DIR, PFP_DIR y PRODUCT_DIR, que el script crea en /var/lib/minute).
> Es posible que hecho esto, sea necesario habilitar el modulo de rewrite para apache2
	`sudo a2enmod rewrite`
> Y cambiar el parametro AllowOverride de "off" a "on" para /srv/www/htdocs dentro de la configuración por defecto de Apache (Usualmente en /etc/apache2/default-server.conf).

### Imágenes subidas
* Las fotos de perfil y los gifs de los ejercicios se guardan en disco, fuera de la carpeta pública, en las carpetas indicadas por `PFP_DIR`, `EXERCISE_DIR` y `PRODUCT_DIR` (api/.env). El archivo se llama como la id: `<id del usuario>.jpg`, `<id del ejercicio>.gif` y `<id del producto>.jpg`, por lo que no hay columnas para imágenes en la base.
* Foto de perfil (`PUT /api/mi-foto`): se convierte a JPG, se recorta al centro en 1:1 y queda de 128 × 128 px. Subir otra reemplaza la anterior.
* Gif de ejercicio (`PUT /api/ejercicios/:id/gif`, o el campo `image` al crear el ejercicio): siempre se guarda como GIF y nunca se recorta. Un GIF se guarda tal cual (conserva la animación); un JPG, PNG o WEBP se convierte a GIF. Subir otro reemplaza el anterior.
* PHP necesita la extensión GD.

### Idiomas (i18n)
* El sitio está escrito en español y ese texto es la clave de traducción. Idiomas disponibles: español (`es`) e inglés (`en`).
* El idioma se elige con el selector ES/EN de cada página y se guarda en la cookie `lang`; sin cookie se usa el idioma del navegador.
* Front: `front/dist/js/i18n.js` traduce la página con el diccionario `front/dist/i18n/<idioma>.json`.
* API: los mensajes de las respuestas se traducen con `api/src/Utils/I18n.php` y el diccionario `api/lang/<idioma>.php`.
* Para sumar un texto nuevo alcanza con escribirlo en español en el código y agregar su traducción a los diccionarios (si falta, se muestra en español).
