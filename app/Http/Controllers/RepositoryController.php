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
            $projectId = $request->input('project_id');
            if ($projectId === 'null' || $projectId === 'unlinked') {
                $query->whereNull('project_id');
            } else {
                $query->where('project_id', $request->integer('project_id'));
            }
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
        $service = new GitHubService();
        $result  = $service->syncRepositories();

        $message = $result['fetched'] === 0
            ? 'No repositories returned from GitHub. Check your token and organisation settings.'
            : "Sync complete: {$result['created']} new, {$result['updated']} updated (fetched {$result['fetched']} from GitHub).";

        return response()->json([
            'message' => $message,
            'fetched' => $result['fetched'],
            'created' => $result['created'],
            'updated' => $result['updated'],
        ]);
    }

    public function members(Repository $repository)
    {
        abort_unless(auth()->user()->isAdmin(), 403, 'Access denied.');

        if (!$repository->full_name) {
            return response()->json([]);
        }

        [$owner, $repo] = explode('/', $repository->full_name, 2);

        $collaborators = (new GitHubService())->getCollaborators($owner, $repo);

        return response()->json($collaborators);
    }

    public function commitCount(Repository $repository)
    {
        abort_unless(auth()->user()->isAdmin(), 403, 'Access denied.');

        if (!$repository->full_name) {
            return response()->json(['count' => 0]);
        }

        [$owner, $repo] = explode('/', $repository->full_name, 2);

        $count = (new GitHubService())->getCommitCount($owner, $repo);

        return response()->json(['count' => $count]);
    }

    public function removeCollaborator(Repository $repository, string $username)
    {
        abort_unless(auth()->user()->isAdmin(), 403, 'Access denied.');

        if (!$repository->full_name) {
            return response()->json(['message' => 'Repository has no full_name.'], 422);
        }

        [$owner, $repo] = explode('/', $repository->full_name, 2);

        $success = (new GitHubService())->removeCollaborator($owner, $repo, $username);

        if (!$success) {
            return response()->json(['message' => 'Failed to remove collaborator from GitHub.'], 502);
        }

        return response()->json(['message' => 'Collaborator removed successfully.']);
    }

    public function destroy(Repository $repository)
    {
        $user = auth()->user();

        abort_unless($user->isAdmin() || $user->isManager(), 403, 'Access denied.');

        $repository->delete();

        return response()->json(['message' => 'Repository removed from local database.']);
    }

    public function linkToProject(Project $project, Repository $repository)
    {
        $user = auth()->user();

        // Check if repository is already linked to this project
        if ($repository->project_id === $project->id) {
            return response()->json(['message' => 'Repository is already linked to this project.'], 400);
        }

        // Check if repository is linked to another project
        if ($repository->project_id !== null) {
            return response()->json(['message' => 'Repository is already linked to another project.'], 400);
        }

        // Check permissions - same as unlink
        $member = $project->members()->where('users.id', $user->id)->first();
        $isOwner = $member && $member->pivot->role === 'owner';
        abort_unless($user->isAdmin() || $user->isManager() || $isOwner, 403, 'Access denied.');

        $repository->update(['project_id' => $project->id]);

        $project->logActivity('repository_linked', "Repository '{$repository->full_name}' was linked.");

        return response()->json(['message' => 'Repository linked successfully.']);
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


