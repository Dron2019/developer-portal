<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        return response()->json(['message' => 'ok']);
    }

    public function login(Request $request)
    {
        return response()->json(['message' => 'ok']);
    }

    public function logout(Request $request)
    {
        return response()->json(['message' => 'ok']);
    }

    public function me(Request $request)
    {
        return response()->json(['message' => 'ok']);
    }

    public function githubRedirect()
    {
        return response()->json(['message' => 'ok']);
    }

    public function githubCallback()
    {
        return response()->json(['message' => 'ok']);
    }
}
