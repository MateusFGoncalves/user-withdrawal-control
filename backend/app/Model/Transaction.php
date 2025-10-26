<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class Transaction extends Model
{
    protected ?string $table = 'transactions';

    protected array $fillable = [
        'user_id',
        'account_id',
        'type',
        'amount',
        'status',
        'scheduled_at',
        'processed_at',
        'failure_reason',
    ];

    protected array $casts = [
        'id' => 'integer',
        'user_id' => 'integer',
        'account_id' => 'integer',
        'amount' => 'decimal:2',
        'scheduled_at' => 'datetime',
        'processed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Constantes para tipos de transação
    public const TYPE_DEPOSIT = 'DEPOSITO';
    public const TYPE_WITHDRAWAL = 'SAQUE';

    // Constantes para status
    public const STATUS_PENDING = 'PENDENTE';
    public const STATUS_PROCESSED = 'PROCESSADO';
    public const STATUS_FAILED = 'FALHOU';
    public const STATUS_CANCELLED = 'CANCELADO';

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function withdrawalDetails()
    {
        return $this->hasOne(WithdrawalDetails::class);
    }

    public function isDeposit(): bool
    {
        return $this->type === self::TYPE_DEPOSIT;
    }

    public function isWithdrawal(): bool
    {
        return $this->type === self::TYPE_WITHDRAWAL;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isProcessed(): bool
    {
        return $this->status === self::STATUS_PROCESSED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function markAsProcessed(): bool
    {
        $this->status = self::STATUS_PROCESSED;
        $this->processed_at = now();
        return $this->save();
    }

    public function markAsFailed(string $reason): bool
    {
        $this->status = self::STATUS_FAILED;
        $this->failure_reason = $reason;
        $this->processed_at = now();
        return $this->save();
    }
}
