FROM php:8.2-apache

# 1. Apache necesita "rewrite" para que /api/alumnos llegue a index.php
# 2. PHP necesita pdo_mysql para hablar con MySQL
# 3. PHP necesita gd (con jpeg, png y webp) para recortar y convertir las imágenes subidas
# 4. /var/lib/minute es donde se guardan esas imágenes, fuera de /var/www/html
#    (EXERCISE_DIR, PFP_DIR y PRODUCT_DIR en api/.env)
RUN apt-get update \
    && apt-get install -y --no-install-recommends libjpeg62-turbo-dev libpng-dev libwebp-dev \
    && rm -rf /var/lib/apt/lists/* \
    && a2enmod rewrite \
    && docker-php-ext-configure gd --with-jpeg --with-webp \
    && docker-php-ext-install pdo pdo_mysql gd \
    && sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf \
    && mkdir -p /var/lib/php/sessions /var/lib/minute/exercises /var/lib/minute/pfp /var/lib/minute/products \
    && chown -R www-data:www-data /var/lib/php/sessions /var/lib/minute

WORKDIR /var/www/html
