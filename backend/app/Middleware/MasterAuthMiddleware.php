<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Model\User;
use Hyperf\Context\ApplicationContext;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class MasterAuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): PsrResponseInterface
    {
        $response = ApplicationContext::getContainer()->get(ResponseInterface::class);
        
        // Obter usuário do request (deve ter passado pelo AuthMiddleware primeiro)
        $user = $request->getAttribute('user');
        
        if (!$user) {
            return $response->json([
                'success' => false,
                'message' => 'Usuário não autenticado',
            ])->withStatus(401);
        }

        // Verificar se é usuário Master
        if ($user->user_type !== 'MASTER') {
            return $response->json([
                'success' => false,
                'message' => 'Acesso negado. Apenas administradores podem acessar esta área',
            ])->withStatus(403);
        }

        return $handler->handle($request);
    }
}
