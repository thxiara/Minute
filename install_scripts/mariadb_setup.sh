#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

function CHECK_INPUT {
if [[ ! "$1" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo -e "\e[1;31m$2 inválid@ (solo letras, números y _)\e[0m"
    return 1
fi
return 0
}

## Ingreso datos mariadb
while :; do
	echo -e "\e[1;34mIngrese nombre de base de datos a crear:\e[0m"
	printf "database: "
	read -r newdb
	CHECK_INPUT "$newdb" "Nombre Base De Datos" || continue
	echo -e "\e[1;34mIngrese nombre de usuario para acceder a MariaDB:\e[0m"
	printf "username: "
	read -r newuser
	CHECK_INPUT "$newuser" "Nombre Usuario" || continue
	echo -e "\e[1;34mIngrese contraseña de usuario para acceder a MariaDB (Solo letras, números y _):\e[0m"
	printf "password: "
	read -rs newpass
	CHECK_INPUT "$newpass" "Contraseña" || continue
	echo -e "\e[1;32m\nEs esto correcto? (S/n)\e[0m \nNombre base de datos: '$newdb' \nNombre de usuario para db: '$newuser' \nContraseña para usuario para db: '$newpass'"
	printf "(S/n):"
	read -r choice
	case "$choice" in
		S|s|Y|y|"") break ;;
		*) continue ;;
	esac
done

## Configuración mariadb
# Se crea la base de datos
sudo mariadb -e "CREATE DATABASE IF NOT EXISTS \`$newdb\` CHARACTER SET utf8mb4;" && sudo mariadb -u root "$newdb" < /srv/www/htdocs/api/config/init.sql;
#Se crea el usuario, o se lo edita si ya existe
sudo mariadb -e "CREATE USER IF NOT EXISTS '$newuser'@'localhost' IDENTIFIED BY '$newpass';"
sudo mariadb -e "ALTER USER '$newuser'@'localhost' IDENTIFIED BY '$newpass';"
#Se le da permisos absolutos sobre la bd al usuario
sudo mariadb -e "GRANT ALL PRIVILEGES ON \`$newdb\`.* TO '$newuser'@'localhost';"
#Se actualizan los permisos
sudo mariadb -e "FLUSH PRIVILEGES;"

