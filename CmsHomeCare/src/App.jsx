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
import { getUserRoles } from './utils/role';

import 'leaflet/dist/leaflet.css';

function RootRedirect() {
  const userRoles = getUserRoles();
  if (userRoles.includes('super_admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginAdminCms />} />
      <Route path="/super-admin/login" element={<LoginSuperAdmin />} />
      <Route path="/admindashboard" element={<RootRedirect />} />

      {/* Admin Biasa only routes */}
      <Route
        element={
          <ProtectedRoute excludeSuperAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/layanan" element={<PageLayanan />} />
        <Route path="/layanan/tambah" element={<FormTambah />} />
        <Route path="/layanan/:id/edit" element={<FormEdit />} />
        <Route path="/promo" element={<PagePromo />} />
        <Route path="/promo/tambah" element={<PromoTambah />} />
        <Route path="/promo/:id_promo/edit" element={<PromoEdit />} />
        <Route path="/artikel" element={<PageArtikel />} />
        <Route path="/artikel/tambah" element={<FormTambahArtikel />} />
        <Route path="/artikel/:id/edit" element={<FormEditArtikel />} />
      </Route>

      {/* Super Admin only routes */}
      <Route
        element={
          <ProtectedRoute requiredRole="super_admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/nakes" element={<DataNakes />} />
        <Route path="/admin/nakes/requests" element={<PageNakesRequest />} />
        <Route path="/nakes-request/:id" element={<PageNakesRequestDetail />} />
        <Route path="/admin/booking" element={<PageBooking />} />
        <Route path="/admin/bookings/:id" element={<PageBookingDetail />} />
        <Route path="/admin/users" element={<DataUser/>} />
        <Route path="/kelola-admin" element={<KelolaAdmin />} />
        {/**master Data Barang */}
        <Route path="/admin/master-barang" element={<DataBarang/>} />
        {/**Master Tarif */}
        <Route path="/admin/master-tarif" element={<DataMasterTarif/>}/>
        {/**Master Provinsi */}
        <Route path="/admin/master-provinsi" element={<AdminMasterProvinsi />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;