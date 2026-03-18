<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectServer extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'type',
        'host',
        'username',
        'password_encrypted',
        'port',
        'notes',
    ];

    protected $hidden = [
        'password_encrypted',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
