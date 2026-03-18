<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function showGithub(): JsonResponse
    {
        return response()->json([
            'github_token' => Setting::get('github_token') ? '********' : null,
            'github_org'   => Setting::get('github_org'),
            'has_token'    => !is_null(Setting::get('github_token')),
        ]);
    }

    public function updateGithub(Request $request): JsonResponse
    {
        $data = $request->validate([
            'github_token' => ['nullable', 'string', 'max:255'],
            'github_org'   => ['nullable', 'string', 'max:255'],
        ]);

        if (array_key_exists('github_token', $data)) {
            Setting::set('github_token', $data['github_token'] ?: null, true);
        }

        if (array_key_exists('github_org', $data)) {
            Setting::set('github_org', $data['github_org'] ?: null, false);
        }

        return response()->json(['message' => 'GitHub settings updated successfully.']);
    }
}
