#!/bin/bash

# Este script limpia la base de datos, la vuelve a sembrar y luego reindexa los datos para Meilisearch.

echo "🚨 ¡ADVERTENCIA: Esto borrará todos los datos de tu base de datos!"
read -p "¿Estás seguro de que quieres continuar? (s/N): " confirm

if [[ $confirm =~ ^[sS]$ ]]; then
    echo "Reiniciando la base de datos y ejecutando seeders..."
    php artisan migrate:fresh --seed

    if [ $? -eq 0 ]; then
        echo "Base de datos reiniciada y sembrada con éxito."
        echo "Iniciando la importación de datos a Meilisearch..."

        # Reemplaza 'App\Models\Cancion' y 'App\Models\Contenedor'
        # con los modelos que realmente estés indexando con Meilisearch (Laravel Scout).
        # Si tienes muchos modelos indexados, simplemente puedes usar 'php artisan scout:import'
        # sin especificar un modelo para importar todos los modelos indexables.
        php artisan scout:import "App\Models\Cancion"
        php artisan scout:import "App\Models\Contenedor"
        # php artisan scout:import # Descomenta esta línea si quieres importar todos los modelos

        if [ $? -eq 0 ]; then
            echo "✅ Datos importados a Meilisearch con éxito."
        else
            echo "❌ Error al importar datos a Meilisearch. Asegúrate de que Meilisearch esté corriendo."
        fi
    else
        echo "❌ Error al reiniciar o sembrar la base de datos."
    fi
else
    echo "Operación cancelada."
fi

echo "Proceso finalizado."
