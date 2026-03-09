<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Client portal login</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; color: #333; max-width: 560px; margin: 0 auto; padding: 20px; }
        h1 { font-size: 1.25rem; margin-bottom: 1rem; }
        .box { background: #f5f5f5; padding: 12px 16px; border-radius: 8px; margin: 16px 0; font-family: monospace; word-break: break-all; }
        .button { display: inline-block; background: #2563eb; color: #fff !important; padding: 10px 20px; border-radius: 8px; text-decoration: none; margin: 12px 0; }
        .button:hover { opacity: 0.9; }
        .muted { color: #666; font-size: 0.875rem; margin-top: 24px; }
    </style>
</head>
<body>
    <h1>Welcome to your client portal</h1>
    <p>Hi {{ $clientName }},</p>
    <p>You have been set up as a client. Use the details below to sign in to your dashboard and view projects, quotations, and agreements.</p>

    <p><strong>Login URL:</strong></p>
    <p><a href="{{ $loginUrl }}" class="button">{{ $loginUrl }}</a></p>

    <p><strong>Email:</strong></p>
    <div class="box">{{ $email }}</div>

    @if($temporaryPassword)
    <p><strong>Temporary password:</strong></p>
    <div class="box">{{ $temporaryPassword }}</div>
    <p>We recommend changing your password after your first login (use “Forgot password” on the login page if needed).</p>
    @else
    <p>Use your existing password to sign in.</p>
    @endif

    <p class="muted">This is an automated message from {{ config('app.name') }}.</p>
</body>
</html>
