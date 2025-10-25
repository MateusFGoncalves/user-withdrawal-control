<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Model\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Hyperf\Context\ApplicationContext;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AuthMiddleware implements MiddlewareInterface
{
    private string $jwtSecret = 'your-super-secret-jwt-key-change-in-production';

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): PsrResponseInterface
    {
        $response = ApplicationContext::getContainer()->get(ResponseInterface::class);
        
        try {
            // Obter token do header Authorization
            $authHeader = $request->getHeaderLine('Authorization');
            
            if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token de autorização não fornecido',
                ])->withStatus(401);
            }

            $token = substr($authHeader, 7); // Remove "Bearer " prefix
            
            // Decodificar e validar token
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            // Buscar usuário no banco de dados
            $user = User::find($decoded->user_id);
            
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ])->withStatus(401);
            }

            // Adicionar usuário ao request para uso nos controllers
            $request = $request->withAttribute('user', $user);
            
            return $handler->handle($request);
            
        } catch (\Firebase\JWT\ExpiredException $e) {
            return $response->json([
                'success' => false,
                'message' => 'Token expirado',
            ])->withStatus(401);
        } catch (\Firebase\JWT\SignatureInvalidException $e) {
            return $response->json([
                'success' => false,
                'message' => 'Token inválido',
            ])->withStatus(401);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro de autenticação: ' . $e->getMessage(),
            ])->withStatus(401);
        }
    }
}
