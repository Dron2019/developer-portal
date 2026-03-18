<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Repository extends Model
{
    use HasFactory;

    protected $fillable = [
        'github_id',
        'name',
        'full_name',
        'description',
        'private',
        'html_url',
        'clone_url',
        'default_branch',
        'language',
        'stars_count',
        'forks_count',
        'open_issues_count',
        'project_id',
        'last_synced_at',
    ];

    protected $casts = [
        'private' => 'boolean',
        'last_synced_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'repository_members')
            ->withPivot('permission')
            ->withTimestamps();
    }

    public function requests()
    {
        return $this->hasMany(RepositoryRequest::class);
    }

    public function scopePublic($query)
    {
        return $query->where('private', false);
    }

    public function scopeSynced($query)
    {
        return $query->whereNotNull('last_synced_at');
    }
}

