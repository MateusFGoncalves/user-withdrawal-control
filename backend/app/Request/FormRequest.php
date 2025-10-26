<?php

namespace App\Request;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\Validation\Contract\ValidatorFactoryInterface;
use Hyperf\Validation\ValidationException;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

abstract class FormRequest
{
    protected RequestInterface $request;
    protected ResponseInterface $response;
    protected ValidatorFactoryInterface $validatorFactory;

    public function __construct(
        RequestInterface $request,
        ResponseInterface $response,
        ValidatorFactoryInterface $validatorFactory
    ) {
        $this->request = $request;
        $this->response = $response;
        $this->validatorFactory = $validatorFactory;
    }

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
    abstract public function rules(): array;

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [];
    }

    /**
     * Validate the request.
     */
    public function validate(): array
    {
        if (!$this->authorize()) {
            throw new \Exception('Unauthorized');
        }

        $validator = $this->validatorFactory->make(
            $this->request->all(),
            $this->rules(),
            $this->messages(),
            $this->attributes()
        );

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->request->all();
    }

    /**
     * Get validated data.
     */
    public function validated(): array
    {
        return $this->validate();
    }

    /**
     * Get the request instance.
     */
    public function getRequest(): RequestInterface
    {
        return $this->request;
    }

    /**
     * Get the response instance.
     */
    public function getResponse(): ResponseInterface
    {
        return $this->response;
    }
}
