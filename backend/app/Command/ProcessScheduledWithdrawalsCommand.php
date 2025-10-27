<?php

declare(strict_types=1);

namespace App\Command;

use App\Helper\DateTimeHelper;
use App\Model\Account;
use App\Model\Transaction;
use App\Service\EmailService;
use Hyperf\Command\Command as HyperfCommand;
use Hyperf\Command\Annotation\Command;
use Psr\Container\ContainerInterface;

#[Command]
class ProcessScheduledWithdrawalsCommand extends HyperfCommand
{
    public function __construct(protected ContainerInterface $container)
    {
        parent::__construct('withdrawals:process-scheduled');
    }

    public function configure()
    {
        parent::configure();
        $this->setDescription('Processa saques agendados que estão pendentes e devem ser executados');
    }

    public function handle()
    {
        $this->info('🔄 Iniciando processamento de saques agendados...');
        
        // Buscar transações agendadas que devem ser processadas
        $now = DateTimeHelper::createBrazilDateTime();
        $currentDate = $now->format('Y-m-d');
        
        $this->info("📅 Data atual: {$currentDate}");
        
        // Buscar saques pendentes agendados para hoje ou anterior
        $scheduledWithdrawals = Transaction::where('type', Transaction::TYPE_WITHDRAWAL)
            ->where('status', Transaction::STATUS_PENDING)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', $now->format('Y-m-d H:i:s'))
            ->with(['account', 'user', 'withdrawalDetails'])
            ->get();
        
        $total = $scheduledWithdrawals->count();
        $this->info("📊 Total de saques encontrados: {$total}");
        
        if ($total === 0) {
            $this->info('✅ Nenhum saque agendado para processar');
            return 0;
        }
        
        $processed = 0;
        $failed = 0;
        
        foreach ($scheduledWithdrawals as $transaction) {
            try {
                $this->info("💸 Processando saque #{$transaction->id} de R$ {$transaction->amount}");
                
                // Verificar se ainda tem saldo suficiente
                $account = $transaction->account;
                
                if (!$account->hasSufficientBalance((float) $transaction->amount)) {
                    $this->error("❌ Saldo insuficiente para saque #{$transaction->id}");
                    
                    $transaction->markAsFailed('Saldo insuficiente no momento do processamento');
                    $failed++;
                    continue;
                }
                
                // Debitar da conta
                $account->subtractBalance((float) $transaction->amount);
                
                // Marcar como processado
                $transaction->status = Transaction::STATUS_PROCESSED;
                $transaction->processed_at = $now->format('Y-m-d H:i:s');
                $transaction->save();
                
                // Enviar email de confirmação
                try {
                    $emailService = new EmailService();
                    $withdrawalDetails = $transaction->withdrawalDetails;
                    
                    if ($withdrawalDetails) {
                        $emailService->sendWithdrawalConfirmation(
                            $transaction->user->email,
                            floatval($transaction->amount),
                            $withdrawalDetails->pix_key,
                            $withdrawalDetails->pix_type
                        );
                    }
                } catch (\Exception $e) {
                    $this->warn("⚠️ Erro ao enviar email para transação #{$transaction->id}: " . $e->getMessage());
                    // Continua o processamento mesmo se o email falhar
                }
                
                $this->info("✅ Saque #{$transaction->id} processado com sucesso");
                $processed++;
                
            } catch (\Exception $e) {
                $this->error("❌ Erro ao processar saque #{$transaction->id}: " . $e->getMessage());
                
                try {
                    $transaction->markAsFailed($e->getMessage());
                } catch (\Exception $saveEx) {
                    $this->error("❌ Erro ao salvar falha para transação #{$transaction->id}");
                }
                
                $failed++;
            }
        }
        
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->info("📈 Resumo do processamento:");
        $this->info("   • Total processado: {$processed}");
        $this->info("   • Total com falha: {$failed}");
        $this->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        return 0;
    }
}

