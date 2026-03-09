<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response;

class OAuthController extends Controller
{
    /**
     * Redirect to Google. GET /api/auth/google
     */
    public function redirectToGoogle(Request $request): RedirectResponse|Response
    {
        $redirectUri = $request->query('redirect_uri'); // frontend URL to receive token
        if ($redirectUri) {
            session(['oauth_redirect_uri' => $redirect_uri]);
        }
        if (! config('services.google.client_id')) {
            return response()->json(['message' => 'Google OAuth not configured'], 501);
        }
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Handle Google callback. GET /api/auth/google/callback
     */
    public function handleGoogleCallback(Request $request): RedirectResponse|Response
    {
        if (! config('services.google.client_id')) {
            return response()->json(['message' => 'Google OAuth not configured'], 501);
        }
        try {
            $oauthUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return $this->redirectWithError('Google login failed.');
        }
        $user = $this->findOrCreateUser($oauthUser->getEmail(), $oauthUser->getName(), 'google', $oauthUser->getId());
        $token = $user->createToken('auth-token')->plainTextToken;
        return $this->redirectWithToken($token);
    }

    /**
     * Redirect to Facebook. GET /api/auth/facebook
     */
    public function redirectToFacebook(Request $request): RedirectResponse|Response
    {
        $redirectUri = $request->query('redirect_uri');
        if ($redirectUri) {
            session(['oauth_redirect_uri' => $redirectUri]);
        }
        if (! config('services.facebook.client_id')) {
            return response()->json(['message' => 'Facebook OAuth not configured'], 501);
        }
        return Socialite::driver('facebook')->stateless()->redirect();
    }

    /**
     * Handle Facebook callback. GET /api/auth/facebook/callback
     */
    public function handleFacebookCallback(Request $request): RedirectResponse|Response
    {
        if (! config('services.facebook.client_id')) {
            return response()->json(['message' => 'Facebook OAuth not configured'], 501);
        }
        try {
            $oauthUser = Socialite::driver('facebook')->stateless()->user();
        } catch (\Throwable $e) {
            return $this->redirectWithError('Facebook login failed.');
        }
        $user = $this->findOrCreateUser($oauthUser->getEmail() ?? $oauthUser->getId() . '@facebook.id', $oauthUser->getName(), 'facebook', $oauthUser->getId());
        $token = $user->createToken('auth-token')->plainTextToken;
        return $this->redirectWithToken($token);
    }

    private function findOrCreateUser(string $email, string $name, string $provider, string $providerId): User
    {
        $user = User::where('email', $email)->first();
        if ($user) {
            return $user;
        }
        $user = User::create([
            'name' => $name ?: explode('@', $email)[0],
            'email' => $email,
            'password' => bcrypt(str()->random(32)),
            'role' => 'client',
        ]);
        $role = Role::where('slug', 'client')->first();
        if ($role) {
            $user->roles()->sync([$role->id]);
        }
        return $user;
    }

    private function redirectWithToken(string $token): RedirectResponse
    {
        $base = session('oauth_redirect_uri', env('FRONTEND_URL', 'http://localhost:5174'));
        $separator = str_contains($base, '?') ? '&' : '?';
        return redirect($base . $separator . 'token=' . urlencode($token) . '&oauth=1');
    }

    private function redirectWithError(string $message): RedirectResponse
    {
        $base = session('oauth_redirect_uri', env('FRONTEND_URL', 'http://localhost:5174'));
        $separator = str_contains($base, '?') ? '&' : '?';
        return redirect($base . $separator . 'oauth_error=' . urlencode($message));
    }
}
