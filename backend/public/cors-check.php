<?php
/**
 * CORS check: confirms the server is the Vsparkz backend and sends CORS headers.
 * Open http://localhost:8000/cors-check.php in browser – you should see "CORS OK".
 * If you get 404 or a different page, you are NOT running the backend from backend/public.
 */
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: text/plain');
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}
echo 'CORS OK - backend is running from backend/public';
