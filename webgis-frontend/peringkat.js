// =========================================================================
// 📡 CONFIGURATION & TUNNELING GLOBAL VARIABLES (NGROK LIVE API)
// =========================================================================
const URL_API = "https://sermon-upward-sheet.ngrok-free.dev/api/urgensi-padang";
let arrayMasterRanking = [];
let dataSedangDitampilkan = []; 
let tahunAktif = "2024";
let kolomSortAktif = "skor_komposit"; 
let arahSortAsc = false;              

// 1. Ambil data spasial-atribut berkala berdasarkan filter tahun aktif
function ambilDataRanking() {
    // 🌟 REVISI: Menambahkan Header untuk bypass Ngrok Landing Page Warning
    fetch(`${URL_API}?tahun=${tahunAktif}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(res => res.json())
        .then(geojson => {
            // Mapping fitur properties GeoJSON menjadi array objek flat untuk mempermudah manipulasi tabel
            arrayMasterRanking = geojson.features.map(f => f.properties);
            prosesSortDanRenderTabel();
        })
        .catch(err => console.error("Gagal memuat data matriks peringkat:", err));
}

// 2. Engine Pemroses Pengurutan (Sorting) Data Sebelum Dikirim ke Dom HTML
function prosesSortDanRenderTabel() {
    let dataHasilSort = [...arrayMasterRanking];

    if (kolomSortAktif !== "") {
        dataHasilSort.sort((a, b) => {
            let nilaiA = a[kolomSortAktif];
            let nilaiB = b[kolomSortAktif];
            return arahSortAsc ? nilaiA - nilaiB : nilaiB - nilaiA;
        });
    }

    dataSedangDitampilkan = dataHasilSort; 
    perbaruiIconUrutan();
    renderHTMLTabel(dataHasilSort);
    
    // 🧠 AUTOMATED BAPPEDA STRATEGIC ADVISORY LOGIC ENGINE (RULE-BASED)
    generasiInsightDanRekomendasiBappeda(dataHasilSort);
}

// 🎨 Helper Component: Penolak Glitch Visual Badge Warna Skor Urgensi
function pasangBadgeSkor(skor) {
    if (skor > 66) return `<span class="bg-red-50 text-red-700 font-extrabold px-2.5 py-1 rounded-lg text-[11px] border border-red-100">${skor}</span>`;
    if (skor > 33) return `<span class="bg-amber-50 text-amber-700 font-extrabold px-2.5 py-1 rounded-lg text-[11px] border border-amber-100">${skor}</span>`;
    return `<span class="bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-1 rounded-lg text-[11px] border border-emerald-100">${skor}</span>`;
}

// 3. Render Komponen Baris Pasukan Tabel Prioritas Pembangunan
function renderHTMLTabel(data) {
    const wadahTabel = document.getElementById('tabel-body-ranking');
    if (!wadahTabel) return;
    wadahTabel.innerHTML = "";

    data.forEach((row, index) => {
        // Pembuatan badge medali peringkat eksekutif top 3 prioritas
        let badgeRank = `<span class="text-slate-400 font-bold">${index + 1}</span>`;
        if (index === 0) badgeRank = `<span class="bg-red-700 text-white text-[11px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center mx-auto shadow-sm">1</span>`;
        if (index === 1) badgeRank = `<span class="bg-amber-500 text-white text-[11px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center mx-auto shadow-sm">2</span>`;
        if (index === 2) badgeRank = `<span class="bg-slate-500 text-white text-[11px] font-extrabold w-6 h-6 rounded-full flex items-center justify-center mx-auto shadow-sm">3</span>`;

        wadahTabel.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition duration-150 text-slate-700">
                <td class="py-4 px-6 text-center">${badgeRank}</td>
                <td class="py-4 px-6 font-bold text-slate-900 text-sm">Kec. ${row.nama}</td>
                <td class="py-4 px-6 text-center">${pasangBadgeSkor(row.skor_ekonomi)}</td>
                <td class="py-4 px-6 text-center">${pasangBadgeSkor(row.skor_sosial)}</td>
                <td class="py-4 px-6 text-center">${pasangBadgeSkor(row.skor_infrastruktur)}</td>
                <td class="py-4 px-6 text-center bg-indigo-50/20 font-bold border-l border-indigo-100/30">${pasangBadgeSkor(row.skor_komposit)}</td>
            </tr>
        `;
    });
}

