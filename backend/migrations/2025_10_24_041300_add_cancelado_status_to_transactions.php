<?php

use Hyperf\Database\Schema\Schema;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Migrations\Migration;
use Hyperf\DbConnection\Db;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Usar SQL direto para modificar o enum
        DB::statement("ALTER TABLE transactions MODIFY COLUMN status ENUM('PENDENTE', 'PROCESSADO', 'FALHOU', 'CANCELADO') DEFAULT 'PENDENTE'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverter o enum da coluna status para o estado original
        DB::statement("ALTER TABLE transactions MODIFY COLUMN status ENUM('PENDENTE', 'PROCESSADO', 'FALHOU') DEFAULT 'PENDENTE'");
    }
};
