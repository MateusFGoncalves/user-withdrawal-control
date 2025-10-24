<?php

declare(strict_types=1);

namespace App\Controller\Master;

use App\Controller\AbstractController;
use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\HttpServer\Contract\RequestInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;
use App\Model\User;
use App\Model\Account;
use App\Model\Transaction;

#[Controller]
class TransactionController extends AbstractController
{
    #[GetMapping('/stats')]
    public function getStats(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            // Verificar se o usuário é MASTER
            $user = $this->getUserFromToken();
            if (!$user || $user->user_type !== 'MASTER') {
                return $response->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas administradores.',
                ])->withStatus(403);
            }

            // Buscar estatísticas reais
            $totalClients = User::where('user_type', 'CLIENTE')->count();
            $totalTransactions = Transaction::count();
            
            // Calcular total de fundos (soma de todos os saldos)
            $totalFunds = Account::sum('balance');
            
            // Calcular total de saques agendados (soma de todos os saques pendentes)
            $totalScheduledWithdrawals = Transaction::where('type', 'SAQUE')
                ->where('status', 'PENDENTE')
                ->sum('amount');

            // Buscar transações recentes
            $recentTransactions = Transaction::with(['user', 'withdrawalDetails'])
                ->orderBy('created_at', 'desc')
                ->limit(4)
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                        'status' => $transaction->status,
                        'user_name' => $transaction->user->name,
                        'user_email' => $transaction->user->email,
                        'created_at' => $transaction->created_at,
                        'formatted_date' => $transaction->created_at->format('d/m/Y H:i'),
                        'scheduled_at' => $transaction->scheduled_at,
                        'processed_at' => $transaction->processed_at,
                        'pix_type' => $transaction->withdrawalDetails?->pix_type,
                        'pix_key' => $transaction->withdrawalDetails?->pix_key,
                        'failure_reason' => $transaction->failure_reason,
                    ];
                });

            return $response->json([
                'success' => true,
                'data' => [
                    'stats' => [
                        'totalClients' => $totalClients,
                        'totalTransactions' => $totalTransactions,
                        'totalFunds' => $totalFunds,
                        'formattedTotalFunds' => 'R$ ' . number_format((float) $totalFunds, 2, ',', '.'),
                        'totalScheduledWithdrawals' => $totalScheduledWithdrawals,
                        'formattedTotalScheduledWithdrawals' => 'R$ ' . number_format((float) $totalScheduledWithdrawals, 2, ',', '.'),
                    ],
                    'recentTransactions' => $recentTransactions,
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    #[GetMapping('/recent')]
    public function getRecentTransactions(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            // Verificar se o usuário é MASTER
            $user = $this->getUserFromToken();
            if (!$user || $user->user_type !== 'MASTER') {
                return $response->json([
                    'success' => false,
                    'message' => 'Acesso negado. Apenas administradores.',
                ])->withStatus(403);
            }

            // Parâmetros
            $limit = (int) $request->input('limit', 4);
            $days = (int) $request->input('days', 30); // Últimos 30 dias por padrão

            // Calcular data limite
            $dateLimit = date('Y-m-d H:i:s', strtotime("-{$days} days"));

            // Buscar transações recentes de todos os usuários
            $transactions = Transaction::where('created_at', '>=', $dateLimit)
                ->with(['user', 'withdrawalDetails'])
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            $formattedTransactions = $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                    'status' => $transaction->status,
                    'user_name' => $transaction->user->name,
                    'user_email' => $transaction->user->email,
                    'created_at' => $transaction->created_at,
                    'formatted_date' => $transaction->created_at->format('d/m/Y H:i'),
                    'scheduled_at' => $transaction->scheduled_at,
                    'processed_at' => $transaction->processed_at,
                    'pix_type' => $transaction->withdrawalDetails?->pix_type,
                    'pix_key' => $transaction->withdrawalDetails?->pix_key,
                    'failure_reason' => $transaction->failure_reason,
                ];
            });

            return $response->json([
                'success' => true,
                'data' => [
                    'transactions' => $formattedTransactions,
                    'period' => "Últimos {$days} dias",
                    'total_found' => $formattedTransactions->count(),
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
