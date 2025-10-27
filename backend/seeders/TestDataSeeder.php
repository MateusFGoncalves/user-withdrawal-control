<?php

use Hyperf\Database\Seeders\Seeder;
use App\Model\User;
use App\Model\Account;
use App\Model\Transaction;
use App\Model\WithdrawalDetails;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        // Limpar dados existentes
        echo "🧹 Limpando banco de dados...\n";
        WithdrawalDetails::query()->delete();
        Transaction::query()->delete();
        Account::query()->delete();
        User::query()->delete();

        // Criar usuário Master
        $master = new User();
        $master->name = 'Admin Master';
        $master->email = 'master@exemplo.com';
        $master->password = '123456'; // Será hasheada automaticamente pelo setter
        $master->user_type = 'MASTER';
        $master->save();
        echo "✅ Master: master@exemplo.com / 123456\n";

        // Clientes
        $clients = [
            ['name' => 'João Silva', 'email' => 'joao@exemplo.com'],
            ['name' => 'Maria Santos', 'email' => 'maria@exemplo.com'],
            ['name' => 'Pedro Oliveira', 'email' => 'pedro@exemplo.com'],
            ['name' => 'Ana Costa', 'email' => 'ana@exemplo.com'],
        ];

        foreach ($clients as $clientData) {
            $user = new User();
            $user->name = $clientData['name'];
            $user->email = $clientData['email'];
            $user->password = '123456'; // Será hasheada automaticamente pelo setter
            $user->user_type = 'CLIENTE';
            $user->save();

            $account = Account::create([
                'user_id' => $user->id,
                'balance' => 0.00,
            ]);

            // Simular transações
            $balance = 0;
            for ($i = 0; $i < 3; $i++) {
                // Depósito
                $amount = rand(500, 3000);
                $balance += $amount;
                
                Transaction::create([
                    'user_id' => $user->id,
                    'account_id' => $account->id,
                    'type' => Transaction::TYPE_DEPOSIT,
                    'amount' => $amount,
                    'status' => Transaction::STATUS_PROCESSED,
                    'processed_at' => date('Y-m-d H:i:s', strtotime("-{$i} days")),
                ]);

                // Saque
                if ($balance > 0) {
                    $withdrawAmount = min($amount * 0.3, $balance);
                    $balance -= $withdrawAmount;
                    
                    $transaction = Transaction::create([
                        'user_id' => $user->id,
                        'account_id' => $account->id,
                        'type' => Transaction::TYPE_WITHDRAWAL,
                        'amount' => $withdrawAmount,
                        'status' => Transaction::STATUS_PROCESSED,
                        'processed_at' => date('Y-m-d H:i:s', strtotime("-{$i} days")),
                    ]);

                    WithdrawalDetails::create([
                        'transaction_id' => $transaction->id,
                        'pix_type' => 'EMAIL',
                        'pix_key' => $clientData['email'],
                    ]);
                }
            }

            $account->balance = $balance;
            $account->save();

            echo "✅ {$clientData['name']}: {$clientData['email']} / 123456 (Saldo: R$ " . number_format($balance, 2, ',', '.') . ")\n";
        }

        echo "\n🎉 Seed concluído!\n";
    }
}

