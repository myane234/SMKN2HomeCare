import { Routes, Route, Navigate } from 'react-router-dom';
import LoginAdminCms from './pages/LoginAdminCms';
import LoginSuperAdmin from './pages/LoginAdminCms';
import Dashboard from './pages/Dashboard';
import DataNakes from './pages/admin/DataNakes';
import AdminProfile from './pages/AdminProfile';
import PageLayanan from './pages/PageLayanan';
import PagePromo from './pages/PagePromo';
import FormTambah from './pages/FormTambah';
import FormEdit from './pages/FormEdit';
import PromoTambah from './pages/PromoTambah';
import PromoEdit from './pages/PromoEdit';
import PageArtikel from './pages/PageArtikel';
import FormTambahArtikel from './pages/FormTambahArtikel';
import FormEditArtikel from './pages/FormEditArtikel';
import PageKelolaKonten from './pages/PageKelolaKonten';
import PageKelolaKontenHome from './pages/PageKelolaKontenHome';
import PageKelolaKontenAbout from './pages/PageKelolaKontenAbout';
import PageNakesRequest from './pages/admin/registerNakes/PageNakesRequest';
import PageNakesRequestDetail from './pages/admin/RegisterNakes/PageNakesRequestDetail';
import PageBooking, { PageBookingDetail } from "./pages/admin/PageBooking";
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import KelolaAdmin from './pages/KelolaAdmin';
import KelolaTierAdmin from './pages/KelolaTierAdmin';
import DataUser from './pages/admin/AdminUser';
import DataBarang from './pages/admin/AdminMasterBarang';
import DataMasterTarif from './pages/admin/AdminMasterTarif';
import AdminMasterProvinsi from './pages/admin/AdminMasterProvinsi';
import AdminMasterkotakabupaten from './pages/admin/AdminMasterkotakabupaten';
import AdminMasterKelurahan from './pages/admin/AdminMasterKelurahan';
import AdminMasterKategori from './pages/admin/AdminMasterKategori';

import AdminMasterMetodePembayaran from './pages/admin/AdminMasterMetodePembayaran';
import AdminMasterKategoriPembayaran from './pages/admin/AdminMasterKategoriPembayaran';

import AdminMasterKomponenTarif from './pages/admin/AdminMasterKomponenTarif';
import AdminMasterTarifTransport from './pages/admin/AdminMasterTarifTransport';  
import AdminMasterKecamatan from './pages/admin/AdminMasterKecamatan';

import { getUserRoles } from './utils/role';

