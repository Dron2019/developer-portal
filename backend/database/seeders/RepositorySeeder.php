<?php

namespace Database\Seeders;

use App\Models\Repository;
use Illuminate\Database\Seeder;

class RepositorySeeder extends Seeder
{
    public function run(): void
    {
        $repos = [
            [
                'name' => 'developer-portal',
                'full_name' => 'org/developer-portal',
                'description' => 'Developer Portal — manage GitHub repositories, projects, server access and team permissions',
                'private' => false,
                'html_url' => 'https://github.com/org/developer-portal',
                'clone_url' => 'https://github.com/org/developer-portal.git',
                'default_branch' => 'main',
                'language' => 'PHP',
                'stars_count' => 5,
                'forks_count' => 2,
                'open_issues_count' => 3,
            ],
            [
                'name' => 'laravel-api',
                'full_name' => 'org/laravel-api',
                'description' => 'RESTful API built with Laravel 11',
                'private' => false,
                'html_url' => 'https://github.com/org/laravel-api',
                'clone_url' => 'https://github.com/org/laravel-api.git',
                'default_branch' => 'main',
                'language' => 'PHP',
                'stars_count' => 12,
                'forks_count' => 4,
                'open_issues_count' => 1,
            ],
            [
                'name' => 'react-frontend',
                'full_name' => 'org/react-frontend',
                'description' => 'React + Vite frontend application',
                'private' => false,
                'html_url' => 'https://github.com/org/react-frontend',
                'clone_url' => 'https://github.com/org/react-frontend.git',
                'default_branch' => 'main',
                'language' => 'JavaScript',
                'stars_count' => 8,
                'forks_count' => 3,
                'open_issues_count' => 2,
            ],
            [
                'name' => 'mobile-app',
                'full_name' => 'org/mobile-app',
                'description' => 'Cross-platform mobile application',
                'private' => true,
                'html_url' => 'https://github.com/org/mobile-app',
                'clone_url' => 'https://github.com/org/mobile-app.git',
                'default_branch' => 'main',
                'language' => 'TypeScript',
                'stars_count' => 3,
                'forks_count' => 1,
                'open_issues_count' => 5,
            ],
            [
                'name' => 'data-service',
                'full_name' => 'org/data-service',
                'description' => 'Data processing microservice',
                'private' => true,
                'html_url' => 'https://github.com/org/data-service',
                'clone_url' => 'https://github.com/org/data-service.git',
                'default_branch' => 'main',
                'language' => 'Python',
                'stars_count' => 2,
                'forks_count' => 0,
                'open_issues_count' => 0,
            ],
        ];

        foreach ($repos as $index => $repo) {
            Repository::firstOrCreate(
                ['full_name' => $repo['full_name']],
                array_merge($repo, [
                    'github_id' => 1000 + $index,
                ])
            );
        }
    }
}
