<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

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
            try {
                return Crypt::decryptString($setting->value);
            } catch (DecryptException) {
                // Encrypted value is no longer readable (APP_KEY changed or value corrupted).
                // Clear the stale value so the user can re-enter it.
                Log::warning("Setting [{$key}] could not be decrypted — stored value cleared. Re-save the value in Settings.");
                $setting->update(['value' => null]);
                return $default;
            }
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
