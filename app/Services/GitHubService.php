<?php

namespace App\Services;

use App\Models\Repository;
use App\Models\Setting;
use Illuminate\Support\Facades\Http;

class GitHubService
{
    private string $token;
    private string $baseUrl = 'https://api.github.com';

    public function __construct(string $token = null)
    {
        $this->token = $token ?? Setting::get('github_token') ?? env('GITHUB_TOKEN', '');
    }

    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        $client = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => '2022-11-28',
        ]);

        if (app()->environment('local')) {
            $client = $client->withOptions(['verify' => false]);
        }

        return $client;
    }

    private function fetchAllPages(string $url, array $params = []): array
    {
        $results = [];
        $page    = 1;

        do {
            $response = $this->http()->get($url, array_merge($params, ['per_page' => 100, 'page' => $page]));

            if (!$response->successful()) {
                \Log::error('GitHubService fetchAllPages failed', [
                    'url'    => $url,
                    'page'   => $page,
                    'status' => $response->status(),
                    'body'   => $response->json(),
                ]);
                break;
            }

            $batch = $response->json();

            if (empty($batch)) {
                break;
            }

            $results = array_merge($results, $batch);
            $page++;
        } while (count($batch) === 100);

        return $results;
    }

    public function getOrganizationRepos(string $org): array
    {
        return $this->fetchAllPages("{$this->baseUrl}/orgs/{$org}/repos", ['type' => 'all']);
    }

    public function getUserRepos(string $username): array
    {
        return $this->fetchAllPages("{$this->baseUrl}/users/{$username}/repos");
    }

    public function getAuthenticatedUserRepos(): array
    {
        return $this->fetchAllPages("{$this->baseUrl}/user/repos", ['visibility' => 'all']);
    }

    public function createRepository(string $name, string $description, bool $private, string $org = null): array
    {
        $endpoint = $org
            ? "{$this->baseUrl}/orgs/{$org}/repos"
            : "{$this->baseUrl}/user/repos";

        $response = $this->http()
            ->post($endpoint, [
                'name'        => $name,
                'description' => $description,
                'private'     => $private,
                'auto_init'   => true,
            ]);

        return $response->successful() ? $response->json() : [];
    }

    public function addCollaborator(string $owner, string $repo, string $username, string $permission = 'push'): array
    {
        $response = $this->http()
            ->put("{$this->baseUrl}/repos/{$owner}/{$repo}/collaborators/{$username}", [
                'permission' => $permission,
            ]);

        if (!$response->successful()) {
            \Log::error('GitHub addCollaborator failed', [
                'owner'    => $owner,
                'repo'     => $repo,
                'username' => $username,
                'status'   => $response->status(),
                'body'     => $response->json(),
            ]);

            return [
                'success' => false,
                'status'  => $response->status(),
                'error'   => $response->json('message') ?? 'Unknown GitHub API error',
            ];
        }

        return ['success' => true];
    }

    public function getCollaborators(string $owner, string $repo): array
    {
        $response = $this->http()
            ->get("{$this->baseUrl}/repos/{$owner}/{$repo}/collaborators", ['per_page' => 100]);

        return $response->successful() ? $response->json() : [];
    }

    public function getCommitCount(string $owner, string $repo): int
    {
        $response = $this->http()
            ->get("{$this->baseUrl}/repos/{$owner}/{$repo}/commits", ['per_page' => 1]);

        if (!$response->successful()) {
            return 0;
        }

        $link = $response->header('Link');

        if ($link && preg_match('/[&?]page=(\d+)>;\s*rel="last"/', $link, $m)) {
            return (int) $m[1];
        }

        // No Link header = single page; count items directly
        return count($response->json());
    }

    public function removeCollaborator(string $owner, string $repo, string $username): bool
    {
        $response = $this->http()
            ->delete("{$this->baseUrl}/repos/{$owner}/{$repo}/collaborators/{$username}");

        return $response->successful();
    }

    public function getRepoInfo(string $owner, string $repo): array
    {
        $response = $this->http()
            ->get("{$this->baseUrl}/repos/{$owner}/{$repo}");

        return $response->successful() ? $response->json() : [];
    }

    public function syncRepositories(): array
    {
        $org = Setting::get('github_org') ?? env('GITHUB_ORG');

        $repos = $org
            ? $this->getOrganizationRepos($org)
            : $this->getAuthenticatedUserRepos();

        $fetched = count($repos);
        $created = 0;
        $updated = 0;

        \Log::info('GitHubService syncRepositories', ['source' => $org ?? '(authenticated user)', 'fetched' => $fetched]);

        foreach ($repos as $repo) {
            $result = Repository::updateOrCreate(
                ['github_id' => $repo['id']],
                [
                    'name' => $repo['name'],
                    'full_name' => $repo['full_name'],
                    'description' => $repo['description'] ?? null,
                    'private' => $repo['private'] ?? false,
                    'html_url' => $repo['html_url'],
                    'clone_url' => $repo['clone_url'] ?? null,
                    'default_branch' => $repo['default_branch'] ?? 'main',
                    'language' => $repo['language'] ?? null,
                    'stars_count' => $repo['stargazers_count'] ?? 0,
                    'forks_count' => $repo['forks_count'] ?? 0,
                    'open_issues_count' => $repo['open_issues_count'] ?? 0,
                    'last_synced_at' => now(),
                ]
            );

            if ($result->wasRecentlyCreated) {
                $created++;
            } else {
                $updated++;
            }
        }

        return [
            'fetched' => $fetched,
            'created' => $created,
            'updated' => $updated,
        ];
    }
}
