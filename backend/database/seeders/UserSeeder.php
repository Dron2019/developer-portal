<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@devportal.local'],
            [
                'name' => 'Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'manager@devportal.local'],
            [
                'name' => 'Manager',
                'password' => Hash::make('password'),
                'role' => 'manager',
                'is_active' => true,
            ]
        );

        User::firstOrCreate(
            ['email' => 'developer@devportal.local'],
            [
                'name' => 'Developer',
                'password' => Hash::make('password'),
                'role' => 'developer',
                'is_active' => true,
            ]
        );
    }
}
