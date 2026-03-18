<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repositories', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('github_id')->unsigned()->unique()->nullable();
            $table->string('name');
            $table->string('full_name')->unique();
            $table->text('description')->nullable();
            $table->boolean('private')->default(false);
            $table->string('html_url');
            $table->string('clone_url')->nullable();
            $table->string('default_branch')->default('main');
            $table->string('language')->nullable();
            $table->integer('stars_count')->default(0);
            $table->integer('forks_count')->default(0);
            $table->integer('open_issues_count')->default(0);
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->timestamp('last_synced_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repositories');
    }
};
