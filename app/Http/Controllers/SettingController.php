<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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

    public function showWebhook(): JsonResponse
    {
        return response()->json([
            'webhook_url' => Setting::get('webhook_url'),
        ]);
    }

    public function updateWebhook(Request $request): JsonResponse
    {
        $data = $request->validate([
            'webhook_url' => ['nullable', 'url', 'max:500'],
        ]);

        Setting::set('webhook_url', $data['webhook_url'] ?: null, false);

        return response()->json(['message' => 'Webhook settings updated successfully.']);
    }

    public function testWebhook(): JsonResponse
    {
        $url = Setting::get('webhook_url');

        if (empty($url)) {
            return response()->json(['message' => 'No webhook URL configured.'], 422);
        }

        try {
            $response = Http::timeout(10)
                ->withHeaders(['Content-Type' => 'application/json'])
                ->post($url, [
                    'event'     => 'webhook.test',
                    'timestamp' => now()->toIso8601String(),
                    'message'   => 'Test webhook from Developer Portal',
                ]);

            if ($response->successful()) {
                return response()->json(['message' => 'Webhook delivered successfully. Status: ' . $response->status()]);
            }

            return response()->json([
                'message' => 'Webhook endpoint responded with an error.',
                'status'  => $response->status(),
            ], 502);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Failed to reach webhook URL: ' . $e->getMessage()], 502);
        }
    }
}
