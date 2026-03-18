<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        return UserResource::collection(User::paginate(15));
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => ['sometimes', 'in:admin,manager,developer,guest'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $user->update($validated);

        return new UserResource($user);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'                  => ['sometimes', 'required', 'string', 'max:255'],
            'email'                 => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'current_password'      => ['required_with:password,email', 'string'],
            'password'              => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
        ]);

        if (isset($validated['password']) || isset($validated['email'])) {
            if (!Hash::check($validated['current_password'] ?? '', $user->password)) {
                return response()->json([
                    'message' => 'The provided current password is incorrect.',
                    'errors'  => ['current_password' => ['Current password is incorrect.']],
                ], 422);
            }
        }

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        unset($validated['current_password']);
        $user->update($validated);

        return new UserResource($user);
    }

    public function destroy(User $user)
    {
        $user->update(['is_active' => false]);

        return response()->json(['message' => 'User deactivated.']);
    }

    public function permissions(Request $request)
    {
        $user = $request->user();

        $permissions = [
            'admin'     => ['manage_users', 'manage_projects', 'manage_repositories', 'view_all'],
            'manager'   => ['manage_projects', 'manage_repositories', 'view_all'],
            'developer' => ['view_projects', 'view_repositories', 'submit_requests'],
            'guest'     => ['view_projects'],
        ];

        return response()->json([
            'role'        => $user->role,
            'permissions' => $permissions[$user->role] ?? [],
        ]);
    }
}

