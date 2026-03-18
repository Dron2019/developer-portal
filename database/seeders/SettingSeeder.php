<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        Setting::firstOrCreate(['key' => 'github_token'], ['value' => null, 'is_encrypted' => true]);
        Setting::firstOrCreate(['key' => 'github_org'],   ['value' => null, 'is_encrypted' => false]);
    }
}
