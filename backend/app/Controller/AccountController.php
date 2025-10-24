<?php

declare(strict_types=1);

namespace App\Controller;

use App\Model\Account;
use App\Model\User;
use App\Model\Transaction;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\Config\Annotation\Value;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

class AccountController
{
    #[Value('jwt.secret')]
    private string $jwtSecret = 'your-super-secret-jwt-key-change-in-production';

    public function getBalance(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            // Buscar conta diretamente
            $account = Account::where('user_id', $user->id)->first();
            if (!$account) {
                return $response->json([
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ])->withStatus(404);
            }

            return $response->json([
                'success' => true,
                'data' => $account->getBalanceData(),
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function getAccountInfo(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            $account = $user->account;
            if (!$account) {
                return $response->json([
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ])->withStatus(404);
            }

            $balanceData = $account->getBalanceData();

            return $response->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                    'account' => array_merge([
                        'id' => $account->id,
                        'created_at' => $account->created_at,
                    ], $balanceData),
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    private function getUserFromToken(RequestInterface $request): ?User
    {
        try {
            $token = $request->header('Authorization');
            if (empty($token)) {
                return null;
            }

            $token = str_replace('Bearer ', '', $token);
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            return User::with('account')->find($decoded->user_id);
        } catch (\Exception $e) {
            return null;
        }
    }
}
