<?php

declare(strict_types=1);

namespace App\Request;

class WithdrawRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0.01'],
            'pix_type' => ['required', 'string'],
            'pix_key' => ['required', 'string'],
            'scheduled_at' => ['nullable'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'amount.required' => 'O valor é obrigatório',
            'amount.numeric' => 'O valor deve ser um número',
            'amount.min' => 'O valor deve ser pelo menos R$ 0,01',
            'amount.max' => 'O valor não pode ser maior que R$ 999.999,99',
            
            'pix_type.required' => 'O tipo de PIX é obrigatório',
            'pix_type.string' => 'O tipo de PIX deve ser um texto',
            'pix_type.in' => 'Tipo de PIX inválido. Use: EMAIL, CPF, CNPJ, TELEFONE ou CHAVE_ALEATORIA',
            
            'pix_key.required' => 'A chave PIX é obrigatória',
            'pix_key.string' => 'A chave PIX deve ser um texto',
            'pix_key.min' => 'A chave PIX deve ter pelo menos 5 caracteres',
            'pix_key.max' => 'A chave PIX não pode ter mais de 77 caracteres',
            
            'scheduled_at.date' => 'A data de agendamento deve ser uma data válida',
            'scheduled_at.after' => 'A data de agendamento deve ser no futuro',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'amount' => 'valor',
            'pix_type' => 'tipo de PIX',
            'pix_key' => 'chave PIX',
            'scheduled_at' => 'data de agendamento',
        ];
    }
}
