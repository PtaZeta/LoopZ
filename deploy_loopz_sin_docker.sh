#!/bin/bash

# --- Variables de Configuración ---
PROJECT_PATH="/home/manuel/laravel/LoopZ"
DOMAIN="loopzmusic.duckdns.org"
DUCKDNS_TOKEN="b6cd242b-a5ae-4bdb-8ccd-020d6994a97e"
MEILISEARCH_KEY="e0f2a763db38e7558177ac73161d875a21c1565c13394143b27e11001f231428"
PHP_VERSION="8.4" # Ajustado a la versión de PHP proporcionada por el usuario (8.4.7)

# --- Funciones de Utilidad ---
log_info() {
    echo -e "\n\033[1;34mINFO:\033[0m $1"
}

log_success() {
    echo -e "\n\033[1;32mÉXITO:\033[0m $1"
}

log_error() {
    echo -e "\n\033[1;31mERROR:\033[0m $1" >&2
    exit 1
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "Este script debe ejecutarse como root. Usa 'sudo bash $0'."
    fi
}

# --- 1. Pre-chequeos y Limpieza ---
check_root

log_info "Actualizando la lista de paquetes del sistema..."
apt update || log_error "Fallo al actualizar la lista de paquetes."

log_info "Deteniendo y deshabilitando servicios que puedan usar los puertos 80/443..."
systemctl stop nginx apache2 caddy 2>/dev/null
systemctl disable nginx apache2 caddy 2>/dev/null

log_info "Desinstalando cualquier instalación antigua de Docker..."
for pkg in docker.io docker-doc docker-compose docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin docker-ce-rootless-extras; do
    apt-get purge -y "$pkg" 2>/dev_null
done
rm -rf /var/lib/docker /etc/docker ~/.docker 2>/dev/null
log_info "Docker antiguo desinstalado (si existía)."

log_info "Eliminando configuraciones antiguas de Nginx para el dominio $DOMAIN..."
rm -f "/etc/nginx/sites-available/$DOMAIN"
rm -f "/etc/nginx/sites-enabled/$DOMAIN"

# --- 2. Instalación de Dependencias ---
log_info "Instalando dependencias necesarias: Nginx, PHP, Composer, Node.js, Certbot, UFW..."

# Nginx
apt install -y nginx || log_error "Fallo al instalar Nginx."

# PHP y extensiones
apt install -y software-properties-common || log_error "Fallo al instalar software-properties-common."
add-apt-repository -y ppa:ondrej/php || log_error "Fallo al añadir PPA de PHP."
apt update || log_error "Fallo al actualizar la lista de paquetes después de añadir PPA."
apt install -y php"$PHP_VERSION"-fpm php"$PHP_VERSION"-cli php"$PHP_VERSION"-pgsql php"$PHP_VERSION"-mbstring php"$PHP_VERSION"-xml php"$PHP_VERSION"-bcmath php"$PHP_VERSION"-curl php"$PHP_VERSION"-zip php"$PHP_VERSION"-gd php"$PHP_VERSION"-sqlite3 || log_error "Fallo al instalar PHP y sus extensiones."

# Composer
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer || log_error "Fallo al instalar Composer."

# Node.js y NPM
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - || log_error "Fallo al configurar el repositorio de Node.js."
apt install -y nodejs || log_error "Fallo al instalar Node.js."

# Certbot
apt install -y certbot python3-certbot-nginx || log_error "Fallo al instalar Certbot."

# UFW (Uncomplicated Firewall)
apt install -y ufw || log_error "Fallo al instalar UFW."

log_success "Todas las dependencias instaladas correctamente."

# --- 3. Configuración de DuckDNS ---
log_info "Configurando la actualización automática de DuckDNS..."
mkdir -p /etc/duckdns
cat <<EOF > /etc/duckdns/duck.sh
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=$DOMAIN&token=$DUCKDNS_TOKEN&ip=" | curl -k -o /etc/duckdns/duck.log -K -
EOF
chmod 700 /etc/duckdns/duck.sh

# Crear cron job para actualizar cada 5 minutos
(crontab -l 2>/dev/null; echo "*/5 * * * * /etc/duckdns/duck.sh >/dev/null 2>&1") | crontab - || log_error "Fallo al configurar el cron job de DuckDNS."

log_info "Ejecutando la primera actualización de DuckDNS..."
/etc/duckdns/duck.sh || log_error "Fallo en la primera actualización de DuckDNS."
log_success "DuckDNS configurado y actualizado."

# --- 4. Configuración de la Aplicación Laravel ---
log_info "Configurando la aplicación Laravel en $PROJECT_PATH..."

if [ ! -d "$PROJECT_PATH" ]; then
    log_error "El directorio del proyecto Laravel '$PROJECT_PATH' no existe."
fi

cd "$PROJECT_PATH" || log_error "No se pudo cambiar al directorio del proyecto Laravel."

