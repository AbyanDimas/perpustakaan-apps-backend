import path from 'path';

const port = 5000;
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${port}`;

export const getFullUrl = (filePath: string | null | undefined) => {
  if (!filePath) return null;
  return `${API_BASE_URL}/uploads/${path.basename(filePath)}`;
};
