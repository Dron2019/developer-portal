<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repository_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('repository_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('type', ['access', 'create']);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('reason');
            $table->string('repository_name')->nullable();
            $table->text('repository_description')->nullable();
            $table->boolean('repository_private')->nullable();
            $table->text('admin_comment')->nullable();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repository_requests');
    }
};