# Añadir la configuración de safe.directory para Git
log_info "Configurando Git safe.directory para el proyecto..."
git config --global --add safe.directory "$PROJECT_PATH" || log_error "Fallo al configurar Git safe.directory."

# Establecer permisos para todo el proyecto ANTES de instalar dependencias de Node.js
log_info "Estableciendo permisos de directorio para todo el proyecto..."
# Asegura que todo el proyecto es propiedad de www-data
sudo chown -R www-data:www-data "$PROJECT_PATH"
# Asegura que los directorios tienen permisos de ejecución (755)
sudo find "$PROJECT_PATH" -type d -exec chmod 755 {} \;
# Asegura que los archivos tienen permisos de lectura (644)
sudo find "$PROJECT_PATH" -type f -exec chmod 644 {} \;
# Reconfirma permisos de escritura para storage y bootstrap/cache
sudo chmod -R 775 "$PROJECT_PATH"/storage
sudo chmod -R 775 "$PROJECT_PATH"/bootstrap/cache

log_info "Actualizando .env para producción..."
sed -i "s/^APP_ENV=.*/APP_ENV=production/" .env
sed -i "s/^APP_DEBUG=.*/APP_DEBUG=false/" .env
sed -i "s|^APP_URL=.*|APP_URL=https://$DOMAIN|" .env

log_info "Instalando dependencias de Composer..."
# La advertencia de Composer sobre ejecutar como root es normal, pero se puede ignorar en scripts de despliegue.
composer install --no-dev --optimize-autoloader || log_error "Fallo al ejecutar 'composer install'."

log_info "Instalando dependencias de Node.js..."
npm install || log_error "Fallo al ejecutar 'npm install'."

# Asegurar permisos de ejecución para binarios de Node.js y sus destinos
log_info "Asegurando permisos de ejecución para binarios de Node.js..."
# Se añade un chmod específico para los binarios de node_modules/.bin (los symlinks)
sudo find "$PROJECT_PATH"/node_modules/.bin -type f -exec chmod 755 {} \; || log_error "Fallo al establecer permisos de ejecución para binarios de Node.js."
# Asegurar que el archivo vite.js real tenga permisos de ejecución.
sudo chmod +x "$PROJECT_PATH"/node_modules/vite/bin/vite.js || log_error "Fallo al establecer permisos de ejecución para vite.js."
# ¡NUEVO! Asegurar que el binario de esbuild tenga permisos de ejecución.
sudo chmod +x "$PROJECT_PATH"/node_modules/@esbuild/linux-x64/bin/esbuild || log_error "Fallo al establecer permisos de ejecución para esbuild."


log_info "Compilando assets de frontend..."
# Se llama directamente al ejecutable 'vite' para evitar problemas con el PATH de npm
"$PROJECT_PATH"/node_modules/.bin/vite build || log_error "Fallo al ejecutar 'vite build'."

log_info "Ejecutando migraciones de base de datos y otros comandos Artisan..."
php artisan migrate --force || log_error "Fallo al ejecutar 'php artisan migrate'."
php artisan storage:link || log_error "Fallo al ejecutar 'php artisan storage:link'."
php artisan config:cache || log_error "Fallo al ejecutar 'php artisan config:cache'."
php artisan route:cache || log_error "Fallo al ejecutar 'php artisan route:cache'."
php artisan view:cache || log_error "Fallo al ejecutar 'php artisan view:cache'."
php artisan event:cache || log_error "Fallo al ejecutar 'php artisan event:cache'."

log_success "Aplicación Laravel configurada correctamente."

# --- 5. Configuración de Nginx ---
log_info "Creando la configuración de Nginx para $DOMAIN..."

NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"
cat <<EOF > "$NGINX_CONFIG"
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;
    root $PROJECT_PATH/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php index.html index.htm;

    charset utf-8;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    # Proxy para el servidor Node.js (icy-server)
    # Las solicitudes a https://loopzmusic.duckdns.org/icy-api/ se reenviarán a http://localhost:3001/
    location /icy-api/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php$PHP_VERSION-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

log_info "Habilitando el sitio Nginx..."
ln -sfn "$NGINX_CONFIG" "/etc/nginx/sites-enabled/$DOMAIN" || log_error "Fallo al habilitar el sitio Nginx."

log_info "Verificando la configuración de Nginx..."
nginx -t || log_error "La configuración de Nginx tiene errores. Por favor, revisa el archivo $NGINX_CONFIG."

log_info "Reiniciando Nginx para aplicar los cambios..."
systemctl restart nginx || log_error "Fallo al reiniciar Nginx."
systemctl enable nginx || log_error "Fallo al habilitar Nginx al inicio."

log_success "Nginx configurado y funcionando."

# --- 6. Configuración SSL con Certbot ---
log_info "Obteniendo certificado SSL con Certbot para $DOMAIN..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m manuel@example.com || log_error "Fallo al obtener el certificado SSL con Certbot. Asegúrate de que el dominio apunta a esta IP y que Nginx está sirviendo en el puerto 80."

