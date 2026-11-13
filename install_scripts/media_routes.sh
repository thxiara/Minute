#!/usr/bin/env bash

# Error handling
set -euo pipefail
trap 'echo -e "\e[1;31mFallo en la línea $LINENO: $BASH_COMMAND\e[0m" >&2' ERR

# Exercise Media
while :; do
	echo -e "\e[1;34mBajo que ruta se guardaran las imágenes de ejercicios? (ruta absoluta, deje vacio para default)\e[0m"
	read -r EXERCISE_DIR
	case "$EXERCISE_DIR" in
	"")
		sudo mkdir -p /srv/exercise_media/ \
		&& chown root:www /srv/exercise_media/ \
		&& chmod 770 /srv/exercise_media/
		EXERCISE_DIR="/srv/exercise_media/"
		echo -e "\e[1;34mSe usará la ruta por defecto \"/srv/exercise_media\"\e[0m"
		break
	;;
	/*)
		sudo mkdir -p "$EXERCISE_DIR" \
		&& chown root:www "$EXERCISE_DIR" \
		&& chmod 770 "$EXERCISE_DIR"
		echo -e "\e[1;34mSe usará la ruta \"$EXERCISE_DIR\"\e[0m"
		break
	;;
	*)
		echo -e "\e[1;31mDebe ser una ruta absoluta\e[0m"
	;;
	esac
done

# Pfp Media
while :; do
	echo -e "\e[1;34mBajo que ruta se guardaran las fotos de perfil? (ruta absoluta, deje vacio para default)\e[0m"
	read -r PFP_DIR
	case "$PFP_DIR" in
	"")
		sudo mkdir -p /srv/pfp_media/ \
		&& chown root:www /srv/pfp_media/ \
		&& chmod 770 /srv/pfp_media/
		PFP_DIR="/srv/pfp_media/"
		echo -e "\e[1;34mSe usará la ruta por defecto \"/srv/pfp_media\"\e[0m"
		break
	;;
	/*)
		sudo mkdir -p "$PFP_DIR" \
		&& chown root:www "$PFP_DIR" \
		&& chmod 770 "$PFP_DIR"
		echo -e "\e[1;34mSe usará la ruta \"$PFP_DIR\"\e[0m"
		break
	;;
	*)
		echo -e "\e[1;31mDebe ser una ruta absoluta\e[0m"
	;;
	esac
done

# Product media
while :; do
	echo -e "\e[1;34mBajo que ruta se guardaran las imágenes de productos? (ruta absoluta, deje vacio para default)\e[0m"
	read -r PRODUCT_DIR
	case "$PRODUCT_DIR" in
	"")
		sudo mkdir -p /srv/product_media/ \
		&& chown root:www /srv/product_media/ \
		&& chmod 770 /srv/product_media/
		PRODUCT_DIR="/srv/product_media/"
		echo -e "\e[1;34mSe usará la ruta por defecto \"/srv/product_media\"\e[0m"
		break
	;;
	/*)
		sudo mkdir -p "$PRODUCT_DIR" \
		&& chown root:www "$PRODUCT_DIR" \
		&& chmod 770 "$PRODUCT_DIR"
		echo -e "\e[1;34mSe usará la ruta \"$PRODUCT_DIR\"\e[0m"
		break
	;;
	*)
		echo -e "\e[1;31mDebe ser una ruta absoluta\e[0m"
	;;
	esac
done

[[ $EXERCISE_DIR == */ ]] || EXERCISE_DIR+="/"
[[ $PFP_DIR == */ ]] || PFP_DIR+="/"
[[ $PRODUCT_DIR == */ ]] || PRODUCT_DIR+="/"
