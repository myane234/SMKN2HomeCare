<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Pastikan Sanctum middleware di prepend untuk stateful guard
        // $middleware->api(prepend: [
        //     \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        // ]);
        $middleware->statefulApi();
        
        // Append CORS middleware untuk API routes and adjust COOP headers
        $middleware->api(append: [
            \Illuminate\Http\Middleware\HandleCors::class,
            \App\Http\Middleware\AdjustCrossOriginHeaders::class,
        ]);
        
        $middleware->trustProxies(at: '*');
        
        // Register route middleware untuk role checking
        $middleware->alias([
            'role' => \App\Http\Middleware\CheckRole::class,
        ]);
        
        $middleware->validateCsrfTokens(except: [
            'api/login',
            'api/googleAuth',
            'api/register',
            'api/pasien/complete-profile',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
