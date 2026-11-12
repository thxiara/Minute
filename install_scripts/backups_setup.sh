#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

##Nombre backups
echo -e "\e[1;34mBajo que nombre se guardaran los backups? (deje vacio para saltear)\e[0m"
read -r BACKUP_NAME
case "$BACKUP_NAME" in
"") BACKUP_NAME="backup"
	echo -e "\e[1;34mSe usará el nombre default \"backup\"\e[0m" ;;
*) echo -e "\e[1;34mNombre de Backups establecido como \"$BACKUP_NAME\"\e[0m" ;;
esac

##Ruta backups
while :; do
	echo -e "\e[1;34mBajo que ruta se guardaran los backups? (ruta absoluta, dejar vacio para saltear)\e[0m"
	read -r BACKUP_ROUTE
	case "$BACKUP_ROUTE" in
	"")
		sudo mkdir -p /srv/backups
		BACKUP_ROUTE="/srv/backups/"
		echo -e "\e[1;34mSe usará la ruta por defecto \"/srv/backups/\"\e[0m"
		break
	;;
	/*)
		sudo mkdir -p "$BACKUP_ROUTE"
		echo -e "\e[1;34mRuta de Backups establecida como \"$BACKUP_ROUTE\"\e[0m"
		break
	;;
	*)
		echo -e "\e[1;31mLa ruta debe ser absoluta (debe comenzar con /)\e[0m"
		continue
	;;
	esac
done
#Se asegura la barra final para que los backups se guarden dentro del directorio
[[ $BACKUP_ROUTE == */ ]] || BACKUP_ROUTE+="/"
