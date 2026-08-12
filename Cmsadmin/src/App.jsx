import { Routes, Route, Navigate } from 'react-router-dom';
import LoginAdminCms from './pages/LoginAdminCms';
// import LoginSuperAdmin from './pages/super-admin/loginAdmin';
import LoginSuperAdmin from './pages/LoginAdminCms';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import DataNakes from './pages/admin/DataNakes';
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
import PageNakesRequest from './pages/admin/registerNakes/PageNakesRequest';
import PageNakesRequestDetail from './pages/admin/RegisterNakes/PageNakesRequestDetail';
import PageBooking, { PageBookingDetail } from "./pages/admin/PageBooking";
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import KelolaAdmin from './pages/KelolaAdmin';
import DataUser from './pages/admin/AdminUser';
import DataBarang from './pages/admin/AdminMasterBarang'
import DataMasterTarif from './pages/admin/AdminMasterTarif';
import AdminMasterProvinsi from './pages/admin/AdminMasterProvinsi';
import AdminMasterkotakabupaten from './pages/admin/AdminMasterkotakabupaten';
import AdminMasterKategori from './pages/admin/AdminMasterKategori';
import AdminMasterMetodePembayaran from './pages/admin/AdminMasterMetodePembayaran';
import AdminMasterKategoriPembayaran from './pages/admin/AdminMasterKategoriPembayaran';
import { getUserRoles } from './utils/role';

import 'leaflet/dist/leaflet.css';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginAdminCms />} />
      <Route path="/super-admin/login" element={<LoginSuperAdmin />} />
      <Route path="/admindashboard" element={<Navigate to="/dashboard" replace />} />

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

        {/* Shared Routes */}
        <Route path="/layanan" element={<PageLayanan />} />
        <Route path="/layanan/tambah" element={<FormTambah />} />
        <Route path="/layanan/:id/edit" element={<FormEdit />} />
        <Route path="/promo" element={<PagePromo />} />
        <Route path="/promo/tambah" element={<PromoTambah />} />
        <Route path="/promo/:id_promo/edit" element={<PromoEdit />} />
        <Route path="/artikel" element={<PageArtikel />} />
        <Route path="/artikel/tambah" element={<FormTambahArtikel />} />
        <Route path="/artikel/:id/edit" element={<FormEditArtikel />} />
        <Route path="/kelola-konten" element={<PageKelolaKonten />} />

        {/* Super Admin specific routes (without /admin prefix) */}
        <Route path="/nakes" element={<ProtectedRoute requiredRole="super_admin"><DataNakes /></ProtectedRoute>} />
        <Route path="/nakes/requests" element={<ProtectedRoute requiredRole="super_admin"><PageNakesRequest /></ProtectedRoute>} />
        <Route path="/nakes-request/:id" element={<ProtectedRoute requiredRole="super_admin"><PageNakesRequestDetail /></ProtectedRoute>} />
        <Route path="/booking" element={<ProtectedRoute requiredRole="super_admin"><PageBooking /></ProtectedRoute>} />
        <Route path="/bookings/:id" element={<ProtectedRoute requiredRole="super_admin"><PageBookingDetail /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute requiredRole="super_admin"><DataUser /></ProtectedRoute>} />
        <Route path="/kelola-admin" element={<ProtectedRoute requiredRole="super_admin"><KelolaAdmin /></ProtectedRoute>} />
        
        {/* Master Data */}
        <Route path="/master-barang" element={<ProtectedRoute requiredRole="super_admin"><DataBarang /></ProtectedRoute>} />
        <Route path="/master-tarif" element={<ProtectedRoute requiredRole="super_admin"><DataMasterTarif /></ProtectedRoute>} />
        <Route path="/master-provinsi" element={<ProtectedRoute requiredRole="super_admin"><AdminMasterProvinsi /></ProtectedRoute>} />
        <Route path="/master-kabupaten" element={<ProtectedRoute requiredRole="super_admin"><AdminMasterkotakabupaten /></ProtectedRoute>} />
        <Route path="/master-kategori" element={<ProtectedRoute requiredRole="super_admin"><AdminMasterKategori /></ProtectedRoute>} />
        <Route path="/master-metode-pembayaran" element={<ProtectedRoute requiredRole="super_admin"><AdminMasterMetodePembayaran /></ProtectedRoute>} />
        <Route path="/master-kategori-pembayaran" element={<ProtectedRoute requiredRole="super_admin"><AdminMasterKategoriPembayaran /></ProtectedRoute>} />
      </Route>

      {/* Default redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;