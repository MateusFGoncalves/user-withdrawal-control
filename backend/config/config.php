<?php

declare(strict_types=1);
/**
 * This file is part of Hyperf.
 *
 * @link     https://www.hyperf.io
 * @document https://hyperf.wiki
 * @contact  group@hyperf.io
 * @license  https://github.com/hyperf/hyperf/blob/master/LICENSE
 */
use Hyperf\Contract\StdoutLoggerInterface;
use Psr\Log\LogLevel;

use function Hyperf\Support\env;

return [
    'app_name' => env('APP_NAME', 'skeleton'),
    'app_env' => env('APP_ENV', 'dev'),
    'scan_cacheable' => env('SCAN_CACHEABLE', false),
    'mail' => [
        'driver' => env('MAIL_DRIVER', 'smtp'),
        'host' => env('MAIL_HOST') ?: 'smtp.gmail.com',
        'port' => (int) env('MAIL_PORT') ?: 465,
        'username' => env('MAIL_USERNAME') ?: '',
        'password' => env('MAIL_PASSWORD') ?: '',
        'encryption' => env('MAIL_ENCRYPTION') ?: 'ssl',
        'from' => [
            'address' => env('MAIL_FROM_ADDRESS') ?: '',
            'name' => env('MAIL_FROM_NAME') ?: 'UserControl',
        ]
    ],
    StdoutLoggerInterface::class => [
        'log_level' => [
            LogLevel::ALERT,
            LogLevel::CRITICAL,
            LogLevel::DEBUG,
            LogLevel::EMERGENCY,
            LogLevel::ERROR,
            LogLevel::INFO,
            LogLevel::NOTICE,
            LogLevel::WARNING,
        ],
    ],
];
