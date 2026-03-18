<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectLink extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'title',
        'url',
        'type',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
