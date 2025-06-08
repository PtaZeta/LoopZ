#!/bin/bash
composer run dev &
./meilisearch-linux-amd64 --master-key 'e0f2a763db38e7558177ac73161d875a21c1565' &
mailpit &
node resources/js/hooks/icy-server.cjs &
wait
