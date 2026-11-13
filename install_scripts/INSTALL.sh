#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

#Se ubica en el directorio del script para que los source relativos funcionen
cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"

#Instalar servicios y dependencias
source ./service_install.sh

#Activar servicios
source ./service_enable.sh

#Configuración interactiva MariaDB
source ./mariadb_setup.sh

#Configuración interactiva Rclone
source ./rclone_setup.sh

#Configuración interactiva backups
source ./backups_setup.sh

#Configuración interactiva rutas imágenes
source ./media_routes.sh

#Creación envs
source ./env_setup.sh

exit 0
