<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Pasien;
use App\Models\Role;
use App\Models\Users;
use App\Models\NakesRequest;
use App\Models\TenagaMedis;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class NakesAuthTest extends TestCase
{
    use RefreshDatabase;

    private $nakesRole;
    private $pasienRole;
    private $adminRole;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        $this->adminRole = Role::create(['nama_role' => 'admin']);
        $this->pasienRole = Role::create(['nama_role' => 'pasien']);
        $this->nakesRole = Role::create(['nama_role' => 'nakes']);
    }

    public function test_nakes_cannot_register_without_login(): void
    {
        $response = $this->postJson('/api/nakes/register', [
            'nik' => '1234567890123456',
            'nama_lengkap' => 'Dr. John Doe',
            'no_str' => '1234567890123456',
            'jenis_tenaga_medis' => 'Dokter',
            'foto_profile' => UploadedFile::fake()->image('profile.jpg'),
        ]);

        $response->assertStatus(401);
    }

    public function test_nakes_cannot_register_without_pasien_profile(): void
    {
        $user = Users::create([
            'email' => 'user@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $user->roles()->attach($this->pasienRole->id_role);

        $this->actingAs($user, 'sanctum');

        $response = $this->postJson('/api/nakes/register', [
            'nik' => '1234567890123456',
            'nama_lengkap' => 'Dr. John Doe',
            'no_str' => '1234567890123456',
            'jenis_tenaga_medis' => 'Dokter',
            'foto_profile' => UploadedFile::fake()->image('profile.jpg'),
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Pendaftaran Nakes gagal. Anda harus terdaftar dan login sebagai Pasien terlebih dahulu.');
    }

    public function test_nakes_registration_validation_errors(): void
    {
        $pasien = Pasien::factory()->create();
        $user = $pasien->user;

        $this->actingAs($user, 'sanctum');

        // Test invalid NIK (less than 16 digits) and invalid STR and missing photo
        $response = $this->postJson('/api/nakes/register', [
            'nik' => '123',
            'nama_lengkap' => '',
            'no_str' => 'abc',
            'jenis_tenaga_medis' => 'Dokter',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nik', 'nama_lengkap', 'no_str', 'foto_profile']);
    }

    public function test_nakes_registration_success_and_admin_approval_flow(): void
    {
        Storage::fake('public');

        // Create user with Pasien profile
        $pasien = Pasien::factory()->create();
        $user = $pasien->user;

        $this->actingAs($user, 'sanctum');

        $registerData = [
            'nik' => '1234567890123456',
            'nama_lengkap' => 'Dr. Jane Doe',
            'no_str' => '1234567890123456',
            'jenis_tenaga_medis' => 'Dokter',
            'foto_profile' => UploadedFile::fake()->image('profile.jpg'),
            'lulusan' => 'Universitas Indonesia',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
        ];

        // 1. Register Nakes
        $response = $this->postJson('/api/nakes/register', $registerData);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.nama_lengkap', 'Dr. Jane Doe');

        $requestId = $response->json('data.nakes_request_id');

        // Assert file is uploaded
        $nakesRequest = NakesRequest::find($requestId);
        $filename = basename($nakesRequest->foto_profile);
        Storage::disk('public')->assertExists('uploads/nakes/' . $filename);

        // 2. Prevent duplicate pending requests
        $duplicateResponse = $this->postJson('/api/nakes/register', $registerData);
        $duplicateResponse->assertStatus(400)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Permohonan pendaftaran Nakes Anda sedang diproses oleh admin. Harap tunggu persetujuan.');

        // Create Admin User
        $admin = Users::create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $admin->roles()->attach($this->adminRole->id_role);

        // Act as Admin
        $this->actingAs($admin, 'sanctum');

        // 3. Admin list pending requests
        $listResponse = $this->getJson('/api/admin/nakes/requests');
        $listResponse->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $requestId);

        // 4. Admin show detail request
        $detailResponse = $this->getJson("/api/admin/nakes/requests/{$requestId}");
        $detailResponse->assertStatus(200)
            ->assertJsonPath('data.id', $requestId);

        // 5. Admin Approve Request
        $approveResponse = $this->postJson("/api/admin/nakes/requests/{$requestId}/approve");
        $approveResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Nakes request berhasil di-approve. Role Nakes diaktifkan.');

        // Assert nakes request updated status
        $this->assertEquals('approved', NakesRequest::find($requestId)->status);

        // Assert TenagaMedis profile is created
        $tenagaMedis = TenagaMedis::where('id_user', $user->id_user)->first();
        $this->assertNotNull($tenagaMedis);
        $this->assertEquals('Dr. Jane Doe', $tenagaMedis->nama_lengkap);
        $this->assertEquals('1234567890123456', $tenagaMedis->nik);
        $this->assertEquals($pasien->id_pasien, $tenagaMedis->id_pasien);

        // Assert role is attached
        $this->assertTrue($user->fresh()->roles()->where('user_roles.id_role', 3)->exists());
    }

    public function test_admin_can_reject_nakes_request(): void
    {
        $pasien = Pasien::factory()->create();
        $user = $pasien->user;

        // Create pending request
        $nakesRequest = NakesRequest::create([
            'id_user' => $user->id_user,
            'id_pasien' => $pasien->id_pasien,
            'nama_lengkap' => 'Dr. Rejected',
            'nik' => '1111222233334444',
            'no_str' => '4444333322221111',
            'jenis_tenaga_medis' => 'Perawat',
            'foto_profile' => '/storage/uploads/nakes/fake.jpg',
            'status' => 'pending',
        ]);

        $admin = Users::create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $admin->roles()->attach($this->adminRole->id_role);

        $this->actingAs($admin, 'sanctum');

        // Reject request without notes (fails validation)
        $rejectResponse = $this->postJson("/api/admin/nakes/requests/{$nakesRequest->id}/reject", []);
        $rejectResponse->assertStatus(422)
            ->assertJsonValidationErrors(['admin_notes']);

        // Reject request with notes
        $rejectResponse = $this->postJson("/api/admin/nakes/requests/{$nakesRequest->id}/reject", [
            'admin_notes' => 'Dokumen STR tidak valid.',
        ]);

        $rejectResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertEquals('rejected', $nakesRequest->fresh()->status);
        $this->assertEquals('Dokumen STR tidak valid.', $nakesRequest->fresh()->admin_notes);
    }

    public function test_super_admin_can_manage_active_nakes_profiles(): void
    {
        $pasien = Pasien::factory()->create();
        $nakesUser = $pasien->user;
        $nakesUser->roles()->attach($this->nakesRole->id_role);

        $tenagaMedis = TenagaMedis::create([
            'id_user' => $nakesUser->id_user,
            'id_pasien' => $pasien->id_pasien,
            'nama_lengkap' => 'Dr. Super Admin Test',
            'nik' => '1234567890123456',
            'jenis_tenaga_medis' => 'Ibu dan Anak',
            'no_str' => '1234567890123456',
            'foto_profile' => '/storage/uploads/nakes/fake.jpg',
            'lulusan' => 'Universitas Indonesia',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
        ]);

        $superAdminUser = Users::create([
            'email' => 'superadmin@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $superAdminUser->roles()->attach($this->adminRole->id_role);
        Admin::create([
            'id_user' => $superAdminUser->id_user,
            'nama_lengkap' => 'Super Admin',
            'tier_admin' => 'Super Admin',
        ]);

        $this->actingAs($superAdminUser, 'sanctum');

        $listResponse = $this->getJson('/api/super-admin/nakes');
        $listResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data');

        $detailResponse = $this->getJson('/api/super-admin/nakes/' . $tenagaMedis->id_tenaga_medis);
        $detailResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id_tenaga_medis', $tenagaMedis->id_tenaga_medis);

        $updateResponse = $this->putJson('/api/super-admin/nakes/' . $tenagaMedis->id_tenaga_medis, [
            'nama_lengkap' => 'Dr. Updated Super Admin',
            'latitude' => -6.300000,
            'longitude' => 106.900000,
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_lengkap', 'Dr. Updated Super Admin');

        $this->assertEquals(-6.300000, $tenagaMedis->fresh()->latitude);
        $this->assertEquals(106.900000, $tenagaMedis->fresh()->longitude);

        $deleteResponse = $this->deleteJson('/api/super-admin/nakes/' . $tenagaMedis->id_tenaga_medis);
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('tenaga_medis', [
            'id_tenaga_medis' => $tenagaMedis->id_tenaga_medis,
        ]);
    }

    public function test_nakes_login_success(): void
    {
        $user = Users::create([
            'email' => 'nakes@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $user->roles()->attach($this->nakesRole->id_role);

        $tenagaMedis = TenagaMedis::create([
            'id_user' => $user->id_user,
            'nama_lengkap' => 'Dr. Jane Doe',
            'nik' => '1234567890123456',
            'jenis_tenaga_medis' => 'Dokter',
            'no_str' => '1234567890123456',
            'foto_profile' => '/storage/uploads/nakes/fake.jpg',
            'lulusan' => 'Universitas Indonesia',
            'latitude' => -6.200000,
            'longitude' => 106.816666,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'nakes@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Berhasil Login')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'roles',
                    'nama',
                    'is_profile_complete',
                    'tenaga_medis'
                ]
            ]);
    }

    public function test_patient_login_success(): void
    {
        $user = Users::create([
            'email' => 'user@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $user->roles()->attach($this->pasienRole->id_role);

        $response = $this->postJson('/api/login', [
            'email' => 'user@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Berhasil Login')
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'token',
                    'roles',
                    'nama',
                    'is_profile_complete'
                ]
            ]);
    }

    public function test_login_fails_for_user_without_roles(): void
    {
        $user = Users::create([
            'email' => 'admin_only@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $user->roles()->attach($this->adminRole->id_role);

        $response = $this->postJson('/api/login', [
            'email' => 'admin_only@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Anda tidak memiliki akses untuk masuk.');
    }
}
