<?php

declare(strict_types=1);

namespace App\Service;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mailer\Transport;
use Symfony\Component\Mailer\Mailer;
use function Hyperf\Support\env;

class EmailService
{
    private MailerInterface $mailer;

    public function __construct()
    {
        try {
            // Ler configuração do .env
            $username = env('MAIL_USERNAME');
            $password = env('MAIL_PASSWORD');
            $host = env('MAIL_HOST', 'smtp.gmail.com');
            $port = (int) env('MAIL_PORT', 465);
            $encryption = env('MAIL_ENCRYPTION', 'ssl');

            // URL-encode credentials to handle spaces and special characters
            $encodedUsername = urlencode($username);
            $encodedPassword = urlencode($password);
            
            // Para porta 465, usar smtps (ssl implícito), para 587 usar smtp com tls
            $protocol = ($port == 465) ? 'smtps' : 'smtp';
            
            $dsn = sprintf(
                '%s://%s:%s@%s:%s',
                $protocol,
                $encodedUsername,
                $encodedPassword,
                $host,
                $port
            );

            $transport = Transport::fromDsn($dsn);
            $this->mailer = new Mailer($transport);
            
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Enviar email de confirmação de saque
     */
    public function sendWithdrawalConfirmation(string $toEmail, float $amount, string $pixKey, string $pixType, ?string $scheduledAt = null): void
    {
        try {
            $formattedAmount = 'R$ ' . number_format($amount, 2, ',', '.');
            
            if ($scheduledAt) {
                // Saque agendado
                $subject = 'Saque agendado com sucesso - User Control';
                $message = $this->getScheduledWithdrawalEmail($formattedAmount, $pixKey, $pixType, $scheduledAt);
            } else {
                // Saque imediato
                $subject = 'Saque efetuado com sucesso - User Control';
                $message = $this->getImmediateWithdrawalEmail($formattedAmount, $pixKey, $pixType);
            }
            
            $this->sendEmail($toEmail, $subject, $message);
            
        } catch (\Exception $e) {
            throw $e;
        }
    }

    /**
     * Template para saque imediato
     */
    private function getImmediateWithdrawalEmail(string $amount, string $pixKey, string $pixType): string
    {
        return "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h1 style='color: #4F46E5;'>User Control</h1>
                    
                    <h2 style='color: #333;'>Saque Efetuado com Sucesso</h2>
                    
                    <p>Olá,</p>
                    
                    <p>Seu saque foi efetuado com sucesso!</p>
                    
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 5px 0;'><strong>Valor:</strong> {$amount}</p>
                        <p style='margin: 5px 0;'><strong>Chave PIX:</strong> {$pixKey}</p>
                        <p style='margin: 5px 0;'><strong>Tipo PIX:</strong> {$pixType}</p>
                        <p style='margin: 5px 0;'><strong>Data/Hora:</strong> " . date('d/m/Y H:i:s') . "</p>
                    </div>
                    
                    <p>O valor foi enviado para a chave PIX informada.</p>
                    
                    <p style='color: #666; font-size: 14px; margin-top: 30px;'>
                        Este é um email automático, por favor não responda.
                    </p>
                    
                    <p style='color: #666; font-size: 14px;'>
                        User Control - Sistema de Controle de Saques
                    </p>
                </div>
            </body>
            </html>
        ";
    }

    /**
     * Template para saque agendado
     */
    private function getScheduledWithdrawalEmail(string $amount, string $pixKey, string $pixType, string $scheduledAt): string
    {
        $formattedDate = date('d/m/Y \à\s H:i', strtotime($scheduledAt));
        
        return "
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h1 style='color: #4F46E5;'>User Control</h1>
                    
                    <h2 style='color: #333;'>Saque Agendado com Sucesso</h2>
                    
                    <p>Olá,</p>
                    
                    <p>Seu saque foi agendado com sucesso!</p>
                    
                    <div style='background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;'>
                        <p style='margin: 5px 0;'><strong>Valor:</strong> {$amount}</p>
                        <p style='margin: 5px 0;'><strong>Chave PIX:</strong> {$pixKey}</p>
                        <p style='margin: 5px 0;'><strong>Tipo PIX:</strong> {$pixType}</p>
                        <p style='margin: 5px 0;'><strong>Agendado para:</strong> {$formattedDate}</p>
                    </div>
                    
                    <p>O valor será enviado automaticamente para a chave PIX informada na data e hora agendadas.</p>
                    
                    <p style='color: #666; font-size: 14px; margin-top: 30px;'>
                        Este é um email automático, por favor não responda.
                    </p>
                    
                    <p style='color: #666; font-size: 14px;'>
                        User Control - Sistema de Controle de Saques
                    </p>
                </div>
            </body>
            </html>
        ";
    }

    /**
     * Enviar email
     */
    private function sendEmail(string $to, string $subject, string $htmlMessage): void
    {
        try {
            $fromAddress = env('MAIL_FROM_ADDRESS');
            $fromName = env('MAIL_FROM_NAME', 'User Control');
            
            $email = (new Email())
                ->from($fromAddress)
                ->to($to)
                ->subject($subject)
                ->html($htmlMessage);
            
            $this->mailer->send($email);
            
        } catch (\Exception $e) {
            throw $e;
        }
    }
}

