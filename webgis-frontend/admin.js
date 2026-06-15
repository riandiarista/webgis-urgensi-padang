const URL_API = "http://localhost:3000/api/perkembangan";
let modeForm = "tambah"; 

// BARU: State Global untuk Manajemen Sinkronisasi Searching & Sorting
let arrayMasterAdmin = []; 
let kolomSortAktif = "";   
let arahSortAsc = true;    

// 1. Ambil data awal dari database dan simpan ke variabel penampung global
function ambilDataTabelAdmin() {
    fetch(URL_API)
        .then(res => res.json())
        .then(data => {
            arrayMasterAdmin = data; // Simpan data asli murni dari database
            filterDanSortDataEksekutif(); // Jalankan penyaringan dan pengurutan
        })
        .catch(err => console.error("Gagal menarik data atribut:", err));
}

// BARU: Fungsi Utama Pemroses Filter Kata Kunci & Arah Pengurutan Kolom
function filterDanSortDataEksekutif() {
    const kataKunci = document.getElementById('search-admin').value.toLowerCase().trim();
    let dataHasilProses = [...arrayMasterAdmin]; // Duplikasi array master agar data asli tetap terjaga

    // A. ENGINE FITUR SEARCHING (Menyaring nama kecamatan atau tahun secara parsial)
    if (kataKunci !== "") {
        dataHasilProses = dataHasilProses.filter(row => {
            return row.nama_kecamatan.toLowerCase().includes(kataKunci) || 
                   row.tahun.toString().includes(kataKunci);
        });
    }

    // B. ENGINE FITUR SORTING (Mengurutkan berdasarkan tipe data huruf atau angka)
    if (kolomSortAktif !== "") {
        dataHasilProses.sort((a, b) => {
            let nilaiA = a[kolomSortAktif];
            let nilaiB = b[kolomSortAktif];

            // Jika mengurutkan teks (Nama Kecamatan)
            if (typeof nilaiA === 'string') {
                return arahSortAsc ? nilaiA.localeCompare(nilaiB) : nilaiB.localeCompare(nilaiA);
            } 
            // Jika mengurutkan angka (Tahun, UMKM, Kepadatan, Jalan)
            else {
                return arahSortAsc ? nilaiA - nilaiB : nilaiB - nilaiA;
            }
        });
    }

    // Perbarui indikator visual tanda panah (icon) di header tabel
    perbaruiIndikatorIconSort();
    
    // Kirim data hasil filter & sort ke fungsi render tampilan tabel HTML
    renderBarisTabelHTML(dataHasilProses);
}

// BARU: Fungsi Khusus untuk Menggambar/Merender Ulang Baris Tabel
function renderBarisTabelHTML(data) {
    const wadahTabel = document.getElementById('tabel-body-admin');
    wadahTabel.innerHTML = ""; 

    if (data.length === 0) {
        wadahTabel.innerHTML = `
            <tr>
                <td colspan="6" class="py-8 text-center text-slate-400 font-medium">Data tidak ditemukan. Silakan masukkan kata kunci pencarian yang lain.</td>
            </tr>
        `;
        return;
    }

    data.forEach(row => {
        wadahTabel.innerHTML += `
            <tr class="hover:bg-slate-50/80 transition duration-150">
                <td class="py-4 px-6 font-bold text-slate-900">${row.nama_kecamatan}</td>
                <td class="py-4 px-6 text-center"><span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">${row.tahun}</span></td>
                <td class="py-4 px-6">${row.jumlah_umkm.toLocaleString('id-ID')} Unit</td>
                <td class="py-4 px-6">${row.kepadatan_penduduk.toLocaleString('id-ID')} jw/km²</td>
                <td class="py-4 px-6 font-bold text-red-500">${(row.persen_jalan_rusak * 100).toFixed(0)}%</td>
                <td class="py-4 px-6 text-center flex justify-center gap-2">
                    <button onclick="bukaFormEdit(${JSON.stringify(row).replace(/"/g, '&quot;')})" class="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1 rounded-lg transition duration-150">✏️ Edit</button>
                    <button onclick="eksekusiHapusData(${row.id})" class="bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-lg transition duration-150">🗑️ Hapus</button>
                </td>
            </tr>
        `;
    });
}

// BARU: Pemicu Aksi Input Kotak Pencarian
function pemicuCariAdmin() {
    filterDanSortDataEksekutif();
}

// BARU: Pemicu Klik Judul Kolom (Header) Tabel untuk Mengaktifkan Sortir
function pemicuSortAdmin(kolom) {
    if (kolomSortAktif === kolom) {
        arahSortAsc = !arahSortAsc; // Balik arah sortir jika kolom yang sama diklik ulang
    } else {
        kolomSortAktif = kolom; // Aktifkan kolom sortir baru
        arahSortAsc = true;    // Set default awal ke terkecil (Ascending)
    }
    filterDanSortDataEksekutif();
}

// BARU: Merender Indikator Tanda Panah Naik/Turun pada Header Kolom aktif
function perbaruiIndikatorIconSort() {
    const semuaKolom = ['nama_kecamatan', 'tahun', 'jumlah_umkm', 'kepadatan_penduduk', 'persen_jalan_rusak'];
    semuaKolom.forEach(k => {
        const elemenIcon = document.getElementById(`sort-icon-${k}`);
        if (elemenIcon) {
            if (kolomSortAktif === k) {
                elemenIcon.innerText = arahSortAsc ? "🔼" : "🔽";
                elemenIcon.className = "text-indigo-600 ml-1 font-bold";
            } else {
                elemenIcon.innerText = "⇅";
                elemenIcon.className = "text-slate-300 ml-1";
            }
        }
    });
}

