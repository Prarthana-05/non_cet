// const express = require('express');
// const router = express.Router();
// const { registerStudent, loginStudent } = require('../controllers/studentController');

// router.post('/register', registerStudent);
// router.post('/login', loginStudent);

// module.exports = router;
 const express = require('express');
const router = express.Router();
const pool = require('../config/db');
require('dotenv').config();


// Health check route
router.get('/check-db', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1');
    res.json({ success: true, message: 'Database connected!', result: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Database connection failed', error: err.message });
  }
});

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
    'Integrated Master of Science': 'integrated_msc_cutoffs',
    // PG streams
    'Master of Science': 'pg_cutoffs',
    'Master of Arts': 'pg_cutoffs',
    'Master of Commerce': 'pg_cutoffs',
    'MA Psychology': 'pg_cutoffs'
  },

  'Pune University': {
    'Science': 'pune_bsc_cutoffs',
    
  }
};

// Check if stream is postgraduate
const isPostgraduate = (stream) => {
  return ['Master of Science', 'Master of Arts', 'Master of Commerce', 'MA Psychology'].includes(stream);
};


router.get('/specializations', async (req, res) => {
  const { stream, university } = req.query;

  if (!stream || !university) {
    return res.status(400).json({ success: false, message: 'Missing stream or university parameter' });
  }

  const universityMap = universityToTableMap[university];
  if (!universityMap) {
    return res.status(400).json({ success: false, message: 'Invalid university' });
  }

  const tableName = universityMap[stream];
  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid stream for the selected university' });
  }

  try {
    let query;
    if (tableName.includes('pg')) {
      query = `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE ?`;
      const [rows] = await pool.query(query, [`${stream}%`]);
      res.json({ success: true, data: rows });
    } else {
      query = `SELECT DISTINCT course FROM ${tableName}`;
      const [rows] = await pool.query(query);
      res.json({ success: true, data: rows });
    }
  } catch (error) {
    console.error('Error in specializations route:', error);
    res.status(500).json({ success: false, message: 'Error fetching specializations', error: error.message });
  }
});


// Route to get cleaned, unique cities (only for UG streams)
router.get('/cities', async (req, res) => {
  const { stream, university } = req.query;

  // Validate university
  if (!universityToTableMap[university]) {
    return res.status(400).json({ success: false, message: 'Invalid university selected' });
  }

  // PG streams don’t need cities
  if (isPostgraduate(stream)) {
    return res.json({ success: true, data: [] });
  }

  const tableName = universityToTableMap[university][stream];
  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid stream for selected university' });
  }

  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT TRIM(LOWER(city)) AS city_cleaned
      FROM ${tableName}
      WHERE city IS NOT NULL AND TRIM(city) != ''
    `);

    const uniqueCitiesSet = new Set();
    rows.forEach(row => {
      const c = row.city_cleaned;
      const formatted = c.charAt(0).toUpperCase() + c.slice(1);
      uniqueCitiesSet.add(formatted);
    });

    const cleanedCities = Array.from(uniqueCitiesSet).sort();

    res.json({ success: true, data: cleanedCities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ success: false, message: 'Error fetching cities', error: error.message });
  }
});


// Route to get colleges - with conditional city filtering
router.get('/colleges', async (req, res) => {
  const { stream, specialization, city, university } = req.query;

  // Validate university
  if (!universityToTableMap[university]) {
    return res.status(400).json({ success: false, message: 'Invalid university selected' });
  }

  const tableName = universityToTableMap[university][stream];

  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid stream selected for this university' });
  }

  try {
    let query, params = [], rows;

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

    console.log('Executing query:', query);
    console.log('With params:', params);

    [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, type: isPostgraduate(stream) ? 'PG' : 'UG' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Error fetching colleges', error: error.message });
  }
});



router.get('/search-college', async (req, res) => {
  const search = req.query.q;

  if (!search || search.trim() === '') {
    return res.status(400).json({ success: false, message: 'Please enter a college name to search' });
  }

  const searchTerm = `%${search.trim().toLowerCase()}%`;
  const results = [];

  try {
    for (const [university, streamTableMap] of Object.entries(universityToTableMap)) {
      for (const [stream, table] of Object.entries(streamTableMap)) {
        let query = '';
        let params = [searchTerm];

        // PG tables may not have college_code or city
        if (isPostgraduate(stream)) {
          query = `SELECT DISTINCT '${university}' AS university, institute_name, course, NULL AS college_code, NULL AS city FROM ${table} WHERE LOWER(TRIM(institute_name)) LIKE ?`;
        } else {
          query = `SELECT DISTINCT '${university}' AS university, institute_name, course, college_code, city FROM ${table} WHERE LOWER(TRIM(institute_name)) LIKE ?`;
        }

        const [rows] = await pool.query(query, params);

        if (rows.length > 0) {
          results.push(...rows);
        }
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error searching college:', error);
    res.status(500).json({ success: false, message: 'Error searching college', error: error.message });
  }
});


// Add this temporary debug route
router.post('/chatbot', (req, res) => {
  const { message } = req.body;
  const lowerMessage = message.toLowerCase();

  let reply = "I'm not sure I understand that. Can you rephrase or ask something else?";

  if (lowerMessage.includes("admission")) {
    reply = `Admission Process:
1. Register online
2. Fill out the application
3. Upload documents
4. Wait for merit list / counselling rounds.`;
  } else if (lowerMessage.includes("fee") || lowerMessage.includes("fees")) {
    reply = `Fee structures vary by course. Please specify your course or check the 'Fee Structure' section on our website.`;
  } else if (lowerMessage.includes("course") || lowerMessage.includes("program")) {
    reply = `We offer a wide range of UG & PG programs like BSc, BA, BCom, MSc, MA, etc. Please select your stream to view options.`;
  } else if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    reply = `Hi there! 👋 I'm your assistant. Ask me anything about admission, courses, documents, or fees.`;
  } else if (lowerMessage.includes("scholarship")) {
    reply = `Scholarships are available for meritorious and needy students. Details can be found under 'Scholarship' on our website.`;
  } else if (lowerMessage.includes("contact") || lowerMessage.includes("support")) {
    reply = `You can contact us at: support@vidyarthimitra.org or call 1800-123-456.`;
  } else if (lowerMessage.includes("rounds") || lowerMessage.includes("counselling")) {
    reply = `Usually, there are 2–3 rounds of admission. However, this may vary by course or seat availability. Stay updated on our website.`;
  } else if (lowerMessage.includes("documents")) {
    reply = `Commonly required documents:
- 10th & 12th Marksheet
- Caste Certificate (if applicable)
- Passport Photo
- Aadhaar Card
- Transfer Certificate (TC)`;
  } else if (lowerMessage.includes("eligibility")) {
    reply = `Eligibility depends on the course.
Example:
- UG: Must have passed 12th
- PG: Must hold a related UG degree
Mention your course for exact criteria.`;
  } else if (lowerMessage.includes("cutoff")) {
    reply = `Cutoffs vary each year. You can check previous year cutoffs in the 'Cutoff' section after selecting your stream & specialization.`;
  }

  res.json({ reply });
});


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;
// store this securely in environment variables

// User registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);
    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// User login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



module.exports = router;