import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginAdminCms />} />
      {/* <Route path="/super-admin/login" element={<LoginSuperAdmin />} /> */}
      <Route path="/admindashboard" element={<Navigate to="/dashboard" replace />} />


      {/* Pindahkan rute profile ke sini (di luar AdminLayout) */}
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute requiredPath="/profile">
            <AdminProfile />
          </ProtectedRoute>
        } 
      />
      {/* Main Admin/Super Admin App Layout */}
      <Route
        element={
          
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Shared Dashboard Route */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Content Routes */}
        <Route path="/layanan" element={<ProtectedRoute requiredPath="/layanan"><PageLayanan /></ProtectedRoute>} />
        <Route path="/layanan/tambah" element={<ProtectedRoute requiredPath="/layanan"><FormTambah /></ProtectedRoute>} />
        <Route path="/layanan/:id/edit" element={<ProtectedRoute requiredPath="/layanan"><FormEdit /></ProtectedRoute>} />
        <Route path="/promo" element={<ProtectedRoute requiredPath="/promo"><PagePromo /></ProtectedRoute>} />
        <Route path="/promo/tambah" element={<ProtectedRoute requiredPath="/promo"><PromoTambah /></ProtectedRoute>} />
        <Route path="/promo/:id_promo/edit" element={<ProtectedRoute requiredPath="/promo"><PromoEdit /></ProtectedRoute>} />
        <Route path="/artikel" element={<ProtectedRoute requiredPath="/artikel"><PageArtikel /></ProtectedRoute>} />
        <Route path="/artikel/tambah" element={<ProtectedRoute requiredPath="/artikel"><FormTambahArtikel /></ProtectedRoute>} />
        <Route path="/artikel/:id/edit" element={<ProtectedRoute requiredPath="/artikel"><FormEditArtikel /></ProtectedRoute>} />
        <Route path="/kelola-konten" element={<ProtectedRoute requiredPath="/kelola-konten"><PageKelolaKonten /></ProtectedRoute>} />
        <Route path="/kelola-konten/home" element={<ProtectedRoute requiredPath="/kelola-konten"><PageKelolaKontenHome /></ProtectedRoute>} />
        <Route path="/kelola-konten/about" element={<ProtectedRoute requiredPath="/kelola-konten"><PageKelolaKontenAbout /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute requiredPath="/profile"><AdminProfile /></ProtectedRoute>} />

        {/* Nakes & Bookings */}
        <Route path="/nakes" element={<ProtectedRoute requiredPath="/nakes"><DataNakes /></ProtectedRoute>} />
        <Route path="/nakes/requests" element={<ProtectedRoute requiredPath="/nakes/requests"><PageNakesRequest /></ProtectedRoute>} />
        <Route path="/nakes-request/:id" element={<ProtectedRoute requiredPath="/nakes/requests"><PageNakesRequestDetail /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute requiredPath="/booking"><PageBooking /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute requiredPath="/booking"><PageBookingDetail /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requiredPath="/users"><DataUser /></ProtectedRoute>} />

        {/* Config / Admin & Tier Management */}
        <Route path="/kelola-admin" element={<ProtectedRoute requiredPath="/kelola-admin"><KelolaAdmin /></ProtectedRoute>} />
        <Route path="/tier-admin" element={<ProtectedRoute requiredPath="/tier-admin"><KelolaTierAdmin /></ProtectedRoute>} />
        
        {/* Master Data */}
        <Route path="/master-barang" element={<ProtectedRoute requiredPath="/master-barang"><DataBarang /></ProtectedRoute>} />
        <Route path="/master-tarif" element={<ProtectedRoute requiredPath="/master-tarif"><DataMasterTarif /></ProtectedRoute>} />
        <Route path="/master-provinsi" element={<ProtectedRoute requiredPath="/master-provinsi"><AdminMasterProvinsi /></ProtectedRoute>} />
        <Route path="/master-kabupaten" element={<ProtectedRoute requiredPath="/master-kabupaten"><AdminMasterkotakabupaten /></ProtectedRoute>} />
        <Route path="/master-kelurahan" element={<ProtectedRoute requiredPath="/master-kelurahan"><AdminMasterKelurahan /></ProtectedRoute>} />

        <Route path="/master-komponen-tarif" element={<ProtectedRoute requiredPath="/master-komponen-tarif"><AdminMasterKomponenTarif /></ProtectedRoute>} />
<Route path="/master-tarif-transport" element={<ProtectedRoute requiredPath="/master-tarif-transport"><AdminMasterTarifTransport /></ProtectedRoute>} />
        
        <Route path="/master-kategori" element={<ProtectedRoute requiredPath="/master-kategori"><AdminMasterKategori /></ProtectedRoute>} />
        <Route path="/master-metode-pembayaran" element={<ProtectedRoute requiredPath="/master-metode-pembayaran"><AdminMasterMetodePembayaran /></ProtectedRoute>} />
        <Route path="/master-kategori-pembayaran" element={<ProtectedRoute requiredPath="/master-kategori-pembayaran"><AdminMasterKategoriPembayaran /></ProtectedRoute>} />
        <Route path="/master-kecamatan" element={<ProtectedRoute requiredPath="/master-kecamatan"><AdminMasterKecamatan /></ProtectedRoute>} />
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;