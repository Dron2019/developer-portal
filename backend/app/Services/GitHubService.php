<?php

namespace App\Services;

use App\Models\Repository;
use Illuminate\Support\Facades\Http;

class GitHubService
{
    private string $token;
    private string $baseUrl = 'https://api.github.com';

    public function __construct(string $token = null)
    {
        $this->token = $token ?? env('GITHUB_TOKEN', '');
    }

    private function headers(): array
    {
        return [
            'Authorization' => 'Bearer ' . $this->token,
            'Accept' => 'application/vnd.github+json',
            'X-GitHub-Api-Version' => '2022-11-28',
        ];
    }

    public function getOrganizationRepos(string $org): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/orgs/{$org}/repos", ['per_page' => 100]);

        return $response->successful() ? $response->json() : [];
    }

    public function getUserRepos(string $username): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/users/{$username}/repos", ['per_page' => 100]);

        return $response->successful() ? $response->json() : [];
    }

    public function getAuthenticatedUserRepos(): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/user/repos", ['per_page' => 100, 'visibility' => 'all']);

        return $response->successful() ? $response->json() : [];
    }

    public function createRepository(string $name, string $description, bool $private, string $org = null): array
    {
        $endpoint = $org
            ? "{$this->baseUrl}/orgs/{$org}/repos"
            : "{$this->baseUrl}/user/repos";

        $response = Http::withHeaders($this->headers())
            ->post($endpoint, [
                'name' => $name,
                'description' => $description,
                'private' => $private,
            ]);

        return $response->successful() ? $response->json() : [];
    }

    public function addCollaborator(string $owner, string $repo, string $username, string $permission = 'pull'): bool
    {
        $response = Http::withHeaders($this->headers())
            ->put("{$this->baseUrl}/repos/{$owner}/{$repo}/collaborators/{$username}", [
                'permission' => $permission,
            ]);

        return $response->successful();
    }

    public function removeCollaborator(string $owner, string $repo, string $username): bool
    {
        $response = Http::withHeaders($this->headers())
            ->delete("{$this->baseUrl}/repos/{$owner}/{$repo}/collaborators/{$username}");

        return $response->successful();
    }

    public function getRepoInfo(string $owner, string $repo): array
    {
        $response = Http::withHeaders($this->headers())
            ->get("{$this->baseUrl}/repos/{$owner}/{$repo}");

        return $response->successful() ? $response->json() : [];
    }

    public function syncRepositories(): void
    {
        $repos = $this->getAuthenticatedUserRepos();

        foreach ($repos as $repo) {
            Repository::updateOrCreate(
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
        }
    }
}
