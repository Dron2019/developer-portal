<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ProjectServerController extends Controller
{
    public function index(int $projectId)
    {
        return response()->json(['message' => 'ok']);
    }

    public function store(Request $request, int $projectId)
    {
        return response()->json(['message' => 'ok']);
    }
}
