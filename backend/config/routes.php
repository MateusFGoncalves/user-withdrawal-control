<?php

use Hyperf\HttpServer\Router\Router;

Router::addRoute(['GET', 'POST', 'PUT', 'DELETE'], '/', 'App\Controller\IndexController@index');

// Rotas de autenticação
Router::post('/auth/register', 'App\Controller\AuthController@register');
Router::post('/auth/login', 'App\Controller\AuthController@login');
Router::get('/auth/me', 'App\Controller\AuthController@me');

// Rotas de conta (protegidas)
Router::get('/account/balance', 'App\Controller\AccountController@getBalance');
Router::get('/account/info', 'App\Controller\AccountController@getAccountInfo');

// Rotas de transações (protegidas)
Router::post('/transactions/deposit', 'App\Controller\TransactionController@deposit');
Router::post('/transactions/withdraw', 'App\Controller\TransactionController@withdraw');
Router::get('/transactions/statement', 'App\Controller\TransactionController@getStatement');
Router::get('/transactions/recent', 'App\Controller\TransactionController@getRecentTransactions');
Router::post('/transactions/cancel-scheduled', 'App\Controller\TransactionController@cancelScheduledWithdrawal');

// Rotas protegidas
Router::get('/dashboard', 'App\Controller\DashboardController@index');