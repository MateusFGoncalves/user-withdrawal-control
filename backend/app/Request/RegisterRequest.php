<?php

namespace App\Request;

use App\Model\User;

class RegisterRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:255', 'min:2'],
            'email' => ['required', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:6', 'max:255'],
            'user_type' => ['nullable', 'string', 'in:CLIENTE,MASTER'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'O nome é obrigatório',
            'name.string' => 'O nome deve ser um texto',
            'name.max' => 'O nome não pode ter mais de 255 caracteres',
            'name.min' => 'O nome deve ter pelo menos 2 caracteres',
            
            'email.required' => 'O email é obrigatório',
            'email.email' => 'O email deve ter um formato válido',
            'email.max' => 'O email não pode ter mais de 255 caracteres',
            
            'password.required' => 'A senha é obrigatória',
            'password.string' => 'A senha deve ser um texto',
            'password.min' => 'A senha deve ter pelo menos 6 caracteres',
            'password.max' => 'A senha não pode ter mais de 255 caracteres',
            
            'user_type.string' => 'O tipo de usuário deve ser um texto',
            'user_type.in' => 'O tipo de usuário deve ser CLIENTE ou MASTER',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'nome',
            'email' => 'email',
            'password' => 'senha',
            'user_type' => 'tipo de usuário',
        ];
    }
}