// =========================================================================
// 🧠 AUTOMATED BAPPEDA STRATEGIC ADVISORY LOGIC ENGINE (RULE-BASED)
// =========================================================================
function generasiInsightDanRekomendasiBappeda(data) {
    const wadahPanel = document.getElementById('panel-rekomendasi');
    if (!wadahPanel || data.length === 0) return;

    // A. Cari Kecamatan Prioritas Tertinggi Kontekstual Berdasarkan data teratas IUPW
    const dataUrutanTeratas = [...data].sort((a, b) => b.skor_komposit - a.skor_komposit);
    const kecamatanUtamaKritis = dataUrutanTeratas[0];

    // B. Hitung Sebaran Distribusi Frekuensi Zona Kelas Wilayah Kota Padang
    const jumlahKritisMerah = data.filter(r => r.skor_komposit > 66).length;
    const jumlahWaspadaKuning = data.filter(r => r.skor_komposit > 33 && r.skor_komposit <= 66).length;

    // C. Klasterisasi Penugasan Instansi Berdasarkan Diagnosis Sektoral Terburuk per Kecamatan
    let daftarDinasPUPR = [];
    let daftarDinasUMKM = [];
    let daftarDinasPerkim = [];

    data.forEach(row => {
        // Hanya kecamatan bermasalah (Kuning & Merah) yang kita beri penugasan intervensi
        if (row.skor_komposit > 33) {
            let nilaiMaksimumSektoral = Math.max(row.skor_ekonomi, row.skor_sosial, row.skor_infrastruktur);
            
            if (nilaiMaksimumSektoral === row.skor_infrastruktur) daftarDinasPUPR.push(`Kec. ${row.nama}`);
            else if (nilaiMaksimumSektoral === row.skor_ekonomi) daftarDinasUMKM.push(`Kec. ${row.nama}`);
            else daftarDinasPerkim.push(`Kec. ${row.nama}`);
        }
    });

    // D. Render HTML Template Komponen Dashboard Rekomendasi
    wadahPanel.innerHTML = `
        <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
                <span class="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-wider">Wawasan Makro</span>
                <h3 class="text-sm font-bold text-slate-900 mt-2.5 mb-2">Ringkasan Beban Wilayah</h3>
                <p class="text-xs text-slate-500 leading-relaxed font-medium">
                    Pada periode evaluasi tahun <span class="font-bold text-slate-800">${tahunAktif}</span>, visualisasi matriks menunjukkan terdapat <span class="text-red-600 font-extrabold">${jumlahKritisMerah} kecamatan</span> dalam status kerawanan tinggi (Kritis) dan <span class="text-amber-600 font-extrabold">${jumlahWaspadaKuning} kecamatan</span> berstatus Waspada.
                </p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
                Fokus Utama Peta: <span class="text-slate-700 font-bold">${jumlahKritisMerah + jumlahWaspadaKuning} Kawasan Prioritas</span>
            </div>
        </div>

        <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
                <span class="text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase tracking-wider">Lokasi Prioritas 1</span>
                <h3 class="text-sm font-bold text-slate-900 mt-2.5 mb-2">Intervensi Utama Kota</h3>
                <p class="text-xs text-slate-500 leading-relaxed font-medium">
                    Kecamatan dengan tingkat urgensi pembangunan paling mendesak diduduki oleh <span class="text-slate-900 font-black">Kecamatan ${kecamatanUtamaKritis.nama}</span> dengan pencatatan indeks komposit sebesar <span class="text-red-600 font-extrabold">${kecamatanUtamaKritis.skor_komposit}/100</span>.
                </p>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-slate-400">
                Rekomendasi Tindakan: <span class="text-indigo-600 font-bold">Fokus APBD Wilayah</span>
            </div>
        </div>

        <div class="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex flex-col justify-between md:col-span-1">
            <div class="space-y-3">
                <span class="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">Delegasi Rencana Aksi</span>
                <h3 class="text-sm font-bold text-slate-900 mt-1">Saran Distribusi Kerja Dinas</h3>
                
                <div class="text-[11px] space-y-2">
                    <div class="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <b class="text-slate-800 font-bold block mb-0.5">🏗️ Dinas PUPR Padang:</b>
                        <span class="text-slate-500 leading-tight block font-semibold">${daftarDinasPUPR.length > 0 ? daftarDinasPUPR.join(', ') : 'Tidak ada rekomendasi proyek fisik.'}</span>
                        <span class="text-[9.5px] text-indigo-600 font-bold block mt-1">Aksi: Pengaspalan ulang & normalisasi drainase.</span>
                    </div>
                    <div class="p-2 bg-slate-50 border border-slate-100 rounded-xl">
                        <b class="text-slate-800 font-bold block mb-0.5">🏪 Dinas Koperasi & UMKM:</b>
                        <span class="text-slate-500 leading-tight block font-semibold">${daftarDinasUMKM.length > 0 ? daftarDinasUMKM.join(', ') : 'Tidak ada intervensi ekonomi.'}</span>
                        <span class="text-[9.5px] text-indigo-600 font-bold block mt-1">Aksi: Stimulus modal & inkubasi digital.</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// =========================================================================
// 📥 ENGINES EKSPOR MULTI-FORMAT (EXCEL, CSV, WORD, PDF)
// =========================================================================
function pemicuEksporMultiFormat() {
    const formatDipilih = document.getElementById('select-format-ekspor').value;
    if (formatDipilih === 'excel') eksporKeExcel();
    else if (formatDipilih === 'csv') eksporKeCSV();
    else if (formatDipilih === 'word') eksporKeWord();
    else if (formatDipilih === 'pdf') eksporKePDF();
}

function eksporKeExcel() {
    const namaFile = `Laporan_Prioritas_Wilayah_Padang_${tahunAktif}.xls`;
    const isiHtmlTabel = document.getElementById('wadah-tabel-cetak').innerHTML;
    const templateExcel = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><style>table { border-collapse: collapse; } th, td { border: 1px solid #cbd5e1; padding: 8px; font-family: sans-serif; }</style></head>
        <body><h2>MATRIKS PERINGKAT PRIORITAS WILAYAH KOTA PADANG TAHUN ${tahunAktif}</h2>${isiHtmlTabel}</body>
        </html>
    `;
    eksekusiUnduhBlob(templateExcel, 'application/vnd.ms-excel', namaFile);
}