log_info "Verificando la configuración de Nginx con SSL..."
nginx -t || log_error "La configuración de Nginx con SSL tiene errores."

log_info "Reiniciando Nginx para aplicar los cambios SSL..."
systemctl restart nginx || log_error "Fallo al reiniciar Nginx después de SSL."

log_success "Certificado SSL obtenido y configurado. Tu sitio ahora usa HTTPS."

# --- 7. Configuración de Servicios Systemd ---

# MeiliSearch Service
log_info "Configurando el servicio Systemd para MeiliSearch..."
MEILI_BIN_PATH="$PROJECT_PATH/meilisearch-linux-amd64"
if [ ! -f "$MEILI_BIN_PATH" ]; then
    log_info "Descargando MeiliSearch..."
    wget -q https://github.com/meilisearch/meilisearch/releases/download/v1.7.0/meilisearch-linux-amd64 -O "$MEILI_BIN_PATH" || log_error "Fallo al descargar Meilisearch."
    chmod +x "$MEILI_BIN_PATH"
fi

cat <<EOF > /etc/systemd/system/meilisearch.service
[Unit]
Description=MeiliSearch
After=network.target

[Service]
User=www-data
Group=www-data
ExecStart=$MEILI_BIN_PATH --master-key '$MEILISEARCH_KEY'
Restart=always
WorkingDirectory=$PROJECT_PATH

[Install]
WantedBy=multi-user.target
EOF

log_info "Iniciando y habilitando el servicio MeiliSearch..."
systemctl daemon-reload || log_error "Fallo al recargar daemon de systemd."
systemctl start meilisearch || log_error "Fallo al iniciar MeiliSearch."
systemctl enable meilisearch || log_error "Fallo al habilitar MeiliSearch al inicio."
log_success "MeiliSearch configurado y funcionando."

# Node.js Icy Server Service
log_info "Configurando el servicio Systemd para el servidor Node.js (icy-server)..."
NODE_SERVER_PATH="$PROJECT_PATH/resources/js/hooks/icy-server.cjs"
if [ ! -f "$NODE_SERVER_PATH" ]; then
    log_error "El archivo del servidor Node.js '$NODE_SERVER_PATH' no existe."
fi

cat <<EOF > /etc/systemd/system/icy-server.service
[Unit]
Description=LoopZ Icy Node Server
After=network.target

[Service]
User=www-data
Group=www-data
ExecStart=/usr/bin/node $NODE_SERVER_PATH
Restart=always
WorkingDirectory=$PROJECT_PATH

[Install]
WantedBy=multi-user.target
EOF

log_info "Iniciando y habilitando el servicio icy-server..."
systemctl daemon-reload || log_error "Fallo al recargar daemon de systemd."
systemctl start icy-server || log_error "Fallo al iniciar icy-server."
systemctl enable icy-server || log_error "Fallo al habilitar icy-server al inicio."
log_success "Servidor Node.js (icy-server) configurado y funcionando."

# --- 8. Configuración del Firewall (UFW) ---
log_info "Configurando el firewall UFW..."
# Se cambió 'OpenSSH' por el puerto 22/tcp directamente para mayor compatibilidad
ufw allow 22/tcp comment 'OpenSSH' || log_error "Fallo al permitir OpenSSH en UFW."
ufw allow 'Nginx Full' || log_error "Fallo al permitir Nginx Full en UFW."
ufw allow 7700/tcp comment 'MeiliSearch' || log_error "Fallo al permitir puerto 7700 en UFW."
ufw allow 5432/tcp comment 'PostgreSQL' || log_error "Fallo al permitir puerto 5432 en UFW."
# No es necesario abrir el puerto 3001 en UFW para acceso externo, ya que Nginx hará de proxy.
# Pero si quieres acceder directamente al puerto 3001 desde localhost (ej. para pruebas),
# asegúrate de que no haya reglas de UFW que lo bloqueen para localhost.

log_info "Habilitando UFW (esto puede interrumpir conexiones SSH si no se permite OpenSSH)..."
ufw --force enable || log_error "Fallo al habilitar UFW."
log_success "Firewall UFW configurado y habilitado."

# --- 9. Verificación Final ---
log_info "Verificación final del estado de los servicios..."
systemctl status nginx php"$PHP_VERSION"-fpm meilisearch icy-server | grep "Active: active (running)" || log_error "Alguno de los servicios no está corriendo. Revisa los logs."

log_success "¡Despliegue de LoopZ completado con éxito!"
log_info "Tu aplicación debería ser accesible en https://$DOMAIN"
log_info "Recuerda que la propagación de DNS puede tardar un poco."
log_info "Puedes verificar el estado de los servicios con 'systemctl status <nombre_servicio>'."
log_info "Los logs de MeiliSearch y icy-server se pueden ver con 'journalctl -u meilisearch' y 'journalctl -u icy-server'."
