<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', '*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173,http://citra.faaruq.com,https://citra.faaruq.com'))))),

    'allowed_origins_patterns' => array_values(array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS_PATTERNS', '^https?://(localhost|127\\.0\\.0\\.1)(:\\d+)?$,^https://([a-z0-9-]+\\.)?citra\\.faaruq\\.com$'))))),

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Content-Type',
        'X-Total-Count',
        'X-Request-Id',
    ],

    'max_age' => 86400,

    'supports_credentials' => true,

];
