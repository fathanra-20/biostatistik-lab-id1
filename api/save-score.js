import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Add CORS headers to allow requests if needed, though usually same-origin on Vercel
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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const entry = req.body;
    
    // Fetch existing scores (default to empty array if key doesn't exist)
    let scores = await kv.get('biostatistik_lab_scores') || [];
    
    // If it's a string, parse it (just in case it was saved incorrectly before)
    if (typeof scores === 'string') {
      try {
        scores = JSON.parse(scores);
      } catch (e) {
        scores = [];
      }
    }

    // Filter out previous entry from the same NPM so we don't have duplicates for retakes
    scores = scores.filter(e => e.npm !== entry.npm);
    
    // Add the new score
    scores.push(entry);

    // Save updated scores back to KV
    await kv.set('biostatistik_lab_scores', scores);

    res.status(200).json({ success: true, count: scores.length });
  } catch (error) {
    console.error('Error saving score to KV:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
