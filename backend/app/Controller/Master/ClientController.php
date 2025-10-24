<?php

declare(strict_types=1);

namespace App\Controller\Master;

use App\Controller\AbstractController;
use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Annotation\PostMapping;
use Hyperf\HttpServer\Annotation\PutMapping;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\HttpServer\Contract\RequestInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;
use App\Model\User;
use App\Model\Account;
use App\Model\Transaction;
use Hyperf\Validation\Contract\ValidatorFactoryInterface;
use Hyperf\Di\Annotation\Inject;

#[Controller(prefix: '/master')]
class ClientController extends AbstractController
{
    #[Inject]
    protected ValidatorFactoryInterface $validationFactory;

    public function getClients(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
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

            // Parâmetros de paginação e filtros
            $page = (int) $request->input('page', 1);
            $limit = (int) $request->input('limit', 10);
            $search = $request->input('search', '');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            // Query base para clientes
            $query = User::where('user_type', 'CLIENTE')
                ->with(['account']);

            // Aplicar filtro de busca
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Aplicar ordenação
            $allowedSortFields = ['name', 'email', 'created_at'];
            if (in_array($sortBy, $allowedSortFields)) {
                $query->orderBy($sortBy, $sortOrder);
            }

            // Paginação manual
            $offset = ($page - 1) * $limit;
            $total = $query->count();
            $clients = $query->offset($offset)->limit($limit)->get();

            // Formatar dados dos clientes
            $formattedClients = $clients->map(function ($client) {
                $account = $client->account;
                
                // Calcular estatísticas do cliente
                $totalTransactions = Transaction::where('user_id', $client->id)->count();
                $totalDeposits = Transaction::where('user_id', $client->id)
                    ->where('type', 'DEPOSITO')
                    ->where('status', 'PROCESSADO')
                    ->sum('amount');
                $totalWithdrawals = Transaction::where('user_id', $client->id)
                    ->where('type', 'SAQUE')
                    ->where('status', 'PROCESSADO')
                    ->sum('amount');
                $scheduledWithdrawals = Transaction::where('user_id', $client->id)
                    ->where('type', 'SAQUE')
                    ->where('status', 'PENDENTE')
                    ->sum('amount');

                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'email' => $client->email,
                    'created_at' => $client->created_at,
                    'formatted_created_at' => $client->created_at->format('d/m/Y H:i'),
                    'account' => $account ? [
                        'id' => $account->id,
                        'balance' => $account->balance,
                        'formatted_balance' => 'R$ ' . number_format((float) $account->balance, 2, ',', '.'),
                    ] : [
                        'id' => null,
                        'balance' => 0,
                        'formatted_balance' => 'R$ 0,00',
                    ],
                    'stats' => [
                        'total_transactions' => $totalTransactions,
                        'total_deposits' => $totalDeposits,
                        'formatted_total_deposits' => 'R$ ' . number_format((float) $totalDeposits, 2, ',', '.'),
                        'total_withdrawals' => $totalWithdrawals,
                        'formatted_total_withdrawals' => 'R$ ' . number_format((float) $totalWithdrawals, 2, ',', '.'),
                        'scheduled_withdrawals' => $scheduledWithdrawals,
                        'formatted_scheduled_withdrawals' => 'R$ ' . number_format((float) $scheduledWithdrawals, 2, ',', '.'),
                    ],
                ];
            });

            // Calcular informações de paginação
            $lastPage = ceil($total / $limit);
            $from = $offset + 1;
            $to = min($offset + $limit, $total);

