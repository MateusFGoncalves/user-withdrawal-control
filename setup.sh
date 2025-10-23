#!/bin/bash

# Script de inicialização do projeto
echo "🚀 Iniciando User Withdrawal Control..."

# Aguardar o MySQL estar pronto
echo "⏳ Aguardando MySQL estar pronto..."
until docker-compose exec -T mysql mysqladmin ping -h localhost --silent; do
    echo "MySQL não está pronto ainda..."
    sleep 2
done
echo "✅ MySQL está pronto!"

# Executar migrations
echo "📊 Executando migrations..."
docker-compose exec -T backend php bin/hyperf.php migrate:fresh --force

# Executar seeders
echo "🌱 Executando seeders..."
docker-compose exec -T backend php bin/hyperf.php db:seed

echo "✅ Migrations e seeders executados com sucesso!"
echo "🎉 Projeto pronto para uso!"
echo ""
echo "📱 URLs de acesso:"
echo "   Frontend: http://localhost:3000"
echo "   API: http://localhost:8080"
echo ""
echo "🔑 Credenciais de teste:"
echo "   Email: teste@exemplo.com"
echo "   Senha: 123456"
