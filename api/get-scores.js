export default async function handler(req, res) {
  // CORS headers
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

  const { JSONBIN_ID, JSONBIN_KEY } = process.env;
  
  if (!JSONBIN_ID || !JSONBIN_KEY) {
    return res.status(500).json({ error: 'Database credentials not configured' });
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_KEY
      }
    });
    
    const data = await response.json();
    
    let scores = [];
    if (data.record && Array.isArray(data.record)) {
      scores = data.record;
    } else if (data.record && data.record.scores) {
      scores = data.record.scores;
    }

    res.status(200).json(scores);
  } catch (error) {
    console.error('Error fetching scores:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
