<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectNote;
use Illuminate\Http\Request;

class ProjectNoteController extends Controller
{
    public function index(Project $project)
    {
        $notes = $project->notes()->with('author')->latest()->get()->map(function ($note) {
            return [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'author' => $note->author ? [
                    'id' => $note->author->id,
                    'name' => $note->author->name,
                    'avatar_url' => $note->author->avatar_url,
                ] : null,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
            ];
        });

        return response()->json(['data' => $notes]);
    }

    public function store(Request $request, Project $project)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $note = $project->notes()->create([
            'author_id' => $request->user()->id,
            'title' => $validated['title'],
            'content' => $validated['content'],
        ]);

        $note->load('author');

        $project->logActivity('note_created', "Note '{$note->title}' was created.");

        return response()->json([
            'data' => [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'author' => $note->author ? [
                    'id' => $note->author->id,
                    'name' => $note->author->name,
                    'avatar_url' => $note->author->avatar_url,
                ] : null,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
            ],
        ], 201);
    }

    public function update(Request $request, Project $project, ProjectNote $note)
    {
        abort_unless($note->project_id === $project->id, 404);

        $user = $request->user();
        abort_unless($user->isAdmin() || $note->author_id === $user->id, 403, 'Access denied.');

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
        ]);

        $note->update($validated);

        return response()->json([
            'data' => [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
            ],
        ]);
    }

    public function destroy(Project $project, ProjectNote $note)
    {
        abort_unless($note->project_id === $project->id, 404);

        $user = auth()->user();
        abort_unless($user->isAdmin() || $note->author_id === $user->id, 403, 'Access denied.');

        $project->logActivity('note_deleted', "Note '{$note->title}' was deleted.");
        $note->delete();

        return response()->json(['message' => 'Note deleted successfully.']);
    }

    public function show(Project $project, ProjectNote $note)
    {
        abort_unless($note->project_id === $project->id, 404);

        $note->load('author');

        return response()->json([
            'data' => [
                'id' => $note->id,
                'title' => $note->title,
                'content' => $note->content,
                'author' => $note->author ? [
                    'id' => $note->author->id,
                    'name' => $note->author->name,
                    'avatar_url' => $note->author->avatar_url,
                ] : null,
                'created_at' => $note->created_at,
                'updated_at' => $note->updated_at,
            ],
        ]);
    }
}
