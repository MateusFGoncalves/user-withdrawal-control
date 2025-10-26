<?php

declare(strict_types=1);

namespace App\Middleware;

use Hyperf\Context\Context;
use Hyperf\HttpServer\Contract\RequestInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class LoadUserAccountMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Verificar se há um usuário autenticado
        $user = $request->getAttribute('user');
        
        if ($user) {
            // Carregar a conta do usuário e adicionar ao request
            $account = $user->account;
            $request = $request->withAttribute('account', $account);
            
            // Atualizar o contexto
            Context::set(ServerRequestInterface::class, $request);
        }
        
        return $handler->handle($request);
    }
}
