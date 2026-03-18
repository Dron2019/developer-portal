<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->enum('status', ['active', 'development', 'archived', 'on_hold'])->default('development');
            $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('tech_lead_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->json('tech_stack')->nullable();
            $table->string('test_url')->nullable();
            $table->string('staging_url')->nullable();
            $table->string('production_url')->nullable();
            $table->date('started_at')->nullable();
            $table->date('finished_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
