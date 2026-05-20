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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { JSONBIN_ID, JSONBIN_KEY } = process.env;
  
  if (!JSONBIN_ID || !JSONBIN_KEY) {
    return res.status(500).json({ error: 'Database credentials not configured' });
  }

  try {
    const entry = req.body;
    
    // 1. Fetch current scores
    const getRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': JSONBIN_KEY
      }
    });
    
    const getData = await getRes.json();
    let scores = [];
    if (getData.record && Array.isArray(getData.record)) {
      scores = getData.record;
    } else if (getData.record && getData.record.scores) {
      scores = getData.record.scores;
    }

    // 2. Filter out duplicate NPMs
    scores = scores.filter(e => e.npm !== entry.npm);
    
    // 3. Add the new score
    scores.push(entry);

    // 4. Update the JSON bin
    const putRes = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': JSONBIN_KEY
      },
      body: JSON.stringify(scores)
    });
    
    if (!putRes.ok) {
      throw new Error('Failed to save to JSONBin');
    }

    res.status(200).json({ success: true, count: scores.length });
  } catch (error) {
    console.error('Error saving score:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
