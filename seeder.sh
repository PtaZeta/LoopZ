#!/bin/bash

php artisan migrate:fresh --seed
php artisan scout:import "App\Models\Cancion"
php artisan scout:import "App\Models\Contenedor"

