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
        'project_id',
    ];

    protected $casts = [
        'private' => 'boolean',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function requests()
    {
        return $this->hasMany(RepositoryRequest::class);
    }
}
