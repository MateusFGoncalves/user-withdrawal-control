<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class Account extends Model
{
    protected ?string $table = 'accounts';

    protected array $fillable = [
        'user_id',
        'balance',
    ];

    protected array $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function addBalance(float $amount): bool
    {
        $this->balance += $amount;
        return $this->save();
    }

    public function subtractBalance(float $amount): bool
    {
        if ($this->balance < $amount) {
            return false;
        }
        
        $this->balance -= $amount;
        return $this->save();
    }

    public function hasSufficientBalance(float $amount): bool
    {
        return $this->getAvailableBalance() >= $amount;
    }

    /**
     * Calcula o saldo total da conta
     */
    public function getTotalBalance(): float
    {
        return floatval($this->balance);
    }

    /**
     * Calcula o valor total de saques agendados pendentes
     */
    public function getScheduledWithdrawals(): float
    {
        return floatval(\App\Model\Transaction::where('user_id', $this->user_id)
            ->where('type', 'SAQUE')
            ->where('status', 'PENDENTE')
            ->where('scheduled_at', '>', date('Y-m-d H:i:s'))
            ->sum('amount'));
    }

    /**
     * Calcula o saldo disponível (total - saques agendados)
     */
    public function getAvailableBalance(): float
    {
        return $this->getTotalBalance() - $this->getScheduledWithdrawals();
    }

    /**
     * Retorna dados completos de saldo formatados
     */
    public function getBalanceData(): array
    {
        $totalBalance = $this->getTotalBalance();
        $scheduledWithdrawals = $this->getScheduledWithdrawals();
        $availableBalance = $this->getAvailableBalance();

        return [
            'balance' => $availableBalance, // Saldo disponível
            'formatted_balance' => 'R$ ' . number_format($availableBalance, 2, ',', '.'),
            'total_balance' => $totalBalance,
            'formatted_total_balance' => 'R$ ' . number_format($totalBalance, 2, ',', '.'),
            'scheduled_withdrawals' => $scheduledWithdrawals,
            'formatted_scheduled_withdrawals' => 'R$ ' . number_format($scheduledWithdrawals, 2, ',', '.'),
        ];
    }
}
