-- =====================================================
-- USER WITHDRAWAL CONTROL - SCHEMA COMPLETO
-- Sistema de Controle de Saques via PIX
-- =====================================================

-- =====================================================
-- Tabela: users
-- Descrição: Usuários do sistema (CLIENTE ou MASTER)
-- =====================================================
CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Nome completo do usuário',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT 'Email único para login',
    password VARCHAR(255) NULL COMMENT 'Senha hasheada (bcrypt)',
    user_type ENUM('CLIENTE', 'MASTER') NOT NULL DEFAULT 'CLIENTE' COMMENT 'Tipo de acesso',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabela: accounts
-- Descrição: Contas digitais com saldo
-- =====================================================
CREATE TABLE accounts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Referência ao usuário',
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Saldo monetário em reais',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabela: transactions
-- Descrição: Histórico completo de transações
-- =====================================================
CREATE TABLE transactions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Referência ao usuário',
    account_id BIGINT UNSIGNED NOT NULL COMMENT 'Referência à conta',
    type ENUM('DEPOSITO', 'SAQUE') NOT NULL COMMENT 'Tipo de transação',
    amount DECIMAL(15, 2) NOT NULL COMMENT 'Valor da transação',
    status ENUM('PENDENTE', 'PROCESSADO', 'FALHOU', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE' COMMENT 'Status da transação',
    scheduled_at TIMESTAMP NULL COMMENT 'Data agendada (para saques)',
    processed_at TIMESTAMP NULL COMMENT 'Data de processamento',
    failure_reason TEXT NULL COMMENT 'Motivo da falha (se status = FALHOU)',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    INDEX idx_user_type (user_id, type),
    INDEX idx_account_status (account_id, status),
    INDEX idx_scheduled_at (scheduled_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabela: withdrawal_details
-- Descrição: Detalhes dos saques via PIX
-- =====================================================
CREATE TABLE withdrawal_details (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    transaction_id BIGINT UNSIGNED NOT NULL COMMENT 'Referência à transação',
    pix_type ENUM('EMAIL', 'PHONE', 'CPF', 'RANDOM') NOT NULL COMMENT 'Tipo de chave PIX',
    pix_key VARCHAR(255) NOT NULL COMMENT 'Chave PIX',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de atualização',
    
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RELACIONAMENTOS ENTRE AS TABELAS
-- =====================================================

-- users (1) ────────< (N) accounts
-- users (1) ────────< (N) transactions
-- accounts (1) ────────< (N) transactions
-- transactions (1) ────────< (1) withdrawal_details

-- =====================================================
-- ÍNDICES E PERFORMANCE
-- =====================================================

-- Índice composto para buscar transações por usuário e tipo
-- Utilizado em: listagem de extrato, filtros
CREATE INDEX idx_user_type ON transactions(user_id, type);

-- Índice composto para buscar transações por conta e status
-- Utilizado em: verificação de saques agendados, saldo disponível
CREATE INDEX idx_account_status ON transactions(account_id, status);

-- Índice para transações agendadas
-- Utilizado em: CRON de processamento de saques agendados
CREATE INDEX idx_scheduled_at ON transactions(scheduled_at);

-- =====================================================
-- COMENTÁRIOS SOBRE OS ENUMS
-- =====================================================

-- user_type (tabela users):
--   - CLIENTE: Acesso limitado ao próprio dashboard, depósitos, saques e extrato
--   - MASTER: Acesso administrativo completo (gestão de clientes, transações, estatísticas)

-- status (tabela transactions):
--   - PENDENTE: Saque agendado aguardando processamento
--   - PROCESSADO: Transação executada com sucesso
--   - FALHOU: Transação falhou (ex: saldo insuficiente)
--   - CANCELADO: Saque agendado cancelado pelo usuário

-- type (tabela transactions):
--   - DEPOSITO: Entrada de dinheiro na conta
--   - SAQUE: Saída de dinheiro da conta

-- pix_type (tabela withdrawal_details):
--   - EMAIL: Chave PIX por email
--   - PHONE: Chave PIX por telefone
--   - CPF: Chave PIX por CPF
--   - RANDOM: Chave PIX aleatória

-- =====================================================
-- REGRAS DE NEGÓCIO IMPLEMENTADAS
-- =====================================================

-- 1. Relacionamento 1:1 entre users e accounts
-- 2. Relacionamento 1:N entre users e transactions
-- 3. Relacionamento 1:N entre accounts e transactions
-- 4. Relacionamento 1:1 entre transactions e withdrawal_details (apenas para saques)
-- 5. Cascade delete: ao deletar usuário, deleta conta e transações
-- 6. Saldo nunca pode ser negativo (validado na aplicação)
-- 7. Email único no sistema
-- 8. Senha pode ser NULL (suporte a primeiro acesso)
-- 9. Transações têm timestamps detalhados (created_at, updated_at, scheduled_at, processed_at)

-- =====================================================
-- OBSERVAÇÕES PARA DIAGRAMA
-- =====================================================

-- Relacionamentos:
--   1. users → accounts (1:1) [Foreign Key: accounts.user_id]
--   2. users → transactions (1:N) [Foreign Key: transactions.user_id]
--   3. accounts → transactions (1:N) [Foreign Key: transactions.account_id]
--   4. transactions → withdrawal_details (1:1) [Foreign Key: withdrawal_details.transaction_id]

-- Cardinalidades:
--   - Um usuário tem exatamente UMA conta
--   - Um usuário pode ter MUITAS transações
--   - Uma conta pode ter MUITAS transações
--   - Uma transação pode ter ZERO ou UM withdrawal_details (apenas saques)

-- Atributos importantes:
--   - password é NULLABLE (primeiro acesso)
--   - balance inicia em 0.00
--   - scheduled_at e processed_at são NULLABLE
--   - failure_reason é NULLABLE

-- Índices criados para performance:
--   - idx_email: busca rápida de usuários por email
--   - idx_user_id: busca rápida de contas por usuário
--   - idx_user_type: busca otimizada de transações por usuário e tipo
--   - idx_account_status: busca otimizada de transações por conta e status
--   - idx_scheduled_at: processamento eficiente de saques agendados
--   - idx_transaction_id: busca rápida de detalhes PIX por transação

