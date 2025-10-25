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
            
            // Calcular total de fundos (saldo líquido baseado em transações)
            $totalDeposits = Transaction::where('type', 'DEPOSITO')
                ->where('status', 'PROCESSADO')
                ->sum('amount');
            $totalWithdrawals = Transaction::where('type', 'SAQUE')
                ->where('status', 'PROCESSADO')
                ->sum('amount');
            $totalFunds = $totalDeposits - $totalWithdrawals;
            
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

    public function getTransactions(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
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

            // Parâmetros de paginação
            $page = (int) $request->input('page', 1);
            $limit = (int) $request->input('limit', 10);
            $search = $request->input('search', '');
            $type = $request->input('type', '');
            $status = $request->input('status', '');
            $sortBy = $request->input('sort_by', 'created_at');
            $sortOrder = $request->input('sort_order', 'desc');

            // Construir query
            $query = Transaction::with(['user', 'withdrawalDetails']);

            // Filtros
            if ($search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($type) {
                $query->where('type', $type);
            }

            if ($status) {
                $query->where('status', $status);
            }

            // Ordenação
            $query->orderBy($sortBy, $sortOrder);

            // Paginação manual
            $offset = ($page - 1) * $limit;
            $total = $query->count();
            $transactions = $query->offset($offset)->limit($limit)->get();

            // Formatar dados das transações
            $formattedTransactions = $transactions->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => $transaction->amount,
                    'formatted_amount' => 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'),
                    'status' => $transaction->status,
                    'user' => [
                        'id' => $transaction->user->id,
                        'name' => $transaction->user->name,
                        'email' => $transaction->user->email,
                    ],
                    'created_at' => $transaction->created_at,
                    'formatted_created_at' => $transaction->created_at->format('d/m/Y H:i'),
                    'scheduled_at' => $transaction->scheduled_at,
                    'formatted_scheduled_at' => $transaction->scheduled_at ? $transaction->scheduled_at->format('d/m/Y H:i') : null,
                    'processed_at' => $transaction->processed_at,
                    'formatted_processed_at' => $transaction->processed_at ? $transaction->processed_at->format('d/m/Y H:i') : null,
                    'pix_type' => $transaction->withdrawalDetails?->pix_type,
                    'pix_key' => $transaction->withdrawalDetails?->pix_key,
                    'failure_reason' => $transaction->failure_reason,
                ];
            });

            // Calcular informações de paginação
            $lastPage = ceil($total / $limit);
            $from = $offset + 1;
            $to = min($offset + $limit, $total);

            return $response->json([
                'success' => true,
                'data' => [
                    'transactions' => $formattedTransactions,
                    'pagination' => [
                        'current_page' => $page,
                        'last_page' => $lastPage,
                        'per_page' => $limit,
                        'total' => $total,
                        'from' => $from,
                        'to' => $to,
                    ],
                    'filters' => [
                        'search' => $search,
                        'type' => $type,
                        'status' => $status,
                        'sort_by' => $sortBy,
                        'sort_order' => $sortOrder,
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

    public function exportExcel(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            // Parâmetros de filtro
            $search = $request->input('search', '');
            $type = $request->input('type', 'all');
            $status = $request->input('status', 'all');

            // Construir query base
            $query = Transaction::with(['user', 'withdrawalDetails']);

            // Aplicar filtros
            if ($search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($type !== 'all') {
                $query->where('type', $type);
            }

            if ($status !== 'all') {
                $query->where('status', $status);
            }

            // Buscar todas as transações (sem paginação para Excel)
            $transactions = $query->orderBy('created_at', 'desc')->get();

            // Gerar arquivo Excel real
            $filename = 'transacoes_master_' . date('Y-m-d_H-i-s') . '.xlsx';
            
            // Criar planilha Excel
            $excelContent = $this->generateExcelFile($transactions);

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

    private function generateExcelFile($transactions): string
    {
        // Criar nova planilha
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Definir nome da planilha
        $sheet->setTitle('Transações Master');
        
        // Cabeçalhos
        $headers = [
            'A1' => 'ID',
            'B1' => 'Cliente',
            'C1' => 'Email',
            'D1' => 'Tipo',
            'E1' => 'Valor',
            'F1' => 'Status',
            'G1' => 'Data Criação',
            'H1' => 'Agendado para',
            'I1' => 'Processado em',
            'J1' => 'Tipo PIX',
            'K1' => 'Chave PIX',
            'L1' => 'Motivo da Falha'
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
                'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                'startColor' => ['rgb' => '3B82F6']
            ],
            'alignment' => [
                'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER
            ]
        ];
        
        $sheet->getStyle('A1:L1')->applyFromArray($headerStyle);
        
        // Dados das transações
        $row = 2;
        foreach ($transactions as $transaction) {
            $sheet->setCellValue('A' . $row, $transaction->id);
            $sheet->setCellValue('B' . $row, $transaction->user->name ?? 'N/A');
            $sheet->setCellValue('C' . $row, $transaction->user->email ?? 'N/A');
            $sheet->setCellValue('D' . $row, $transaction->type);
            $sheet->setCellValue('E' . $row, 'R$ ' . number_format((float) $transaction->amount, 2, ',', '.'));
            $sheet->setCellValue('F' . $row, $transaction->status);
            $sheet->setCellValue('G' . $row, $transaction->created_at->format('d/m/Y H:i'));
            $sheet->setCellValue('H' . $row, $transaction->scheduled_at ? $transaction->scheduled_at->format('d/m/Y H:i') : '');
            $sheet->setCellValue('I' . $row, $transaction->processed_at ? $transaction->processed_at->format('d/m/Y H:i') : '');
            $sheet->setCellValue('J' . $row, $transaction->withdrawalDetails?->pix_type ?? '');
            $sheet->setCellValue('K' . $row, $transaction->withdrawalDetails?->pix_key ?? '');
            $sheet->setCellValue('L' . $row, $transaction->failure_reason ?? '');
            $row++;
        }
        
        // Ajustar largura das colunas
        $sheet->getColumnDimension('A')->setWidth(8);
        $sheet->getColumnDimension('B')->setWidth(20);
        $sheet->getColumnDimension('C')->setWidth(25);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(12);
        $sheet->getColumnDimension('G')->setWidth(18);
        $sheet->getColumnDimension('H')->setWidth(18);
        $sheet->getColumnDimension('I')->setWidth(18);
        $sheet->getColumnDimension('J')->setWidth(12);
        $sheet->getColumnDimension('K')->setWidth(25);
        $sheet->getColumnDimension('L')->setWidth(30);
        
        // Salvar em string
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'excel_');
        $writer->save($tempFile);
        
        $content = file_get_contents($tempFile);
        unlink($tempFile);
        
        return $content;
    }
}
