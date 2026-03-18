<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RepositoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'github_id' => $this->github_id,
            'name' => $this->name,
            'full_name' => $this->full_name,
            'description' => $this->description,
            'private' => $this->private,
            'html_url' => $this->html_url,
            'clone_url' => $this->clone_url,
            'default_branch' => $this->default_branch,
            'language' => $this->language,
            'stars_count' => $this->stars_count,
            'forks_count' => $this->forks_count,
            'open_issues_count' => $this->open_issues_count,
            'project' => $this->whenLoaded('project', fn() => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null),
            'last_synced_at' => $this->last_synced_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
