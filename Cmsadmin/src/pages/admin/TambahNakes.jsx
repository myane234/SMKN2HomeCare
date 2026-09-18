import React,{useState,useEffect,useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import Swal from 'sweetalert2';

import {getAllAgama} from '../../data/masterAgamaData.js';
import {getAllUniversitas} from '../../data/masterUniversitasData.js';
import {getAllWilayahLayanan} from '../../data/wilayahLayananData.js';
import {getAllKategoriLayanan} from '../../data/kategoriData.js';
import {getAllActiveNakes,registerNakesByAdmin} from '../../data/nakesData.js';
import {getAuthHeaders} from '../../utils/auth.js';
import { compressImage } from '../../utils/imageCompressor.js';

export default function TambahNakes(){
  const navigate=useNavigate();
  const [loading,setLoading]=useState(false);
  const [loadingMaster,setLoadingMaster]=useState(true);

  const [searchQuery,setSearchQuery]=useState('');
  const [searchResults,setSearchResults]=useState([]);
  const [searchingPasien,setSearchingPasien]=useState(false);
  const [showPasienDropdown,setShowPasienDropdown]=useState(false);
  const [selectedPasien,setSelectedPasien]=useState(null);
  const searchRef=useRef(null);

  const [agamaOptions,setAgamaOptions]=useState([]);
  const [wilayahOptions,setWilayahOptions]=useState([]);
  const [kategoriOptions,setKategoriOptions]=useState([]);
  const [universitasOptions,setUniversitasOptions]=useState([]);

  const [univSearch,setUnivSearch]=useState('');
  const [filteredUniv,setFilteredUniv]=useState([]);
  const [isUnivOpen,setIsUnivOpen]=useState(false);
  const univRef=useRef(null);

  const [form,setForm]=useState({
    user_id:'',email:'',status:'approved',admin_notes:'',
    nik:'',nama_lengkap:'',nama_panggilan:'',jenis_kelamin:'',
    tempat_lahir:'',tanggal_lahir:'',agama:'',no_telp:'',
    id_wilayah_layanan:'',jenis_tenaga_medis:[],
    universitas:'',program_studi:'',tahun_lulus:'',no_str:'',
    no_sip:'',tempat_kerja:'',lama_bekerja:'',
    alamat_lengkap:'',latitude:'-6.2088',longitude:'106.8456'
  });

  const [files,setFiles]=useState({
    foto_profile:null,file_ktp:null,ijazah:null,
    file_skck:null,file_cv:null,file_str:null,file_sip:null
  });

  const getAgamaLabel=item=>item?.nama_agama||item?.nama||item?.name||String(item||'');
  const getKategoriLabel=item=>item?.nama_kategori||item?.nama||item?.name||String(item||'');
  const getWilayahLabel=item=>item?.nama_provinsi||item?.nama_wilayah||item?.nama||String(item||'');
  const getWilayahId=item=>item?.id_provinsi??item?.id_wilayah_layanan??item?.id??item?.wilayah_id??'';
  const getUnivLabel=item=>item?.nama_universitas||item?.nama||item?.name||String(item||'');
  const normalize=value=>String(value??'').trim().toLowerCase().replace(/\s+/g,' ');

  useEffect(()=>{
    let mounted=true;

    const fetchAllMaster=async()=>{
      setLoadingMaster(true);
      try{
        const [resAgama,resWilayah,resUniv,resKategori]=await Promise.all([
          getAllAgama().catch(()=>[]),
          getAllWilayahLayanan().catch(()=>[]),
          getAllUniversitas().catch(()=>[]),
          getAllKategoriLayanan().catch(()=>[])
        ]);

        if(!mounted)return;

        const extract=res=>{
          if(res&&typeof res==='object'&&res.data!==undefined)return Array.isArray(res.data)?res.data:res.data?[res.data]:[];
          return Array.isArray(res)?res:[];
        };

        setAgamaOptions(extract(resAgama));
        setWilayahOptions(extract(resWilayah));
        setUniversitasOptions(extract(resUniv));
        setKategoriOptions(extract(resKategori));
      }catch(err){
        console.error('Error fetching master data:',err);
      }finally{
        if(mounted)setLoadingMaster(false);
      }
    };

    fetchAllMaster();
    return()=>{mounted=false;};
  },[]);

  useEffect(()=>{
    const handleClickOutside=e=>{
      if(univRef.current&&!univRef.current.contains(e.target))setIsUnivOpen(false);
      if(searchRef.current&&!searchRef.current.contains(e.target))setShowPasienDropdown(false);
    };

    document.addEventListener('mousedown',handleClickOutside);
    return()=>document.removeEventListener('mousedown',handleClickOutside);
  },[]);

  const handleSearchPasien=async e=>{
    e?.preventDefault();

    const keyword=searchQuery.trim();

    if(!keyword){
      Swal.fire('Perhatian','Masukkan kata kunci pencarian (Email, NIK, Nama, atau No. HP).','warning');
      return;
    }

    setSearchingPasien(true);
    setShowPasienDropdown(true);
    setSearchResults([]);

    try{
      const url=`https://citra.faaruq.com/api/admin/pasien?search=${encodeURIComponent(keyword)}`;

      const res=await fetch(url,{
        method:'GET',
        headers:getAuthHeaders({
          'Content-Type':'application/json',
          Accept:'application/json'
        })
      });

      const response=await res.json().catch(()=>null);

      if(!res.ok)throw new Error(response?.message||`Request gagal dengan status ${res.status}`);

      const data=response?.data!==undefined?response.data:response;
      const list=Array.isArray(data)?data:data?[data]:[];

      setSearchResults(list);

      if(!list.length){
        Swal.fire('Informasi','Tidak ditemukan akun pasien dengan kata kunci tersebut.','info');
      }
    }catch(err){
      console.error('Error search pasien:',err);
      setSearchResults([]);
      Swal.fire('Gagal',err.message||'Gagal mencari akun pasien.','error');
    }finally{
      setSearchingPasien(false);
    }
  };

  const handleSelectPasien=pasien=>{
    const jkRaw=String(pasien?.jenis_kelamin||'').toLowerCase();
    const jenisKelamin=jkRaw==='p'||jkRaw.includes('perempuan')?'P':jkRaw==='l'||jkRaw.includes('laki')?'L':'';

    const namaLengkap=pasien?.nama_lengkap||pasien?.nama||pasien?.name||pasien?.user?.name||pasien?.user?.nama||'';
    const namaPanggilan=pasien?.nama_panggilan||(namaLengkap?namaLengkap.split(' ')[0]:'');
    const alamat=pasien?.alamat_utama||pasien?.alamat_lengkap||pasien?.alamat||'';
    const email=pasien?.email||pasien?.user?.email||'';
    const noHp=pasien?.no_hp||pasien?.no_telp||pasien?.no_telepon||pasien?.phone||pasien?.user?.no_hp||pasien?.user?.no_telp||pasien?.user?.no_telepon||pasien?.user?.phone||'';
    const userId=pasien?.user_id||pasien?.id_user||pasien?.user?.id||pasien?.id_pasien||pasien?.id||'';

    const wilayahCandidates=[
      pasien?.id_wilayah_layanan,
      pasien?.id_provinsi,
      pasien?.wilayah_layanan?.id_provinsi,
      pasien?.wilayah_layanan?.id_wilayah_layanan,
      pasien?.wilayah_layanan?.id
    ];

    const rawWilayahId=wilayahCandidates.find(value=>value!==null&&value!==undefined&&/^\d+$/.test(String(value)));
    const wilayahId=rawWilayahId?String(rawWilayahId):'';

    setSelectedPasien(pasien);

    setForm(prev=>({
      ...prev,
      user_id:userId||prev.user_id,
      email:email||prev.email,
      nik:pasien?.nik||prev.nik,
      nama_lengkap:namaLengkap||prev.nama_lengkap,
      nama_panggilan:namaPanggilan||prev.nama_panggilan,
      jenis_kelamin:jenisKelamin||prev.jenis_kelamin,
      tanggal_lahir:pasien?.tanggal_lahir||prev.tanggal_lahir,
      agama:pasien?.agama||prev.agama,
      tempat_lahir:pasien?.tempat_lahir||prev.tempat_lahir,
      no_telp:noHp||prev.no_telp,
      alamat_lengkap:alamat||prev.alamat_lengkap,
      id_wilayah_layanan:wilayahId
    }));

    setSearchResults([]);
    setShowPasienDropdown(false);
    setSearchQuery('');

    Swal.fire({
      icon:'success',
      title:'Data Pasien Terpilih',
      text:`Profil "${namaLengkap}" berhasil dimasukkan ke form Nakes.`,
      timer:1800,
      showConfirmButton:false
    });
  };

  const handleInputChange=e=>{
    const {name,value}=e.target;
    setForm(prev=>({...prev,[name]:value}));
  };

  const handleFileChange = async (e) => {
  const { name, files: selectedFiles } = e.target;
  const file = selectedFiles?.[0];

  if (!file) return;

  try {
    const compressed = await compressImage(file, 1024, 1024, 0.7);
    console.log(`${name}: ${file.size} -> ${compressed.size}`);
    setFiles((prev) => ({ ...prev, [name]: compressed }));
  } catch (error) {
    console.error(`Gagal kompres ${name}:`, error);
    setFiles((prev) => ({ ...prev, [name]: file }));
  }
};

  const handleKategoriToggle=kategoriName=>{
    setForm(prev=>{
      const current=prev.jenis_tenaga_medis||[];
      const updated=current.includes(kategoriName)?current.filter(item=>item!==kategoriName):[...current,kategoriName];
      return {...prev,jenis_tenaga_medis:updated};
    });
  };

  const handleUnivSearch=e=>{
    const value=e.target.value;

    setUnivSearch(value);
    setForm(prev=>({...prev,universitas:value}));
    setIsUnivOpen(true);

    if(!value.trim()){
      setFilteredUniv([]);
      return;
    }

    const keyword=value.toLowerCase();
    setFilteredUniv(universitasOptions.filter(item=>getUnivLabel(item).toLowerCase().includes(keyword)));
  };

  const handleSelectUniv=name=>{
    setForm(prev=>({...prev,universitas:name}));
    setUnivSearch(name);
    setIsUnivOpen(false);
  };

  const checkExistingNakes=async()=>{
    try{
      const result=await getAllActiveNakes();
      const nakesList=Array.isArray(result)?result:[];

      const sameUser=nakesList.find(item=>{
        const idUser=item?.id_user??item?.user_id??item?.user?.id;
        return idUser&&String(idUser)===String(form.user_id);
      });

      if(sameUser){
        return 'Akun pasien ini sudah terdaftar sebagai Nakes.';
      }

      const sameNik=nakesList.find(item=>{
        const nik=item?.nik??item?.NIK;
        return nik&&normalize(nik)===normalize(form.nik);
      });

      if(sameNik){
        return 'NIK tersebut sudah digunakan oleh Nakes lain.';
      }

      if(form.no_str){
        const sameStr=nakesList.find(item=>{
          const str=item?.no_str??item?.str;
          return str&&normalize(str)===normalize(form.no_str);
        });

        if(sameStr)return 'Nomor STR tersebut sudah digunakan oleh Nakes lain.';
      }

      if(form.no_sip){
        const sameSip=nakesList.find(item=>{
          const sip=item?.no_sip??item?.sip;
          return sip&&normalize(sip)===normalize(form.no_sip);
        });

        if(sameSip)return 'Nomor SIP tersebut sudah digunakan oleh Nakes lain.';
      }

      return '';
    }catch(err){
      console.warn('Gagal melakukan pengecekan Nakes existing:',err);
      return '';
    }
  };

  const handleSubmit=async e=>{
    e.preventDefault();

    if(!form.user_id)return Swal.fire('Perhatian','WAJIB memilih akun Pasien existing terlebih dahulu.','warning');
    if(!form.nama_lengkap)return Swal.fire('Perhatian','Nama lengkap wajib diisi.','warning');
    if(!form.nik||!/^\d{16}$/.test(String(form.nik)))return Swal.fire('Perhatian','NIK harus terdiri dari 16 digit angka.','warning');
    if(!form.jenis_kelamin)return Swal.fire('Perhatian','Jenis kelamin wajib dipilih.','warning');

    const wilayahId=Number(form.id_wilayah_layanan);
    if(!Number.isInteger(wilayahId)||wilayahId<=0)return Swal.fire('Perhatian','Wilayah operasional wajib dipilih.','warning');

    if(!form.jenis_tenaga_medis?.length)return Swal.fire('Perhatian','Pilih minimal 1 jenis/kategori tenaga medis.','warning');

    if(!files.foto_profile)return Swal.fire('Perhatian','Foto profil wajib diunggah.','warning');
    if(!files.file_ktp)return Swal.fire('Perhatian','Foto KTP wajib diunggah.','warning');
    if(!files.ijazah)return Swal.fire('Perhatian','Foto ijazah wajib diunggah.','warning');
    if(!files.file_skck)return Swal.fire('Perhatian','Foto SKCK wajib diunggah.','warning');
    if(!files.file_cv)return Swal.fire('Perhatian','File CV wajib diunggah.','warning');
    if(!files.file_str)return Swal.fire('Perhatian','Foto STR wajib diunggah.','warning');
    if(!files.file_sip)return Swal.fire('Perhatian','Foto SIP wajib diunggah.','warning');

    const totalUploadSize = Object.values(files).filter(Boolean).reduce((total, file) => total + file.size, 0);
    const maxSafeSize = 6 * 1024 * 1024;

    if (totalUploadSize > maxSafeSize) {
      return Swal.fire('Ukuran Berkas Terlalu Besar', `Total berkas setelah kompresi masih ${ (totalUploadSize / 1024 / 1024).toFixed(2) } MB. Maksimal aman sekitar 6 MB dalam satu kali pendaftaran. Silakan gunakan file PDF/dokumen dengan ukuran lebih kecil.`, 'warning');
    }

    setLoading(true);

    try{
      const duplicateMessage=await checkExistingNakes();

      if(duplicateMessage){
        setLoading(false);
        return Swal.fire('Tidak dapat mendaftarkan',duplicateMessage,'warning');
      }

      const formData=new FormData();

      formData.append('user_id',String(form.user_id));
      formData.append('email',form.email||'');
      formData.append('nik',form.nik||'');
      formData.append('nama_lengkap',form.nama_lengkap||'');
      formData.append('nama_panggilan',form.nama_panggilan||'');
      formData.append('jenis_kelamin',form.jenis_kelamin||'');
      formData.append('tempat_lahir',form.tempat_lahir||'');
      formData.append('tanggal_lahir',form.tanggal_lahir||'');
      formData.append('agama',form.agama||'');
      formData.append('no_telp',form.no_telp||'');
      formData.append('id_wilayah_layanan',String(wilayahId));
      formData.append('jenis_tenaga_medis',form.jenis_tenaga_medis.join(', '));
      formData.append('universitas',form.universitas||'');
      formData.append('program_studi',form.program_studi||'');
      if(form.tahun_lulus)formData.append('tahun_lulus',String(form.tahun_lulus));
      formData.append('no_str',form.no_str||'');
      formData.append('no_sip',form.no_sip||'');
      formData.append('tempat_kerja',form.tempat_kerja||'');
      formData.append('lama_bekerja',form.lama_bekerja||'');
      formData.append('alamat_lengkap',form.alamat_lengkap||'');
      formData.append('latitude',form.latitude||'-6.2088');
      formData.append('longitude',form.longitude||'106.8456');
      formData.append('status','approved');

      if(form.admin_notes)formData.append('admin_notes',form.admin_notes);

      Object.entries(files).forEach(([key,file])=>{
        if(file)formData.append(key,file);
      });

      const result=await registerNakesByAdmin(formData);
      console.log('Register Nakes Response:',result);

      await Swal.fire({
        icon:'success',
        title:'Berhasil',
        text:'Akun pasien berhasil didaftarkan sebagai Nakes.',
        timer:1800,
        showConfirmButton:false
      });

      navigate('/nakes');
    }catch(error){
      console.error('Gagal daftar Nakes:',error);

      const rawMessage=String(error?.message||'').toLowerCase();
      const isDuplicate=rawMessage.includes('duplicate')||rawMessage.includes('tenaga_medis_nik_unique')||rawMessage.includes('nik');

      Swal.fire({
        icon:'error',
        title:'Gagal Simpan',
        text:isDuplicate?'NIK tersebut sudah digunakan pada data Nakes lain. Silakan periksa kembali data NIK.':error?.message||'Gagal mendaftarkan akun pasien sebagai Nakes.'
      });
    }finally{
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-200 my-6">
      <div className="border-b pb-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Form Input Tenaga Kesehatan</h1>
        <p className="text-sm text-gray-500">Pilih akun Pasien eksisting untuk didaftarkan sebagai Nakes</p>
      </div>

      <div ref={searchRef} className="mb-8 p-4 bg-amber-50/70 border border-amber-200 rounded-xl relative">
        <div className="mb-2">
          <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">1. Cari & Pilih Akun Pasien (Wajib)</h3>
          <p className="text-xs text-amber-700">Cari berdasarkan <b>Email</b>, <b>NIK</b>, <b>Nama</b>, atau <b>No. HP</b>.</p>
        </div>

        <div className="flex gap-2">
          <input type="text" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearchPasien(e)} placeholder="Ketik Email / NIK / Nama / No. HP..." className="w-full border rounded-lg p-2.5 text-sm bg-white" />
          <button type="button" onClick={handleSearchPasien} disabled={searchingPasien} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm whitespace-nowrap disabled:opacity-50">{searchingPasien?'Mencari...':'Cari Pasien'}</button>
        </div>

        {showPasienDropdown&&(
          <div className="absolute left-0 right-0 mt-2 bg-white border border-amber-300 rounded-xl shadow-xl z-30 max-h-60 overflow-y-auto">
            {searchingPasien?(
              <div className="p-4 text-center text-xs text-gray-500">Mencari data pasien...</div>
            ):searchResults.length>0?(
              searchResults.map((pasien,index)=>{
                const nama=pasien?.nama_lengkap||pasien?.nama||pasien?.name||pasien?.user?.name||pasien?.user?.nama||'Tanpa Nama';
                const email=pasien?.email||pasien?.user?.email||'-';
                const nik=pasien?.nik||'-';
                const noHp=pasien?.no_hp||pasien?.no_telp||pasien?.phone||'-';
                const key=pasien?.user_id||pasien?.id_user||pasien?.id_pasien||pasien?.id||index;

                return(
                  <div key={key} onClick={()=>handleSelectPasien(pasien)} className="p-3 hover:bg-amber-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center transition">
                    <div>
                      <p className="text-xs font-bold text-gray-800">{nama}</p>
                      <p className="text-[11px] text-gray-500">Email: <span className="text-gray-700">{email}</span></p>
                      <p className="text-[11px] text-gray-500">NIK: <span className="text-gray-700">{nik}</span> | No. HP: <span className="text-gray-700">{noHp}</span></p>
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">Pilih Data Ini</span>
                  </div>
                );
              })
            ):(
              <div className="p-4 text-center text-xs text-gray-500">Data pasien tidak ditemukan.</div>
            )}
          </div>
        )}

        {selectedPasien&&(
          <div className="mt-3 px-3 py-2 rounded-lg bg-white border border-amber-200 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">Pasien terpilih:</span> {form.nama_lengkap}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        <div>
          <h2 className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-4 border-b pb-1">2. Data Pribadi Nakes</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label><input type="email" name="email" required value={form.email} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">NIK (16 Digit) *</label><input type="text" name="nik" required maxLength={16} value={form.nik} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap *</label><input type="text" name="nama_lengkap" required value={form.nama_lengkap} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Nama Panggilan *</label><input type="text" name="nama_panggilan" required value={form.nama_panggilan} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Kelamin *</label>
              <select name="jenis_kelamin" required value={form.jenis_kelamin} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                <option value="" disabled>Pilih...</option><option value="L">Laki-Laki</option><option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tempat Lahir *</label>
              <select name="tempat_lahir" required value={form.tempat_lahir} onChange={handleInputChange} disabled={loadingMaster} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                <option value="" disabled>Pilih...</option>
                {wilayahOptions.map((item,index)=>{
                  const id=getWilayahId(item);
                  const label=getWilayahLabel(item);
                  return <option key={id||index} value={label}>{label}</option>;
                })}
              </select>
            </div>

            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Lahir *</label><input type="date" name="tanggal_lahir" required value={form.tanggal_lahir} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Agama *</label>
              <select name="agama" required value={form.agama} onChange={handleInputChange} disabled={loadingMaster} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                <option value="" disabled>Pilih...</option>
                {agamaOptions.map((item,index)=>{
                  const text=getAgamaLabel(item);
                  return <option key={item?.id_agama||item?.id||index} value={item?.nama_agama||item?.nama||item?.name||text}>{text}</option>;
                })}
              </select>
            </div>

            <div><label className="block text-xs font-semibold text-gray-700 mb-1">No. HP / WA *</label><input type="text" name="no_telp" required value={form.no_telp} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Wilayah Operasional *</label>
              <select name="id_wilayah_layanan" required value={form.id_wilayah_layanan} onChange={handleInputChange} disabled={loadingMaster} className="w-full border rounded-lg p-2.5 text-sm bg-white">
                <option value="" disabled>Pilih...</option>
                {wilayahOptions.map((item,index)=>{
                  const id=getWilayahId(item);
                  const label=getWilayahLabel(item);
                  if(!id)return null;
                  return <option key={id||index} value={id}>{label}</option>;
                })}
              </select>
            </div>

            <div className="md:col-span-3 border p-3.5 rounded-xl bg-slate-50">
              <label className="block text-xs font-bold text-gray-800 mb-1">Jenis / Kategori Tenaga Medis *</label>
              <p className="text-[11px] text-gray-500 mb-2">Bisa memilih lebih dari satu.</p>

              <div className="flex flex-wrap gap-2">
                {kategoriOptions.map((item,index)=>{
                  const text=getKategoriLabel(item);
                  const checked=form.jenis_tenaga_medis.includes(text);

                  return(
                    <button type="button" key={item?.id||item?.id_kategori_layanan||index} onClick={()=>handleKategoriToggle(text)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border ${checked?'bg-sky-600 text-white border-sky-600 shadow-sm':'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                      <span>{checked?'✓':'+'}</span>{text}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap *</label>
              <textarea name="alamat_lengkap" rows={2} required value={form.alamat_lengkap} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-4 border-b pb-1">3. Pendidikan & Profesi</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative" ref={univRef}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Universitas *</label>
              <input type="text" value={univSearch||form.universitas} onChange={handleUnivSearch} onFocus={()=>setIsUnivOpen(true)} placeholder="Ketik universitas..." className="w-full border rounded-lg p-2.5 text-sm" />

              {isUnivOpen&&(
                <div className="absolute z-20 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredUniv.length>0?filteredUniv.map((item,index)=>{
                    const name=getUnivLabel(item);
                    return <div key={item?.id||index} onClick={()=>handleSelectUniv(name)} className="p-2 text-xs hover:bg-sky-50 cursor-pointer border-b">{name}</div>;
                  }):<div className="p-2 text-xs text-gray-400">Ketik untuk memilih...</div>}
                </div>
              )}
            </div>

            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Program Studi *</label><input type="text" name="program_studi" required value={form.program_studi} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Tahun Lulus *</label><input type="number" name="tahun_lulus" required min="1900" max="2100" value={form.tahun_lulus} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Nomor STR *</label><input type="text" name="no_str" required value={form.no_str} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Nomor SIP</label><input type="text" name="no_sip" value={form.no_sip} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Tempat Kerja</label><input type="text" name="tempat_kerja" value={form.tempat_kerja} onChange={handleInputChange} className="w-full border rounded-lg p-2.5 text-sm" /></div>
            <div><label className="block text-xs font-semibold text-gray-700 mb-1">Lama Bekerja</label><input type="text" name="lama_bekerja" value={form.lama_bekerja} onChange={handleInputChange} placeholder="Contoh: 5 Tahun" className="w-full border rounded-lg p-2.5 text-sm" /></div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-4 border-b pb-1">4. Upload Berkas Dokumen & Foto</h2>
          <p className="text-xs text-gray-500 mb-4">Berkas tetap dapat dilengkapi atau diperbarui kembali oleh Nakes setelah akun berhasil dibuat.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded-lg bg-gray-50"><label className="block text-xs font-semibold text-gray-700 mb-1">Foto Profil *</label><input type="file" name="foto_profile" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.foto_profile&&<p className="mt-1 text-[11px] text-green-600">{files.foto_profile.name}</p>}</div>

            <div className="p-3 border rounded-lg bg-gray-50"><label className="block text-xs font-semibold text-gray-700 mb-1">Foto KTP *</label><input type="file" name="file_ktp" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.file_ktp&&<p className="mt-1 text-[11px] text-green-600">{files.file_ktp.name}</p>}</div>

            <div className="p-3 border rounded-lg bg-gray-50"><label className="block text-xs font-semibold text-gray-700 mb-1">Foto Ijazah *</label><input type="file" name="ijazah" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.ijazah&&<p className="mt-1 text-[11px] text-green-600">{files.ijazah.name}</p>}</div>

            <div className="p-3 border rounded-lg bg-gray-50"><label className="block text-xs font-semibold text-gray-700 mb-1">Foto SKCK *</label><input type="file" name="file_skck" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.file_skck&&<p className="mt-1 text-[11px] text-green-600">{files.file_skck.name}</p>}</div>

            <div className="p-3 border rounded-lg bg-gray-50"><label className="block text-xs font-semibold text-gray-700 mb-1">CV *</label><input type="file" name="file_cv" accept=".pdf,.doc,.docx,image/jpeg,image/png" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.file_cv&&<p className="mt-1 text-[11px] text-green-600">{files.file_cv.name}</p>}</div>

            <div className="p-3 border rounded-lg bg-gray-50"><label className="block text-xs font-semibold text-gray-700 mb-1">Foto STR *</label><input type="file" name="file_str" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.file_str&&<p className="mt-1 text-[11px] text-green-600">{files.file_str.name}</p>}</div>

            <div className="p-3 border rounded-lg bg-gray-50 md:col-span-2"><label className="block text-xs font-semibold text-gray-700 mb-1">Foto SIP *</label><input type="file" name="file_sip" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileChange} className="w-full text-xs text-gray-500" />{files.file_sip&&<p className="mt-1 text-[11px] text-green-600">{files.file_sip.name}</p>}</div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <button type="button" onClick={()=>navigate('/nakes')} disabled={loading} className="px-5 py-2.5 rounded-lg border text-gray-600 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50">Batal</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow disabled:opacity-50">{loading?'Menyimpan Data Nakes...':'Simpan Data Nakes'}</button>
        </div>
      </form>
    </div>
  );
}