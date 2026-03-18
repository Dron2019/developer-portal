<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'github_id',
        'github_token',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'github_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
    ];

    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }

    public function projects()
    {
        return $this->hasMany(Project::class, 'owner_id');
    }

    public function repositoryRequests()
    {
        return $this->hasMany(RepositoryRequest::class);
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
