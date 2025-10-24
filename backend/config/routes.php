<?php

use Hyperf\HttpServer\Router\Router;

// Rotas de autenticação
Router::post('/auth/register', 'App\Controller\AuthController@register');
Router::post('/auth/login', 'App\Controller\AuthController@login');
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

