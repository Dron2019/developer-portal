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
        $channels = ['database'];
        
        // Only send email if user has email notifications enabled
        if ($notifiable->email_notifications) {
            $channels[] = 'mail';
        }
        
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $status = $this->repositoryRequest->status;
        $statusText = $status === 'approved' ? 'approved' : 'rejected';
        $type = $this->repositoryRequest->type;

        $mail = (new MailMessage)
            ->subject("Your Repository Request has been {$statusText}")
            ->greeting('Hello!')
            ->line("Your repository request has been **{$statusText}**.");

        if ($status === 'approved' && $type === 'access' && $this->repositoryRequest->repository) {
            $repoName = $this->repositoryRequest->repository->full_name;
            $mail->line("You have been invited to collaborate on **{$repoName}**.")
                 ->line('Please check your GitHub notifications or email to **accept the collaboration invitation** — access will only be granted after you accept it.')
                 ->action('Accept on GitHub', "https://github.com/{$repoName}/invitations");
        } elseif ($status === 'approved' && $type === 'create') {
            $repoName = $this->repositoryRequest->repository_name ?? 'the new repository';
            $mail->line("The repository **{$repoName}** has been created in the organization.")
                 ->action('View Request', url('/requests'));
        } else {
            $mail->action('View Request', url('/requests'));
        }

        if ($this->repositoryRequest->admin_comment) {
            $mail->line('Admin comment: ' . $this->repositoryRequest->admin_comment);
        }

        return $mail->line('Thank you for using Developer Portal.');
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
