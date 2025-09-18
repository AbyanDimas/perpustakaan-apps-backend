import rateLimit from 'express-rate-limit';

export const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 menit
	max: 10000, // Batasi setiap IP hingga 100 permintaan per `window`
	standardHeaders: true, // Kembalikan info rate limit di header `RateLimit-*`
	legacyHeaders: false, // Nonaktifkan header `X-RateLimit-*`
});

export const bookUploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 50000, // Batasi setiap IP hingga 5 permintaan per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Terlalu banyak permintaan upload buku, coba lagi setelah 1 menit',
});
