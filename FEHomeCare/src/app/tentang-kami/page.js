import Image from "next/image";

export default function TentangKami() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[280px] sm:h-[400px] lg:h-[500px] overflow-hidden">

        <Image
          src="/images/tentang-kami/HeroTentangKami.jpeg"
          alt="Tentang SmartHomeCare"
          fill
          priority
          className="object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Content */}
        <div className="relative flex h-full items-center justify-center px-4 sm:px-6">

          <div className="max-w-4xl text-center text-white">

            <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
              Tentang Kami
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              SmartHomeCare
            </h1>

            <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-xs sm:text-base lg:text-lg leading-6 sm:leading-8 text-gray-100">
              SmartHomeCare menghadirkan layanan kesehatan profesional
              langsung ke rumah dengan proses pemesanan yang mudah,
              aman, dan terpercaya sehingga pasien dapat memperoleh
              pelayanan terbaik tanpa harus meninggalkan kenyamanan rumah.
            </p>

          </div>

        </div>

      </section>

      {/* Cerita */}
      <section className="bg-white py-14 sm:py-24">

        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:gap-16 px-6 lg:grid-cols-2">

          <div>

            <p className="font-semibold uppercase tracking-[0.2em] text-sky-600 text-xs sm:text-sm">
              Tentang SmartHomeCare
            </p>

            <h2 className="mt-2 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
              Membawa Pelayanan Kesehatan Lebih Dekat
            </h2>

            <p className="mt-4 sm:mt-8 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
              SmartHomeCare hadir untuk membantu masyarakat memperoleh
              layanan kesehatan profesional tanpa harus datang ke rumah
              sakit atau klinik. Kami memahami bahwa setiap pasien memiliki
              kondisi dan kebutuhan yang berbeda, sehingga pelayanan yang
              nyaman di rumah menjadi solusi yang lebih efektif bagi banyak orang.
            </p>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
              Melalui tenaga kesehatan yang telah terverifikasi, SmartHomeCare
              berkomitmen memberikan pelayanan yang aman, profesional, dan
              berkualitas agar setiap pasien dapat memperoleh perawatan yang
              sesuai dengan kebutuhannya.
            </p>

          </div>

          <div className="w-full h-auto">

            <Image
              src="/images/tentang-kami/kenapaSmartHomeCare.jpeg"
              alt="Pelayanan SmartHomeCare"
              width={600}
              height={500}
              className="rounded-3xl object-cover shadow-lg w-full h-auto"
            />

          </div>

        </div>

      </section>

      {/* Visi & Misi */}
      <section className="border-y bg-white border-gray-200 py-14 sm:py-20">

        <div className="mx-auto max-w-5xl px-6">

          <p className="text-xl sm:text-2xl font-bold text-center uppercase tracking-[0.2em] text-sky-600">
            Visi & Misi
          </p>

          <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">

            <div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Visi
              </h3>

              <p className="mt-2 sm:mt-4 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
                Menjadi platform layanan homecare terpercaya di Indonesia
                yang menghadirkan pelayanan kesehatan profesional secara
                mudah, aman, dan berorientasi pada kebutuhan setiap pasien.
              </p>

            </div>

            <div className="border-t border-gray-200 pt-8 sm:pt-10">

              <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                Misi
              </h3>

              <p className="mt-2 sm:mt-4 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
                Kami berkomitmen menghadirkan layanan kesehatan yang mudah
                diakses melalui tenaga kesehatan profesional yang telah
                terverifikasi, memanfaatkan teknologi untuk mempermudah
                proses pelayanan, serta terus menjaga kualitas layanan agar
                setiap pasien memperoleh pengalaman yang aman, nyaman,
                dan terpercaya.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* Cara Kerja */}
        <section className="bg-slate-50 py-16 sm:py-28">

            <div className="mx-auto max-w-7xl px-6">

                <div className="mb-10 sm:mb-16 text-center">

                <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em]  text-sky-700">
                    Cara Kerja
                </h2>

                <p className="mx-auto mt-3 sm:mt-5 max-w-2xl text-sm sm:text-base lg:text-lg leading-7 sm:leading-8 text-gray-600">
                    Hanya dengan beberapa langkah sederhana, layanan kesehatan
                    dapat hadir langsung ke rumah Anda.
                </p>

                </div>

                <div className="grid gap-8 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">

                {/* map() yang di atas */}
                {[
                    {
                        no: "01",
                        title: "Pilih Layanan",
                        desc: "Pilih layanan homecare sesuai kebutuhan pasien.",
                    },
                    {
                        no: "02",
                        title: "Isi Data",
                        desc: "Masukkan alamat serta jadwal kunjungan.",
                    },
                    {
                        no: "03",
                        title: "Proses Pencarian",
                        desc: "Sistem akan mencarikan tenaga kesehatan yang tersedia.",
                    },
                    {
                        no: "04",
                        title: "Pelayanan",
                        desc: "Tenaga kesehatan datang ke lokasi sesuai jadwal.",
                    },
                    ].map((step) => (
                    <div
                        key={step.no}
                        className="flex flex-col items-center text-center"
                    >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white shadow-md">
                        {step.no}
                        </div>

                        <h3 className="mt-6 text-xl font-semibold text-gray-800">
                        {step.title}
                        </h3>

                        <p className="mt-3 max-w-[220px] leading-7 text-gray-600">
                        {step.desc}
                        </p>
                    </div>
                    ))}

                </div>

            </div>

            </section>

            { /*mengapa memilih*/ }
            <section className="bg-white py-14 sm:py-24">

                <div className="mx-auto grid max-w-7xl items-center gap-8 lg:gap-15 px-6 lg:grid-cols-2">

                    <div className="w-full h-auto">

                    <Image
                        src="/images/tentang-kami/TentangHomeCare.jpeg"
                        alt="Mengapa Memilih SmartHomeCare"
                        width={600}
                        height={600}
                        className="rounded-3xl object-cover w-full h-auto shadow-lg"
                    />

                    </div>

                    <div>

                    <h2 className="mt-5 text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-sky-700 leading-tight">
                        Mengapa Memilih SmartHomeCare
                    </h2>

                    <div className="mt-6 sm:mt-10 space-y-6 sm:space-y-8">

                        <div>
                        <h3 className="font-bold text-lg sm:text-xl text-gray-800">
                            Tenaga Kesehatan Profesional
                        </h3>

                        <p className="mt-2 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                            Seluruh layanan dilakukan oleh tenaga kesehatan yang telah melalui proses verifikasi.
                        </p>
                        </div>

                        <div>
                        <h3 className="font-bold text-lg sm:text-xl text-gray-800">
                            Mudah & Praktis
                        </h3>

                        <p className="mt-2 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                            Pemesanan layanan dapat dilakukan secara online dengan proses yang sederhana.
                        </p>
                        </div>

                        <div>
                        <h3 className="font-bold text-lg sm:text-xl text-gray-800">
                            Aman & Terpercaya
                        </h3>

                        <p className="mt-2 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                            Kami mengutamakan keamanan, kenyamanan, dan kualitas pelayanan bagi setiap pasien.
                        </p>
                        </div>

                    </div>

                    </div>

                </div>

            </section>
            
            {/* Komitmen */}
<section className="bg-[#F4FAFF] py-14 sm:py-24">

  <div className="mx-auto max-w-5xl px-6 text-center">

    <p className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-sky-600">
      Komitmen Kami
    </p>

    <h2 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-gray-700 leading-tight">
      Memberikan Pelayanan Terbaik untuk Setiap Pasien
    </h2>

    <p className="mx-auto mt-6 sm:mt-8 max-w-3xl text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
      SmartHomeCare berkomitmen menghadirkan pelayanan kesehatan yang
      profesional, aman, dan berorientasi pada kebutuhan pasien.
      Melalui tenaga kesehatan yang telah terverifikasi serta sistem
      pelayanan yang mudah digunakan, kami terus berupaya memberikan
      pengalaman layanan homecare yang berkualitas bagi setiap keluarga.
    </p>

  </div>

</section>

    </>
  );
}