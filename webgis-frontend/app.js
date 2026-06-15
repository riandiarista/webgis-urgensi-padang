// =========================================================================
// 🗺️ CONFIGURATION & MAP INITIALIZATION
// =========================================================================
const map = L.map('map-canvas', { zoomControl: false }).setView([-0.947, 100.417], 12);

// Pindahkan posisi tombol Zoom (+ -) Leaflet ke pojok kanan bawah agar layout kiri bersih
L.control.zoom({ position: 'bottomright' }).addTo(map);

// Menggunakan CartoDB Positron Basemap agar visualisasi Koroplet terlihat kontras
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

// STATE FILTER GLOBAL (Variabel Penampung Keadaan Filter Saat Ini)
let layerGisKecamatan;
let cacheDataGeoJSON = null; 
let tahunAktif = '2024';
let aspekAktif = 'komposit'; 
let showTinggi = true;
let showMenengah = true;
let showRendah = true;

// =========================================================================
// 🎨 SPATIAL STYLING & COLOR CLASSIFICATION
// =========================================================================
function dapatkanWarnaKlasifikasi(skor) {
    return skor > 66 ? '#800026' : // Merah Tua: Urgensi Kritis (Tinggi)
           skor > 33 ? '#FEB24C' : // Oranye/Kuning: Urgensi Waspada (Menengah)
                       '#238B45' ; // Hijau: Urgensi Stabil (Rendah)
}

function dapatkanSkorBerdasarkanAspek(properties) {
    if (aspekAktif === 'ekonomi') return properties.skor_ekonomi;
    if (aspekAktif === 'sosial') return properties.skor_sosial;
    if (aspekAktif === 'infrastruktur') return properties.skor_infrastruktur;
    return properties.skor_komposit; 
}

function setGayaPoligon(feature) {
    let skor = dapatkanSkorBerdasarkanAspek(feature.properties);
    return {
        fillColor: dapatkanWarnaKlasifikasi(skor),
        weight: 1.5,
        opacity: 1,
        color: '#ffffff', // Garis batas antar kecamatan berwarna putih bersih
        dashArray: '3',
        fillOpacity: 0.7
    };
}

// =========================================================================
// 🚀 RENDERING & DATA FETCHING ENGINE (AJAX)
// =========================================================================
function muatDataWebGis() {
    // 🌟 REVISI: Ditambahkan Header Rahasia bypass Ngrok Browser Warning
    fetch(`https://sermon-upward-sheet.ngrok-free.dev/api/urgensi-padang?tahun=${tahunAktif}`, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => response.json())
        .then(geojsonResource => {
            cacheDataGeoJSON = geojsonResource; 
            prosesRenderUlangPetaSpasial();    
        })
        .catch(error => console.error("Koneksi API Spasial Terputus:", error));
}

