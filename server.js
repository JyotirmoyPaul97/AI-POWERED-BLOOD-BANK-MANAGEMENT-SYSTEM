const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');
const db = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and parsing
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve the redesigned frontend static files

/* ============================================================
   IN-MEMORY FALLBACK STATE (if MySQL is not configured/offline)
   ============================================================ */
let memoryState = {
  inventory: {
    "A+": 18, "A-": 6, "B+": 14, "B-": 4,
    "O+": 22, "O-": 3, "AB+": 9, "AB-": 2
  },
  donors: [
    { id: 101, name: "Ananya Roy", bloodType: "O+", phone: "9830098300", city: "Kolkata", lastDonation_date: "2026-03-15" },
    { id: 102, name: "Rahul Sharma", bloodType: "A-", phone: "9876543210", city: "Mumbai", lastDonation_date: "2026-05-10" },
    { id: 103, name: "Siddharth Verma", bloodType: "O-", phone: "9900990099", city: "Kolkata", lastDonation_date: "2026-01-20" },
    { id: 104, name: "Priya Patel", bloodType: "AB+", phone: "9123456789", city: "Delhi", lastDonation_date: "2026-04-01" }
  ],
  requests: [
    { id: 201, hospital: "AMRI Hospital", bloodType: "O-", units: 2, urgency: "critical", status: "pending", date: new Date(Date.now() - 3600000 * 2).toISOString() },
    { id: 202, hospital: "Apollo Gleneagles", bloodType: "A+", units: 5, urgency: "urgent", status: "fulfilled", date: new Date(Date.now() - 3600000 * 24).toISOString() },
    { id: 203, hospital: "Peerless Hospital", bloodType: "B+", units: 1, urgency: "routine", status: "cancelled", date: new Date(Date.now() - 3600000 * 48).toISOString() }
  ]
};

// Helper: Check compatibility
const COMPAT = {
  "O-":["O-","O+","A-","A+","B-","B+","AB-","AB+"],
  "O+":["O+","A+","B+","AB+"],
  "A-":["A-","A+","AB-","AB+"],
  "A+":["A+","AB+"],
  "B-":["B-","B+","AB-","AB+"],
  "B+":["B+","AB+"],
  "AB-":["AB-","AB+"],
  "AB+":["AB+"]
}; // donor type -> recipient types it can receive from (Wait, compatibility is: O- can GIVE to anyone. AB+ can RECEIVE from anyone.)
// Let's verify compatibility helper:
// Donor type -> recipient types.
// A donor of type D can give to recipient R if COMPAT[D] includes R.
// That is exactly:
// "O-" is universal donor (can give to O-, O+, A-, A+, B-, B+, AB-, AB+). Correct.
// "AB+" is universal recipient (can only give to AB+). Correct.
// "O+" can give to O+, A+, B+, AB+. Correct.
// Let's make sure it's accurate:
// O- -> all
// O+ -> O+, A+, B+, AB+
// A- -> A-, A+, AB-, AB+
// A+ -> A+, AB+
// B- -> B-, B+, AB-, AB+
// B+ -> B+, AB+
// AB- -> AB-, AB+
// AB+ -> AB+
// This is correct!

/* ============================================================
   INVENTORY ENDPOINTS
   ============================================================ */
