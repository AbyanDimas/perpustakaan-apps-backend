import request from 'supertest';

// Alamat server API yang sedang berjalan.
// Ambil dari environment variable jika ada, jika tidak, gunakan localhost.
// Ini memungkinkan kita menjalankan tes yang sama untuk lingkungan yang berbeda.
const API_URL = process.env.TEST_TARGET_URL || 'http://localhost:3001';

describe('Simulasi Beban dan Rate Limiting', () => {

  // Tes 1: Pengecekan sederhana untuk memastikan API aktif
  it('Harus berhasil mendapatkan status API pada satu permintaan', async () => {
    const response = await request(API_URL).get('/api/stats');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalBooks');
  });

  // Tes 2: Simulasi Brute-Force untuk menguji Rate Limiter
  describe('Simulasi Rate Limiter', () => {
    it('Harus memblokir permintaan setelah melampaui batas (100 permintaan)', async () => {
      const agent = request.agent(API_URL); // Gunakan agent untuk menyimulasikan satu pengguna/IP
      let response;

      console.log('Memulai simulasi 101 permintaan... Ini mungkin memakan waktu sekitar 10-20 detik.');

      // Kirim 100 permintaan pertama, semuanya harus berhasil (status 200)
      for (let i = 1; i <= 100; i++) {
        response = await agent.get('/api/genres');
        expect(response.status).toBe(200);
        if (i % 10 === 0) {
          console.log(`Permintaan ke-${i} berhasil...`);
        }
      }

      console.log('Batas 100 permintaan berhasil. Mengirim permintaan ke-101 untuk tes pemblokiran...');

      // Permintaan ke-101, ini harus diblokir (status 429)
      response = await agent.get('/api/genres');
      expect(response.status).toBe(429);
      expect(response.text).toContain('Too many requests');

      console.log('Tes berhasil! Permintaan ke-101 diblokir dengan status 429.');
    });
  });
});