function eksporKeCSV() {
    let isiCsv = "Peringkat,Nama Kecamatan,Skor Urgensi Ekonomi (UMKM),Skor Urgensi Sosial (Penduduk),Skor Urgensi Infrastruktur (Jalan),Skor Komposit Gabungan (IUPW)\n";
    dataSedangDitampilkan.forEach((row, index) => {
        isiCsv += `${index + 1},Kec. ${row.nama},${row.skor_ekonomi},${row.skor_sosial},${row.skor_infrastruktur},${row.skor_komposit}\n`;
    });
    eksekusiUnduhBlob("\uFEFF" + isiCsv, 'text/csv;charset=utf-8;', `Laporan_Prioritas_Wilayah_Padang_${tahunAktif}.csv`);
}

function eksporKeWord() {
    const namaFile = `Laporan_Prioritas_Wilayah_Padang_${tahunAktif}.doc`;
    const isiHtmlTabel = document.getElementById('wadah-tabel-cetak').innerHTML;
    const templateWord = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><style>table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #cbd5e1; padding: 10px; font-family: sans-serif; font-size: 12px; }</style></head>
        <body><h2 style="text-align: center;">LAPORAN PERINGKAT PRIORITAS PEMBANGUNAN WILAYAH</h2><p style="text-align: center;">Periode Data Evaluasi Spasial: Tahun ${tahunAktif}</p><br/>${isiHtmlTabel}</body>
        </html>
    `;
    eksekusiUnduhBlob(templateWord, 'application/msword', namaFile);
}

function eksporKePDF() {
    const judulAsliDokumen = document.title;
    document.title = `Laporan_Prioritas_Wilayah_Padang_${tahunAktif}`;
    window.print();
    document.title = judulAsliDokumen; 
}

function eksekusiUnduhBlob(konten, tipeMime, namaFile) {
    const blob = new Blob([konten], { type: tipeMime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = namaFile;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function pemicuGantiTahunRanking(tahunBaru) {
    tahunAktif = tahunBaru;
    ambilDataRanking();
}

// =========================================================================
// 🎛️ SORT ELEMENT SINKRONISASI
// =========================================================================
function pemicuSortRanking(kolom) {
    if (kolomSortAktif === kolom) {
        arahSortAsc = !arahSortAsc;
    } else {
        kolomSortAktif = kolom;
        arahSortAsc = false; 
    }
    prosesSortDanRenderTabel();
}

function perbaruiIconUrutan() {
    const semuaKolom = ['skor_ekonomi', 'skor_sosial', 'skor_infrastruktur', 'skor_komposit'];
    semuaKolom.forEach(k => {
        const elemen = document.getElementById(`icon-${k}`);
        if (elemen) {
            if (kolomSortAktif === k) {
                elemen.innerText = arahSortAsc ? "🔼" : "🔽";
                elemen.className = "text-indigo-600 ml-0.5 font-bold";
            } else {
                elemen.innerText = "⇅";
                elemen.className = "text-slate-300 ml-0.5";
            }
        }
    });
}

// =========================================================================
// 🔄 DYNAMIC FILTER INITIALIZER (REAL-TIME NGROK INTEGRATION)
// =========================================================================
function muatFilterTahunRankingDinamis() {
    // 🌟 REVISI: Mengarahkan fetch list tahun ke alamat HTTPS Ngrok aman dengan bypass header
    fetch('https://sermon-upward-sheet.ngrok-free.dev/api/tahun-tersedia', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => response.json())
        .then(daftarTahun => {
            const selectElement = document.getElementById('select-tahun-ranking');
            if (!selectElement) return;
            selectElement.innerHTML = ""; 

            if (daftarTahun.length > 0) {
                tahunAktif = daftarTahun[0].toString();
                daftarTahun.forEach((thn, index) => {
                    const labelTerbaru = index === 0 ? " (Terbaru)" : "";
                    selectElement.innerHTML += `<option value="${thn}" ${index === 0 ? 'selected' : ''}>Tahun ${thn}${labelTerbaru}</option>`;
                });
            } else {
                selectElement.innerHTML = `<option value="">Tidak ada data</option>`;
            }
            ambilDataRanking();
        })
        .catch(err => console.error("Gagal memuat filter tahun ranking dinamis:", err));
}

// Inisialisasi awal penarikan data peringkat
muatFilterTahunRankingDinamis();