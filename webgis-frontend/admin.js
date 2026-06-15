const URL_API = "https://sermon-upward-sheet.ngrok-free.dev/api/perkembangan";
let modeForm = "tambah"; 

// State Global untuk Manajemen Sinkronisasi Searching & Sorting
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

// Fungsi Utama Pemroses Filter Kata Kunci & Arah Pengurutan Kolom
function filterDanSortDataEksekutif() {
    const kataKunci = document.getElementById('search-admin').value.toLowerCase().trim();
    let dataHasilProses = [...arrayMasterAdmin]; // Duplikasi array master agar data asli tetap terjaga

    // A. ENGINE FITUR SEARCHING
    if (kataKunci !== "") {
        dataHasilProses = dataHasilProses.filter(row => {
            return row.nama_kecamatan.toLowerCase().includes(kataKunci) || 
                   row.tahun.toString().includes(kataKunci);
        });
    }

    // B. ENGINE FITUR SORTING
    if (kolomSortAktif !== "") {
        dataHasilProses.sort((a, b) => {
            let nilaiA = a[kolomSortAktif];
            let nilaiB = b[kolomSortAktif];

            if (typeof nilaiA === 'string') {
                return arahSortAsc ? nilaiA.localeCompare(nilaiB) : nilaiB.localeCompare(nilaiA);
            } else {
                return arahSortAsc ? nilaiA - nilaiB : nilaiB - nilaiA;
            }
        });
    }

    perbaruiIndikatorIconSort();
    renderBarisTabelHTML(dataHasilProses);
}

// Fungsi Khusus untuk Menggambar/Merender Ulang Baris Tabel
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

function pemicuCariAdmin() {
    filterDanSortDataEksekutif();
}

function pemicuSortAdmin(kolom) {
    if (kolomSortAktif === kolom) {
        arahSortAsc = !arahSortAsc;
    } else {
        kolomSortAktif = kolom;
        arahSortAsc = true;
    }
    filterDanSortDataEksekutif();
}

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

// 4. Proses Simpan Data (POST & PUT) dengan Deteksi Duplikasi Cerdas
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
        const selectKecamatan = document.getElementById('form-kecamatan');
        const namaKecamatanPilihan = selectKecamatan.options[selectKecamatan.selectedIndex].text.replace("Kec. ", "").trim().toLowerCase();
        const tahunPilihan = parseInt(document.getElementById('form-tahun').value);

        // 🔥 STRATEGIC GUARD: Validasi Duplikasi di Sisi Klien Sebelum Hit Server
        const adakahDuplikat = arrayMasterAdmin.some(row => 
            row.nama_kecamatan.toLowerCase().trim() === namaKecamatanPilihan && 
            parseInt(row.tahun) === tahunPilihan
        );

        if (adakahDuplikat) {
            Swal.fire({
                title: "Duplikasi Data Terdeteksi!",
                text: `Log indikator untuk Kecamatan ${selectKecamatan.options[selectKecamatan.selectedIndex].text} pada tahun ${tahunPilihan} sudah terekam di database. Silakan gunakan opsi 'Edit' pada tabel jika ingin mengubah nilai indikatornya.`,
                icon: "warning",
                confirmButtonColor: "#4f46e5"
            });
            return; // Menghentikan eksekusi, operasi POST ke backend dibatalkan!
        }

        bodyData.kecamatan_id = parseInt(selectKecamatan.value);
        bodyData.tahun = tahunPilihan;
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
        Swal.fire({
            title: "Aksi Berhasil!",
            text: resData.message || "Data indikator BPS kecamatan telah sukses diperbarui.",
            icon: "success",
            confirmButtonColor: "#4f46e5"
        }).then(() => {
            ambilDataTabelAdmin(); 
        });
    })
    .catch(err => {
        Swal.fire({
            title: "Gagal Menyimpan!",
            text: "Terjadi gangguan koneksi sistem saat mencoba mengamankan data.",
            icon: "error",
            confirmButtonColor: "#b91c1c"
        });
    });
}

// 5. Eksekusi Penghapusan Data Rekaman
function eksekusiHapusData(id) {
    Swal.fire({
        title: "Apakah Anda Yakin?",
        text: "Data rekam berkala ini akan dihapus permanen dari basis data PostgreSQL!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#b91c1c", 
        cancelButtonColor: "#64748b",  
        confirmButtonText: "Ya, Hapus Data!",
        cancelButtonText: "Batal"
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${URL_API}/${id}`, { method: "DELETE" })
                .then(res => res.json())
                .then(resData => {
                    Swal.fire({
                        title: "Terhapus!",
                        text: resData.message || "Data sukses dibersihkan dari sistem.",
                        icon: "success",
                        confirmButtonColor: "#4f46e5"
                    });
                    ambilDataTabelAdmin(); 
                })
                .catch(err => {
                    Swal.fire({
                        title: "Gagal Menghapus!",
                        text: "Gagal mengeksekusi perintah hapus akibat kendala server backend.",
                        icon: "error",
                        confirmButtonColor: "#b91c1c"
                    });
                });
        }
    });
}

// Jalankan fungsi muat tabel saat halaman admin pertama kali diakses browser
ambilDataTabelAdmin();