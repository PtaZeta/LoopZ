#!/bin/bash

echo "--- Inicia el despliegue de LoopZ ---"

echo "Realizando limpieza de contenedores e imágenes Docker existentes..."
sudo docker compose down -v --rmi all
sudo docker builder prune -f

echo "Construyendo imágenes Docker..."
sudo docker compose build app icy-server

echo "Preparando directorios para Certbot..."
mkdir -p ./data/certbot/conf
mkdir -p ./data/certbot/www

echo "Generando parámetros Diffie-Hellman (esto puede tardar varios minutos)..."
DH_PARAMS_FILE="./data/certbot/conf/ssl-dhparams.pem"
if [ ! -f "$DH_PARAMS_FILE" ]; then
    sudo openssl dhparam -out "$DH_PARAMS_FILE" 2048
fi

echo "Descargando configuraciones SSL recomendadas de Nginx..."
OPTIONS_SSL_NGINX_FILE="./data/certbot/conf/options-ssl-nginx.conf"
if [ ! -f "$OPTIONS_SSL_NGINX_FILE" ]; then
    sudo wget -O "$OPTIONS_SSL_NGINX_FILE" https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/resources/options-ssl-nginx.conf
fi

echo "Iniciando Nginx y App (solo HTTP) para la validación de Certbot..."
sudo docker compose up -d nginx app

echo "Esperando 10 segundos para que Nginx inicie..."
sleep 10

echo "Obteniendo certificados SSL con Certbot..."
sudo docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
    -d loopzmusic.duckdns.org \
    --email manuel@loopzmusic.com \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive \
    --force-renewal

if [ $? -ne 0 ]; then
    echo "ERROR: Fallo al obtener los certificados SSL con Certbot."
    echo "Revisa los logs del contenedor certbot: sudo docker compose logs loopz-certbot-1"
    exit 1
fi

echo "Certificados SSL obtenidos exitosamente."

echo "Activando configuración HTTPS y reiniciando Nginx..."
sudo sed -i '/# --- INICIO BLOQUE HTTPS ---/,/# --- FIN BLOQUE HTTPS ---/s/^# *//' ./nginx/conf.d/default.conf
sudo sed -i '/^--- INICIO BLOQUE HTTPS ---/d' ./nginx/conf.d/default.conf
sudo sed -i '/^--- FIN BLOQUE HTTPS ---/d' ./nginx/conf.d/default.conf

sudo docker compose restart nginx

echo "Iniciando el resto de los servicios Docker (db, meilisearch, icy-server)..."
sudo docker compose up -d db meilisearch icy-server

echo "--- Despliegue de LoopZ finalizado exitosamente ---"
