<?php

namespace App\Notifications;

use App\Models\RepositoryRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RepositoryRequestReviewedNotification extends Notification
{
    use Queueable;

    public function __construct(private RepositoryRequest $repositoryRequest)
    {
    }

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->repositoryRequest->status;
        $statusText = $status === 'approved' ? 'approved' : 'rejected';

        $mail = (new MailMessage)
            ->subject("Your Repository Request has been {$statusText}")
            ->greeting('Hello!')
            ->line("Your repository request has been **{$statusText}**.");

        if ($this->repositoryRequest->admin_comment) {
            $mail->line('Admin comment: ' . $this->repositoryRequest->admin_comment);
        }

        return $mail
            ->action('View Request', url('/requests'))
            ->line('Thank you for using Developer Portal.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'repository_request_reviewed',
            'request_id' => $this->repositoryRequest->id,
            'request_type' => $this->repositoryRequest->type,
            'status' => $this->repositoryRequest->status,
            'admin_comment' => $this->repositoryRequest->admin_comment,
            'reviewer_name' => $this->repositoryRequest->reviewer->name ?? null,
        ];
    }
}
