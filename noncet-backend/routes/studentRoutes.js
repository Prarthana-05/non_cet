const express = require('express');
const router = express.Router();
const pool = require('../config/db');
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');



// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET;

// --------------------- Health Check ---------------------
router.get('/check-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ success: true, message: 'Database connected!', result: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
  }
});

// --------------------- University Stream Mapping ---------------------
const universityToTableMap = {
  'Mumbai University': {
    'Fine Arts': 'bfa_cutoffs',
    'Commerce': 'bcom_cutoffs',
    'Science': 'bsc_cutoffs',
    'Arts': 'ba_cutoffs',
    'Vocational': 'bvoc_cutoffs',
    'International Accounting': 'bia_cutoffs',
    'Management': 'bm_cutoffs',
    'Performing Arts': 'bpa_cutoffs',
    'Sports Management': 'bsports_cutoffs',
    'Architecture': 'barch_cutoffs',
    'Gujarati': 'ba_gujarati_cutoffs',
    'Tourism and Travel Managment': 'travel_cutoffs',  
    'Adv.Dip.in Accounting and Taxation': 'adv_dip_cutoffs',
    'Integrated Master of Science': 'integrated_msc_cutoffs',
    'Diploma Cousre':'dip_cutoffs',
    'Advanced Diploma Course':'dip_cutoffs',
    'Certificate Course': 'CERTIFIED_cutoffs',
    'Teacher Training Certificate Course': 'CERTIFIED_cutoffs',
    'Master of Science': 'pg_cutoffs',
    'Master of Arts': 'pg_cutoffs',
    'Master of Commerce': 'pg_cutoffs',
    'MA Psychology': 'pg_cutoffs'
  },
  'Pune University': {
    'Science': 'pune_bsc_cutoffs',
  }
};

// --------------------- Helper ---------------------
const isPostgraduate = (stream) => ['Master of Science','Master of Arts','Master of Commerce','MA Psychology'].includes(stream);

// --------------------- Routes ---------------------

// Specializations
router.get('/specializations', async (req, res) => {
  const { stream, university } = req.query;

  if (!stream || !university) {
    return res.status(400).json({ success: false, message: 'Missing stream or university parameter' });
  }

  const universityMap = universityToTableMap[university];
  if (!universityMap) return res.status(400).json({ success: false, message: 'Invalid university' });

  const tableName = universityMap[stream];
  if (!tableName) return res.status(400).json({ success: false, message: 'Invalid stream for the selected university' });

  try {
    let query = '', params = [];

    if (tableName.includes('pg')) {
      query = `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE ?`;
      params = [`${stream}%`];
    } else if (tableName === 'dip_cutoffs') {
      query = stream === 'Diploma Cousre' 
        ? `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE '%Diploma%' AND course NOT LIKE '%Advanced%'`
        : `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE '%Advanced%' AND course LIKE '%Diploma%'`;
    } else if (tableName === 'CERTIFIED_cutoffs') {
      query = stream === 'Certificate Course' 
        ? `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE '%Certificate%' AND course NOT LIKE '%Teacher%'`
        : `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE '%Teacher%' AND course LIKE '%Certificate%'`;
    } else {
      query = `SELECT DISTINCT course FROM ${tableName}`;
    }

    console.log('Executing query:', query, 'Params:', params);
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });

  } catch (error) {
    console.error('Error in /specializations:', error);
    res.status(500).json({ success: false, message: 'Error fetching specializations', error: error.message });
  }
});

