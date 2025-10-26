<?php

declare(strict_types=1);

namespace App\Controller;

use App\Model\User;
use App\Request\RegisterRequest;
use Firebase\JWT\JWT;
use Hyperf\Validation\Contract\ValidatorFactoryInterface;
use Firebase\JWT\Key;
use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\PostMapping;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\Config\Annotation\Value;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

#[Controller]
class AuthController
{
    #[Value('jwt.secret')]
    private string $jwtSecret = 'your-super-secret-jwt-key-change-in-production';

    #[Value('jwt.expiration')]
    private int $jwtExpiration = 3600;

    protected ValidatorFactoryInterface $validatorFactory;

    public function __construct(ValidatorFactoryInterface $validatorFactory)
    {
        $this->validatorFactory = $validatorFactory;
    }

    public function register(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            // Validação usando o Form Request
            $validatedData = $this->validateRegisterRequest($request);
            
            $user = User::create([
                'name' => $validatedData['name'],
                'email' => $validatedData['email'],
                'password' => $validatedData['password'],
            ]);

            $token = $this->generateToken($user);

            return $response->json([
                'success' => true,
                'message' => 'Usuário criado com sucesso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                    'token' => $token,
                ],
            ]);
        } catch (\Exception $e) {
            // Verificar se é erro de validação
            if ($e->getCode() === 422) {
                return $response->json([
                    'success' => false,
                    'message' => 'Dados inválidos',
                    'errors' => $this->getValidationErrors($request)
                ])->withStatus(422);
            }
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    /**
     * Validar dados de registro
     */
    private function validateRegisterRequest(RequestInterface $request): array
    {
        $data = $request->all();
        $errors = [];
        
        // Validação de nome
        if (empty(trim($data['name'] ?? ''))) {
            $errors['name'] = ['O nome é obrigatório'];
        } elseif (strlen(trim($data['name'])) < 2) {
            $errors['name'] = ['O nome deve ter pelo menos 2 caracteres'];
        } elseif (strlen(trim($data['name'])) > 255) {
            $errors['name'] = ['O nome não pode ter mais de 255 caracteres'];
        }
        
        // Validação de email
        if (empty(trim($data['email'] ?? ''))) {
            $errors['email'] = ['O email é obrigatório'];
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = ['O email deve ter um formato válido'];
        } elseif (strlen($data['email']) > 255) {
            $errors['email'] = ['O email não pode ter mais de 255 caracteres'];
        } elseif (User::where('email', $data['email'])->exists()) {
            $errors['email'] = ['Este email já está sendo usado por outro usuário'];
        }
        
        // Validação de senha
        if (empty($data['password'] ?? '')) {
            $errors['password'] = ['A senha é obrigatória'];
        } elseif (strlen($data['password']) < 6) {
            $errors['password'] = ['A senha deve ter pelo menos 6 caracteres'];
        } elseif (strlen($data['password']) > 255) {
            $errors['password'] = ['A senha não pode ter mais de 255 caracteres'];
        }
        
        // Validação de user_type
        if (isset($data['user_type']) && !in_array($data['user_type'], ['CLIENTE', 'MASTER'])) {
            $errors['user_type'] = ['O tipo de usuário deve ser CLIENTE ou MASTER'];
        }
        
        if (!empty($errors)) {
            throw new \Exception('Validation failed', 422);
        }
        
        return [
            'name' => trim($data['name']),
            'email' => trim($data['email']),
            'password' => $data['password'],
        ];
    }

    /**
     * Obter erros de validação
     */
    private function getValidationErrors(RequestInterface $request): array
    {
        $data = $request->all();
        $errors = [];
        
        // Validação de nome
        if (empty(trim($data['name'] ?? ''))) {
            $errors['name'] = ['O nome é obrigatório'];
        } elseif (strlen(trim($data['name'])) < 2) {
            $errors['name'] = ['O nome deve ter pelo menos 2 caracteres'];
        } elseif (strlen(trim($data['name'])) > 255) {
            $errors['name'] = ['O nome não pode ter mais de 255 caracteres'];
        }
        
        // Validação de email
        if (empty(trim($data['email'] ?? ''))) {
            $errors['email'] = ['O email é obrigatório'];
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = ['O email deve ter um formato válido'];
        } elseif (strlen($data['email']) > 255) {
            $errors['email'] = ['O email não pode ter mais de 255 caracteres'];
        } elseif (User::where('email', $data['email'])->exists()) {
            $errors['email'] = ['Este email já está sendo usado por outro usuário'];
        }
        
        // Validação de senha
        if (empty($data['password'] ?? '')) {
            $errors['password'] = ['A senha é obrigatória'];
        } elseif (strlen($data['password']) < 6) {
            $errors['password'] = ['A senha deve ter pelo menos 6 caracteres'];
        } elseif (strlen($data['password']) > 255) {
            $errors['password'] = ['A senha não pode ter mais de 255 caracteres'];
        }
        
        // Validação de user_type
        if (isset($data['user_type']) && !in_array($data['user_type'], ['CLIENTE', 'MASTER'])) {
            $errors['user_type'] = ['O tipo de usuário deve ser CLIENTE ou MASTER'];
        }
        
        return $errors;
    }

    public function login(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = User::where('email', $request->input('email'))->first();

            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas',
                ])->withStatus(401);
            }

            // Verificar se o usuário tem senha definida
            if ($user->password === null) {
                return $response->json([
                    'success' => false,
                    'message' => 'Usuário sem senha definida. Entre em contato com o administrador.',
                ])->withStatus(401);
            }

            if (!$user->verifyPassword($request->input('password'))) {
                return $response->json([
                    'success' => false,
                    'message' => 'Credenciais inválidas',
                ])->withStatus(401);
            }

            $token = $this->generateToken($user);

            return $response->json([
                'success' => true,
                'message' => 'Login realizado com sucesso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                    'token' => $token,
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    public function me(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $token = $request->header('Authorization');
            
            if (!$token) {
                return $response->json([
                    'success' => false,
                    'message' => 'Token não fornecido',
                ])->withStatus(401);
            }

            $token = str_replace('Bearer ', '', $token);
            $decoded = JWT::decode($token, new Key($this->jwtSecret, 'HS256'));
            
            $user = User::find($decoded->user_id);
            
            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ])->withStatus(404);
            }

            return $response->json([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Token inválido',
            ])->withStatus(401);
        }
    }

    public function setInitialPassword(RequestInterface $request, ResponseInterface $response): PsrResponseInterface
    {
        try {
            $user = User::where('email', $request->input('email'))->first();

            if (!$user) {
                return $response->json([
                    'success' => false,
                    'message' => 'Usuário não encontrado',
                ])->withStatus(404);
            }

            // Verificar se o usuário já tem senha definida
            if ($user->password !== null) {
                return $response->json([
                    'success' => false,
                    'message' => 'Usuário já possui senha definida',
                ])->withStatus(422);
            }

            // Definir a senha
            $user->password = $request->input('password');
            $user->save();

            $token = $this->generateToken($user);

            return $response->json([
                'success' => true,
                'message' => 'Senha definida com sucesso',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'user_type' => $user->user_type,
                    ],
                    'token' => $token,
                ],
            ]);
        } catch (\Exception $e) {
            return $response->json([
                'success' => false,
                'message' => 'Erro interno do servidor: ' . $e->getMessage(),
            ])->withStatus(500);
        }
    }

    private function generateToken(User $user): string
    {
        $payload = [
            'user_id' => $user->id,
            'email' => $user->email,
            'iat' => time(),
            'exp' => time() + $this->jwtExpiration,
        ];

        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }
}