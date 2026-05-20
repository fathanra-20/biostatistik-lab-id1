import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch existing scores
    let scores = await kv.get('biostatistik_lab_scores') || [];
    
    // If it's a string, parse it
    if (typeof scores === 'string') {
      try {
        scores = JSON.parse(scores);
      } catch (e) {
        scores = [];
      }
    }

    res.status(200).json(scores);
  } catch (error) {
    console.error('Error fetching scores from KV:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
