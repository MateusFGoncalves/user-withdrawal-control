<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class WithdrawalDetails extends Model
{
    protected ?string $table = 'withdrawal_details';

    protected array $fillable = [
        'transaction_id',
        'pix_type',
        'pix_key',
    ];

    protected array $casts = [
        'id' => 'integer',
        'transaction_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Constantes para tipos de PIX
    public const PIX_TYPE_EMAIL = 'EMAIL';
    public const PIX_TYPE_PHONE = 'PHONE';
    public const PIX_TYPE_CPF = 'CPF';
    public const PIX_TYPE_RANDOM = 'RANDOM';

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    public function isEmail(): bool
    {
        return $this->pix_type === self::PIX_TYPE_EMAIL;
    }

    public function isPhone(): bool
    {
        return $this->pix_type === self::PIX_TYPE_PHONE;
    }

    public function isCpf(): bool
    {
        return $this->pix_type === self::PIX_TYPE_CPF;
    }

    public function isRandom(): bool
    {
        return $this->pix_type === self::PIX_TYPE_RANDOM;
    }
}
