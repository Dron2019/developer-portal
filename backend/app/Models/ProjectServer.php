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
        'port',
        'username',
        'password_encrypted',
        'notes',
    ];

    protected $hidden = [
        'password_encrypted',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function getPasswordDecryptedAttribute(): ?string
    {
        if (empty($this->attributes['password_encrypted'])) {
            return null;
        }

        try {
            return decrypt($this->attributes['password_encrypted']);
        } catch (\Exception) {
            return null;
        }
    }

    public function setPasswordEncryptedAttribute(?string $value): void
    {
        $this->attributes['password_encrypted'] = $value ? encrypt($value) : null;
    }
}

