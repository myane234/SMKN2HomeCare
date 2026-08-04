<?php

namespace Tests\Feature;

use App\Models\Users;
use App\Models\Role;
use App\Models\Pasien;
use App\Models\Layanan;
use App\Models\Booking;
use App\Models\Transaksi;
use App\Models\TenagaMedis;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BookingChargeTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_booking_charge_forwards_to_midtrans(): void
    {
        // Mock Midtrans API response
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/charge' => Http::response([
                'status_code' => '201',
                'status_message' => 'Success, GTS transaction is created',
                'transaction_id' => 'mock-trans-id-123',
                'order_id' => 'srb-03092600001',
                'gross_amount' => '44000.00',
                'payment_type' => 'gopay',
                'transaction_status' => 'pending',
            ], 201),
        ]);

        $payload = [
            'payment_type' => 'gopay',
            'transaction_details' => [
                'order_id' => 'srb-03092600001',
                'gross_amount' => 44000,
            ],
        ];

        $response = $this->postJson('/api/booking/charge', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status_code', '201')
            ->assertJsonPath('transaction_id', 'mock-trans-id-123')
            ->assertJsonPath('order_id', 'srb-03092600001');

        // Assert that the request was forwarded correctly
        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.sandbox.midtrans.com/v2/charge'
                && $request['payment_type'] === 'gopay'
                && $request['transaction_details']['order_id'] === 'srb-03092600001'
                && $request['transaction_details']['gross_amount'] == 44000;
        });
    }

    public function test_authenticated_booking_intercept_forwards_to_midtrans(): void
    {
        // Mock Midtrans API response
        Http::fake([
            'https://api.sandbox.midtrans.com/v2/charge' => Http::response([
                'status_code' => '201',
                'status_message' => 'Success, GTS transaction is created',
                'transaction_id' => 'mock-trans-id-456',
                'order_id' => 'srb-03092600002',
                'gross_amount' => '44000.00',
                'payment_type' => 'gopay',
                'transaction_status' => 'pending',
            ], 201),
        ]);

        // Create a user and authenticate them via Sanctum
        $role = Role::create(['nama_role' => 'pasien']);
        $user = Users::create([
            'email' => 'pasien@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $user->roles()->attach($role->id_role);

        $this->actingAs($user, 'sanctum');

        $payload = [
            'payment_type' => 'gopay',
            'transaction_details' => [
                'order_id' => 'srb-03092600002',
                'gross_amount' => 44000,
            ],
        ];

        // Access main /api/booking endpoint
        $response = $this->postJson('/api/booking', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('status_code', '201')
            ->assertJsonPath('transaction_id', 'mock-trans-id-456')
            ->assertJsonPath('order_id', 'srb-03092600002');
    }

    public function test_check_status_returns_transaction_status(): void
    {
        $role = Role::create(['nama_role' => 'pasien']);
        $user = Users::create([
            'email' => 'pasien@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $user->roles()->attach($role->id_role);

        $pasien = Pasien::factory()->create([
            'id_user' => $user->id_user,
        ]);

        $nakesRole = Role::create(['nama_role' => 'tenaga medis']);
        $nakesUser = Users::create([
            'email' => 'nakes@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $nakesUser->roles()->attach($nakesRole->id_role);

        $nakesPasien = Pasien::create([
            'id_user' => $nakesUser->id_user,
            'nama_lengkap' => 'Nakes Pasien',
            'nik' => '9876543210987654',
            'jenis_kelamin' => 'L',
            'alamat_utama' => 'Jl. Nakes',
        ]);

        $tenagaMedis = TenagaMedis::create([
            'id_user' => $nakesUser->id_user,
            'id_pasien' => $nakesPasien->id_pasien,
            'nama_lengkap' => 'Nakes Test',
            'nik' => '9876543210987654',
            'jenis_tenaga_medis' => 'Fisioterapi',
            'no_str' => '9876543210987654',
            'foto_profile' => 'fake_nakes.jpg',
            'lulusan' => 'Universitas Indonesia',
            'latitude' => 0.0,
            'longitude' => 0.0,
        ]);

        $layanan = Layanan::create([
            'nama_layanan' => 'Layanan Test',
            'deskripsi_layanan' => 'Deskripsi',
            'kategori_layanan' => 'Kategori',
            'foto_layanan' => 'test.jpg',
            'harga' => 100000,
            'tipe_layanan' => 'tindakan',
            'durasi_menit' => 60,
        ]);

        $booking = Booking::create([
            'booking_code' => 'BOOK-TEST',
            'id_pasien' => $pasien->id_pasien,
            'id_layanan' => $layanan->id_layanan,
            'id_tenaga_medis' => $tenagaMedis->id_tenaga_medis,
            'tanggal_kunjungan' => '2026-08-03',
            'jam_kunjungan' => '10:00:00',
            'alamat_kunjungan' => 'Jl. Test',
            'latitude_kunjungan' => 0.0,
            'longitude_kunjungan' => 0.0,
            'status_booking' => 'Pending',
        ]);

        $transaksi = Transaksi::create([
            'id_booking' => $booking->id_booking,
            'jumlah_total' => 100000,
            'metode_pembayaran' => 'QRIS',
            'status_transaksi' => 'Belum Bayar',
            'sl' => 100000,
            'sb' => 0,
            'st' => 0,
            'ba' => 0,
            'ppn' => 0,
            'persen_ppn' => 0,
            'persen_fee_nakes' => 0,
            'fee_midtrans' => 0,
            'hpp_bhp' => 0,
            'hak_nakes' => 0,
            'profit_hc' => 0,
        ]);

        $this->actingAs($user, 'sanctum');

        $response = $this->getJson("/api/booking/transaksi/{$transaksi->id_transaksi}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id_transaksi', $transaksi->id_transaksi)
            ->assertJsonPath('data.status_transaksi', 'Belum Bayar');
    }
}
