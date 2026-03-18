<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ProjectDetailResource extends ProjectResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'tech_lead' => $this->whenLoaded('techLead', fn () => new UserResource($this->techLead)),
            'manager' => $this->whenLoaded('manager', fn () => new UserResource($this->manager)),
            'members' => $this->whenLoaded('members', function () {
                return $this->members->map(fn ($user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar_url' => $user->avatar_url,
                    'github_nickname' => $user->github_nickname,
                    'role' => $user->pivot->role,
                    'joined_at' => $user->pivot->joined_at,
                ]);
            }),
            'servers' => $this->whenLoaded('servers', fn () => ProjectServerResource::collection($this->servers)),
            'notes' => $this->whenLoaded('notes', function () {
                return $this->notes->map(fn ($note) => [
                    'id' => $note->id,
                    'title' => $note->title,
                    'content' => $note->content,
                    'author' => $note->relationLoaded('author') && $note->author ? [
                        'id' => $note->author->id,
                        'name' => $note->author->name,
                        'avatar_url' => $note->author->avatar_url,
                    ] : null,
                    'created_at' => $note->created_at,
                    'updated_at' => $note->updated_at,
                ]);
            }),
            'links' => $this->whenLoaded('links', function () {
                return $this->links->map(fn ($link) => [
                    'id' => $link->id,
                    'title' => $link->title,
                    'url' => $link->url,
                    'type' => $link->type,
                    'created_at' => $link->created_at,
                ]);
            }),
            'files' => $this->whenLoaded('files', function () {
                return $this->files->map(fn ($file) => [
                    'id' => $file->id,
                    'name' => $file->name,
                    'original_name' => $file->original_name,
                    'mime_type' => $file->mime_type,
                    'size' => $file->size,
                    'type' => $file->type,
                    'uploader' => $file->relationLoaded('uploader') && $file->uploader ? [
                        'id' => $file->uploader->id,
                        'name' => $file->uploader->name,
                        'avatar_url' => $file->uploader->avatar_url,
                    ] : null,
                    'created_at' => $file->created_at,
                ]);
            }),
            'recent_activity' => $this->whenLoaded('activityLogs', function () {
                return $this->activityLogs->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'metadata' => $log->metadata,
                    'user' => $log->relationLoaded('user') && $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'avatar_url' => $log->user->avatar_url,
                    ] : null,
                    'created_at' => $log->created_at,
                ]);
            }),
            'repositories' => $this->whenLoaded('repositories', function () {
                return $this->repositories->map(fn ($repo) => [
                    'id' => $repo->id,
                    'name' => $repo->name,
                    'full_name' => $repo->full_name,
                    'description' => $repo->description,
                    'url' => $repo->url,
                    'visibility' => $repo->visibility,
                ]);
            }),
        ]);
    }
}
