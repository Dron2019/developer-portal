<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'github_id',
        'github_token',
        'github_nickname',
        'avatar_url',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'github_token',
        'two_factor_secret',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_active' => 'boolean',
        'role' => 'string',
    ];

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }

    public function isDeveloper(): bool
    {
        return $this->role === 'developer';
    }

    public function isGuest(): bool
    {
        return $this->role === 'guest';
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
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
