<?php

declare(strict_types=1);

namespace App\Request;

use App\Model\Transaction;
use App\Traits\HasAuthenticatedUser;
use Hyperf\Validation\Request\FormRequest;

class CancelScheduledWithdrawalRequest extends FormRequest
{
    use HasAuthenticatedUser;

    /**
     * Determinar se o usuário está autorizado a fazer esta requisição
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Regras de validação
     */
    public function rules(): array
    {
        return [
            'transaction_id' => [
                'required',
                'integer',
                'min:1',
                function ($attribute, $value, $fail) {
                    $this->validateTransaction($attribute, $value, $fail);
                },
            ],
        ];
    }

    /**
     * Validação customizada da transação
     */
    protected function validateTransaction($attribute, $value, $fail): void
    {
        // Não validar se o valor for null (outras regras já validarão)
        if ($value === null) {
            return;
        }

        $request = $this->getRequest();
        $user = $this->getAuthenticatedUser($request);
        
        if (!$user) {
            $fail('Usuário não autenticado.');
            return;
        }

        $transaction = Transaction::where('id', $value)
            ->where('user_id', $user->id)
            ->where('type', Transaction::TYPE_WITHDRAWAL)
            ->where('status', Transaction::STATUS_PENDING)
            ->first();

        if (!$transaction) {
            $fail('Saque agendado não encontrado ou já processado.');
            return;
        }

        // Verificar se ainda é possível cancelar (não processado)
        if ($transaction->status !== Transaction::STATUS_PENDING) {
            $fail('Este saque já foi processado e não pode ser cancelado.');
            return;
        }

        // Armazenar a transação validada para uso no controller
        $request->setAttribute('validated_transaction', $transaction);
    }

    /**
     * Obter a transação validada
     */
    public function getValidatedTransaction(): ?Transaction
    {
        return $this->getRequest()->getAttribute('validated_transaction');
    }

    /**
     * Mensagens de erro personalizadas
     */
    public function messages(): array
    {
        return [
            'transaction_id.required' => 'ID da transação é obrigatório',
            'transaction_id.integer' => 'ID da transação deve ser um número inteiro',
            'transaction_id.min' => 'ID da transação deve ser maior que zero',
        ];
    }
}

