### Acceso a sitio y phpmyadmin
* El sitio es accesible a través del puerto 8080 de la red local.
* La interfaz de phpmyadmin es accesible a tavés del puerto 8081 de la red local, la contraseña por defecto para el usuario root es "vitaminadedeficienciac.2026.com".

>Cabe aclarar que si alguno de los puertos anterior (más el 3306 asignado a mariaDB), se encuentra siendo utilizado por otro servicio al prender uno de los contenedores, este no iniciara correctamente, y si lo mismo es el caso cuando se hace el docker compose, las imagenes no serán capaz de enlazarse con sus puertos correspondientes, y los contenedores resultantes de ellas no serán funcionales.
### Setup de Docker
* Se tiene que crear un archivo .env (excluido en el repositorio por buenas prácticas de seguridad, debido a que este puede contener información sensible, que no deseamos se publique en un commit), y dentro de este asignar un valor a la variable APP_NAME
	`APP_NAME=nombre`
	
* Hecho esto se deberá navegar a el directorio del repositorio (Minute), y ejecutar el siguiente comando:
	`sudo docker compose up -d` 
	
Esto creara todas las imagenes (y contenedores a partir de estas), para poder ejecutar la aplicación web correctamente.

>En caso de que docker compose no este instalado, se deberá agregar el repositorio de docker siguiendo los pasos listados para tu distribución en [el doc oficial de Docker](https://docs.docker.com/desktop/setup/install/linux/). Una vez agregado, deberas instalar el paquete.
	`sudo apt install docker-compose # Ejemplo instalación para Debian y derivados`