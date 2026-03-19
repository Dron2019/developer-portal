<?php

namespace App\Notifications;

use App\Models\RepositoryRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewRepositoryRequestNotification extends Notification
{
    use Queueable;

    public function __construct(private RepositoryRequest $repositoryRequest)
    {
    }

    public function via(object $notifiable): array
    {
        $channels = ['database'];
        
        // Only send email if user has email notifications enabled
        if ($notifiable->email_notifications) {
            $channels[] = 'mail';
        }
        
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $requester = $this->repositoryRequest->user->name ?? 'A user';
        $type = $this->repositoryRequest->type === 'create' ? 'create a new repository' : 'access a repository';

        return (new MailMessage)
            ->subject('New Repository Request')
            ->greeting('Hello!')
            ->line("{$requester} has submitted a request to {$type}.")
            ->line('Reason: ' . $this->repositoryRequest->reason)
            ->action('Review Request', url('/requests'))
            ->line('Please review this request at your earliest convenience.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_repository_request',
            'request_id' => $this->repositoryRequest->id,
            'request_type' => $this->repositoryRequest->type,
            'requester_name' => $this->repositoryRequest->user->name ?? null,
            'reason' => $this->repositoryRequest->reason,
        ];
    }
}
