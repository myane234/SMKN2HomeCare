import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaDatabase,
  FaFileUpload,
  FaGlobe,
  FaPlay,
  FaRedo,
  FaSave,
  FaSpinner,
} from "react-icons/fa";
import { URL } from "../utils/getUrl";
import { getAuthHeaders } from "../utils/auth";

const ENDPOINT = "/admin/seeders";

async function request(path, options = {}) {
  const response = await fetch(`${URL}${path}`, {
    ...options,
    headers: getAuthHeaders(
      options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" },
    ),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(body.message || `Request gagal (${response.status})`);
  return body;
}

export default function PageSeederManagement() {
  const [seeders, setSeeders] = useState([]);
  const [selected, setSelected] = useState([]);
  const [source, setSource] = useState(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [savingSource, setSavingSource] = useState(false);
  const [message, setMessage] = useState(null);

  async function loadData() {
    setLoading(true);
    try {
      const [seederResponse, sourceResponse] = await Promise.all([
        request(ENDPOINT),
        request(`${ENDPOINT}/wilayah-source`),
      ]);
      setSeeders(seederResponse.data || []);
      setSource(sourceResponse.data || null);
      setBaseUrl(sourceResponse.data?.base_url || "");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function toggleSeeder(name) {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  }

  async function runSeeders(names, runAll = false) {
    setRunning(runAll ? "all" : names.join(","));
    setMessage(null);
    try {
      const result = await request(`${ENDPOINT}/run`, {
        method: "POST",
        body: JSON.stringify(runAll ? { all: true } : { seeders: names }),
      });
      const failed = (result.results || []).find(
        (item) => item.status === "failed",
      );
      setMessage({
        type: result.success ? "success" : "error",
        text: failed
          ? `${result.message} ${failed.name}: ${failed.output || "Tanpa detail."}`
          : result.message,
      });
      if (result.success) setSelected([]);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setRunning(null);
    }
  }

  async function saveApiSource(event) {
    event.preventDefault();
    setSavingSource(true);
    setMessage(null);
    try {
      const result = await request(`${ENDPOINT}/wilayah-source/api`, {
        method: "PUT",
        body: JSON.stringify({ base_url: baseUrl }),
      });
      setSource(result.data);
      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSavingSource(false);
    }
  }

  async function saveFileSource(event) {
    event.preventDefault();
    if (!file) return;
    setSavingSource(true);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await request(`${ENDPOINT}/wilayah-source/file`, {
        method: "POST",
        body: formData,
      });
      setSource(result.data);
      setFile(null);
      event.target.reset();
      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setSavingSource(false);
    }
  }

  const allSelected = seeders.length > 0 && selected.length === seeders.length;

  return (
    /* CONTAINER LUAS (max-w-screen-2xl) DENGAN PADDING PAS */
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
            <FaDatabase className="text-primary" /> Pengaturan Seeder
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Kelola konfigurasi sumber wilayah dan jalankan pengisian data
            master.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => loadData()}
            disabled={loading}
            className="btn-secondary flex items-center gap-2 px-3.5 py-2 text-xs font-semibold sm:text-sm rounded-lg"
          >
            <FaRedo className={loading ? "animate-spin" : ""} /> Muat Ulang
          </button>
          <button
            type="button"
            onClick={() => runSeeders([], true)}
            disabled={running !== null || loading}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-xs font-semibold sm:text-sm rounded-lg"
          >
            {running === "all" ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaPlay />
            )}
            Run All Seeder
          </button>
        </div>
      </div>

      {/* ALERT MESSAGE */}
      {message && (
        <div
          className={`rounded-xl border p-4 text-xs sm:text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* DAFTAR SEEDER (DIV WIDE, FONT & IKON PROPOSIONAL) */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
              Daftar Seeder
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pilih beberapa data atau jalankan satu seeder dari barisnya.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setSelected(allSelected ? [] : seeders.map((item) => item.name))
            }
            className="text-left text-xs font-semibold text-primary hover:text-primary-dark sm:text-sm"
          >
            {allSelected ? "Batalkan semua pilihan" : "Pilih semua"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-xs text-slate-500 sm:text-sm">
            <FaSpinner className="animate-spin" /> Memuat daftar seeder...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {seeders.map((seeder) => {
              const isRunning =
                running === seeder.name ||
                running?.split(",").includes(seeder.name);
              return (
                <div
                  key={seeder.name}
                  className="flex flex-col gap-3 px-6 py-4 hover:bg-slate-50/60 transition-colors sm:flex-row sm:items-center"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(seeder.name)}
                      onChange={() => toggleSeeder(seeder.name)}
                      className="mt-1 h-4 w-4 rounded accent-primary shrink-0 cursor-pointer"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-800">
                        {seeder.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {seeder.description}
                      </span>
                      <span className="mt-1 block truncate font-mono text-[11px] text-slate-400">
                        {seeder.name}
                      </span>
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => runSeeders([seeder.name])}
                    disabled={running !== null}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary-light disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRunning ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaPlay className="text-[10px]" />
                    )}
                    Run Seeder
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* FOOTER BARIS SEEDER */}
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-slate-500 sm:text-sm">
            {selected.length} seeder dipilih
          </span>
          <button
            type="button"
            onClick={() => runSeeders(selected)}
            disabled={!selected.length || running !== null}
            className="flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-900 sm:text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running && running !== "all" ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaCheckCircle />
            )}
            Jalankan yang Dipilih
          </button>
        </div>
      </section>

      {/* FORM CONFIGURATION SECTION */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* API FORM */}
        <form
          onSubmit={saveApiSource}
          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs"
        >
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
              <FaGlobe className="text-primary" /> Sumber API Untuk Wilayah
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              URL ini dipakai oleh proses import Data Wilayah
            </p>
            <input
              value={baseUrl}
              onChange={(event) => setBaseUrl(event.target.value)}
              type="url"
              required
              placeholder="https://example.com/api"
              className="mt-4 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="submit"
            disabled={savingSource}
            className="btn-primary mt-5 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold sm:text-sm rounded-lg"
          >
            {savingSource ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Simpan API
          </button>
        </form>

        {/* FILE FORM */}
        <form
          onSubmit={saveFileSource}
          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs"
        >
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
              <FaFileUpload className="text-primary" /> Sumber File Wilayah
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Gunakan CSV, JSON, atau XLSX maksimal 20 MB.
            </p>
            <input
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              type="file"
              accept=".csv,.json,.xlsx"
              required
              className="mt-4 block w-full text-xs sm:text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-dark cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={savingSource || !file}
            className="btn-primary mt-5 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold sm:text-sm rounded-lg"
          >
            {savingSource ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Simpan File
          </button>
        </form>
      </section>

      {/* FOOTER SOURCE INFO */}
      {source?.source_type && (
        <div className="rounded-xl border border-slate-200/60 bg-slate-50 px-4 py-3 text-xs text-slate-500">
          Sumber aktif:{" "}
          <span className="font-semibold text-slate-700">
            {source.source_type}
          </span>
        </div>
      )}
    </div>
  );
}
