#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

## Ingreso Datos Rclone
while :; do
echo -e "\e[1;34mDesea configurar el almacenamiento remoto a través de BackBlaze? (S/n)\e[0m"
read -r choice
case "$choice" in
S|s|Y|y|"")
##Ruta remote

	echo -e "\e[1;34mIngrese nombre del bucket a usar\e[0m"
	read -r BUCKET

	echo -e "\e[1;34mIngrese KEY_ID para el bucket de BackBlaze a usar :\e[0m"
	read -r KEY_ID

	echo -e "\e[1;34mIngrese APP_KEY para el bucket de BackBlaze a usar:\e[0m"
	read -r APP_KEY

	echo -e "\e[1;34mIngrese nombre para el remote que va a representar este bucket:\e[0m"
	read -r REMOTE

	echo -e "\e[1;32mEs esto correcto? (S/n)\e[0m \nBUCKET: '$BUCKET' \nKEY_ID: '$KEY_ID' \nAPP_KEY: '$APP_KEY' \nNombre de remote: '$REMOTE'"
	read -r choice
	case "$choice" in
		S|s|Y|y|"")
			[[ -n $BUCKET ]] || { echo -e "\e[1;31mNombre de bucket vacio\e[0m"; continue; }

			sudo rclone config create "$REMOTE" b2 account="$KEY_ID" key="$APP_KEY" --non-interactive \
			|| { echo -e "\e[1;31m No se pudo escribir a la configuración de rclone\e[0m"; continue; }

                        sudo rclone lsd "$REMOTE:${BUCKET#/}" \
			|| { echo -e "\e[1;31mNo se pudo acceder al bucket, chequee credenciales\e[0m"; continue; }

			echo -e "\e[1;34mRclone exitosamente configurado\e[0m"
			break
			;;
		*) continue ;;
	esac
;;
*)
	BUCKET=""
	KEY_ID=""
	APP_KEY=""
	REMOTE=""
	echo "Configuración de remote salteada"
	break
;;
esac
done