            return $response->json([
                'success' => true,
                'data' => [
                    'clients' => $formattedClients,
                    'pagination' => [
                        'current_page' => $page,
                        'last_page' => $lastPage,
                        'per_page' => $limit,
                        'total' => $total,
                        'from' => $from,
                        'to' => $to,
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

    public function createClient(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
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

            // Validar dados
            $validator = $this->validationFactory->make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email',
            ]);

            if ($validator->fails()) {
                return $response->json([
                    'success' => false,
                    'message' => 'Dados inválidos.',
                    'errors' => $validator->errors(),
                ])->withStatus(422);
            }

            // Criar cliente
            $client = new User();
            $client->name = $request->input('name');
            $client->email = $request->input('email');
            $client->password = null; // Senha será definida no primeiro acesso
            $client->user_type = 'CLIENTE';
            $client->save();

            // Criar conta vinculada
            $account = new Account();
            $account->user_id = $client->id;
            $account->balance = 0.00;
            $account->save();

            return $response->json([
                'success' => true,
                'message' => 'Cliente cadastrado com sucesso. O cliente deve definir sua senha no primeiro acesso.',
                'data' => [
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'user_type' => $client->user_type,
                        'created_at' => $client->created_at,
                        'formatted_created_at' => $client->created_at->format('d/m/Y H:i'),
                        'account' => [
                            'id' => $account->id,
                            'balance' => $account->balance,
                            'formatted_balance' => 'R$ ' . number_format((float) $account->balance, 2, ',', '.'),
                        ],
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

    public function getClient(RequestInterface $request, ResponseInterface $response, int $id): PsrResponseInterface
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

            // Buscar cliente
            $client = User::where('id', $id)
                ->where('user_type', 'CLIENTE')
                ->with(['account'])
                ->first();

            if (!$client) {
                return $response->json([
                    'success' => false,
                    'message' => 'Cliente não encontrado.',
                ])->withStatus(404);
            }

            // Buscar transações recentes do cliente
            $recentTransactions = Transaction::where('user_id', $client->id)
                ->with(['withdrawalDetails'])
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($transaction) {
                    return [
                        'id' => $transaction->id,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                        'status' => $transaction->status,
                        'created_at' => $transaction->created_at,
                        'formatted_date' => $transaction->created_at->format('d/m/Y H:i'),
                        'scheduled_at' => $transaction->scheduled_at,
                        'processed_at' => $transaction->processed_at,
                        'pix_type' => $transaction->withdrawalDetails?->pix_type,
                        'pix_key' => $transaction->withdrawalDetails?->pix_key,
                        'failure_reason' => $transaction->failure_reason,
                    ];
                });

            // Calcular estatísticas detalhadas
            $totalTransactions = Transaction::where('user_id', $client->id)->count();
            $totalDeposits = Transaction::where('user_id', $client->id)
                ->where('type', 'DEPOSITO')
                ->where('status', 'PROCESSADO')
                ->sum('amount');
            $totalWithdrawals = Transaction::where('user_id', $client->id)
                ->where('type', 'SAQUE')
                ->where('status', 'PROCESSADO')
                ->sum('amount');
            $scheduledWithdrawals = Transaction::where('user_id', $client->id)
                ->where('type', 'SAQUE')
                ->where('status', 'PENDENTE')
                ->sum('amount');

            $account = $client->account;

            return $response->json([
                'success' => true,
                'data' => [
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'created_at' => $client->created_at,
                        'formatted_created_at' => $client->created_at->format('d/m/Y H:i'),
                        'account' => [
                            'id' => $account->id,
                            'balance' => $account->balance,
                            'formatted_balance' => 'R$ ' . number_format((float) $account->balance, 2, ',', '.'),
                        ],
                        'stats' => [
                            'total_transactions' => $totalTransactions,
                            'total_deposits' => $totalDeposits,
                            'formatted_total_deposits' => 'R$ ' . number_format((float) $totalDeposits, 2, ',', '.'),
                            'total_withdrawals' => $totalWithdrawals,
                            'formatted_total_withdrawals' => 'R$ ' . number_format((float) $totalWithdrawals, 2, ',', '.'),
                            'scheduled_withdrawals' => $scheduledWithdrawals,
                            'formatted_scheduled_withdrawals' => 'R$ ' . number_format((float) $scheduledWithdrawals, 2, ',', '.'),
                        ],
                    ],
                    'recent_transactions' => $recentTransactions,
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function updateClient(RequestInterface $request, ResponseInterface $response, int $id): PsrResponseInterface
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

            // Buscar cliente
            $client = User::where('id', $id)
                ->where('user_type', 'CLIENTE')
                ->first();

            if (!$client) {
                return $response->json([
                    'success' => false,
                    'message' => 'Cliente não encontrado.',
                ])->withStatus(404);
            }

            // Validar dados
            $validator = $this->validationFactory->make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email,' . $id,
            ]);

            if ($validator->fails()) {
                return $response->json([
                    'success' => false,
                    'message' => 'Dados inválidos.',
                    'errors' => $validator->errors(),
                ])->withStatus(422);
            }

            // Atualizar cliente
            $client->name = $request->input('name');
            $client->email = $request->input('email');
            $client->save();

            return $response->json([
                'success' => true,
                'message' => 'Cliente atualizado com sucesso.',
                'data' => [
                    'client' => [
                        'id' => $client->id,
                        'name' => $client->name,
                        'email' => $client->email,
                        'created_at' => $client->created_at,
                        'formatted_created_at' => $client->created_at->format('d/m/Y H:i'),
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
}
