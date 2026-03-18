<?php

namespace App\Http\Controllers;

use App\Http\Resources\RepositoryResource;
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

    public function members(Repository $repository)
    {
        $members = $repository->members()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'permission' => $user->pivot->permission,
            ];
        });

        return response()->json(['data' => $members]);
    }
}

