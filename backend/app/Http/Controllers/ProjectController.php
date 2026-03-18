<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index()
    {
        return response()->json(['message' => 'ok']);
    }

    public function store(Request $request)
    {
        return response()->json(['message' => 'ok']);
    }

    public function show(int $id)
    {
        return response()->json(['message' => 'ok']);
    }

    public function update(Request $request, int $id)
    {
        return response()->json(['message' => 'ok']);
    }

    public function destroy(int $id)
    {
        return response()->json(['message' => 'ok']);
    }
}
