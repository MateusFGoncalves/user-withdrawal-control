#!/bin/sh
set -e

# Iniciar o cron em background
crond -f -d 8 &

# Executar o Hyperf
exec php /opt/www/bin/hyperf.php start

