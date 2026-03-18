<?php

namespace App\Http\Controllers;

use App\Http\Resources\RepositoryResource;
use App\Models\Project;
use App\Models\Repository;
use App\Services\GitHubService;
use Illuminate\Http\Request;

class RepositoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Repository::with('project');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('full_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('private')) {
            $query->where('private', filter_var($request->input('private'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('language')) {
            $query->where('language', $request->input('language'));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->integer('project_id'));
        }

        $repositories = $query->latest()->paginate(20);

        return RepositoryResource::collection($repositories);
    }

    public function show(Repository $repository)
    {
        $repository->load('project');

        return new RepositoryResource($repository);
    }

    public function sync()
    {
        $before = Repository::count();

        $service = new GitHubService();
        $service->syncRepositories();

        $after = Repository::count();

        return response()->json([
            'message' => 'Repositories synced successfully.',
            'synced' => $after - $before,
            'total' => $after,
        ]);
    }

    public function unlinkFromProject(Project $project, Repository $repository)
    {
        $user = auth()->user();

        abort_unless($repository->project_id === $project->id, 404);

        $member = $project->members()->where('users.id', $user->id)->first();
        $isOwner = $member && $member->pivot->role === 'owner';
        abort_unless($user->isAdmin() || $user->isManager() || $isOwner, 403, 'Access denied.');

        $repository->update(['project_id' => null]);

        $project->logActivity('repository_unlinked', "Repository '{$repository->full_name}' was unlinked.");

        return response()->json(['message' => 'Repository unlinked successfully.']);
    }
}


