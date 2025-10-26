<?php

declare(strict_types=1);

namespace App\Controller\Client;

use App\Controller\AbstractController;
use App\Helper\DateTimeHelper;
use App\Model\Account;
use App\Model\Transaction;
use App\Model\User;
use App\Model\WithdrawalDetails;
use App\Request\CancelScheduledWithdrawalRequest;
use App\Request\DepositRequest;
use App\Request\WithdrawRequest;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Font;

class TransactionController extends AbstractController
{
    public function deposit(DepositRequest $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getAuthenticatedUser($request);
            
            // Acesse os dados validados diretamente do objeto $request
            $validatedData = $request->validated();
            $amount = (float) $validatedData['amount']; 
            
            // Obter conta do usuário (carregada pelo middleware)
            $account = $this->getAuthenticatedAccount($request);

            // Adicionar saldo à conta
            $account->balance = floatval($account->balance) + $amount;
            $account->save();

            // Criar transação de depósito
            $transaction = new Transaction();
            $transaction->user_id = $user->id;
            $transaction->account_id = $account->id;
            $transaction->type = Transaction::TYPE_DEPOSIT;
            $transaction->amount = $amount;
            $transaction->status = Transaction::STATUS_PROCESSED;
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
        } catch (ValidationException $e) {
            // Erro de validação do Form Request
            return $response->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->validator->errors()->toArray()
            ])->withStatus(422);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function withdraw(WithdrawRequest $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            // Acesse os dados validados diretamente do objeto $request
            $validatedData = $request->validated();
            $amount = (float) $validatedData['amount'];
            $pixType = $validatedData['pix_type'];
            $pixKey = $validatedData['pix_key'];
            $scheduledAt = $validatedData['scheduled_at'] ?? null;

            // Obter conta do usuário (carregada pelo middleware)
            $account = $this->getAuthenticatedAccount($request);

            // Verificar se é saque agendado
            $isScheduled = !empty($scheduledAt);
            $scheduledDate = null;
            
            if ($isScheduled) {
                // Criar data agendada para 06:00 da manhã (validação já feita no Form Request)
                $scheduledDate = DateTimeHelper::createScheduledAt($scheduledAt);
            }

            // Verificar saldo sempre (para saque imediato ou agendado)
            if (!$account->hasSufficientBalance($amount)) {
                return $response->json([
                    'success' => false,
                    'message' => 'Saldo insuficiente',
                ])->withStatus(422);
            }

            // Criar transação de saque
            $transaction = Transaction::create([
                'user_id' => $user->id,
                'account_id' => $account->id,
                'type' => Transaction::TYPE_WITHDRAWAL,
                'amount' => $amount,
                'status' => $isScheduled ? Transaction::STATUS_PENDING : Transaction::STATUS_PROCESSED,
                'scheduled_at' => $isScheduled ? $scheduledDate->format('Y-m-d H:i:s') : null,
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
        } catch (ValidationException $e) {
            // Erro de validação do Form Request
            return $response->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->validator->errors()->toArray()
            ])->withStatus(422);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function cancelScheduledWithdrawal(CancelScheduledWithdrawalRequest $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            // A transação já foi validada no Form Request
            $transaction = $request->getValidatedTransaction();

            // Atualizar status para cancelado
            $transaction->update([
                'status' => Transaction::STATUS_CANCELLED,
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
        } catch (ValidationException $e) {
            // Erro de validação do Form Request
            return $response->json([
                'success' => false,
                'message' => 'Dados inválidos',
                'errors' => $e->validator->errors()->toArray()
            ])->withStatus(422);
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
            $user = $this->getAuthenticatedUser($request);

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
            $user = $this->getAuthenticatedUser($request);

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

    public function exportExcel(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = $this->getAuthenticatedUser($request);

            // Parâmetros de filtro
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

            // Buscar todas as transações (sem paginação para Excel)
            $transactions = $query->orderBy('created_at', 'desc')->get();

            // Gerar arquivo Excel real
            $filename = 'extrato_transacoes_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            // Criar planilha Excel
            $excelContent = $this->generateExcelFile($transactions, $user);

            // Retornar arquivo Excel
            return $response->withHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                ->withHeader('Content-Disposition', 'attachment; filename="' . $filename . '"')
                ->withHeader('Cache-Control', 'no-cache, must-revalidate')
                ->withHeader('Expires', '0')
                ->withHeader('Content-Length', (string) strlen($excelContent))
                ->raw($excelContent);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    private function generateExcelFile($transactions, $user): string
    {
        // Criar nova planilha
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Definir nome da planilha
        $sheet->setTitle('Extrato de Transações');
        
        // Cabeçalhos
        $headers = [
            'A1' => 'ID',
            'B1' => 'Tipo',
            'C1' => 'Valor',
            'D1' => 'Status',
            'E1' => 'Data Criação',
            'F1' => 'Agendado para',
            'G1' => 'Processado em',
            'H1' => 'Tipo PIX',
            'I1' => 'Chave PIX',
            'J1' => 'Motivo da Falha'
        ];
        
        // Definir cabeçalhos
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
        }
        
        // Estilizar cabeçalho
        $headerStyle = [
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF']
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => '3B82F6']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER
            ]
        ];
        
        $sheet->getStyle('A1:J1')->applyFromArray($headerStyle);
        
        // Dados das transações
        $row = 2;
        foreach ($transactions as $transaction) {
            $sheet->setCellValue('A' . $row, $transaction->id);
            $sheet->setCellValue('B' . $row, $transaction->type === Transaction::TYPE_DEPOSIT ? 'Depósito' : 'Saque');
            $sheet->setCellValue('C' . $row, 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'));
            $sheet->setCellValue('D' . $row, $this->formatStatus($transaction->status));
            $sheet->setCellValue('E' . $row, $this->formatDate($transaction->created_at));
            $sheet->setCellValue('F' . $row, $this->formatDate($transaction->scheduled_at));
            $sheet->setCellValue('G' . $row, $this->formatDate($transaction->processed_at));
            $sheet->setCellValue('H' . $row, $this->formatPixType($transaction->withdrawalDetails?->pix_type));
            $sheet->setCellValue('I' . $row, $transaction->withdrawalDetails?->pix_key ?? '-');
            $sheet->setCellValue('J' . $row, $transaction->failure_reason ?? '-');
            $row++;
        }
        
        // Ajustar largura das colunas
        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(12);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(18);
        $sheet->getColumnDimension('F')->setWidth(18);
        $sheet->getColumnDimension('G')->setWidth(18);
        $sheet->getColumnDimension('H')->setWidth(15);
        $sheet->getColumnDimension('I')->setWidth(25);
        $sheet->getColumnDimension('J')->setWidth(20);
        
        // Criar writer
        $writer = new Xlsx($spreadsheet);
        
        // Salvar em arquivo temporário
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_export_');
        $writer->save($tempFile);
        
        // Ler conteúdo do arquivo
        $excelContent = file_get_contents($tempFile);
        
        // Remover arquivo temporário
        unlink($tempFile);
        
        return $excelContent;
    }

    private function formatDate($date): string
    {
        if (!$date) return '-';
        if (is_object($date)) {
            return $date->format('d/m/Y H:i');
        }
        return date('d/m/Y H:i', strtotime($date));
    }

    private function formatPixType($type): string
    {
        if (!$type) return '-';
        $types = [
            'EMAIL' => 'E-mail',
            'PHONE' => 'Telefone',
            'CPF' => 'CPF',
            'RANDOM' => 'Chave Aleatória'
        ];
        return $types[$type] ?? $type;
    }

    private function formatStatus($status): string
    {
        $statuses = [
            Transaction::STATUS_PENDING => 'Pendente',
            Transaction::STATUS_PROCESSED => 'Processado',
            Transaction::STATUS_FAILED => 'Falhou',
            Transaction::STATUS_CANCELLED => 'Cancelado'
        ];
        return $statuses[$status] ?? $status;
    }
}
