#!/bin/bash

echo "--- Inicia el despliegue de LoopZ ---"

# 1. Realizando limpieza de contenedores e imágenes Docker existentes...
echo "Realizando limpieza de contenedores e imágenes Docker existentes..."
# Eliminar la advertencia de 'version' en docker-compose.yml si aparece, simplemente ignórala o elimínala del archivo.
sudo docker compose down -v --rmi all
sudo docker builder prune -f

# 2. Construyendo imágenes Docker...
echo "Construyendo imágenes Docker..."
# Ahora incluimos icy-server en la construcción
sudo docker compose build app icy-server

# 3. Preparando directorios para Certbot...
echo "Preparando directorios para Certbot..."
mkdir -p ./data/certbot/conf
mkdir -p ./data/certbot/www

# 4. Generando parámetros Diffie-Hellman
echo "Generando parámetros Diffie-Hellman (esto puede tardar varios minutos)..."
DH_PARAMS_FILE="./data/certbot/conf/ssl-dhparams.pem"
if [ ! -f "$DH_PARAMS_FILE" ]; then
    sudo openssl dhparam -out "$DH_PARAMS_FILE" 2048
fi

# 5. Descargando configuraciones SSL recomendadas de Nginx
echo "Descargando configuraciones SSL recomendadas de Nginx..."
OPTIONS_SSL_NGINX_FILE="./data/certbot/conf/options-ssl-nginx.conf"
if [ ! -f "$OPTIONS_SSL_NGINX_FILE" ]; then
    # Usar una URL más estable para opciones-ssl-nginx.conf
    sudo wget -O "$OPTIONS_SSL_NGINX_FILE" https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/resources/options-ssl-nginx.conf
fi

# 6. Iniciando Nginx y App (solo HTTP) para la validación de Certbot
echo "Iniciando Nginx y App (solo HTTP) para la validación de Certbot..."
sudo docker compose up -d nginx app

echo "Esperando 10 segundos para que Nginx inicie..."
sleep 10

# 7. Obteniendo certificados SSL con Certbot
echo "Obteniendo certificados SSL con Certbot..."
# El nombre del servicio 'certbot' ahora coincide con el docker-compose.yml
sudo docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
    -d loopzmusic.duckdns.org \
    --email manuel@loopzmusic.com \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive \
    --force-renewal # Usar --force-renewal con precaución, solo para depuración si no tienes certificados

if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al obtener los certificados SSL con Certbot."
    echo "Revisa los logs del contenedor certbot: sudo docker compose logs loopz-certbot-1"
    exit 1
fi

echo "Certificados SSL obtenidos exitosamente."

# 8. Descomentar el bloque HTTPS en default.conf y reiniciar Nginx
echo "Activando configuración HTTPS y reiniciando Nginx..."
# Elimina los comentarios de las líneas del bloque HTTPS
# Asegúrate de que las marcas de inicio/fin no tengan espacios iniciales en el archivo original
sudo sed -i '/# --- INICIO BLOQUE HTTPS ---/,/# --- FIN BLOQUE HTTPS ---/s/^# *//' ./nginx/conf.d/default.conf
# Elimina las líneas de marca de inicio y fin (opcional, pero limpia el archivo)
sudo sed -i '/^--- INICIO BLOQUE HTTPS ---/d' ./nginx/conf.d/default.conf
sudo sed -i '/^--- FIN BLOQUE HTTPS ---/d' ./nginx/conf.d/default.conf

# Reinicia solo Nginx para que cargue la nueva configuración con SSL
sudo docker compose restart nginx

# 9. Iniciar el resto de los servicios
echo "Iniciando el resto de los servicios Docker (db, meilisearch, icy-server)..."
# Ahora levantamos todos los servicios restantes
sudo docker compose up -d db meilisearch icy-server

echo "--- Despliegue de LoopZ finalizado exitosamente ---"
