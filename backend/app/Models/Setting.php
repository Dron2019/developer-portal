<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class Setting extends Model
{
    protected $fillable = ['key', 'value', 'is_encrypted'];

    protected $casts = [
        'is_encrypted' => 'boolean',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if (!$setting) {
            return $default;
        }

        if ($setting->is_encrypted && $setting->value !== null) {
            return Crypt::decryptString($setting->value);
        }

        return $setting->value;
    }

    public static function set(string $key, mixed $value, bool $encrypted = false): void
    {
        $stored = $encrypted && $value !== null ? Crypt::encryptString($value) : $value;

        static::updateOrCreate(
            ['key' => $key],
            ['value' => $stored, 'is_encrypted' => $encrypted]
        );
    }
}
