<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;

class ProjectActivityController extends Controller
{
    public function index(Project $project)
    {
        $activity = $project->activityLogs()
            ->with('user')
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $activity->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->description,
                    'metadata' => $log->metadata,
                    'user' => $log->user ? [
                        'id' => $log->user->id,
                        'name' => $log->user->name,
                        'avatar_url' => $log->user->avatar_url,
                    ] : null,
                    'created_at' => $log->created_at,
                ];
            }),
            'meta' => [
                'current_page' => $activity->currentPage(),
                'last_page' => $activity->lastPage(),
                'total' => $activity->total(),
            ],
        ]);
    }
}
