<?php

use Hyperf\HttpServer\Router\Router;

Router::addRoute(['GET', 'POST', 'PUT', 'DELETE'], '/', 'App\Controller\IndexController@index');

// Rotas de autenticação
Router::post('/auth/register', 'App\Controller\AuthController@register');
Router::post('/auth/login', 'App\Controller\AuthController@login');
Router::get('/auth/me', 'App\Controller\AuthController@me');

// Rotas protegidas
Router::get('/dashboard', 'App\Controller\DashboardController@index');