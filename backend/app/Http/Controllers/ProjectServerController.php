<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProjectServerResource;
use App\Models\Project;
use App\Models\ProjectServer;
use Illuminate\Http\Request;

class ProjectServerController extends Controller
{
    private function canManageServers(Project $project): bool
    {
        $user = auth()->user();

        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        $member = $project->members()->where('users.id', $user->id)->first();
        return $member && in_array($member->pivot->role, ['owner', 'tech_lead', 'manager']);
    }

    public function index(Project $project)
    {
        abort_unless($this->canManageServers($project), 403, 'Access denied.');

        $servers = $project->servers()->get();

        return ProjectServerResource::collection($servers);
    }

    public function store(Request $request, Project $project)
    {
        abort_unless($this->canManageServers($project), 403, 'Access denied.');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:ssh,ftp,panel,other',
            'host' => 'required|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $server = new ProjectServer([
            'project_id' => $project->id,
            'name' => $validated['name'],
            'type' => $validated['type'],
            'host' => $validated['host'],
            'port' => $validated['port'] ?? null,
            'username' => $validated['username'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['password'])) {
            $server->password_encrypted = $validated['password'];
        }

        $server->save();

        $project->logActivity('server_added', "Server '{$server->name}' was added.");

        return new ProjectServerResource($server);
    }

    public function update(Request $request, Project $project, ProjectServer $server)
    {
        abort_unless($this->canManageServers($project), 403, 'Access denied.');
        abort_unless($server->project_id === $project->id, 404);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'type' => 'sometimes|required|in:ssh,ftp,panel,other',
            'host' => 'sometimes|required|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $server->fill([
            'name' => $validated['name'] ?? $server->name,
            'type' => $validated['type'] ?? $server->type,
            'host' => $validated['host'] ?? $server->host,
            'port' => $validated['port'] ?? $server->port,
            'username' => $validated['username'] ?? $server->username,
            'notes' => $validated['notes'] ?? $server->notes,
        ]);

        if (array_key_exists('password', $validated)) {
            $server->password_encrypted = $validated['password'];
        }

        $server->save();

        return new ProjectServerResource($server);
    }

    public function destroy(Project $project, ProjectServer $server)
    {
        abort_unless($this->canManageServers($project), 403, 'Access denied.');
        abort_unless($server->project_id === $project->id, 404);

        $project->logActivity('server_removed', "Server '{$server->name}' was removed.");
        $server->delete();

        return response()->json(['message' => 'Server deleted successfully.']);
    }

    public function showPassword(Project $project, ProjectServer $server)
    {
        $user = auth()->user();
        abort_unless($server->project_id === $project->id, 404);

        $member = $project->members()->where('users.id', $user->id)->first();
        $isTechLead = $member && $member->pivot->role === 'tech_lead';

        abort_unless($user->isAdmin() || $user->isManager() || $isTechLead, 403, 'Access denied.');

        return response()->json(['password' => $server->password_decrypted]);
    }
}

