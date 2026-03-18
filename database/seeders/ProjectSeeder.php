<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@devportal.local')->first();
        $manager = User::where('email', 'manager@devportal.local')->first();
        $developer = User::where('email', 'developer@devportal.local')->first();

        if (!$admin) {
            return;
        }

        $project1 = Project::firstOrCreate(
            ['slug' => 'developer-portal'],
            [
                'name' => 'Developer Portal',
                'description' => 'Internal developer portal for managing repositories, projects and team access.',
                'status' => 'active',
                'owner_id' => $admin->id,
                'tech_stack' => ['Laravel', 'React', 'PostgreSQL'],
                'started_at' => '2024-01-01',
            ]
        );

        $project1->members()->syncWithoutDetaching([
            $admin->id => ['role' => 'owner', 'joined_at' => now()],
        ]);

        if ($manager) {
            $project1->members()->syncWithoutDetaching([
                $manager->id => ['role' => 'manager', 'joined_at' => now()],
            ]);
        }

        if ($developer) {
            $project1->members()->syncWithoutDetaching([
                $developer->id => ['role' => 'developer', 'joined_at' => now()],
            ]);
        }

        $project2 = Project::firstOrCreate(
            ['slug' => 'mobile-app'],
            [
                'name' => 'Mobile App',
                'description' => 'Cross-platform mobile application built with React Native.',
                'status' => 'development',
                'owner_id' => $admin->id,
                'tech_stack' => ['React Native', 'Laravel API'],
                'started_at' => '2024-03-01',
            ]
        );

        $project2->members()->syncWithoutDetaching([
            $admin->id => ['role' => 'owner', 'joined_at' => now()],
        ]);

        if ($developer) {
            $project2->members()->syncWithoutDetaching([
                $developer->id => ['role' => 'developer', 'joined_at' => now()],
            ]);
        }

        $project3 = Project::firstOrCreate(
            ['slug' => 'landing-page'],
            [
                'name' => 'Landing Page',
                'description' => 'Corporate landing page.',
                'status' => 'archived',
                'owner_id' => $admin->id,
                'tech_stack' => ['Vue.js', 'Nginx'],
                'started_at' => '2023-06-01',
                'finished_at' => '2023-12-01',
            ]
        );

        $project3->members()->syncWithoutDetaching([
            $admin->id => ['role' => 'owner', 'joined_at' => now()],
        ]);
    }
}
