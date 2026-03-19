<?php

namespace App\Http\Controllers;

use App\Http\Resources\RepositoryRequestResource;
use App\Models\Repository;
use App\Models\RepositoryRequest;
use App\Models\User;
use App\Notifications\NewRepositoryRequestNotification;
use App\Notifications\RepositoryRequestReviewedNotification;
use App\Services\GitHubService;
use App\Services\WebhookService;
use Illuminate\Http\Request;

class RepositoryRequestController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = RepositoryRequest::with(['user', 'repository', 'reviewer']);

        if (in_array($user->role, ['admin', 'manager'])) {
            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }
        } else {
            $query->forUser($user->id);
        }

        $requests = $query->latest()->paginate(20);

        return RepositoryRequestResource::collection($requests);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:access,create',
            'reason' => 'required|string|min:10',
            'repository_id' => 'required_if:type,access|nullable|exists:repositories,id',
            'repository_name' => 'required_if:type,create|nullable|string|max:255',
            'repository_description' => 'nullable|string',
            'repository_private' => 'nullable|boolean',
        ]);

        $user = $request->user();

        if ($data['type'] === 'access' && isset($data['repository_id'])) {
            $exists = RepositoryRequest::where('user_id', $user->id)
                ->where('repository_id', $data['repository_id'])
                ->where('status', 'pending')
                ->exists();

            if ($exists) {
                return response()->json([
                    'message' => 'You already have a pending request for this repository.',
                ], 422);
            }
        }

        $repositoryRequest = RepositoryRequest::create([
            'user_id' => $user->id,
            'type' => $data['type'],
            'reason' => $data['reason'],
            'repository_id' => $data['repository_id'] ?? null,
            'repository_name' => $data['repository_name'] ?? null,
            'repository_description' => $data['repository_description'] ?? null,
            'repository_private' => $data['repository_private'] ?? null,
            'status' => 'pending',
        ]);

        $admins = User::whereIn('role', ['admin', 'manager'])->get();
        foreach ($admins as $admin) {
            $admin->notify(new NewRepositoryRequestNotification($repositoryRequest));
        }

        (new WebhookService())->sendRepositoryRequestCreated(
            $repositoryRequest->load(['user', 'repository'])
        );

        return new RepositoryRequestResource($repositoryRequest->load(['user', 'repository', 'reviewer']));
    }

    public function show(Request $request, RepositoryRequest $repositoryRequest)
    {
        $user = $request->user();

        if (!in_array($user->role, ['admin', 'manager']) && $repositoryRequest->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return new RepositoryRequestResource($repositoryRequest->load(['user', 'repository', 'reviewer']));
    }

    public function update(Request $request, RepositoryRequest $repositoryRequest)
    {
        $data = $request->validate([
            'status' => 'required|in:approved,rejected',
            'admin_comment' => 'nullable|string',
        ]);

        if ($repositoryRequest->status !== 'pending') {
            return response()->json(['message' => 'This request has already been reviewed.'], 422);
        }

        $reviewer = $request->user();

        if ($data['status'] === 'approved') {
            $githubService = new GitHubService();
            $org = env('GITHUB_ORG');

            if ($repositoryRequest->type === 'access' && $repositoryRequest->repository) {
                $repo = $repositoryRequest->repository;
                $fullName = $repo->full_name ?? '';
                $parts = explode('/', $fullName, 2);
                $owner = (isset($parts[0]) && $parts[0] !== '') ? $parts[0] : $org;
                $repoName = $parts[1] ?? $repo->name;
                $username = $repositoryRequest->user->github_nickname;

                if (empty($username)) {
                    return response()->json([
                        'message' => 'Cannot send GitHub invitation: the user has no GitHub username linked to their account.',
                    ], 422);
                }

                $result = $githubService->addCollaborator($owner, $repoName, $username);

                if (!$result['success']) {
                    return response()->json([
                        'message' => 'Failed to send GitHub collaboration invitation.',
                        'github_error' => $result['error'],
                        'github_status' => $result['status'],
                        'debug' => [
                            'owner'    => $owner,
                            'repo'     => $repoName,
                            'username' => $username,
                        ],
                    ], 502);
                }
            }

            if ($repositoryRequest->type === 'create') {
                $repoData = $githubService->createRepository(
                    $repositoryRequest->repository_name,
                    $repositoryRequest->repository_description ?? '',
                    (bool) $repositoryRequest->repository_private,
                    $org
                );

                if (!empty($repoData)) {
                    $localRepo = Repository::updateOrCreate(
                        ['github_id' => $repoData['id']],
                        [
                            'name'              => $repoData['name'],
                            'full_name'         => $repoData['full_name'],
                            'description'       => $repoData['description'] ?? null,
                            'private'           => $repoData['private'] ?? false,
                            'html_url'          => $repoData['html_url'],
                            'clone_url'         => $repoData['clone_url'] ?? null,
                            'default_branch'    => $repoData['default_branch'] ?? 'main',
                            'language'          => $repoData['language'] ?? null,
                            'stars_count'       => 0,
                            'forks_count'       => 0,
                            'open_issues_count' => 0,
                            'last_synced_at'    => now(),
                        ]
                    );

                    // Link the request to the newly created repository
                    $repositoryRequest->update(['repository_id' => $localRepo->id]);

                    // Invite the requester as a collaborator on the new repo
                    $username = $repositoryRequest->user->github_nickname;

                    if (!empty($username)) {
                        $repoOwner = $org ?? explode('/', $repoData['full_name'])[0];
                        $githubService->addCollaborator($repoOwner, $repoData['name'], $username);
                    }
                }
            }
        }

        $repositoryRequest->update([
            'status' => $data['status'],
            'admin_comment' => $data['admin_comment'] ?? null,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
        ]);

        $repositoryRequest->user->notify(new RepositoryRequestReviewedNotification($repositoryRequest));

        return new RepositoryRequestResource($repositoryRequest->load(['user', 'repository', 'reviewer']));
    }

    public function destroy(Request $request, RepositoryRequest $repositoryRequest)
    {
        $user = $request->user();

        $isAdminOrManager = $user->isAdmin() || $user->isManager();

        if (!$isAdminOrManager && $repositoryRequest->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$isAdminOrManager && $repositoryRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be deleted.'], 422);
        }

        $repositoryRequest->delete();

        return response()->json(['message' => 'Request deleted successfully.']);
    }
}

