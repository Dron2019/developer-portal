<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Repository;
use App\Models\User;
use App\Models\ProjectActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $user = auth()->user();
        
        // Get user's projects (either as member or based on role)
        $userProjectsQuery = $user->isAdmin() || $user->isManager() 
            ? Project::query()
            : Project::whereHas('members', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            });
            
        $userProjects = $userProjectsQuery->get();
        $userProjectIds = $userProjects->pluck('id');
        
        // Basic counts
        $stats = [
            'total_projects' => $userProjects->count(),
            'total_repositories' => Repository::when(!($user->isAdmin() || $user->isManager()), function ($query) use ($userProjectIds) {
                return $query->whereIn('project_id', $userProjectIds);
            })->count(),
            'total_users' => $user->isAdmin() || $user->isManager() ? User::count() : null,
        ];
        
        // Project status breakdown
        $projectsByStatus = $userProjects->groupBy('status');
        $stats['projects_by_status'] = [
            'active' => $projectsByStatus->get('active', collect())->count(),
            'planning' => $projectsByStatus->get('planning', collect())->count(),
            'completed' => $projectsByStatus->get('completed', collect())->count(),
            'on_hold' => $projectsByStatus->get('on_hold', collect())->count(),
        ];
        
        // Recent projects (last 5)
        $recentProjects = $userProjectsQuery
            ->with(['members' => function ($query) {
                $query->limit(3);
            }])
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function ($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status,
                    'updated_at' => $project->updated_at,
                    'members_count' => $project->members()->count(),
                    'repositories_count' => $project->repositories()->count(),
                ];
            });
        
        // Recent activity (last 10)
        $recentActivity = ProjectActivityLog::whereIn('project_id', $userProjectIds)
            ->with(['project:id,name', 'user:id,name,avatar_url'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(function ($activity) {
                return [
                    'id' => $activity->id,
                    'action' => $activity->action,
                    'description' => $activity->description,
                    'created_at' => $activity->created_at,
                    'user' => $activity->user ? [
                        'name' => $activity->user->name,
                        'avatar_url' => $activity->user->avatar_url,
                    ] : null,
                    'project' => $activity->project ? [
                        'id' => $activity->project->id,
                        'name' => $activity->project->name,
                    ] : null,
                ];
            });
            
        // Repository language breakdown
        $languageStats = Repository::when(!($user->isAdmin() || $user->isManager()), function ($query) use ($userProjectIds) {
                return $query->whereIn('project_id', $userProjectIds);
            })
            ->whereNotNull('language')
            ->select('language', DB::raw('count(*) as count'))
            ->groupBy('language')
            ->orderByDesc('count')
            ->limit(5)
            ->get();
            
        return response()->json([
            'stats' => $stats,
            'recent_projects' => $recentProjects,
            'recent_activity' => $recentActivity,
            'language_stats' => $languageStats,
        ]);
    }
}