function prosesRenderUlangPetaSpasial() {
    if (!cacheDataGeoJSON) return;

    if (layerGisKecamatan) {
        map.removeLayer(layerGisKecamatan);
    }

    layerGisKecamatan = L.geoJSON(cacheDataGeoJSON, {
        filter: function (feature) {
            let skor = dapatkanSkorBerdasarkanAspek(feature.properties);
            if (skor > 66 && !showTinggi) return false;                 
            if (skor > 33 && skor <= 66 && !showMenengah) return false; 
            if (skor <= 33 && !showRendah) return false;                
            return true; 
        },
        style: setGayaPoligon,
        onEachFeature: function (feature, layer) {
            let skorAktif = dapatkanSkorBerdasarkanAspek(feature.properties);
            let namaKecamatan = feature.properties.nama;
            
            let labelAspek = aspekAktif === 'ekonomi' ? 'Skor Urgensi Ekonomi (UMKM)' :
                             aspekAktif === 'sosial' ? 'Skor Urgensi Sosial (Penduduk)' :
                             aspekAktif === 'infrastruktur' ? 'Skor Urgensi Infra (Jalan Rusak)' :
                             'Skor IUPW Gabungan Komposit';

            // 🧠 AUTOMATED ROOT-CAUSE ENGINE JAVASCRIPT
            let teksAkarMasalah = "";
            let warnaTeksAkar = "";
            let nilaiTerburuk = Math.max(feature.properties.skor_ekonomi, feature.properties.skor_sosial, feature.properties.skor_infrastruktur);
            
            if (feature.properties.skor_komposit <= 33) {
                teksAkarMasalah = "Kawasan aman, mandiri, dan stabil.";
                warnaTeksAkar = "text-emerald-600";
            } else if (nilaiTerburuk === feature.properties.skor_infrastruktur) {
                teksAkarMasalah = "Kerusakan aksesibilitas fisik jalan raya.";
                warnaTeksAkar = "text-red-600 bg-red-50 px-1.5 py-0.5 rounded";
            } else if (nilaiTerburuk === feature.properties.skor_ekonomi) {
                teksAkarMasalah = "Kelangkaan unit aktivitas usaha UMKM.";
                warnaTeksAkar = "text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded";
            } else {
                teksAkarMasalah = "Overload spasial kepadatan penduduk.";
                warnaTeksAkar = "text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded";
            }

            // 📸 TUNING FOTO LANDMARK & ANTARA FALLBACK ANTI-ERROR
            let namaFileFoto = namaKecamatan.toLowerCase().trim().replace(/\s+/g, '-');
            let pathFotoLokal = `images/${namaFileFoto}.jpg`;
            
            // Foto cadangan arsitektur Rumah Gadang Sumatra Barat jika file lokal tidak ditemukan
            let fotoDefaultFallback = "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?q=80&w=400";

            layer.bindPopup(`
                <div class="font-sans text-slate-800 p-0 min-w-[210px] -mx-1 -my-1">
                    <img src="${pathFotoLokal}" 
                         onerror="this.onerror=null; this.src='${fotoDefaultFallback}';" 
                         class="w-full h-24 object-cover rounded-t-xl mb-2.5 shadow-inner" 
                         alt="Landmark ${namaKecamatan}">
                    
                    <div class="px-2 pb-2">
                        <h3 class="font-black text-sm border-b pb-1 mb-2 text-slate-900">Kec. ${namaKecamatan}</h3>
                        <div class="space-y-1 text-xs font-medium text-slate-500">
                            <p class="flex justify-between"><span>🏪 Data UMKM:</span> <b class="text-slate-700">${feature.properties.umkm_asli} Unit</b></p>
                            <p class="flex justify-between"><span>👥 Kepadatan:</span> <b class="text-slate-700">${feature.properties.kepadatan_asli} jw/km²</b></p>
                            <p class="flex justify-between"><span>🏗️ Jalan Rusak:</span> <b class="text-red-600">${feature.properties.jalan_asli}</b></p>
                        </div>
                        
                        <div class="mt-2.5 pt-2 border-t text-[10px] font-medium text-slate-400">
                            <span class="block uppercase tracking-wider font-bold mb-0.5">⚠️ Diagnosis Utama:</span>
                            <span class="font-bold ${warnaTeksAkar} text-[10.5px] leading-tight block mt-0.5">${teksAkarMasalah}</span>
                        </div>

                        <div class="mt-2.5 pt-2 border-t flex flex-col gap-1 text-[11px]">
                            <span class="font-bold text-slate-400 uppercase text-[9px] tracking-wider">${labelAspek}:</span>
                            <span class="px-2 py-1 rounded font-black text-white text-center text-xs block shadow-sm" style="background-color: ${dapatkanWarnaKlasifikasi(skorAktif)}">
                                ${skorAktif} / 100
                            </span>
                        </div>
                    </div>
                </div>
            `, { 
                closeButton: false, 
                autoPan: false,
                offset: L.point(0, -10) 
            });

            // EVENT INTERAKTIF MOUSE TRACKING POINTER EFFECT
            layer.on({
                mouseover: function (e) {
                    const objekPoligon = e.target;
                    objekPoligon.openPopup(e.latlng); 
                    objekPoligon.setStyle({
                        weight: 3,
                        color: '#4f46e5',
                        fillOpacity: 0.85
                    });
                },
                mousemove: function (e) {
                    const objekPoligon = e.target;
                    objekPoligon.getPopup().setLatLng(e.latlng); 
                },
                mouseout: function (e) {
                    const objekPoligon = e.target;
                    objekPoligon.closePopup(); 
                    objekPoligon.setStyle(setGayaPoligon(feature));
                }
            });
        }
    }).addTo(map);
}

