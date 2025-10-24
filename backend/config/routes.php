<?php

use Hyperf\HttpServer\Router\Router;

// Rotas de autenticação
Router::post('/auth/register', 'App\Controller\AuthController@register');
Router::post('/auth/login', 'App\Controller\AuthController@login');
Router::post('/auth/set-password', 'App\Controller\AuthController@setInitialPassword');
Router::get('/auth/me', 'App\Controller\AuthController@me');

// Grupo de rotas para clientes
Router::addGroup('/client', function () {
    Router::get('/account/balance', 'App\Controller\Client\AccountController@getBalance');
    Router::get('/account/info', 'App\Controller\Client\AccountController@getAccountInfo');
    Router::post('/transactions/deposit', 'App\Controller\Client\TransactionController@deposit');
    Router::post('/transactions/withdraw', 'App\Controller\Client\TransactionController@withdraw');
    Router::get('/transactions/statement', 'App\Controller\Client\TransactionController@getStatement');
    Router::get('/transactions/recent', 'App\Controller\Client\TransactionController@getRecentTransactions');
    Router::post('/transactions/cancel-scheduled', 'App\Controller\Client\TransactionController@cancelScheduledWithdrawal');
    Router::get('/transactions/export-excel', 'App\Controller\Client\TransactionController@exportExcel');
});

// Grupo de rotas para administradores
Router::addGroup('/master', function () {
    Router::get('/transactions/stats', 'App\Controller\Master\TransactionController@getStats');
    Router::get('/transactions/recent', 'App\Controller\Master\TransactionController@getRecentTransactions');
    Router::get('/transactions/list', 'App\Controller\Master\TransactionController@getTransactions');
    Router::get('/clients/list', 'App\Controller\Master\ClientController@getClients');
    Router::post('/clients/create', 'App\Controller\Master\ClientController@createClient');
    Router::get('/clients/{id}', 'App\Controller\Master\ClientController@getClient');
    Router::put('/clients/{id}', 'App\Controller\Master\ClientController@updateClient');
});