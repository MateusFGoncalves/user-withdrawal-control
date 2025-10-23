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
        return $this->balance >= $amount;
    }
}