// =========================================================================
// 🎛️ CONTROLLER & INTERACTIVE EVENT HANDLERS
// =========================================================================
function pemicuGantiTahun(tahunBaru) {
    tahunAktif = tahunBaru;
    muatDataWebGis(); 
}

// Fixed minor typo dari aspectosAktif ke aspekAktif
function pemicuGantiAspek(aspekBaru) {
    aspekAktif = aspekBaru; 
    prosesRenderUlangPetaSpasial(); 
}

function pemicuGantiCheckbox() {
    showTinggi = document.getElementById('check-tinggi').checked;
    showMenengah = document.getElementById('check-menengah').checked;
    showRendah = document.getElementById('check-rendah').checked;
    prosesRenderUlangPetaSpasial(); 
}

// =========================================================================
// 🔍 SEARCH ENGINE LAYER (SMOOTH FLY NAVIGATION)
// =========================================================================
function eksekusiPencarianSpasial() {
    const kataKunciCari = document.getElementById('search-box').value.toLowerCase().trim();
    if (!layerGisKecamatan || kataKunciCari === "") return;

    let statusDitemukan = false;

    layerGisKecamatan.eachLayer(function (layer) {
        const namaKecamatanPeta = layer.feature.properties.nama.toLowerCase();

        if (namaKecamatanPeta.includes(kataKunciCari)) {
            statusDitemukan = true;
            map.flyTo(layer.getBounds().getCenter(), 14, { animate: true, duration: 1.5 });
            layer.setStyle({ color: '#FFD700', weight: 4 }); 

            setTimeout(() => {
                layer.openPopup(layer.getBounds().getCenter());
                layer.setStyle({ color: '#ffffff', weight: 1.5 }); 
            }, 1500);
        }
    });

    if (!statusDitemukan) {
        alert(`Kecamatan "${document.getElementById('search-box').value}" tidak ditemukan atau sedang tersembunyi oleh filter!`);
    }
}

// =========================================================================
// 🔄 DYNAMIC FILTER INITIALIZER (REAL-TIME POSTGIS INTEGRATION)
// =========================================================================
function muatFilterTahunDinamis() {
    // 🌟 REVISI: Dialihkan ke Live HTTPS Ngrok dan ditambahkan Header Bypass Warning
    fetch('https://sermon-upward-sheet.ngrok-free.dev/api/tahun-tersedia', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
    })
        .then(response => response.json())
        .then(daftarTahun => {
            const selectElement = document.getElementById('select-tahun');
            if (!selectElement) return;
            selectElement.innerHTML = ""; 

            if (daftarTahun.length > 0) {
                tahunAktif = daftarTahun[0].toString();
                daftarTahun.forEach((thn, index) => {
                    const labelTerbaru = index === 0 ? " (Terbaru)" : "";
                    selectElement.innerHTML += `<option value="${thn}" ${index === 0 ? 'selected' : ''}>Tahun ${thn}${labelTerbaru}</option>`;
                });
            } else {
                selectElement.innerHTML = `<option value="">Belum ada data</option>`;
            }
            muatDataWebGis();
        })
        .catch(error => console.error("Gagal memuat filter tahun dinamis:", error));
}

// =========================================================================
// 🚪 LOGOUT ENGINE INTERAKTIF (SWEETALERT2 INTEGRATION)
// =========================================================================
function pemicuLogoutSistem() {
    Swal.fire({
        title: "Keluar dari Sistem?",
        text: "Anda akan mengakhiri sesi dasbor eksekutif perencana wilayah ini.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#b91c1c", 
        cancelButtonColor: "#64748b",  
        confirmButtonText: "Ya, Logout",
        cancelButtonText: "Batal"
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = "login.html";
        }
    });
}

// Inisialisasi awal aplikasi
muatFilterTahunDinamis();