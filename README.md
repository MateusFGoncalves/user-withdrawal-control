# User Withdrawal Control

Sistema web completo de controle de usuários desenvolvido com arquitetura de microsserviços, utilizando PHP Hyperf 3 no backend e React com shadcn/ui no frontend.

## 🏗️ Arquitetura

O projeto segue uma arquitetura de microsserviços containerizada com Docker, incluindo:

- **Backend**: PHP Hyperf 3 com autenticação JWT
- **Frontend**: React 18 com TypeScript e shadcn/ui
- **Banco de Dados**: MySQL 8.0
- **Cache**: Redis 7
- **Reverse Proxy**: Nginx
- **Containerização**: Docker e Docker Compose

## 🚀 Stack Tecnológica

### Backend
- **PHP Hyperf 3**: Framework moderno para PHP com suporte a Swoole
- **MySQL 8.0**: Banco de dados relacional para persistência de dados
- **Redis 7**: Cache e armazenamento de sessões
- **JWT**: Autenticação baseada em tokens
- **Docker**: Containerização do ambiente

### Frontend
- **React 18**: Biblioteca para interfaces de usuário
- **TypeScript**: Tipagem estática para JavaScript
- **shadcn/ui**: Biblioteca de componentes modernos e acessíveis
- **Tailwind CSS**: Framework CSS utilitário
- **React Router**: Roteamento client-side
- **Lucide React**: Ícones modernos

### Infraestrutura
- **Docker & Docker Compose**: Orquestração de containers
- **Nginx**: Reverse proxy e load balancer
- **MySQL**: Banco de dados principal
- **Redis**: Cache e filas

## 📋 Funcionalidades

### Módulo de Autenticação
- ✅ Cadastro de usuários
- ✅ Login com JWT
- ✅ Validação de tokens
- ✅ Proteção de rotas

### Interface do Usuário
- ✅ Página de login responsiva
- ✅ Página de cadastro com validação
- ✅ Dashboard com sidebar e navbar
- ✅ Design system consistente com shadcn/ui
- ✅ Interface moderna e acessível

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Docker
- Docker Compose
- Git

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd user-withdrawal-control
```

### 2. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto (opcional, as configurações padrão funcionam para desenvolvimento):

```env
# Backend
JWT_SECRET=your-super-secret-jwt-key-change-in-production
DB_PASSWORD=app_password

# Frontend
REACT_APP_API_URL=http://localhost/api
```

### 3. Inicie os serviços
```bash
docker-compose up -d
```

### 4. Execute o script de configuração
```bash
# Script automatizado que executa migrations e seeders
./setup.sh
```

### 5. Acesse a aplicação
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8080
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

### 🔧 Comandos de Migrations e Seeders

#### Migrations
```bash
# Executar migrations
docker-compose exec backend php bin/hyperf.php migrate

# Criar nova migration
docker-compose exec backend php bin/hyperf.php gen:migration nome_da_migration

# Ver status das migrations
docker-compose exec backend php bin/hyperf.php migrate:status

# Rollback da última migration
docker-compose exec backend php bin/hyperf.php migrate:rollback
```

#### Seeders
```bash
# Executar seeders
docker-compose exec backend php bin/hyperf.php db:seed

# Criar novo seeder
docker-compose exec backend php bin/hyperf.php gen:seeder NomeSeeder
```

## 📁 Estrutura do Projeto

```
user-withdrawal-control/
├── backend/                 # API PHP Hyperf 3
│   ├── app/
│   │   ├── Controller/      # Controladores da API
│   │   └── Model/          # Modelos de dados
│   ├── config/             # Configurações do Hyperf
│   ├── migrations/         # Migrations do banco de dados
│   ├── seeders/            # Seeders para dados iniciais
│   ├── Dockerfile
│   └── composer.json
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── ui/         # Componentes shadcn/ui
│   │   │   └── layout/     # Componentes de layout
│   │   ├── pages/          # Páginas da aplicação
│   │   └── lib/            # Utilitários
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── nginx/                  # Configuração do Nginx
│   └── nginx.conf
├── docker-compose.yml      # Orquestração dos serviços
└── README.md
```

## 🔧 Desenvolvimento

### Backend (PHP Hyperf)
```bash
cd backend
composer install
php bin/hyperf.php start
```

### Frontend (React)
```bash
cd frontend
npm install
npm start
```

## 🐳 Docker

### Comandos úteis
```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Rebuild dos containers
docker-compose up --build

# Acessar container do backend
docker-compose exec backend bash

# Acessar container do frontend
docker-compose exec frontend sh
```

## 🔐 Segurança

- Autenticação JWT com expiração configurável
- Validação de dados no backend
- CORS configurado no Nginx
- Senhas hasheadas com `password_hash()`
- Tokens seguros com chave secreta

## 📊 Banco de Dados

### Tabela `users`
```sql
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login de usuário
- `POST /api/auth/me` - Informações do usuário autenticado

### Dashboard
- `GET /api/dashboard` - Dados do dashboard

## 🎨 Design System

O projeto utiliza o shadcn/ui como base para o design system, garantindo:
- Componentes acessíveis
- Design consistente
- Temas claro/escuro
- Responsividade
- Tipografia moderna

## 🚀 Deploy

### Produção
1. Configure as variáveis de ambiente de produção
2. Altere as senhas padrão
3. Configure um domínio no Nginx
4. Execute `docker-compose up -d`

### Variáveis de ambiente importantes para produção:
```env
JWT_SECRET=chave-super-secreta-para-producao
DB_PASSWORD=senha-forte-para-producao
APP_ENV=production
APP_DEBUG=false
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato através do email.

---

**Desenvolvido com ❤️ usando PHP Hyperf 3, React e shadcn/ui**
