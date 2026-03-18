<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'data' => $n->data,
                'read_at' => $n->read_at?->toISOString(),
                'created_at' => $n->created_at?->toISOString(),
            ]);

        $unread_count = $request->user()->unreadNotifications()->count();

        return response()->json([
            'data' => $notifications,
            'unread_count' => $unread_count,
        ]);
    }

    public function markAsRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->where('id', $id)->first();

        if (!$notification) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }
}
