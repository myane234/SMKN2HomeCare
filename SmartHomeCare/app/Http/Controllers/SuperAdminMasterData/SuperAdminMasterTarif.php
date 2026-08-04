<?php

namespace App\Http\Controllers\SuperAdminMasterData;

use App\Http\Controllers\Controller;
use App\Models\MasterTarif;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperAdminMasterTarif extends Controller
{
    /**
     * Tampilkan semua daftar template Master Tarif beserta item BHP dan layanan terkait
     */
    public function index()
    {
        $masterTarifs = MasterTarif::with(['bhpItems', 'layanans'])->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data Master Tarif',
            'data' => $masterTarifs
        ], 200);
    }

    /**
     * Simpan template Master Tarif baru beserta printilan BHP-nya
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_template' => ['required', 'string', 'max:255'],
            'kategori_tarif' => ['required', 'in:tindakan,waktu'],
            'biaya_admin' => ['required', 'numeric', 'min:0'],
            'persentase_ppn' => ['required', 'numeric', 'min:0', 'max:100'],
            'fee_nakes_persen' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fee_nakes_nominal' => ['nullable', 'numeric', 'min:0'],
            'tarif_transport_per_km' => ['required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            
    
            'bhp_items' => ['nullable', 'array'],
            'bhp_items.*.id_bhp' => ['required_with:bhp_items', 'exists:bhp_items,id_bhp'],
            'bhp_items.*.jumlah_pakai' => ['required_with:bhp_items', 'integer', 'min:1'],
            
        
            'layanans' => ['nullable', 'array'],
            'layanans.*' => ['exists:layanans,id_layanan'],
        ]);

        DB::beginTransaction();
        try {
 
            $masterTarif = MasterTarif::create([
                'nama_template' => $request->nama_template,
                'kategori_tarif' => $request->kategori_tarif,
                'biaya_admin' => $request->biaya_admin,
                'persentase_ppn' => $request->persentase_ppn,
                'fee_nakes_persen' => $request->fee_nakes_persen ?? 0,
                'fee_nakes_nominal' => $request->fee_nakes_nominal ?? 0,
                'tarif_transport_per_km' => $request->tarif_transport_per_km,
                'is_active' => $request->is_active ?? true,
            ]);


            if ($request->has('bhp_items') && !empty($request->bhp_items)) {
                $syncData = [];
                foreach ($request->bhp_items as $item) {
                    $syncData[$item['id_bhp']] = ['jumlah_pakai' => $item['jumlah_pakai']];
                }
                $masterTarif->bhpItems()->sync($syncData);
            }

       
            if ($request->has('layanans') && is_array($request->layanans)) {
                if (!empty($request->layanans)) {
                    \App\Models\Layanan::whereIn('id_layanan', $request->layanans)
                        ->update(['id_master_tarif' => $masterTarif->id_master_tarif]);
                }
            }

            DB::commit();

            $masterTarif->load('bhpItems', 'layanans');

            return response()->json([
                'success' => true,
                'message' => 'Master tarif berhasil ditambahkan',
                'data' => $masterTarif
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan master tarif: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Tampilkan detail template Master Tarif berdasarkan ID
     */
    public function show($id)
    {
        $masterTarif = MasterTarif::with(['bhpItems', 'layanans'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail Master Tarif',
            'data' => $masterTarif
        ], 200);
    }

    /**
     * Update template Master Tarif beserta printilan BHP-nya
     */
    public function update(Request $request, $id)
    {
        $masterTarif = MasterTarif::findOrFail($id);

        $validated = $request->validate([
            'nama_template' => ['sometimes', 'required', 'string', 'max:255'],
            'kategori_tarif' => ['sometimes', 'required', 'in:tindakan,waktu'],
            'biaya_admin' => ['sometimes', 'required', 'numeric', 'min:0'],
            'persentase_ppn' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'fee_nakes_persen' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'fee_nakes_nominal' => ['nullable', 'numeric', 'min:0'],
            'tarif_transport_per_km' => ['sometimes', 'required', 'numeric', 'min:0'],
            'is_active' => ['boolean'],
            

            'bhp_items' => ['nullable', 'array'],
            'bhp_items.*.id_bhp' => ['required_with:bhp_items', 'exists:bhp_items,id_bhp'],
            'bhp_items.*.jumlah_pakai' => ['required_with:bhp_items', 'integer', 'min:1'],

            'layanans' => ['nullable', 'array'],
            'layanans.*' => ['exists:layanans,id_layanan'],
        ]);

        DB::beginTransaction();
        try {
            // Update data utama master tarif
            $masterTarif->update($request->only([
                'nama_template',
                'kategori_tarif',
                'biaya_admin',
                'persentase_ppn',
                'fee_nakes_persen',
                'fee_nakes_nominal',
                'tarif_transport_per_km',
                'is_active'
            ]));

    
            if ($request->has('bhp_items')) {
                $syncData = [];
                if (!empty($request->bhp_items)) {
                    foreach ($request->bhp_items as $item) {
                        $syncData[$item['id_bhp']] = ['jumlah_pakai' => $item['jumlah_pakai']];
                    }
                }
                $masterTarif->bhpItems()->sync($syncData);
            }

        
            if ($request->has('layanans') && is_array($request->layanans)) {
                // Reset existing layanans for this master tarif
                \App\Models\Layanan::where('id_master_tarif', $masterTarif->id_master_tarif)
                    ->update(['id_master_tarif' => null]);
                
                // Assign new layanans
                if (!empty($request->layanans)) {
                    \App\Models\Layanan::whereIn('id_layanan', $request->layanans)
                        ->update(['id_master_tarif' => $masterTarif->id_master_tarif]);
                }
            }

            DB::commit();

  
            $masterTarif->load('bhpItems', 'layanans');

            return response()->json([
                'success' => true,
                'message' => 'Master tarif berhasil diperbarui',
                'data' => $masterTarif
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui master tarif: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Hapus template Master Tarif
     */
    public function destroy($id)
    {
        $masterTarif = MasterTarif::findOrFail($id);
        $masterTarif->delete();

        return response()->json([
            'success' => true,
            'message' => 'Master tarif berhasil dihapus'
        ], 200);
    }
}