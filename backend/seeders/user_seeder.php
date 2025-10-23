<?php

declare(strict_types=1);

use Hyperf\Database\Seeders\Seeder;
use App\Model\User;
use App\Model\Account;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Criar usuário cliente de teste
        $user = User::create([
            'name' => 'Usuário Cliente',
            'email' => 'cliente@exemplo.com',
            'password' => '123456',
            'user_type' => 'CLIENTE',
        ]);

        // Criar conta para o usuário cliente
        Account::create([
            'user_id' => $user->id,
            'balance' => 1000.00, // Saldo inicial de R$ 1.000,00
        ]);

        // Criar usuário master de teste
        $master = User::create([
            'name' => 'Usuário Master',
            'email' => 'master@exemplo.com',
            'password' => '123456',
            'user_type' => 'MASTER',
        ]);

        echo "✅ Usuário cliente criado: cliente@exemplo.com / 123456 (Saldo: R$ 1.000,00)\n";
        echo "✅ Usuário master criado: master@exemplo.com / 123456\n";
    }
}
