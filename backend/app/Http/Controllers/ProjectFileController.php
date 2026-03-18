<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectFileController extends Controller
{
    public function index(Project $project)
    {
        $files = $project->files()->with('uploader')->latest()->get()->map(function ($file) {
            return [
                'id' => $file->id,
                'name' => $file->name,
                'original_name' => $file->original_name,
                'mime_type' => $file->mime_type,
                'size' => $file->size,
                'type' => $file->type,
                'uploader' => $file->uploader ? [
                    'id' => $file->uploader->id,
                    'name' => $file->uploader->name,
                    'avatar_url' => $file->uploader->avatar_url,
                ] : null,
                'created_at' => $file->created_at,
            ];
        });

        return response()->json(['data' => $files]);
    }

    public function store(Request $request, Project $project)
    {
        $request->validate([
            'file' => 'required|file|max:51200',
            'type' => 'nullable|in:document,specification,protocol,other',
        ]);

        $uploaded = $request->file('file');
        $originalName = $uploaded->getClientOriginalName();
        $name = Str::uuid() . '.' . $uploaded->getClientOriginalExtension();
        $path = $uploaded->storeAs("projects/{$project->id}", $name);

        $file = $project->files()->create([
            'uploaded_by' => $request->user()->id,
            'name' => $name,
            'original_name' => $originalName,
            'path' => $path,
            'mime_type' => $uploaded->getMimeType(),
            'size' => $uploaded->getSize(),
            'type' => $request->input('type', 'other'),
        ]);

        $project->logActivity('file_uploaded', "File '{$originalName}' was uploaded.");

        return response()->json([
            'data' => [
                'id' => $file->id,
                'name' => $file->name,
                'original_name' => $file->original_name,
                'mime_type' => $file->mime_type,
                'size' => $file->size,
                'type' => $file->type,
                'created_at' => $file->created_at,
            ],
        ], 201);
    }

    public function destroy(Project $project, ProjectFile $file)
    {
        abort_unless($file->project_id === $project->id, 404);

        $user = auth()->user();
        abort_unless($user->isAdmin() || $user->isManager() || $file->uploaded_by === $user->id, 403, 'Access denied.');

        Storage::delete($file->path);
        $project->logActivity('file_deleted', "File '{$file->original_name}' was deleted.");
        $file->delete();

        return response()->json(['message' => 'File deleted successfully.']);
    }

    public function download(Project $project, ProjectFile $file)
    {
        abort_unless($file->project_id === $project->id, 404);
        abort_unless(Storage::exists($file->path), 404, 'File not found.');

        return Storage::download($file->path, $file->original_name);
    }
}