// 2. Tampilkan Modal untuk penambahan data baru
function bukaFormTambah() {
    modeForm = "tambah";
    document.getElementById('modal-title').innerText = "➕ Tambah Rekam Indikator BPS";
    document.getElementById('form-id-data').value = "";
    document.getElementById('form-tahun').value = "";
    document.getElementById('form-umkm').value = "";
    document.getElementById('form-kepadatan').value = "";
    document.getElementById('form-jalan').value = "";
    
    document.getElementById('container-select-kecamatan').style.display = "block";
    document.getElementById('form-tahun').disabled = false;
    
    document.getElementById('modal-crud').classList.remove('hidden');
}

// 3. Tampilkan Modal dengan isian data lama untuk proses pengeditan
function bukaFormEdit(rowData) {
    modeForm = "edit";
    document.getElementById('modal-title').innerText = `✏️ Edit Atribut: ${rowData.nama_kecamatan} (${rowData.tahun})`;
    document.getElementById('form-id-data').value = rowData.id;
    document.getElementById('form-tahun').value = rowData.tahun;
    document.getElementById('form-umkm').value = rowData.jumlah_umkm;
    document.getElementById('form-kepadatan').value = rowData.kepadatan_penduduk;
    document.getElementById('form-jalan').value = rowData.persen_jalan_rusak;
    
    document.getElementById('container-select-kecamatan').style.display = "none";
    document.getElementById('form-tahun').disabled = true;

    document.getElementById('modal-crud').classList.remove('hidden');
}

function tutupModalForm() {
    document.getElementById('modal-crud').classList.add('hidden');
}

// 4. Proses Simpan Data (Menangani Method POST dan PUT dengan Animasi Pop-up Premium)
function simpanDataForm(event) {
    event.preventDefault();

    const id = document.getElementById('form-id-data').value;
    const bodyData = {
        jumlah_umkm: parseInt(document.getElementById('form-umkm').value),
        kepadatan_penduduk: parseInt(document.getElementById('form-kepadatan').value),
        persen_jalan_rusak: parseFloat(document.getElementById('form-jalan').value)
    };

    let urlTarget = URL_API;
    let metodeHttp = "POST";

    if (modeForm === "tambah") {
        bodyData.kecamatan_id = parseInt(document.getElementById('form-kecamatan').value);
        bodyData.tahun = parseInt(document.getElementById('form-tahun').value);
    } else {
        urlTarget = `${URL_API}/${id}`;
        metodeHttp = "PUT";
    }

    fetch(urlTarget, {
        method: metodeHttp,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
    })
    .then(res => res.json())
    .then(resData => {
        tutupModalForm();
        
        // ✨ PERBAIKAN: Mengganti alert() simpan data dengan SweetAlert2 Success Card
        Swal.fire({
            title: "Aksi Berhasil!",
            text: resData.message || "Data indikator BPS kecamatan telah sukses diperbarui.",
            icon: "success",
            confirmButtonColor: "#4f46e5"
        }).then(() => {
            ambilDataTabelAdmin(); // Memuat ulang isi baris tabel grid
        });
    })
    .catch(err => {
        // ✨ PERBAIKAN: Mengganti alert() error simpan dengan SweetAlert2 Error Card
        Swal.fire({
            title: "Gagal Menyimpan!",
            text: "Terjadi gangguan koneksi sistem saat mencoba mengamankan data.",
            icon: "error",
            confirmButtonColor: "#b91c1c"
        });
    });
}

// 5. Eksekusi Penghapusan Data Rekaman (Kotak Dialog Konfirmasi Interaktif)
function eksekusiHapusData(id) {
    // ✨ PERBAIKAN: Mengganti confirm() lama dengan Dialog Konfirmasi SweetAlert2 Dua Tombol
    Swal.fire({
        title: "Apakah Anda Yakin?",
        text: "Data rekam berkala ini akan dihapus permanen dari basis data PostgreSQL!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#b91c1c", // Merah untuk aksi hapus
        cancelButtonColor: "#64748b",  // Slate gray untuk batal
        confirmButtonText: "Ya, Hapus Data!",
        cancelButtonText: "Batal"
    }).then((result) => {
        // Jika user memantapkan pilihan untuk menghapus data rekam target
        if (result.isConfirmed) {
            fetch(`${URL_API}/${id}`, { method: "DELETE" })
                .then(res => res.json())
                .then(resData => {
                    // ✨ PERBAIKAN: Mengganti alert() berhasil hapus lama dengan SweetAlert2
                    Swal.fire({
                        title: "Terhapus!",
                        text: resData.message || "Data sukses dibersihkan dari sistem.",
                        icon: "success",
                        confirmButtonColor: "#4f46e5"
                    });
                    ambilDataTabelAdmin(); // Sinkronisasi ulang render tabel grid admin
                })
                .catch(err => {
                    // ✨ PERBAIKAN: Mengganti alert() gagal hapus lama dengan SweetAlert2
                    Swal.fire({
                        title: "Gagal Menghapus!",
                        text: "Gagal mengeksekusi perintah hapus akibat kendala restu server backend.",
                        icon: "error",
                        confirmButtonColor: "#b91c1c"
                    });
                });
        }
    });
}

// Jalankan fungsi muat tabel saat halaman admin pertama kali diakses browser
ambilDataTabelAdmin();