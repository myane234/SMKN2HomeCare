<?php

namespace App\Http\Controllers;

use App\Models\SiteContent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ContentController extends Controller
{
    /**
     * Helper to format image value to full URL if present
     */
    private function formatUrl(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return url('storage/' . $value);
    }

    /**
     * GET /api/resource/content/home
     */
    public function getHome()
    {
        $homeBanner = SiteContent::getKey('home_banner');
        $homeTextBanner = SiteContent::getKey('home_text_banner');
        $homeDescription = SiteContent::getKey('home_description');

        return response()->json([
            'home_banner' => $this->formatUrl($homeBanner),
            'home_text_banner' => $homeTextBanner,
            'home_description' => $homeDescription,
        ], 200);
    }

    /**
     * POST /api/resource/content/home
     */
    public function updateHome(Request $request)
    {
        $request->validate([
            'home_banner' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'home_text_banner' => ['nullable', 'string'],
            'home_description' => ['nullable', 'string'],
        ]);

        if ($request->hasFile('home_banner')) {
            $oldPath = SiteContent::getKey('home_banner');
            if ($oldPath && !str_starts_with($oldPath, 'http') && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('home_banner')->store('content', 'public');
            SiteContent::setKey('home_banner', $path);
        }

        if ($request->has('home_text_banner')) {
            SiteContent::setKey('home_text_banner', $request->input('home_text_banner'));
        }

        if ($request->has('home_description')) {
            SiteContent::setKey('home_description', $request->input('home_description'));
        }

        $homeBanner = SiteContent::getKey('home_banner');
        $homeTextBanner = SiteContent::getKey('home_text_banner');
        $homeDescription = SiteContent::getKey('home_description');

        return response()->json([
            'message' => 'Konten Home berhasil diperbarui',
            'data' => [
                'home_banner' => $this->formatUrl($homeBanner),
                'home_text_banner' => $homeTextBanner,
                'home_description' => $homeDescription,
            ],
        ], 200);
    }

    /**
     * GET /api/resource/content/about
     */
    public function getAbout()
    {
        return response()->json([
            'about_banner' => $this->formatUrl(SiteContent::getKey('about_banner')),
            'about_text_banner' => SiteContent::getKey('about_text_banner'),
            'about_description_text' => SiteContent::getKey('about_description_text'),
            'about_description_image' => $this->formatUrl(SiteContent::getKey('about_description_image')),
            'visi_misi' => SiteContent::getKey('visi_misi'),
            'cara_kerja' => SiteContent::getKey('cara_kerja'),
            'wilayah_layanan' => SiteContent::getKey('wilayah_layanan'),
            'komitmen' => SiteContent::getKey('komitmen'),
        ], 200);
    }

    /**
     * POST /api/resource/content/about
     */
    public function updateAbout(Request $request)
    {
        $request->validate([
            'about_banner' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'about_text_banner' => ['nullable', 'string'],
            'about_description_text' => ['nullable', 'string'],
            'about_description_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'visi_misi' => ['nullable', 'string'],
            'cara_kerja' => ['nullable', 'string'],
            'wilayah_layanan' => ['nullable', 'string'],
            'komitmen' => ['nullable', 'string'],
        ]);

        if ($request->hasFile('about_banner')) {
            $oldPath = SiteContent::getKey('about_banner');
            if ($oldPath && !str_starts_with($oldPath, 'http') && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('about_banner')->store('content', 'public');
            SiteContent::setKey('about_banner', $path);
        }

        if ($request->hasFile('about_description_image')) {
            $oldPath = SiteContent::getKey('about_description_image');
            if ($oldPath && !str_starts_with($oldPath, 'http') && Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
            $path = $request->file('about_description_image')->store('content', 'public');
            SiteContent::setKey('about_description_image', $path);
        }

        $textFields = [
            'about_text_banner',
            'about_description_text',
            'visi_misi',
            'cara_kerja',
            'wilayah_layanan',
            'komitmen',
        ];

        foreach ($textFields as $field) {
            if ($request->has($field)) {
                SiteContent::setKey($field, $request->input($field));
            }
        }

        return response()->json([
            'message' => 'Konten Tentang Kami berhasil diperbarui',
            'data' => [
                'about_banner' => $this->formatUrl(SiteContent::getKey('about_banner')),
                'about_text_banner' => SiteContent::getKey('about_text_banner'),
                'about_description_text' => SiteContent::getKey('about_description_text'),
                'about_description_image' => $this->formatUrl(SiteContent::getKey('about_description_image')),
                'visi_misi' => SiteContent::getKey('visi_misi'),
                'cara_kerja' => SiteContent::getKey('cara_kerja'),
                'wilayah_layanan' => SiteContent::getKey('wilayah_layanan'),
                'komitmen' => SiteContent::getKey('komitmen'),
            ],
        ], 200);
    }
}
