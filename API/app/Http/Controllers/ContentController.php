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

        $promoHeading = SiteContent::getKey('promo_heading') ?? 'Promo Spesial';
        $promoText = SiteContent::getKey('promo_text') ?? '';

        $artikelHeading = SiteContent::getKey('artikel_heading') ?? 'Artikel & Info Medis';
        $artikelText = SiteContent::getKey('artikel_text') ?? '';

        $layananHeading = SiteContent::getKey('layanan_heading') ?? 'Layanan Home Care Kami';
        $layananText = SiteContent::getKey('layanan_text') ?? '';

        $promos = \App\Models\Promo::all();
        $artikels = \App\Models\Artikel::all();
        $kategoriArtikel = \App\Models\KategoriArtikel::all();
        $layanans = \App\Models\Layanan::all();

        $homeBanner2 = SiteContent::getKey('home_banner_2');
        $homeTextBanner2 = SiteContent::getKey('home_text_banner_2');
        $homeDescription2 = SiteContent::getKey('home_description_2');

        $homeBanner3 = SiteContent::getKey('home_banner_3');
        $homeTextBanner3 = SiteContent::getKey('home_text_banner_3');
        $homeDescription3 = SiteContent::getKey('home_description_3');

        $banners = [];

        if ($homeBanner) {
            $banners[] = [
                'id' => 1,
                'image' => $this->formatUrl($homeBanner),
                'title' => $homeTextBanner,
                'description' => $homeDescription,
            ];
        }

        if ($homeBanner2) {
            $banners[] = [
                'id' => 2,
                'image' => $this->formatUrl($homeBanner2),
                'title' => $homeTextBanner2,
                'description' => $homeDescription2,
            ];
        }

        if ($homeBanner3) {
            $banners[] = [
                'id' => 3,
                'image' => $this->formatUrl($homeBanner3),
                'title' => $homeTextBanner3,
                'description' => $homeDescription3,
            ];
        }

        return response()->json([
            'home_banner' => $this->formatUrl($homeBanner),
            'home_text_banner' => $homeTextBanner,
            'home_description' => $homeDescription,

            'promo_heading' => $promoHeading,
            'promo_text' => $promoText,
            'promos' => $promos,

            'artikel_heading' => $artikelHeading,
            'artikel_text' => $artikelText,
            'artikels' => $artikels,
            'kategori_artikel' => $kategoriArtikel,

            'layanan_heading' => $layananHeading,
            'layanan_text' => $layananText,
            'layanans' => $layanans,

            'home_banner_2' => $this->formatUrl($homeBanner2),
            'home_text_banner_2' => $homeTextBanner2,
            'home_description_2' => $homeDescription2,

            'home_banner_3' => $this->formatUrl($homeBanner3),
            'home_text_banner_3' => $homeTextBanner3,
            'home_description_3' => $homeDescription3,

            'banners' => $banners,
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

            'promo_heading' => ['nullable', 'string'],
            'promo_text' => ['nullable', 'string'],

            'artikel_heading' => ['nullable', 'string'],
            'artikel_text' => ['nullable', 'string'],

            'layanan_heading' => ['nullable', 'string'],
            'layanan_text' => ['nullable', 'string'],

            'home_banner_2' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'home_text_banner_2' => ['nullable', 'string'],
            'home_description_2' => ['nullable', 'string'],

            'home_banner_3' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:4096'],
            'home_text_banner_3' => ['nullable', 'string'],
            'home_description_3' => ['nullable', 'string'],
        ]);

        $bannerKeys = ['home_banner', 'home_banner_2', 'home_banner_3'];
        foreach ($bannerKeys as $key) {
            if ($request->hasFile($key)) {
                $oldPath = SiteContent::getKey($key);
                if ($oldPath && !str_starts_with($oldPath, 'http') && Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $request->file($key)->store('content', 'public');
                SiteContent::setKey($key, $path);
            }
        }

        $textFields = [
            'home_text_banner',
            'home_description',
            'promo_heading',
            'promo_text',
            'artikel_heading',
            'artikel_text',
            'layanan_heading',
            'layanan_text',
            'home_text_banner_2',
            'home_description_2',
            'home_text_banner_3',
            'home_description_3',
        ];

        foreach ($textFields as $field) {
            if ($request->has($field)) {
                SiteContent::setKey($field, $request->input($field));
            }
        }

        $homeBanner = SiteContent::getKey('home_banner');

        return response()->json([
            'message' => 'Konten Home berhasil diperbarui',
            'data' => [
                'home_banner' => $this->formatUrl($homeBanner),
                'home_text_banner' => SiteContent::getKey('home_text_banner'),
                'home_description' => SiteContent::getKey('home_description'),
                'promo_heading' => SiteContent::getKey('promo_heading'),
                'promo_text' => SiteContent::getKey('promo_text'),
                'artikel_heading' => SiteContent::getKey('artikel_heading'),
                'artikel_text' => SiteContent::getKey('artikel_text'),
                'layanan_heading' => SiteContent::getKey('layanan_heading'),
                'layanan_text' => SiteContent::getKey('layanan_text'),
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
