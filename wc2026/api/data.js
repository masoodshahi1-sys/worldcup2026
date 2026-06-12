// /api/data.js
// Simple key-value API backed by Vercel KV (Upstash Redis under the hood)
// Usage:
//   GET  /api/data?key=matches      -> { value: ... } or { value: null }
//   POST /api/data { key, value }   -> stores value under key

import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Allow same-origin requests (no CORS issues since frontend is same domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'Missing key' });
      const value = await kv.get(key);
      return res.status(200).json({ value: value ?? null });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'Missing key' });
      await kv.set(key, value);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
