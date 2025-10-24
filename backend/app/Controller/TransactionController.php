<?php

declare(strict_types=1);

namespace App\Controller;

use App\Model\Account;
use App\Model\Transaction;
use App\Model\User;
use App\Model\WithdrawalDetails;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\Config\Annotation\Value;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

class TransactionController
{
    #[Value('jwt.secret')]
    private string $jwtSecret = 'your-super-secret-jwt-key-change-in-production';

    public function deposit(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            $amount = (float) $request->input('amount');
            
            if ($amount <= 0) {
                return $response->json([
                    'success' => false,
                    'message' => 'Valor deve ser maior que zero',
                ])->withStatus(400);
            }

            // Buscar conta do usuário
            $account = Account::where('user_id', $user->id)->first();
            if (!$account) {
                return $response->json([
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ])->withStatus(404);
            }

            // Adicionar saldo à conta
            $account->balance = floatval($account->balance) + $amount;
            $account->save();

            // Criar transação de depósito
            $transaction = new Transaction();
            $transaction->user_id = $user->id;
            $transaction->account_id = $account->id;
            $transaction->type = 'DEPOSITO';
            $transaction->amount = $amount;
            $transaction->status = 'PROCESSADO';
            $transaction->processed_at = date('Y-m-d H:i:s');
            $transaction->save();

            return $response->json([
                'success' => true,
                'message' => 'Depósito realizado com sucesso',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                        'status' => $transaction->status,
                        'processed_at' => $transaction->processed_at,
                    ],
                    'account' => [
                        'balance' => (float) $account->balance,
                        'formatted_balance' => 'R$ ' . number_format((float) $account->balance, 2, ',', '.'),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function withdraw(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            $amount = (float) $request->input('amount');
            $pixType = $request->input('pix_type', 'EMAIL');
            $pixKey = $request->input('pix_key');
            $scheduledAt = $request->input('scheduled_at');

            if ($amount <= 0) {
                return $response->json([
                    'success' => false,
                    'message' => 'Valor deve ser maior que zero',
                ])->withStatus(400);
            }

            if (empty($pixKey)) {
                return $response->json([
                    'success' => false,
                    'message' => 'Chave PIX é obrigatória',
                ])->withStatus(400);
            }

            $account = $user->account;
            if (!$account) {
                return $response->json([
                    'success' => false,
                    'message' => 'Conta não encontrada',
                ])->withStatus(404);
            }

            // Verificar se é saque agendado
            $isScheduled = !empty($scheduledAt);
            
            if ($isScheduled) {
                // Configurar fuso horário do Brasil
                $timezone = new \DateTimeZone('America/Sao_Paulo');
                $scheduledDate = new \DateTime($scheduledAt, $timezone);
                $now = new \DateTime('now', $timezone);
                $maxDate = (new \DateTime('now', $timezone))->modify('+7 days');

                // Comparar apenas as datas (sem horário)
                $scheduledDateOnly = $scheduledDate->format('Y-m-d');
                $nowDateOnly = $now->format('Y-m-d');
                $maxDateOnly = $maxDate->format('Y-m-d');

                if ($scheduledDateOnly <= $nowDateOnly) {
                    return $response->json([
                        'success' => false,
                        'message' => 'Data de agendamento deve ser futura',
                    ])->withStatus(400);
                }

                if ($scheduledDateOnly > $maxDateOnly) {
                    return $response->json([
                        'success' => false,
                        'message' => 'Agendamento limitado a 7 dias',
                    ])->withStatus(400);
                }
            } else {
                // Saque imediato - verificar saldo
                if (!$account->hasSufficientBalance($amount)) {
                    return $response->json([
                        'success' => false,
                        'message' => 'Saldo insuficiente',
                    ])->withStatus(400);
                }
            }

            // Criar transação de saque
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $account->id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => $amount,
                'status' => $isScheduled ? Transaction::STATUS_PENDING : Transaction::STATUS_PROCESSED,
                'scheduled_at' => $isScheduled ? $scheduledAt : null,
                'processed_at' => $isScheduled ? null : date('Y-m-d H:i:s'),
            ]);

            // Criar detalhes do saque
            WithdrawalDetails::create([
                'transaction_id' => $transaction->id,
                'pix_type' => $pixType,
                'pix_key' => $pixKey,
            ]);

            // Se for saque imediato, debitar o saldo
            if (!$isScheduled) {
                $account->subtractBalance($amount);
            }

            return $response->json([
                'success' => true,
                'message' => $isScheduled ? 'Saque agendado com sucesso' : 'Saque realizado com sucesso',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                        'status' => $transaction->status,
                        'scheduled_at' => $transaction->scheduled_at,
                        'processed_at' => $transaction->processed_at,
                    ],
                    'withdrawal_details' => [
                        'pix_type' => $pixType,
                        'pix_key' => $pixKey,
                    ],
                    'account' => [
                        'balance' => (float) $account->balance,
                        'formatted_balance' => 'R$ ' . number_format((float) $account->balance, 2, ',', '.'),
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function getStatement(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            // Parâmetros de paginação
            $page = (int) $request->input('page', 1);
            $perPage = (int) $request->input('per_page', 10);
            $type = $request->input('type', 'all');
            $status = $request->input('status', 'all');

            // Construir query base
            $query = Transaction::where('user_id', $user->id)
                ->with('withdrawalDetails');

            // Aplicar filtros
            if ($type !== 'all') {
                $query->where('type', $type);
            }

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            // Ordenar por data de criação (mais recentes primeiro)
            $query->orderBy('created_at', 'desc');

            // Contar total de registros
            $total = $query->count();

            // Aplicar paginação
            $transactions = $query->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->get();

            $formattedTransactions = $transactions->map(function ($transaction) {
                $formattedTransaction = [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at,
                    'scheduled_at' => $transaction->scheduled_at,
                    'processed_at' => $transaction->processed_at,
                ];

                // Adicionar withdrawal_details se existir
                if ($transaction->withdrawalDetails) {
                    $formattedTransaction['withdrawal_details'] = [
                        'pix_type' => $transaction->withdrawalDetails->pix_type,
                        'pix_key' => $transaction->withdrawalDetails->pix_key,
                    ];
                }

                return $formattedTransaction;
            });

            // Calcular informações de paginação
            $totalPages = ceil($total / $perPage);
            $hasNextPage = $page < $totalPages;
            $hasPrevPage = $page > 1;

            return $response->json([
                'success' => true,
                'data' => [
                    'transactions' => $formattedTransactions,
                    'pagination' => [
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total' => $total,
                        'total_pages' => $totalPages,
                        'has_next_page' => $hasNextPage,
                        'has_prev_page' => $hasPrevPage,
                        'next_page' => $hasNextPage ? $page + 1 : null,
                        'prev_page' => $hasPrevPage ? $page - 1 : null,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function getRecentTransactions(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            // Parâmetros
            $limit = (int) $request->input('limit', 5);
            $days = (int) $request->input('days', 30); // Últimos 30 dias por padrão

            // Calcular data limite
            $dateLimit = date('Y-m-d H:i:s', strtotime("-{$days} days"));

            // Buscar transações recentes
            $transactions = Transaction::where('user_id', $user->id)
                ->where('created_at', '>=', $dateLimit)
                ->with('withdrawalDetails')
                ->orderBy('created_at', 'desc')
                ->limit($limit)
                ->get();

            $formattedTransactions = $transactions->map(function ($transaction) {
                $formattedTransaction = [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                    'status' => $transaction->status,
                    'created_at' => $transaction->created_at,
                    'scheduled_at' => $transaction->scheduled_at,
                    'processed_at' => $transaction->processed_at,
                ];

                // Adicionar withdrawal_details se existir
                if ($transaction->withdrawalDetails) {
                    $formattedTransaction['withdrawal_details'] = [
                        'pix_type' => $transaction->withdrawalDetails->pix_type,
                        'pix_key' => $transaction->withdrawalDetails->pix_key,
                    ];
                }

                return $formattedTransaction;
            });

            return $response->json([
                'success' => true,
                'data' => [
                    'transactions' => $formattedTransactions,
                    'period' => "Últimos {$days} dias",
                    'total_found' => $transactions->count(),
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function cancelScheduledWithdrawal(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getUserFromToken($request);
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token inválido ou expirado',
                ])->withStatus(401);
            }

            $transactionId = (int) $request->input('transaction_id');
            
            if (!$transactionId) {
                return $response->json([
                    'success' => false,
                    'message' => 'ID da transação é obrigatório',
                ])->withStatus(400);
            }

            // Buscar a transação
            $transaction = Transaction::where('id', $transactionId)
                ->where('user_id', $user->id)
                ->where('type', 'SAQUE')
                ->where('status', 'PENDENTE')
                ->first();

            if (!$transaction) {
                return $response->json([
                    'success' => false,
                    'message' => 'Saque agendado não encontrado ou já processado',
                ])->withStatus(404);
            }

            // Verificar se ainda é possível cancelar (não processado)
            if ($transaction->status !== 'PENDENTE') {
                return $response->json([
                    'success' => false,
                    'message' => 'Este saque já foi processado e não pode ser cancelado',
                ])->withStatus(400);
            }

            // Atualizar status para cancelado
            $transaction->update([
                'status' => 'CANCELADO',
                'processed_at' => date('Y-m-d H:i:s'),
                'failure_reason' => 'Cancelado pelo usuário',
            ]);

            return $response->json([
                'success' => true,
                'message' => 'Saque agendado cancelado com sucesso',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'status' => $transaction->status,
                        'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                    ],
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
