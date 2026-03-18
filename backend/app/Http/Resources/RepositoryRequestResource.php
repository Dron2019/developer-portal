<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepositoryRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'status' => $this->status,
            'reason' => $this->reason,
            'repository_name' => $this->repository_name,
            'repository_description' => $this->repository_description,
            'repository_private' => $this->repository_private,
            'admin_comment' => $this->admin_comment,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'user' => $this->whenLoaded('user', fn() => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'avatar_url' => $this->user->avatar_url,
            ] : null),
            'repository' => $this->whenLoaded('repository', fn() => $this->repository ? [
                'id' => $this->repository->id,
                'name' => $this->repository->name,
                'full_name' => $this->repository->full_name,
                'html_url' => $this->repository->html_url,
            ] : null),
            'reviewer' => $this->whenLoaded('reviewer', fn() => $this->reviewer ? [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ] : null),
        ];
    }
}
