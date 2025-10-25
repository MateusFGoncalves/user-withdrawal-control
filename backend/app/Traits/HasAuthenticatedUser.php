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
    protected function getAuthenticatedUser(RequestInterface $request): ?User
    {
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
}
