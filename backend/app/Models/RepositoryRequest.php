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
        'admin_comment',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function repository()
    {
        return $this->belongsTo(Repository::class);
    }
}
