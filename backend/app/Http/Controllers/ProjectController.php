<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectDetailResource;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Project::with(['owner', 'members']);

        if ($user->isAdmin() || $user->isManager()) {
            // Admin/Manager see all projects
        } else {
            // Developer sees only projects where they are a member or owner
            $query->forUser($user->id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $projects = $query->withCount(['members', 'repositories'])
            ->latest()
            ->paginate(15);

        return ProjectResource::collection($projects);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isAdmin() || $user->isManager(), 403, 'Access denied.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,development,archived,on_hold',
            'tech_stack' => 'nullable|array',
            'tech_stack.*' => 'string',
            'test_url' => 'nullable|url|max:255',
            'staging_url' => 'nullable|url|max:255',
            'production_url' => 'nullable|url|max:255',
            'logo_url' => 'nullable|url|max:255',
            'tech_lead_id' => 'nullable|exists:users,id',
            'manager_id' => 'nullable|exists:users,id',
            'started_at' => 'nullable|date',
            'finished_at' => 'nullable|date|after_or_equal:started_at',
        ]);

        $validated['owner_id'] = $user->id;

        $project = Project::create($validated);

        // Add creator as owner in project_members
        $project->members()->attach($user->id, [
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        $project->logActivity('created', "Project '{$project->name}' was created.");

        return new ProjectResource($project->load(['owner', 'members'])->loadCount(['members', 'repositories']));
    }

    public function show(Project $project)
    {
        $user = auth()->user();
        $isMember = $project->members()->where('users.id', $user->id)->exists();
        abort_unless($user->isAdmin() || $user->isManager() || $project->owner_id === $user->id || $isMember, 403, 'Access denied.');

        $project->load([
            'owner',
            'techLead',
            'manager',
            'members',
            'servers',
            'repositories',
            'links',
            'files.uploader',
            'notes' => fn ($q) => $q->latest()->limit(5),
            'activityLogs' => fn ($q) => $q->with('user')->latest()->limit(10),
        ])->loadCount(['members', 'repositories']);

        return new ProjectDetailResource($project);
    }

    public function update(Request $request, Project $project)
    {
        $user = $request->user();
        $isMember = $project->members()->where('users.id', $user->id)->first();
        $isOwner = $isMember && $isMember->pivot->role === 'owner';
        abort_unless($user->isAdmin() || $user->isManager() || $isOwner, 403, 'Access denied.');

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,development,archived,on_hold',
            'tech_stack' => 'nullable|array',
            'tech_stack.*' => 'string',
            'test_url' => 'nullable|url|max:255',
            'staging_url' => 'nullable|url|max:255',
            'production_url' => 'nullable|url|max:255',
            'logo_url' => 'nullable|url|max:255',
            'tech_lead_id' => 'nullable|exists:users,id',
            'manager_id' => 'nullable|exists:users,id',
            'started_at' => 'nullable|date',
            'finished_at' => 'nullable|date|after_or_equal:started_at',
        ]);

        $project->update($validated);

        $project->logActivity('updated', "Project '{$project->name}' was updated.");

        return new ProjectResource($project->load(['owner', 'members'])->loadCount(['members', 'repositories']));
    }

    public function destroy(Project $project)
    {
        $user = auth()->user();
        abort_unless($user->isAdmin(), 403, 'Access denied.');

        $project->logActivity('deleted', "Project '{$project->name}' was deleted.");
        $project->delete();

        return response()->json(['message' => 'Project deleted successfully.']);
    }
}


