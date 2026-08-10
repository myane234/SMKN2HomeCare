<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use App\Models\Artikel;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('artikel:fix-image-urls', function () {
    $baseUrl = rtrim(config('app.url', 'https://citra.faaruq.com'), '/');
    $updated = 0;

    foreach (Artikel::all() as $artikel) {
        $changed = false;
        $html = $artikel->isi_artikel;

        if (!empty($html)) {
            $fixed = preg_replace_callback(
                '/<img\s+([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>/i',
                function ($matches) use ($baseUrl) {
                    $src = $matches[2];
                    $normalized = $src;

                    if (preg_match('/^(https?:)?\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//i', $src)) {
                        $normalized = preg_replace('/^(https?:)?\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i', '', $src);
                    }

                    if (preg_match('/\/storage\//i', $normalized)) {
                        $normalized = preg_replace('/^\/+/', '/', $normalized);
                        $normalized = rtrim($baseUrl, '/') . $normalized;
                    } elseif (preg_match('/^\/?(uploads|artikel|images|storage)\//i', $normalized)) {
                        $normalized = rtrim($baseUrl, '/') . '/' . ltrim($normalized, '/');
                        if (!str_contains($normalized, '/storage/')) {
                            $normalized = preg_replace('#^https?://[^/]+#i', '', $normalized);
                            $normalized = rtrim($baseUrl, '/') . '/storage/' . ltrim($normalized, '/');
                        }
                    }

                    return '<img ' . $matches[1] . 'src="' . $normalized . '"' . $matches[3] . '>';
                },
                $html
            );

            if ($fixed !== null && $fixed !== $html) {
                $artikel->isi_artikel = $fixed;
                $changed = true;
            }
        }

        if (!empty($artikel->gambar_artikel) && preg_match('/^(https?:)?\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?\//i', $artikel->gambar_artikel)) {
            $normalized = preg_replace('/^(https?:)?\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?/i', '', $artikel->gambar_artikel);
            if (preg_match('/\/storage\//i', $normalized)) {
                $artikel->gambar_artikel = rtrim($baseUrl, '/') . $normalized;
            } else {
                $artikel->gambar_artikel = rtrim($baseUrl, '/') . '/storage/' . ltrim($normalized, '/');
            }
            $changed = true;
        }

        if ($changed) {
            $artikel->save();
            $updated++;
        }
    }

    $this->info('Artikel image URLs fixed: ' . $updated . ' record(s) updated.');
})->purpose('Normalize broken localhost storage URLs inside article content and cover images');
