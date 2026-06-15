const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🌟 MIDDLEWARE AMAN: Mengizinkan Vercel dan Live Server mengakses pipa data tanpa kendala CORS
app.use(cors());
app.use(express.json());

// Konfigurasi koneksi Pool Basis Data PostgreSQL via Environment Variables (.env)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test Koneksi Awal ke PostgreSQL saat server dinyalakan
pool.connect((err, client, release) => {
    if (err) {
        return console.error('🔴 Gagal menyambungkan koneksi ke PostgreSQL:', err.stack);
    }
    console.log('🟢 Pipa koneksi Driver Basis Data PostgreSQL berhasil diaktifkan.');
    release();
});

// =========================================================================
// 🌐 ENDPOINT 1: SPASIAL & KOROPLET INTERAKTIF (Untuk index.html / Peta Publik)
// =========================================================================
app.get('/api/urgensi-padang', async (req, res) => {
    try {
        const tahunDipilih = req.query.tahun || 2024;

        const querySql = `
            SELECT k.id, k.kecamatan, pt.jumlah_umkm, pt.kepadatan_penduduk, pt.persen_jalan_rusak,
            ST_AsGeoJSON(k.geom)::json AS geometry
            FROM kecamatan_padang k
            JOIN perkembangan_tahunan pt ON k.id = pt.kecamatan_id
            WHERE pt.tahun = $1;
        `;
        
        const result = await pool.query(querySql, [tahunDipilih]);
        const dataRows = result.rows;

        if (dataRows.length === 0) {
            return res.json({ type: "FeatureCollection", features: [] });
        }

        const maxUMKM = Math.max(...dataRows.map(r => r.jumlah_umkm));
        const minUMKM = Math.min(...dataRows.map(r => r.jumlah_umkm));
        const maxKepadatan = Math.max(...dataRows.map(r => r.kepadatan_penduduk));
        const minKepadatan = Math.min(...dataRows.map(r => r.kepadatan_penduduk));
        const maxJalan = Math.max(...dataRows.map(r => r.persen_jalan_rusak));
        const minJalan = Math.min(...dataRows.map(r => r.persen_jalan_rusak));

        const geojsonOutput = {
            type: "FeatureCollection",
            features: dataRows.map(row => {
                // RUMUS COST: Semakin sedikit UMKM = Urgensi makin tinggi
                const n_ekonomi = maxUMKM !== minUMKM ? ((maxUMKM - row.jumlah_umkm) / (maxUMKM - minUMKM)) * 100 : 0;
                
                // RUMUS BENEFIT: Semakin padat penduduk = Urgensi makin tinggi
                const n_sosial = maxKepadatan !== minKepadatan ? ((row.kepadatan_penduduk - minKepadatan) / (maxKepadatan - minKepadatan)) * 100 : 0;
                
                // RUMUS BENEFIT: Semakin tinggi persen jalan rusak = Urgensi makin tinggi
                const n_infra = maxJalan !== minJalan ? ((row.persen_jalan_rusak - minJalan) / (maxJalan - minJalan)) * 100 : 0;
                
                // Skor Gabungan (IUPW)
                const skorIupw = (n_ekonomi + n_sosial + n_infra) / 3;

                return {
                    type: "Feature",
                    properties: {
                        id: row.id,
                        nama: row.kecamatan,
                        umkm_asli: row.jumlah_umkm,
                        kepadatan_asli: row.kepadatan_penduduk,
                        jalan_asli: (row.persen_jalan_rusak * 100).toFixed(0) + "%",
                        
                        // Semua aspek sektoral dikirim sekaligus untuk mendukung multi-filtering di frontend
                        skor_komposit: parseFloat(skorIupw.toFixed(1)),
                        skor_ekonomi: parseFloat(n_ekonomi.toFixed(1)),
                        skor_sosial: parseFloat(n_sosial.toFixed(1)),
                        skor_infrastruktur: parseFloat(n_infra.toFixed(1)),
                        
                        // Tetap dipertahankan agar fungsi peta lama tidak error
                        skor_urgensi: parseFloat(skorIupw.toFixed(1))
                    },
                    geometry: row.geometry
                };
            })
        };

        res.json(geojsonOutput);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// 🛠️ ENDPOINT CRUD MANAJEMEN ATRIBUT TEMPORAL (Untuk admin.html / Panel Admin)
// =========================================================================

// 1. [READ] mengambil semua data perkembangan tahunan dalam bentuk tabel tabular
app.get('/api/perkembangan', async (req, res) => {
    try {
        const query = `
            SELECT pt.id, k.kecamatan AS nama_kecamatan, pt.kecamatan_id, pt.tahun, pt.jumlah_umkm, pt.kepadatan_penduduk, pt.persen_jalan_rusak
            FROM perkembangan_tahunan pt
            JOIN kecamatan_padang k ON pt.kecamatan_id = k.id
            ORDER BY pt.tahun DESC, k.kecamatan ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. [CREATE] Menambahkan rekam data indikator BPS baru per tahun (Dengan Server Guard)
app.post('/api/perkembangan', async (req, res) => {
    const { kecamatan_id, tahun, jumlah_umkm, kepadatan_penduduk, persen_jalan_rusak } = req.body;
    try {
        // 🔥 SERVER-SIDE ANTI-DUPLICATION GUARD
        // Memeriksa relasi silang di database apakah kombinasi kecamatan dan tahun tersebut sudah ada
        const cekDuplikat = await pool.query(
            "SELECT id FROM perkembangan_tahunan WHERE kecamatan_id = $1 AND tahun = $2",
            [kecamatan_id, tahun]
        );

        if (cekDuplikat.rows.length > 0) {
            return res.status(400).json({ 
                error: true,
                message: `Data indikator untuk ID kecamatan ${kecamatan_id} pada tahun ${tahun} sudah terekam di sistem!` 
            });
        }

        const query = `
            INSERT INTO perkembangan_tahunan (kecamatan_id, tahun, jumlah_umkm, kepadatan_penduduk, persen_jalan_rusak)
            VALUES ($1, $2, $3, $4, $5) RETURNING *;
        `;
        const result = await pool.query(query, [kecamatan_id, tahun, jumlah_umkm, kepadatan_penduduk, persen_jalan_rusak]);
        res.status(201).json({ message: "Data BPS berhasil ditambahkan ke database!", data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. [UPDATE] Memperbarui/mengubah nilai indikator data berdasarkan ID tertentu
app.put('/api/perkembangan/:id', async (req, res) => {
    const { id } = req.params;
    const { jumlah_umkm, kepadatan_penduduk, persen_jalan_rusak } = req.body;
    try {
        const query = `
            UPDATE perkembangan_tahunan
            SET jumlah_umkm = $1, kepadatan_penduduk = $2, persen_jalan_rusak = $3
            WHERE id = $4 RETURNING *;
        `;
        const result = await pool.query(query, [jumlah_umkm, kepadatan_penduduk, persen_jalan_rusak, id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Data target tidak ditemukan!" });
        }
        res.json({ message: "Data BPS berhasil diperbarui!", data: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. [DELETE] Menghapus satu rekam baris data temporal di database berdasarkan ID
app.delete('/api/perkembangan/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = "DELETE FROM perkembangan_tahunan WHERE id = $1 RETURNING *;";
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "Data target gagal ditemukan!" });
        }
        res.json({ message: "Data sukses dihapus dari sistem!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. [READ DISTINCT YEARS] Mengambil daftar tahun unik yang tersedia di database secara dinamis
app.get('/api/tahun-tersedia', async (req, res) => {
    try {
        const query = "SELECT DISTINCT tahun FROM perkembangan_tahunan ORDER BY tahun DESC;";
        const result = await pool.query(query);
        const daftarTahun = result.rows.map(row => row.tahun);
        res.json(daftarTahun);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// =========================================================================
// 🚀 RUNNING PORT SERVER
// =========================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server Backend WebGIS Kelompok 3 menyala aman di port ${PORT}`));