<?php

declare(strict_types=1);

namespace App\Controller\Client;

use App\Controller\AbstractController;
use App\Model\User;
use App\Model\Transaction;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

class AccountController extends AbstractController
{
    public function getBalance(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            // A conta já foi carregada pelo middleware
            $account = $this->getAuthenticatedAccount($request);

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
            $user = $this->getAuthenticatedUser($request);
            
            // A conta já foi carregada pelo middleware
            $account = $this->getAuthenticatedAccount($request);
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
}
