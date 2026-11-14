En caso de que se desee hostear la aplicación mediante contenedores en vez de instalar los servicios directamente en el sistema, será necesario completar las variables de entorno del proyecto y componer su `docker-compose.yml`. Esto se podrá lograr siguiendo los siguientes pasos:

>Si no están instalados, Docker y su plugin de Compose se pueden encontrar en [la documentación oficial de Docker.](https://docs.docker.com/desktop/setup/install/linux/).

### Configurar las variables de entorno
**Crear el `.env` de la raíz del proyecto**
```bash
# Se utiliza para nombrar los contenedores (${APP_NAME}_app, ${APP_NAME}_db, ...)
# y debe crearse dentro de la carpeta del repositorio (Minute)
echo 'APP_NAME=fitpower' | sudo tee .env
```

**Crear el `.env` de la API (/srv/www/htdocs/api/.env o ./api/.env)**
```bash
# Los datos deben coincidir con los definidos en el Docker compose
DB_HOST=db
DB_NAME=minute_db
DB_USER=usuario
DB_PASS=password

# Dentro del contenedor las imágenes se guardan en /var/lib/minute (volumen "media"), no en /srv/* como en el host.
EXERCISE_DIR=/var/lib/minute/exercises
PFP_DIR=/var/lib/minute/pfp
PRODUCT_DIR=/var/lib/minute/products
```

>El archivo `api/.env.example` incluido en el repositorio usa rutas `/srv/...` porque está pensado para la instalación nativa. Para Docker se deberán reemplazar por las rutas `/var/lib/minute/...` mostradas arriba.

### Levantar los contenedores
**Ejecutar docker compose desde la raíz del repositorio**
```bash
# Se debe moverse hasta la carpeta del proyecto,
# Y luego construir las imágenes
sudo docker compose up -d

```
>Si el puerto 8080, 8081 o 3306 ya está en uso, los contenedores no van a poder iniciar correctamente
