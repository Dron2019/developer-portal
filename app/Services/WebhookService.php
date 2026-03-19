<?php

namespace App\Services;

use App\Models\RepositoryRequest;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebhookService
{
    public function sendRepositoryRequestCreated(RepositoryRequest $repositoryRequest): void
    {
        $url = Setting::get('webhook_url');

        if (empty($url)) {
            return;
        }

        $payload = [
            'event'     => 'repository_request.created',
            'timestamp' => now()->toIso8601String(),
            'request'   => [
                'id'          => $repositoryRequest->id,
                'type'        => $repositoryRequest->type,
                'status'      => $repositoryRequest->status,
                'reason'      => $repositoryRequest->reason,
                'repository'  => $repositoryRequest->repository
                    ? [
                        'id'        => $repositoryRequest->repository->id,
                        'name'      => $repositoryRequest->repository->name,
                        'full_name' => $repositoryRequest->repository->full_name,
                        'html_url'  => $repositoryRequest->repository->html_url,
                    ]
                    : null,
                'new_repo_name'        => $repositoryRequest->repository_name,
                'new_repo_description' => $repositoryRequest->repository_description,
                'new_repo_private'     => $repositoryRequest->repository_private,
                'created_at'  => $repositoryRequest->created_at->toIso8601String(),
            ],
            'requester' => [
                'id'               => $repositoryRequest->user->id,
                'name'             => $repositoryRequest->user->name,
                'email'            => $repositoryRequest->user->email,
                'github_nickname'  => $repositoryRequest->user->github_nickname,
            ],
            'portal_url' => rtrim(config('app.url'), '/') . '/requests',
        ];

        try {
            $response = Http::timeout(10)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, $payload);

            if (!$response->successful()) {
                Log::warning('Webhook delivery failed', [
                    'url'    => $url,
                    'status' => $response->status(),
                    'body'   => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('Webhook exception', ['url' => $url, 'error' => $e->getMessage()]);
        }
    }
}
