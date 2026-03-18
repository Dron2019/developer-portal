<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    private function canManageMembers(Project $project): bool
    {
        $user = auth()->user();

        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        $member = $project->members()->where('users.id', $user->id)->first();
        return $member && in_array($member->pivot->role, ['owner', 'manager']);
    }

    private function canViewProject(Project $project): bool
    {
        $user = auth()->user();
        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }
        return $project->members()->where('users.id', $user->id)->exists()
            || $project->owner_id === $user->id;
    }

    public function index(Project $project)
    {
        abort_unless($this->canViewProject($project), 403, 'Access denied.');

        $members = $project->members()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'github_nickname' => $user->github_nickname,
                'role' => $user->pivot->role,
                'joined_at' => $user->pivot->joined_at,
            ];
        });

        return response()->json(['data' => $members]);
    }

    public function store(Request $request, Project $project)
    {
        abort_unless($this->canManageMembers($project), 403, 'Access denied.');

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => 'required|in:owner,tech_lead,manager,developer,designer,qa,guest',
        ]);

        $project->members()->syncWithoutDetaching([
            $validated['user_id'] => [
                'role' => $validated['role'],
                'joined_at' => now(),
            ],
        ]);

        $project->logActivity('member_added', "User #{$validated['user_id']} added with role '{$validated['role']}'.");

        $members = $project->members()->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'github_nickname' => $user->github_nickname,
                'role' => $user->pivot->role,
                'joined_at' => $user->pivot->joined_at,
            ];
        });

        return response()->json(['data' => $members], 201);
    }

    public function update(Request $request, Project $project, User $user)
    {
        abort_unless($this->canManageMembers($project), 403, 'Access denied.');

        $validated = $request->validate([
            'role' => 'required|in:owner,tech_lead,manager,developer,designer,qa,guest',
        ]);

        $project->members()->updateExistingPivot($user->id, ['role' => $validated['role']]);

        $project->logActivity('member_updated', "User #{$user->id} role updated to '{$validated['role']}'.");

        return response()->json(['message' => 'Member role updated.']);
    }

    public function destroy(Project $project, User $user)
    {
        abort_unless($this->canManageMembers($project), 403, 'Access denied.');

        $project->members()->detach($user->id);

        $project->logActivity('member_removed', "User #{$user->id} was removed from the project.");

        return response()->json(['message' => 'Member removed successfully.']);
    }
}
