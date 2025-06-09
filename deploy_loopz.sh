#!/bin/bash

sudo docker compose down -v --rmi all
sudo docker builder prune -f
sudo docker compose build app icy-server
mkdir -p ./data/certbot/conf
mkdir -p ./data/certbot/www
DH_PARAMS_FILE="./data/certbot/conf/ssl-dhparams.pem"
if [ ! -f "$DH_PARAMS_FILE" ]; then
    sudo openssl dhparam -out "$DH_PARAMS_FILE" 2048
fi
OPTIONS_SSL_NGINX_FILE="./data/certbot/conf/options-ssl-nginx.conf"
if [ ! -f "$OPTIONS_SSL_NGINX_FILE" ]; then
    sudo wget -O "$OPTIONS_SSL_NGINX_FILE" https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/resources/options-ssl-nginx.conf
fi
sudo docker compose up -d nginx app
sleep 10
sudo docker compose run --rm certbot certonly --webroot -w /var/www/certbot \
    -d loopzmusic.duckdns.org \
    --email manuel@loopzmusic.com \
    --rsa-key-size 4096 \
    --agree-tos \
    --non-interactive \
    --force-renewal

if [ $? -ne 0 ]; then
    exit 1
fi

sudo sed -i '/# --- INICIO BLOQUE HTTPS ---/,/# --- FIN BLOQUE HTTPS ---/s/^# *//' ./nginx/conf.d/default.conf
sudo docker compose restart nginx
sudo docker compose up -d db meilisearch icy-server

