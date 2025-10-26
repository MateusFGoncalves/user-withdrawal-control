<?php

declare(strict_types=1);

namespace App\Helper;

use DateTime;
use DateTimeZone;

class DateTimeHelper
{
    /**
     * Get Brazil timezone
     */
    public static function getBrazilTimezone(): DateTimeZone
    {
        return new DateTimeZone('America/Sao_Paulo');
    }

    /**
     * Create a DateTime with Brazil timezone
     */
    public static function createBrazilDateTime(?string $time = null): DateTime
    {
        $timezone = self::getBrazilTimezone();
        
        if ($time === null) {
            return new DateTime('now', $timezone);
        }
        
        return new DateTime($time, $timezone);
    }

    /**
     * Get current date/time in Brazil timezone as string
     */
    public static function nowBrazil(): string
    {
        return (new DateTime('now', self::getBrazilTimezone()))->format('Y-m-d H:i:s');
    }

    /**
     * Create scheduled date at 6:00 AM in Brazil timezone
     */
    public static function createScheduledAt(string $date): DateTime
    {
        // Garantir que a data tenha horário 06:00:00
        $scheduledDate = DateTime::createFromFormat('Y-m-d', $date, self::getBrazilTimezone());
        $scheduledDate->setTime(6, 0, 0);
        
        return $scheduledDate;
    }
}
