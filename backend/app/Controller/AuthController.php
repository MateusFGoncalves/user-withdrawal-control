<?php

declare(strict_types=1);

namespace App\Controller;

use App\Model\User;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\PostMapping;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\Config\Annotation\Value;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

#[Controller]
class AuthController
{
    #[Value('jwt.secret')]
    private string $jwtSecret = 'your-super-secret-jwt-key-change-in-production';

    #[Value('jwt.expiration')]
    private int $jwtExpiration = 3600;

    public function __construct()
    {
    }

    public function register(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => $request->input('password'),
            ]);

            $token = $this->generateToken($user);

            return $response->json([
                'success' => true,
                'message' => 'Usuário criado com sucesso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                    'token' => $token,
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function login(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = User::where('email', $request->input('email'))->first();

            if (!$user || !$user->verifyPassword($request->input('password'))) {
                return $response->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas',
                ])->withStatus(401);
            }

            $token = $this->generateToken($user);

            return $response->json([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                    'token' => $token,
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function me(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $token = $request->header('Authorization');
            
            if (!$token) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token não fornecido',
                ])->withStatus(401);
            }

            $token = str_replace('Bearer ', '', $token);
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            $user = User::find($decoded->user_id);
            
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ])->withStatus(404);
            }

            return $response->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Token inválido',
            ])->withStatus(401);
        }
    }

    private function generateToken(User $user): string
    {
        $payload = [
            'user_id' => $user->id,
            'email' => $user->email,
            'iat' => time(),
            'exp' => time() + $this->jwtExpiration,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }
}