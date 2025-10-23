<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

#[Controller]
class DashboardController
{
    public function index(ResponseInterface $response): PsrResponseInterface
    {
        return $response->json([
            'success' => true,
            'message' => 'Bem-vindo ao dashboard',
            'data' => [
                'message' => 'Esta é a área restrita do sistema',
                'timestamp' => date('Y-m-d H:i:s'),
            ],
        ]);
    }
}