app.get('/api/inventory', async (req, res) => {
  try {
    if (db.isOnline()) {
      const rows = await db.query('SELECT blood_type, units FROM inventory');
      const inv = {};
      rows.forEach(r => { inv[r.blood_type] = r.units; });
      // Ensure all types exist
      const BLOOD_TYPES = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
      BLOOD_TYPES.forEach(t => { if (inv[t] === undefined) inv[t] = 0; });
      res.json({ status: 'success', data: inv, db: true });
    } else {
      res.json({ status: 'success', data: memoryState.inventory, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/inventory/adjust', async (req, res) => {
  const { bloodType, amount } = req.body;
  if (!bloodType || amount === undefined) {
    return res.status(400).json({ status: 'error', message: 'Missing bloodType or amount' });
  }
  try {
    const change = parseInt(amount) || 0;
    if (db.isOnline()) {
      // Fetch current units
      const rows = await db.query('SELECT units FROM inventory WHERE blood_type = ?', [bloodType]);
      let current = 0;
      if (rows.length > 0) {
        current = rows[0].units;
      }
      const nextVal = Math.max(0, current + change);
      await db.query('INSERT INTO inventory (blood_type, units) VALUES (?, ?) ON DUPLICATE KEY UPDATE units = ?', [bloodType, nextVal, nextVal]);
      res.json({ status: 'success', bloodType, units: nextVal, db: true });
    } else {
      const current = memoryState.inventory[bloodType] || 0;
      const nextVal = Math.max(0, current + change);
      memoryState.inventory[bloodType] = nextVal;
      res.json({ status: 'success', bloodType, units: nextVal, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/* ============================================================
   DONORS ENDPOINTS
   ============================================================ */
app.get('/api/donors', async (req, res) => {
  try {
    if (db.isOnline()) {
      const rows = await db.query('SELECT id, name, blood_type as bloodType, phone, city, DATE_FORMAT(last_donation_date, "%Y-%m-%d") as lastDonation_date FROM donors ORDER BY id DESC');
      res.json({ status: 'success', data: rows, db: true });
    } else {
      res.json({ status: 'success', data: memoryState.donors, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/donors', async (req, res) => {
  const { name, bloodType, phone, city, lastDonation } = req.body;
  if (!name || !bloodType) {
    return res.status(400).json({ status: 'error', message: 'Name and bloodType are required' });
  }
  try {
    const lastDate = lastDonation ? lastDonation : null;
    if (db.isOnline()) {
      const result = await db.query(
        'INSERT INTO donors (name, blood_type, phone, city, last_donation_date) VALUES (?, ?, ?, ?, ?)',
        [name, bloodType, phone || null, city || null, lastDate]
      );
      res.json({ status: 'success', data: { id: result.insertId, name, bloodType, phone, city, lastDonation_date: lastDate }, db: true });
    } else {
      const newDonor = { id: Date.now(), name, bloodType, phone, city, lastDonation_date: lastDate };
      memoryState.donors.push(newDonor);
      res.json({ status: 'success', data: newDonor, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/* ============================================================
   REQUESTS ENDPOINTS
   ============================================================ */
app.get('/api/requests', async (req, res) => {
  try {
    if (db.isOnline()) {
      const rows = await db.query('SELECT id, hospital, blood_type as bloodType, units, urgency, status, date FROM requests ORDER BY id DESC');
      res.json({ status: 'success', data: rows, db: true });
    } else {
      res.json({ status: 'success', data: memoryState.requests, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  const { hospital, bloodType, units, urgency } = req.body;
  if (!hospital || !bloodType || !units) {
    return res.status(400).json({ status: 'error', message: 'Missing hospital, bloodType or units' });
  }
  try {
    const qty = parseInt(units) || 1;
    const urg = urgency || 'routine';
    if (db.isOnline()) {
      const result = await db.query(
        'INSERT INTO requests (hospital, blood_type, units, urgency, status) VALUES (?, ?, ?, ?, ?)',
        [hospital, bloodType, qty, urg, 'pending']
      );
      const newReq = { id: result.insertId, hospital, bloodType, units: qty, urgency: urg, status: 'pending', date: new Date().toISOString() };
      res.json({ status: 'success', data: newReq, db: true });
    } else {
      const newReq = { id: Date.now(), hospital, bloodType, units: qty, urgency: urg, status: 'pending', date: new Date().toISOString() };
      memoryState.requests.push(newReq);
      res.json({ status: 'success', data: newReq, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'fulfilled' or 'cancelled'
  if (!status || !['fulfilled', 'cancelled'].includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Invalid or missing status' });
  }

  try {
    if (db.isOnline()) {
      // 1. Get the request details
      const reqRows = await db.query('SELECT blood_type, units, status FROM requests WHERE id = ?', [id]);
      if (reqRows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Request not found' });
      }
      const request = reqRows[0];
      if (request.status !== 'pending') {
        return res.status(400).json({ status: 'error', message: 'Only pending requests can be updated' });
      }

      // If fulfilling, deduct inventory
      if (status === 'fulfilled') {
        // Fetch current inventory
        const invRows = await db.query('SELECT units FROM inventory WHERE blood_type = ?', [request.blood_type]);
        const currentStock = invRows.length > 0 ? invRows[0].units : 0;
        if (currentStock < request.units) {
          return res.status(400).json({ status: 'error', message: `Insufficient inventory. Stock: ${currentStock} units. Needed: ${request.units} units.` });
        }
        // Deduct
        const nextVal = currentStock - request.units;
        await db.query('UPDATE inventory SET units = ? WHERE blood_type = ?', [nextVal, request.blood_type]);
      }

      // Update request status
      await db.query('UPDATE requests SET status = ? WHERE id = ?', [status, id]);
      res.json({ status: 'success', requestId: id, newStatus: status, db: true });
    } else {
      const request = memoryState.requests.find(r => r.id == id);
      if (!request) {
        return res.status(404).json({ status: 'error', message: 'Request not found' });
      }
      if (request.status !== 'pending') {
        return res.status(400).json({ status: 'error', message: 'Only pending requests can be updated' });
      }

      if (status === 'fulfilled') {
        const currentStock = memoryState.inventory[request.bloodType] || 0;
        if (currentStock < request.units) {
          return res.status(400).json({ status: 'error', message: `Insufficient inventory. Stock: ${currentStock} units. Needed: ${request.units} units.` });
        }
        memoryState.inventory[request.bloodType] = currentStock - request.units;
      }

      request.status = status;
      res.json({ status: 'success', requestId: id, newStatus: status, db: false });
    }
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/* ============================================================
   AI ENDPOINTS & INTEGRATION
   ============================================================ */

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    return new GoogleGenAI({ apiKey });
  }
  return null;
};

// AI chat assistant
app.post('/api/ai/chat', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ status: 'error', message: 'Missing question' });
  }

  const aiClient = getGeminiClient();
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are the in-app assistant for "Lifeline", a blood bank management system. Help with: blood type compatibility, donation eligibility rules, how to use the app (Admin tracks inventory/donors/requests, Donors register and check eligibility, Hospitals submit requests and get AI matching). Keep answers under 80 words, friendly and precise. Question: ${question}`
      });
      return res.json({ status: 'success', answer: response.text.trim() });
    } catch (e) {
      console.error('Gemini API Error:', e.message);
    }
  }

  // Fallback: Local Smart QA Heuristics
  const q = question.toLowerCase();
  let ans = "I am operating in local offline mode. How can I help you today?";
  if (q.includes('eligibility') || q.includes('eligible') || q.includes('how often') || q.includes('can i donate')) {
    ans = "To donate whole blood, you must generally be in good health, weigh at least 50 kg, be between 18-65 years old, and not have donated blood in the last 90 days (cooling-down period). Always check with blood bank staff for medical/disease-related exemptions.";
  } else if (q.includes('compatibility') || q.includes('compatible') || q.includes('give') || q.includes('receive')) {
    ans = "O- negative is the universal donor, meaning they can give blood to all types. AB+ is the universal recipient, meaning they can receive blood from any type. Positive types can generally receive blood from both positive and negative donors of their letter type, but negative types can only receive negative blood.";
  } else if (q.includes('how to') || q.includes('work') || q.includes('app') || q.includes('features')) {
    ans = "Lifeline features 3 views: Admin (manage inventory stock levels, view registry, and manage requests), Donor (register contact info, calculate eligibility, and ask Qs), and Hospital (request units, view history, and run the matching engine to find compatible matches).";
  } else if (q.includes('hi') || q.includes('hello') || q.includes('hey')) {
    ans = "Hello! I am Lifeline's assistant. Ask me about blood type compatibility, donation eligibility, or how request matching works.";
  } else {
    ans = `Regarding "${question}": Please check compatibility rules or consult a medical representative at the Lifeline center. In general, O- is the universal donor, whole blood donations require a 90-day cooldown, and requests can be matched immediately in the control center.`;
  }
  res.json({ status: 'success', answer: ans });
});

// AI 7-day Demand Risk Forecast
app.post('/api/ai/forecast', async (req, res) => {
  try {
    let inventory = {};
    let donorCount = 0;
    let requestCount = 0;

    if (db.isOnline()) {
      const invRows = await db.query('SELECT blood_type, units FROM inventory');
      invRows.forEach(r => { inventory[r.blood_type] = r.units; });
      const [dRows] = await db.query('SELECT COUNT(*) as count FROM donors');
      donorCount = dRows[0].count;
      const [rRows] = await db.query('SELECT COUNT(*) as count FROM requests WHERE status = "pending"');
      requestCount = rRows[0].count;
    } else {
      inventory = memoryState.inventory;
      donorCount = memoryState.donors.length;
      requestCount = memoryState.requests.filter(r => r.status === 'pending').length;
    }

    const BLOOD_TYPES = ["A+","A-","B+","B-","O+","O-","AB+","AB-"];
    BLOOD_TYPES.forEach(t => { if (inventory[t] === undefined) inventory[t] = 0; });

    const aiClient = getGeminiClient();
    if (aiClient) {
      try {
        const reqSummary = BLOOD_TYPES.map(t => `${t}: stock=${inventory[t]}, total_donors=${donorCount}, pending_reqs=${requestCount}`).join('; ');
        const prompt = `You are a demand forecasting model for a blood bank. Here is current data: ${reqSummary}.
Predict a 7-day demand risk score from 0-100 for each of these 8 types: ${BLOOD_TYPES.join(', ')} (higher = higher shortage risk, factoring in low stock, rarity of type, and donor scarcity — O- and AB- are generally rarer).
Respond ONLY with valid JSON, no markdown, no preamble, in this exact shape:
{"A+":NN,"A-":NN,"B+":NN,"B-":NN,"O+":NN,"O-":NN,"AB+":NN,"AB-":NN,"note":"one short sentence summary"}`;
        
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        const cleaned = response.text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleaned);
        return res.json({ status: 'success', data });
      } catch (e) {
        console.error('Gemini API Error in forecast:', e.message);
      }
    }

    // Heuristics forecast
    const data = {};
    let totalRisk = 0;
    BLOOD_TYPES.forEach(t => {
      const stock = inventory[t];
      // Formula: low stock = high risk. O- and AB- are inherently high risk because of rarity.
      let risk = 0;
      if (stock === 0) risk = 95;
      else if (stock <= 2) risk = 85;
      else if (stock <= 4) risk = 65;
      else if (stock <= 8) risk = 40;
      else if (stock <= 15) risk = 20;
      else risk = 10;

      // Add rarity adjustments
      if (t === 'O-' || t === 'AB-') risk += 10;
      if (t === 'A-' || t === 'B-') risk += 5;
      
      // Clamp between 0 and 100
      data[t] = Math.min(98, Math.max(5, risk));
      totalRisk += data[t];
    });

    const averageRisk = totalRisk / BLOOD_TYPES.length;
    let note = "Stock levels are currently stable. Risk remains low for most groups.";
    if (averageRisk > 50) {
      note = "Shortages predicted for rare negative groups due to low donor turnout.";
    } else if (inventory["O-"] <= 2 || inventory["AB-"] <= 1) {
      note = "Critical shortage warning: O- and AB- stocks are near empty.";
    } else if (requestCount > 2) {
      note = "Elevated risk index due to an uptick in incoming hospital requests.";
    }

    data.note = note;
    res.json({ status: 'success', data });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// AI Matching Recommendations
app.post('/api/ai/match', async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ status: 'error', message: 'Missing requestId' });
  }

  try {
    let requestObj = null;
    let inventoryStock = 0;
    let compatibleDonors = [];

    if (db.isOnline()) {
      const reqRows = await db.query('SELECT id, hospital, blood_type as bloodType, units, urgency, status FROM requests WHERE id = ?', [requestId]);
      if (reqRows.length > 0) {
        requestObj = reqRows[0];
        // Fetch inventory
        const invRows = await db.query('SELECT units FROM inventory WHERE blood_type = ?', [requestObj.bloodType]);
        inventoryStock = invRows.length > 0 ? invRows[0].units : 0;
        // Fetch compatible donors
        const allDonors = await db.query('SELECT name, blood_type as bloodType, city, phone FROM donors');
        compatibleDonors = allDonors.filter(d => COMPAT[d.bloodType] && COMPAT[d.bloodType].includes(requestObj.bloodType));
      }
    } else {
      requestObj = memoryState.requests.find(r => r.id == requestId);
      if (requestObj) {
        inventoryStock = memoryState.inventory[requestObj.bloodType] || 0;
        compatibleDonors = memoryState.donors.filter(d => COMPAT[d.bloodType] && COMPAT[d.bloodType].includes(requestObj.bloodType));
      }
    }

    if (!requestObj) {
      return res.status(404).json({ status: 'error', message: 'Request not found' });
    }

    const aiClient = getGeminiClient();
    if (aiClient) {
      try {
        const prompt = `You are an AI matching engine for a blood bank. A hospital "${requestObj.hospital}" requested ${requestObj.units} units of ${requestObj.bloodType} blood, urgency: ${requestObj.urgency}.
Current stock of ${requestObj.bloodType} in the bank: ${inventoryStock} units.
There are ${compatibleDonors.length} compatible registered donors available: ${JSON.stringify(compatibleDonors.map(d=>({name:d.name, type:d.bloodType, city:d.city})))}.
In 3-4 short sentences, give a clear, actionable recommendation: whether stock can fulfill the request directly, whether compatible donors should be contacted, and how urgently. Be direct and operational, not generic.`;
        
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        return res.json({
          status: 'success',
          stock: inventoryStock,
          donors: compatibleDonors,
          recommendation: response.text.trim()
        });
      } catch (e) {
        console.error('Gemini API Error in matching:', e.message);
      }
    }

    // Heuristics template matchmaking
    const canFulfill = inventoryStock >= requestObj.units;
    let rec = "";
    if (canFulfill) {
      rec = `Stock is fully sufficient. Direct delivery of ${requestObj.units} units of ${requestObj.bloodType} to ${requestObj.hospital} is recommended immediately. No urgent donor recruitment is necessary for this order, but normal operations apply.`;
    } else {
      const shortage = requestObj.units - inventoryStock;
      rec = `Critical shortage of ${shortage} unit(s) detected. Current inventory is only ${inventoryStock} units. We recommend immediately contacting the ${compatibleDonors.length} compatible donors located nearby (especially those of type ${requestObj.bloodType}) to bridge this gap. Urgency is ${requestObj.urgency}, so call notifications should be dispatched without delay.`;
    }

    res.json({
      status: 'success',
      stock: inventoryStock,
      donors: compatibleDonors,
      recommendation: rec
    });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

/* ============================================================
   START SERVER & DB INIT
   ============================================================ */
async function startServer() {
  await db.initDb();
  app.listen(PORT, () => {
    console.log(`LIFELINE Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});