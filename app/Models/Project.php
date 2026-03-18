<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo_url',
        'status',
        'owner_id',
        'tech_lead_id',
        'manager_id',
        'tech_stack',
        'test_url',
        'staging_url',
        'production_url',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'tech_stack' => 'array',
        'started_at' => 'date',
        'finished_at' => 'date',
        'status' => 'string',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Project $project) {
            if (empty($project->slug)) {
                $project->slug = static::generateUniqueSlug($project->name);
            }
        });
    }

    public static function generateUniqueSlug(string $name): string
    {
        $slug = Str::slug($name);
        $original = $slug;
        $count = 1;

        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $original . '-' . $count++;
        }

        return $slug;
    }

    // Relationships

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function techLead()
    {
        return $this->belongsTo(User::class, 'tech_lead_id');
    }

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'project_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    public function servers()
    {
        return $this->hasMany(ProjectServer::class);
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function notes()
    {
        return $this->hasMany(ProjectNote::class);
    }

    public function links()
    {
        return $this->hasMany(ProjectLink::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ProjectActivityLog::class);
    }

    public function repositories()
    {
        return $this->hasMany(Repository::class);
    }

    // Scopes

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('owner_id', $userId)
              ->orWhereHas('members', function ($mq) use ($userId) {
                  $mq->where('users.id', $userId);
              });
        });
    }

    // Methods

    public function logActivity(string $action, string $description = '', array $metadata = []): void
    {
        $this->activityLogs()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata ?: null,
        ]);
    }
}

