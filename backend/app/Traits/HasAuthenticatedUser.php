<?php

declare(strict_types=1);

namespace App\Traits;

use App\Model\User;
use Hyperf\HttpServer\Contract\RequestInterface;

trait HasAuthenticatedUser
{
    /**
     * Obter usuário autenticado do request
     */
    protected function getAuthenticatedUser($request): ?User
    {
        // Se é Form Request, acessar o request base
        if ($request instanceof \App\Request\FormRequest) {
            $request = $request->getRequest();
        }
        
        return $request->getAttribute('user');
    }

    /**
     * Verificar se usuário está autenticado
     */
    protected function isAuthenticated(RequestInterface $request): bool
    {
        return $this->getAuthenticatedUser($request) !== null;
    }

    /**
     * Obter ID do usuário autenticado
     */
    protected function getAuthenticatedUserId(RequestInterface $request): ?int
    {
        $user = $this->getAuthenticatedUser($request);
        return $user ? $user->id : null;
    }

    /**
     * Verificar se usuário é Master
     */
    protected function isMaster(RequestInterface $request): bool
    {
        $user = $this->getAuthenticatedUser($request);
        return $user && $user->user_type === 'MASTER';
    }

    /**
     * Verificar se usuário é Cliente
     */
    protected function isClient(RequestInterface $request): bool
    {
        $user = $this->getAuthenticatedUser($request);
        return $user && $user->user_type === 'CLIENTE';
    }

    /**
     * Obter conta do usuário autenticado do request
     */
    protected function getAuthenticatedAccount($request)
    {
        // Se é Form Request, acessar o request base
        if ($request instanceof \App\Request\FormRequest) {
            $baseRequest = $request->getRequest();
            $account = $baseRequest->getAttribute('account');
        } else {
            $account = $request->getAttribute('account');
        }
        
        // Se não houver conta no atributo, tentar carregar do usuário
        if (!$account) {
            $user = $this->getAuthenticatedUser($request);
            if ($user) {
                $account = $user->account;
            }
        }
        
        return $account;
    }
}
