<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
        'owner_id',
        'tech_stack',
        'test_url',
        'staging_url',
        'production_url',
    ];

    protected $casts = [
        'tech_stack' => 'array',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function servers()
    {
        return $this->hasMany(ProjectServer::class);
    }

    public function repositories()
    {
        return $this->hasMany(Repository::class);
    }
}
