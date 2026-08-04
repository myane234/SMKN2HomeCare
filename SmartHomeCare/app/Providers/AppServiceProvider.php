<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        
        VerifyEmail::createUrlUsing(function (object $notifiable) {
            $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
            
         
            $backendVerifyUrl = URL::temporarySignedRoute(
                'verification.verify',
                now()->addMinutes(60), // Link berlaku 60 menit
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );

            // Balikkan URL yang mengarah ke halaman Next.js verify-email
            return $frontendUrl . '/auth/verify-email?verify_url=' . urlencode($backendVerifyUrl);
        });
    }
}