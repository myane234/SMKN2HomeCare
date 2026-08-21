import { useEffect, useState } from "react";
import {
  FaCheckCircle,
  FaDatabase,
  FaExclamationTriangle,
  FaFileUpload,
  FaGlobe,
  FaMapMarkerAlt,
  FaPlay,
  FaRedo,
  FaSave,
  FaSpinner,
  FaTerminal,
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
  const [urls, setUrls] = useState({
    provinces_url: "",
    regencies_url: "",
    districts_url: "",
    villages_url: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null);
  const [savingSource, setSavingSource] = useState(false);
  const [message, setMessage] = useState(null);

  // State untuk Asynchronous Import Wilayah
  const [activeRunId, setActiveRunId] = useState(null);
  const [runProgress, setRunProgress] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [cancelling, setCancelling] = useState(false);

  function addTerminalLog(message, level = "info") {
    setTerminalLogs((current) => [
      ...current,
      { message, level, created_at: new Date().toLocaleTimeString() },
    ]);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [seederResponse, sourceResponse, latestRunResponse] = await Promise.all([
        request(ENDPOINT),
        request(`${ENDPOINT}/wilayah-source`),
        request(`${ENDPOINT}/wilayah/runs/latest`),
      ]);
      const latestRun = latestRunResponse.data;
      setSeeders(seederResponse.data || []);
      setSource(sourceResponse.data || null);
      if (latestRun) {
        setRunProgress(latestRun);
        setTerminalLogs(latestRun.logs || []);
        setActiveRunId(
          ["queued", "running"].includes(latestRun.status)
            ? latestRun.id
            : null,
        );
      }
      setUrls({
        provinces_url: sourceResponse.data?.provinces_url || "",
        regencies_url: sourceResponse.data?.regencies_url || "",
        districts_url: sourceResponse.data?.districts_url || "",
        villages_url: sourceResponse.data?.villages_url || "",
      });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialize = async () => {
      await loadData();
    };

    initialize();
  }, []);

  // Polling status import asynchronous
  useEffect(() => {
    if (!activeRunId) return;

    const fetchRunStatus = async () => {
      try {
        const res = await request(`${ENDPOINT}/wilayah/runs/${activeRunId}`);
        const data = res.data || res;
        setRunProgress(data);
        setTerminalLogs(data.logs || []);

        if (["completed", "failed", "cancelled"].includes(data.status)) {
          if (data.status === "completed") {
            setMessage({
              type: "success",
              text: "Proses import data wilayah asynchronous berhasil diselesaikan!",
            });
          } else if (data.status === "cancelled") {
            setMessage({
              type: "success",
              text: "Proses import data wilayah berhasil dibatalkan.",
            });
          } else {
            setMessage({
              type: "error",
              text: "Proses import data wilayah mengalami kegagalan. Cek log detail.",
            });
          }
          setActiveRunId(null); // Hentikan polling
        }
      } catch (err) {
        console.error("Gagal polling status import:", err);
      }
    };

    fetchRunStatus();
    const interval = setInterval(fetchRunStatus, 2500);

    return () => clearInterval(interval);
  }, [activeRunId]);

  async function cancelWilayahImport() {
    if (!activeRunId || cancelling) return;

    setCancelling(true);
    try {
      const result = await request(
        `${ENDPOINT}/wilayah/runs/${activeRunId}/cancel`,
        { method: "POST" },
      );
      const data = result.data || result;
      setRunProgress(data);
      setTerminalLogs(data.logs || []);
      setActiveRunId(null);
      setMessage({ type: "success", text: result.message });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setCancelling(false);
    }
  }

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
    setTerminalLogs([]);
    addTerminalLog(
      runAll
        ? "Menjalankan semua seeder..."
        : `Menjalankan seeder: ${names.join(", ")}...`,
    );
    try {
      let result;
      // Jika seeder spesifik wilayah dijalankan secara mandiri
      if (
        !runAll &&
        names.length === 1 &&
        names[0].toLowerCase().includes("wilayah")
      ) {
        result = await request(`${ENDPOINT}/wilayah/run`, { method: "POST" });
      } else {
        result = await request(`${ENDPOINT}/run`, {
          method: "POST",
          body: JSON.stringify(runAll ? { all: true } : { seeders: names }),
        });
      }

      const runId = result.run_id || result.data?.run_id || result.data?.id;

      if (runId) {
        setActiveRunId(runId);
        setRunProgress({
          status: "running",
          total_provinces: 0,
          processed_provinces: 0,
          processed_cities: 0,
          processed_districts: 0,
          processed_villages: 0,
          logs: [],
        });
        setMessage({
          type: "success",
          text: `Proses import wilayah asynchronous dimulai (Run ID: ${runId}).`,
        });
        addTerminalLog(`Job dimasukkan ke queue wilayah (Run ID: ${runId}).`);
      } else {
        const failed = (result.results || []).find(
          (item) => item.status === "failed",
        );
        setMessage({
          type: result.success ? "success" : "error",
          text: failed
            ? `${result.message} ${failed.name}: ${failed.output || "Tanpa detail."}`
            : result.message,
        });
        (result.results || []).forEach((item) => {
          addTerminalLog(
            `${item.name}: ${item.status}${item.output ? ` - ${item.output}` : ""}`,
            item.status === "failed" ? "error" : "info",
          );
        });
      }

      if (result.success) setSelected([]);
    } catch (error) {
      addTerminalLog(error.message, "error");
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
        body: JSON.stringify(urls),
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
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-slate-900 sm:text-2xl">
            <FaDatabase className="text-primary" /> Pengaturan Seeder
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Kelola konfigurasi sumber wilayah dan jalankan pengisian data master.
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
            disabled={running !== null || loading || !!activeRunId}
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

      {/* DAFTAR SEEDER */}
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
                    disabled={running !== null || !!activeRunId}
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

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-slate-500 sm:text-sm">
            {selected.length} seeder dipilih
          </span>
          <button
            type="button"
            onClick={() => runSeeders(selected)}
            disabled={!selected.length || running !== null || !!activeRunId}
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

      {/* TERMINAL LOG */}
      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-5 text-white shadow-md">
        <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-3 text-xs font-semibold text-slate-300 sm:text-sm">
          <FaTerminal className="text-emerald-400" /> Terminal Seeder
          {running !== null && (
            <FaSpinner className="ml-auto animate-spin text-amber-400" />
          )}
        </div>
        <div className="max-h-48 min-h-24 overflow-y-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed">
          {terminalLogs.length === 0 ? (
            <span className="text-slate-500">Belum ada log seeder.</span>
          ) : (
            terminalLogs.map((log, index) => (
              <div key={`${log.created_at}-${index}`} className="flex gap-2">
                <span className="shrink-0 text-slate-500">[{log.created_at || "Log"}]</span>
                <span
                  className={
                    log.level === "error" ? "text-rose-400" : "text-emerald-400"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
          {running !== null && (
            <div className="mt-1 text-amber-300">Menunggu proses selesai...</div>
          )}
        </div>
      </section>

      {/* ASYNCHRONOUS PROGRESS MONITOR CARD */}
      {runProgress && (
        <section className="rounded-2xl border border-primary/20 bg-slate-900 text-white p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <FaMapMarkerAlt className="text-primary text-lg" />
              <h3 className="font-semibold text-sm sm:text-base text-slate-100">
                Progres Import Wilayah Asynchronous
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                  runProgress.status === "running"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : runProgress.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {runProgress.status === "running" && (
                  <FaSpinner className="animate-spin" />
                )}
                {runProgress.status === "completed" && <FaCheckCircle />}
                {runProgress.status === "failed" && <FaExclamationTriangle />}
                {runProgress.status}
              </span>
              {["queued", "running"].includes(runProgress.status) && (
                <button
                  type="button"
                  onClick={cancelWilayahImport}
                  disabled={cancelling}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/40 px-2.5 py-1 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cancelling && <FaSpinner className="animate-spin" />}
                  {cancelling ? "Membatalkan..." : "Batalkan"}
                </button>
              )}
            </div>
          </div>

          {/* STATS COUNTER GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
              <span className="block text-[11px] text-slate-400 font-medium">
                Provinsi
              </span>
              <span className="text-lg font-bold text-slate-100">
                {runProgress.processed_provinces || 0}
                {runProgress.total_provinces
                  ? ` / ${runProgress.total_provinces}`
                  : ""}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
              <span className="block text-[11px] text-slate-400 font-medium">
                Kabupaten / Kota
              </span>
              <span className="text-lg font-bold text-slate-100">
                {runProgress.processed_cities || 0}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
              <span className="block text-[11px] text-slate-400 font-medium">
                Kecamatan
              </span>
              <span className="text-lg font-bold text-slate-100">
                {runProgress.processed_districts || 0}
              </span>
            </div>
            <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50">
              <span className="block text-[11px] text-slate-400 font-medium">
                Desa / Kelurahan
              </span>
              <span className="text-lg font-bold text-slate-100">
                {runProgress.processed_villages || 0}
              </span>
            </div>
          </div>

        </section>
      )}

      {/* FORM CONFIGURATION SECTION */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* API FORM */}
        <form
          onSubmit={saveApiSource}
          className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs"
        >
          <div className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900 sm:text-base">
              <FaGlobe className="text-primary" /> Sumber API Untuk Wilayah
            </h2>
            <p className="text-xs text-slate-500">
              Masukkan URL endpoint JSON untuk masing-masing tingkatan wilayah.
            </p>

            <div className="grid grid-cols-1 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Provinces URL
                </label>
                <input
                  value={urls.provinces_url}
                  onChange={(e) =>
                    setUrls({ ...urls, provinces_url: e.target.value })
                  }
                  type="url"
                  required
                  placeholder="https://example.com/provinces.json"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Regencies URL
                </label>
                <input
                  value={urls.regencies_url}
                  onChange={(e) =>
                    setUrls({ ...urls, regencies_url: e.target.value })
                  }
                  type="url"
                  required
                  placeholder="https://example.com/regencies.json"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Districts URL
                </label>
                <input
                  value={urls.districts_url}
                  onChange={(e) =>
                    setUrls({ ...urls, districts_url: e.target.value })
                  }
                  type="url"
                  required
                  placeholder="https://example.com/districts.json"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Villages URL
                </label>
                <input
                  value={urls.villages_url}
                  onChange={(e) =>
                    setUrls({ ...urls, villages_url: e.target.value })
                  }
                  type="url"
                  required
                  placeholder="https://example.com/villages.json"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3.5 py-2 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingSource}
            className="btn-primary mt-5 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold sm:text-sm rounded-lg"
          >
            {savingSource ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Simpan API Wilayah
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