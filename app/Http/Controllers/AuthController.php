<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
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
            'is_active' => false,
        ]);

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'register',
            'description' => 'User registered',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Registration successful. Your account is pending admin approval.',
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

    public function forgotPassword(ForgotPasswordRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        // Always return success to avoid email enumeration
        if (!$user) {
            return response()->json(['message' => 'If that email address is in our system, we have sent a password reset link.']);
        }

        $token = Str::random(64);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($token),
                'created_at' => now(),
            ]
        );

        $frontendUrl = env('APP_FRONTEND_URL', env('APP_URL', 'http://localhost:3000'));
        $resetLink = rtrim($frontendUrl, '/') . '/reset-password?token=' . $token . '&email=' . urlencode($request->email);

        Log::info('Password reset link for ' . $request->email . ': ' . $resetLink);

        try {
            Mail::html(
                '<p>You requested a password reset. Click the link below to reset your password:</p>'
                . '<p><a href="' . $resetLink . '">' . $resetLink . '</a></p>'
                . '<p>This link will expire in 60 minutes.</p>'
                . '<p>If you did not request a password reset, please ignore this email.</p>',
                function ($message) use ($request) {
                    $message->to($request->email)
                            ->subject('Reset Your Password');
                }
            );
        } catch (\Exception $e) {
            Log::warning('Failed to send password reset email: ' . $e->getMessage());
        }

        return response()->json(['message' => 'If that email address is in our system, we have sent a password reset link...']);
    }

    public function resetPassword(ResetPasswordRequest $request)
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$record || !Hash::check($request->token, $record->token)) {
            return response()->json(['message' => 'Invalid or expired password reset token.'], 422);
        }

        if (now()->diffInMinutes($record->created_at) > 60) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            return response()->json(['message' => 'Invalid or expired password reset token.'], 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Invalid or expired password reset token.'], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        AuditLog::create([
            'user_id' => $user->id,
            'action' => 'password_reset',
            'description' => 'User reset their password',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json(['message' => 'Password has been reset successfully.']);
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
