<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function register(RegisterRequest $request)
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'developer',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'register',
            'description' => 'User registered',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Account is deactivated.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'login',
            'description' => 'User logged in',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        AuditLog::create([
            'user_id' => $request->user()->id,
            'action' => 'logout',
            'description' => 'User logged out',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request)
    {
        return new UserResource($request->user());
    }

    public function githubRedirect()
    {
        $url = Socialite::driver('github')->stateless()->redirect()->getTargetUrl();

        return response()->json(['url' => $url]);
    }

    public function githubCallback()
    {
        $githubUser = Socialite::driver('github')->stateless()->user();

        $email = $githubUser->getEmail();

        if (!$email) {
            return response()->json([
                'message' => 'GitHub account does not have a public email. Please set a public email in your GitHub profile.',
            ], 422);
        }

        $user = User::where('github_id', $githubUser->getId())
            ->orWhere('email', $email)
            ->first();

        if ($user) {
            $user->update([
                'github_id' => $githubUser->getId(),
                'github_token' => $githubUser->token,
                'github_nickname' => $githubUser->getNickname(),
                'avatar_url' => $githubUser->getAvatar(),
            ]);
        } else {
            $user = User::create([
                'name' => $githubUser->getName() ?? $githubUser->getNickname(),
                'email' => $email,
                'github_id' => $githubUser->getId(),
                'github_token' => $githubUser->token,
                'github_nickname' => $githubUser->getNickname(),
                'avatar_url' => $githubUser->getAvatar(),
                'role' => 'developer',
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'github_login',
            'description' => 'User logged in via GitHub',
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }
}
