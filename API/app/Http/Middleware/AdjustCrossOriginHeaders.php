<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdjustCrossOriginHeaders
{
    /**
     * Handle an incoming request and adjust COOP/COEP headers to avoid
     * blocking window.postMessage between dev frontends and auth popups.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Allow popups to communicate back to opener while keeping reasonable
        // isolation for same-origin pages. This helps with OAuth popups.
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

        // Do not enable strict COEP unless you intentionally use cross-origin
        // isolated features. Ensure it's not present here.
        if ($response->headers->has('Cross-Origin-Embedder-Policy')) {
            $response->headers->remove('Cross-Origin-Embedder-Policy');
        }

        return $response;
    }
}
