# Guia de Uso do Postman - User Withdrawal Control API

Este documento explica como configurar e usar a collection do Postman para testar a API do User Withdrawal Control.

## 📦 Arquivos Disponíveis

- `User_Withdrawal_Control.postman_collection.json` - Collection com todas as rotas da API
- `User_Withdrawal_Control.postman_environment.json` - Arquivo de ambiente com variáveis

## 🚀 Como Configurar

### 1. Importar a Collection e o Ambiente

1. Abra o Postman
2. Clique em **Import** (botão no canto superior esquerdo)
3. Arraste os arquivos:
   - `User_Withdrawal_Control.postman_collection.json`
   - `User_Withdrawal_Control.postman_environment.json`
4. Clique em **Import** para concluir

### 2. Selecionar o Ambiente

1. No canto superior direito do Postman, selecione o ambiente: **User Withdrawal Control - Local**
2. Isso garantirá que as variáveis de ambiente sejam usadas corretamente

### 3. Configurar a URL Base

Se necessário, você pode modificar a URL base nas variáveis de ambiente:
- **base_url**: `http://localhost:8080` (padrão)

## 📋 Variáveis de Ambiente Disponíveis

| Variável | Valor Padrão | Descrição |
|----------|--------------|-----------|
| `base_url` | `http://localhost:8080` | URL base da API |
| `token` | (automaticamente preenchido) | Token JWT de autenticação |
| `user_type` | (automaticamente preenchido) | Tipo de usuário (CLIENTE/MASTER) |
| `client_email` | `teste@exemplo.com` | Email do cliente de teste |
| `client_password` | `123456` | Senha do cliente de teste |
| `master_email` | `admin@admin.com` | Email do master de teste |
| `master_password` | `admin123` | Senha do master de teste |

## 🎯 Como Usar

### 1. Autenticação Automática

Alguns requests estão configurados para salvar automaticamente o token:

1. **Login** (`POST /api/auth/login`)
   - Executa um script de teste que salva o token na variável `{{token}}`
   - Todas as requisições subsequentes usarão esse token automaticamente

2. **Register** (`POST /api/auth/register`)
   - Também salva o token automaticamente após o registro

### 2. Ordem Recomendada de Teste

#### Para Cliente (CLIENTE)
1. **Authentication > Login** - Autenticar como cliente
2. **Client - Account > Get Balance** - Verificar saldo
3. **Client - Transactions > Deposit** - Fazer um depósito
4. **Client - Transactions > Withdraw Immediate** - Fazer um saque imediato
5. **Client - Transactions > Withdraw Scheduled** - Agendar um saque
6. **Client - Transactions > Get Statement** - Ver extrato completo
7. **Client - Transactions > Export Excel** - Exportar extrato

#### Para Master (MASTER)
1. **Authentication > Login** - Autenticar como master (use `admin@admin.com`)
2. **Master - Transactions > Get Stats** - Ver estatísticas gerais
3. **Master - Transactions > Get Recent Transactions** - Ver transações recentes
4. **Master - Clients > List Clients** - Listar todos os clientes
5. **Master - Clients > Create Client** - Criar um novo cliente
6. **Master - Transactions > Export Excel** - Exportar transações em Excel

## 📂 Estrutura da Collection

```
Authentication
  ├── Register
  ├── Login
  ├── Set Initial Password
  └── Get Me

Client - Account
  ├── Get Balance
  └── Get Account Info

Client - Transactions
  ├── Deposit
  ├── Withdraw Immediate
  ├── Withdraw Scheduled
  ├── Cancel Scheduled Withdrawal
  ├── Get Statement
  ├── Get Recent Transactions
  └── Export Excel

Master - Transactions
  ├── Get Stats
  ├── Get Recent Transactions
  ├── List All Transactions
  └── Export Excel

Master - Clients
  ├── List Clients
  ├── Create Client
  ├── Get Client
  └── Update Client
```

## 🔑 Endpoints por Funcionalidade

### 🔐 Autenticação
- `POST /api/auth/register` - Registrar novo usuário
- `POST /api/auth/login` - Fazer login
- `POST /api/auth/set-password` - Definir senha inicial (cliente novo)
- `GET /api/auth/me` - Informações do usuário autenticado

### 💰 Conta (Cliente)
- `GET /api/client/account/balance` - Consultar saldo
- `GET /api/client/account/info` - Informações da conta

