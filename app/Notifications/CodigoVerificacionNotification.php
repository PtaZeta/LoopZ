<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CodigoVerificacionNotification extends Notification
{
    use Queueable;

    public $codigo;

    public function __construct(string $codigo)
    {
        $this->codigo = $codigo;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Tu código de verificación de LoopZ')
            ->view('emails.codigo_verificacion', [
                'codigo' => $this->codigo,
                'nombre_usuario' => $notifiable->name,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