// Cities
router.get('/cities', async (req, res) => {
  const { stream, university } = req.query;

  if (!universityToTableMap[university]) return res.status(400).json({ success: false, message: 'Invalid university selected' });
  if (isPostgraduate(stream)) return res.json({ success: true, data: [] });

  const tableName = universityToTableMap[university][stream];
  if (!tableName) return res.status(400).json({ success: false, message: 'Invalid stream for selected university' });

  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT TRIM(LOWER(city)) AS city_cleaned
      FROM ${tableName} WHERE city IS NOT NULL AND TRIM(city) != ''
    `);

    const cleanedCities = Array.from(new Set(rows.map(r => r.city_cleaned.charAt(0).toUpperCase() + r.city_cleaned.slice(1)))).sort();
    res.json({ success: true, data: cleanedCities });

  } catch (error) {
    console.error('Error in /cities:', error);
    res.status(500).json({ success: false, message: 'Error fetching cities', error: error.message });
  }
});

// Colleges
router.get('/colleges', async (req, res) => {
  const { stream, specialization, city, university } = req.query;

  if (!universityToTableMap[university]) return res.status(400).json({ success: false, message: 'Invalid university selected' });

  const tableName = universityToTableMap[university][stream];
  if (!tableName) return res.status(400).json({ success: false, message: 'Invalid stream selected for this university' });

  try {
    let query = '', params = [];

    if (isPostgraduate(stream)) {
      query = `SELECT '${university}' AS university, institute_name, course FROM ${tableName} WHERE TRIM(LOWER(course)) = TRIM(LOWER(?))`;
      params.push(specialization);
    } else {
      query = `SELECT '${university}' AS university, college_code, institute_name, city, course FROM ${tableName} WHERE course = ?`;
      params.push(specialization);
      if (city && city !== 'All' && city.trim() !== '') {
        query += ` AND TRIM(LOWER(city)) = TRIM(LOWER(?))`;
        params.push(city);
      }
    }

    console.log('Executing query:', query, 'Params:', params);
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, type: isPostgraduate(stream) ? 'PG' : 'UG' });

  } catch (error) {
    console.error('Error in /colleges:', error);
    res.status(500).json({ success: false, message: 'Error fetching colleges', error: error.message });
  }
});

// Search College
router.get('/search-college', async (req, res) => {
  const search = req.query.q;
  if (!search || search.trim() === '') return res.status(400).json({ success: false, message: 'Please enter a college name' });

  const searchTerm = `%${search.trim().toLowerCase()}%`;
  const results = [];

  try {
    for (const [university, streams] of Object.entries(universityToTableMap)) {
      for (const [stream, table] of Object.entries(streams)) {
        const query = isPostgraduate(stream)
          ? `SELECT DISTINCT '${university}' AS university, institute_name, course, NULL AS college_code, NULL AS city FROM ${table} WHERE LOWER(TRIM(institute_name)) LIKE ?`
          : `SELECT DISTINCT '${university}' AS university, institute_name, course, college_code, city FROM ${table} WHERE LOWER(TRIM(institute_name)) LIKE ?`;

        const [rows] = await pool.query(query, [searchTerm]);
        if (rows.length) results.push(...rows);
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error in /search-college:', error);
    res.status(500).json({ success: false, message: 'Error searching college', error: error.message });
  }
});

// Chatbot
router.post('/chatbot', (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();

  let reply = "I'm not sure I understand that. Can you rephrase?";
  if (lowerMessage.includes("admission")) reply = `Admission Process:\n1. Register online\n2. Fill application\n3. Upload documents\n4. Wait for merit list / counselling.`;
  else if (lowerMessage.includes("fee") || lowerMessage.includes("fees")) reply = `Fees vary by course. Check the 'Fee Structure' section.`;
  else if (lowerMessage.includes("course") || lowerMessage.includes("program")) reply = `UG & PG programs available. Select your stream for details.`;
  else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) reply = `Hi! 👋 Ask me about admissions, courses, documents, or fees.`;
  else if (lowerMessage.includes("scholarship")) reply = `Scholarships available. Check 'Scholarship' section on website.`;
  else if (lowerMessage.includes("contact") || lowerMessage.includes("support")) reply = `Contact: support@vidyarthimitra.org or 1800-123-456.`;
  else if (lowerMessage.includes("rounds") || lowerMessage.includes("counselling")) reply = `Usually 2–3 rounds. Check website for details.`;
  else if (lowerMessage.includes("documents")) reply = `Required documents:\n- 10th & 12th marksheet\n- Caste certificate\n- Passport photo\n- Aadhaar\n- TC`;
  else if (lowerMessage.includes("eligibility")) reply = `Eligibility depends on course. UG: 12th pass. PG: related UG degree.`;
  else if (lowerMessage.includes("cutoff")) reply = `Check previous year cutoffs after selecting stream & specialization.`;

  res.json({ reply });
});

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ success: false, message: 'Email already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
