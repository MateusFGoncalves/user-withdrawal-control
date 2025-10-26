<?php

declare(strict_types=1);

namespace App\Request;

use App\Model\User;
use Hyperf\Validation\Request\FormRequest;

class CreateClientRequest extends FormRequest
{
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
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) {
                    $this->validateUniqueEmail($attribute, $value, $fail);
                },
            ],
        ];
    }

    /**
     * Validação customizada de email único
     */
    protected function validateUniqueEmail($attribute, $value, $fail): void
    {
        $exists = User::where('email', $value)->exists();
        
        if ($exists) {
            $fail('O email informado já está em uso.');
        }
    }

    /**
     * Mensagens de erro personalizadas
     */
    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório',
            'name.string' => 'O nome deve ser uma string',
            'name.max' => 'O nome não pode ter mais de 255 caracteres',
            'email.required' => 'O email é obrigatório',
            'email.email' => 'O email informado não é válido',
            'email.max' => 'O email não pode ter mais de 255 caracteres',
        ];
    }
}

