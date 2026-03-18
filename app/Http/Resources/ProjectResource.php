<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'logo_url' => $this->logo_url,
            'status' => $this->status,
            'tech_stack' => $this->tech_stack,
            'test_url' => $this->test_url,
            'staging_url' => $this->staging_url,
            'production_url' => $this->production_url,
            'started_at' => $this->started_at?->toDateString(),
            'finished_at' => $this->finished_at?->toDateString(),
            'owner' => $this->whenLoaded('owner', fn () => new UserResource($this->owner)),
            'members_count' => $this->members_count ?? $this->whenCounted('members'),
            'repositories_count' => $this->repositories_count ?? $this->whenCounted('repositories'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
