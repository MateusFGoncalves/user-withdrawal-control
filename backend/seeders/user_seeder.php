<?php

declare(strict_types=1);

use Hyperf\Database\Seeders\Seeder;
use App\Model\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Criar usuário de teste
        User::create([
            'name' => 'Usuário Teste',
            'email' => 'teste@exemplo.com',
            'password' => '123456', // Será hashado automaticamente pelo model
        ]);
        
        echo "✅ Usuário de teste criado: teste@exemplo.com / 123456\n";
    }
}
