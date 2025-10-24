<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */

namespace App\Controller;

use App\Model\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Hyperf\Config\Annotation\Value;
use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Container\ContainerInterface;

abstract class AbstractController
{
    #[Inject]
    protected ContainerInterface $container;

    #[Inject]
    protected RequestInterface $request;

    #[Inject]
    protected ResponseInterface $response;

    #[Value('jwt.secret')]
    protected string $jwtSecret = 'your-super-secret-jwt-key-change-in-production';

    /**
     * Obtém o usuário a partir do token JWT
     */
    protected function getUserFromToken(): ?User
    {
        $token = $this->request->header('Authorization');
        if (!$token) {
            return null;
        }

        $token = str_replace('Bearer ', '', $token);
        
        try {
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            return User::find($decoded->user_id);
        } catch (\Exception $e) {
            return null;
        }
    }
}