### 💸 Transações (Cliente)
- `POST /api/client/transactions/deposit` - Realizar depósito
- `POST /api/client/transactions/withdraw` - Realizar saque (imediato/agendado)
- `POST /api/client/transactions/cancel-scheduled` - Cancelar saque agendado
- `GET /api/client/transactions/statement` - Consultar extrato com paginação
- `GET /api/client/transactions/recent` - Transações recentes (dashboard)
- `GET /api/client/transactions/export-excel` - Exportar extrato

### 👑 Master - Transações
- `GET /api/master/transactions/stats` - Estatísticas administrativas
- `GET /api/master/transactions/recent` - Transações recentes de todos
- `GET /api/master/transactions/list` - Listar todas transações com filtros
- `GET /api/master/transactions/export-excel` - Exportar transações

### 👑 Master - Clientes
- `GET /api/master/clients/list` - Listar clientes com paginação
- `POST /api/master/clients/create` - Cadastrar novo cliente
- `GET /api/master/clients/:id` - Visualizar detalhes do cliente
- `PUT /api/master/clients/:id` - Editar cliente

## 💡 Dicas de Uso

### Token Automático
- O token é salvo automaticamente após login
- Use `Bearer {{token}}` nas requisições protegidas
- O token é incluído automaticamente pelos scripts de teste

### Variáveis Dinâmicas
- `{{base_url}}` - URL base da API
- `{{token}}` - Token JWT
- `{{user_type}}` - Tipo de usuário

### Filtros e Parâmetros
- **Statement**: Use `type=all`, `status=all` para buscar todas as transações
- **List Transactions**: Use `search=` para buscar por nome do cliente
- **Paginação**: Use `page=1`, `limit=10` para controlar a paginação

### Exemplos de Uso

#### Fazer Login e Usar Token
```http
POST {{base_url}}/api/auth/login
Content-Type: application/json

{
  "email": "{{client_email}}",
  "password": "{{client_password}}"
}
```
O token será salvo automaticamente e usado nas próximas requisições.

#### Consultar Extrato com Filtros
```http
GET {{base_url}}/api/client/transactions/statement?page=1&per_page=10&type=SAQUE&status=PENDENTE
Authorization: Bearer {{token}}
```

#### Exportar Para Excel
```http
GET {{base_url}}/api/client/transactions/export-excel?type=all&status=all
Authorization: Bearer {{token}}
```
O arquivo será baixado automaticamente.

## 🧪 Testes Recomendados

### Cenário 1: Fluxo Completo de Cliente
1. Login como cliente
2. Verificar saldo inicial
3. Fazer depósito de R$ 500
4. Fazer saque imediato de R$ 100
5. Agendar saque de R$ 50 para amanhã
6. Ver extrato completo
7. Cancelar saque agendado
8. Exportar extrato em Excel

### Cenário 2: Gestão de Clientes (Master)
1. Login como master
2. Listar todos os clientes
3. Criar novo cliente (sem senha)
4. Buscar cliente específico
5. Editar informações do cliente
6. Ver transações recentes do sistema
7. Exportar transações em Excel

## ⚠️ Observações Importantes

- O token expira em **1 hora** (configurável)
- Após expiração, faça login novamente
- Requests protegidos exigem o header `Authorization: Bearer {{token}}`
- O ambiente `User Withdrawal Control - Local` deve estar selecionado
- Certifique-se de que os serviços Docker estão rodando (`docker-compose up -d`)

## 🐛 Solução de Problemas

### Erro: "Token de autorização não fornecido"
- Faça login novamente para atualizar o token
- Verifique se a variável `{{token}}` está preenchida

### Erro: "Acesso negado"
- Verifique se está usando as credenciais corretas (CLIENTE vs MASTER)
- Master só acessa rotas `/master/*`
- Cliente só acessa rotas `/client/*`

### Erro: Connection refused
- Certifique-se de que o backend está rodando: `docker-compose ps`
- Verifique se a URL base está correta: `http://localhost:8080`

## 📚 Documentação Adicional

Para mais informações sobre a API, consulte:
- `README.md` - Documentação completa do projeto
- `backend/app/Controller/` - Código fonte dos controllers
- `backend/config/routes.php` - Definição de todas as rotas

---

**Desenvolvido com ❤️ para facilitar o teste da API**

