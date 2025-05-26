#!/bin/bash

# Iniciar servidor de desarrollo con Composer
echo "Iniciando servidor de desarrollo con Composer..."
composer run dev &

# Iniciar MeiliSearch
echo "Iniciando MeiliSearch..."
./meilisearch-linux-amd64 --master-key 'e0f2a763db38e7558177ac73161d875a21c1565c13394143b27e11001f231428' &

# Iniciar servidor Node
echo "Iniciando servidor Node icy-server..."
node resources/js/hooks/icy-server.cjs &

# Esperar a que los procesos terminen
wait
