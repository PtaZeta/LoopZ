#!/bin/bash
sudo -u postgres psql -c "CREATE USER loopz WITH PASSWORD 'loopz';"
sudo -u postgres psql -c "CREATE DATABASE loopz OWNER loopz;"
composer install || exit 1
npm install || exit 1
php artisan migrate:fresh --seed || exit 1
