### Acceso al sitio y a phpmyadmin
* El sitio por defecto es accesible a través del puerto 8080 de la red local si hosteado a través de docker, o del 80 si es a través del sistema directamente.
* La interfaz de phpmyadmin es accesible por defecto a tavés del puerto 8081 de la red local, la contraseña por defecto para el usuario root es "vitaminadedeficienciac.2026.com" si utilizado a través de docker o a través del puerto 80 si es a través del sistema directamente (localhost:80/phpMyAdmin).

>Cabe aclarar que si alguno de los puertos anterior (más el 3306 asignado a mariaDB), se encuentra siendo utilizado por otro servicio al prender uno de los contenedores, este no iniciara correctamente, y si lo mismo es el caso cuando se hace el docker compose, las imagenes no serán capaz de enlazarse con sus puertos correspondientes, y los contenedores resultantes de ellas no serán funcionales.
### Setup para Docker
* Se debrá que crear un archivo .env dentro de la raíz del proyecto y dentro de este asignar un valor a la variable APP_NAME
	`APP_NAME=nombre`
* Luego se debe crear otro .env dentro de api, incluyendo el host, base de datos y credenciales que debera usar la api para conectarse con la base de datos (ejemplo en env.example, también dentro de api)
	`DB_HOST=db `
	`DB_NAME=minute_db`
	`DB_USER=usuario`
	`DB_PASS=password`
* Hecho esto se deberá navegar al directorio del repositorio (Minute), y ejecutar el siguiente comando:
	`sudo docker compose up -d` 
Esto creara todas las imagenes (y contenedores a partir de estas), para poder ejecutar la aplicación web correctamente.

>En caso de que docker compose no este instalado, se deberá agregar el repositorio de docker siguiendo los pasos listados para tu distribución en [el doc oficial de Docker](https://docs.docker.com/desktop/setup/install/linux/). Una vez agregado, deberas instalar el paquete.
	`sudo apt install docker-compose # Ejemplo instalación para Debian y derivados`

### Setup para OpenSuse
* Se deberá clonar el repositorio dentro de /srv/www/ (creando los directorios si aún no existen)
	`mkdir -p /srv/www/`
	`git clone https://github.com/thxiara/Minute.git htdocs`
* Se deberá ejecutar el archivo "opensuse_dep_install.sh" como administrador para descargar e instalar todas las dependencias para hostear el sitio.
* Luego se deberá ejecutar el archivo "opensuse_service_setup.sh" como administrador para prender y configurar los servicios interactivamente (las credenciales serán guardadas en api/.env).
> Es posible que hecho esto, sea necesario habilitar el modulo de rewrite para apache2
	`sudo a2enmod rewrite`
> Y cambiar el parametro AllowOverride de "off" a "on" para /srv/www/htdocs dentro de la configuración por defecto de Apache (Usualmente en /etc/apache2/default-server.conf).
