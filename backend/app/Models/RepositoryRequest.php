<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RepositoryRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'repository_id',
        'type',
        'status',
        'reason',
        'repository_name',
        'repository_description',
        'repository_private',
        'admin_comment',
        'reviewed_by',
        'reviewed_at',
    ];

    protected $casts = [
        'repository_private' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function repository()
    {
        return $this->belongsTo(Repository::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}

