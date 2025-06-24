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

// Stream-to-table mapping
const streamToTableMap = {
  'Fine Arts': 'bfa_cutoffs',
  'Commerce': 'bcom_cutoffs',
  'Science': 'bsc_cutoffs',
  'Arts': 'ba_cutoffs',
  'Vocational': 'bvoc_cutoffs',
  'International Accounting': 'bia_cutoffs',
  'Management': 'bm_cutoffs',
  'Performing Arts': 'bpa_cutoffs',
  'Sports Management': 'bsports_cutoffs',
  // Postgraduate mappings
  'Master of Science': 'pg_cutoffs',
  'Master of Arts': 'pg_cutoffs',
  'Master of Commerce': 'pg_cutoffs',
  'MA Psychology': 'pg_cutoffs'
};

// Check if stream is postgraduate
const isPostgraduate = (stream) => {
  return ['Master of Science', 'Master of Arts', 'Master of Commerce', 'MA Psychology'].includes(stream);
};

router.get('/specializations', async (req, res) => {
  const { stream } = req.query;

  const tableName = streamToTableMap[stream];
  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid stream selected' });
  }

  try {
    let query;
    if (tableName === 'pg_cutoffs') {
      // For postgraduate, filter courses that start with the selected stream
      query = `SELECT DISTINCT course FROM ${tableName} WHERE course LIKE ?`;
      const [rows] = await pool.query(query, [`${stream}%`]);
      res.json({ success: true, data: rows });
    } else {
      // For undergraduate, use existing logic
      query = `SELECT DISTINCT course FROM ${tableName}`;
      const [rows] = await pool.query(query);
      res.json({ success: true, data: rows });
    }
  } catch (error) {
    console.error('Error in specializations route:', error);
    res.status(500).json({ success: false, message: 'Error fetching specializations', error: error.message });
  }
});
// Route to get cities - only for undergraduate streams
router.get('/cities', async (req, res) => {
  const { stream } = req.query;
  
  // Check if this is a postgraduate stream
  if (isPostgraduate(stream)) {
    return res.json({ success: true, data: [] }); // Return empty array for postgraduate
  }
  
  const tableName = streamToTableMap[stream];
  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid stream selected' });
  }

  try {
    const [rows] = await pool.query(`SELECT DISTINCT city FROM ${tableName} ORDER BY city`);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cities', error: error.message });
  }
});

// Route to get colleges - with conditional city filtering
router.get('/colleges', async (req, res) => {
  const { stream, specialization, city } = req.query;
  const tableName = streamToTableMap[stream];

  if (!tableName) {
    return res.status(400).json({ success: false, message: 'Invalid stream selected' });
  }

  try {
    let query, params, rows;
    
    if (isPostgraduate(stream)) {
      query = `SELECT institute_name, course FROM ${tableName} WHERE TRIM(LOWER(course)) = TRIM(LOWER(?))`;
      params = [specialization];
    } else {
      query = `SELECT college_code, institute_name, city, course FROM ${tableName} WHERE course = ?`;
      params = [specialization];
      if (city && city !== 'All' && city !== '') {
        query += ` AND city = ?`;
        params.push(city);
      }
    }

    console.log('Executing query:', query);
    console.log('With params:', params);
    
    [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, type: isPostgraduate(stream) ? 'PG' : 'UG' }); // ⬅️ add type in response
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, message: 'Error fetching colleges', error: error.message });
  }
});


// Route to search colleges by name and return all courses they offer
router.get('/search-college', async (req, res) => {
  const search = req.query.q;

  if (!search || search.trim() === '') {
    return res.status(400).json({ success: false, message: 'Please enter a college name to search' });
  }

  const searchTerm = `%${search.trim().toLowerCase()}%`;
  const results = [];

  try {
    for (const [stream, table] of Object.entries(streamToTableMap)) {
      // Skip PG table if you don't want to search in it
      if (table === 'pg_cutoffs') continue;

      const [rows] = await pool.query(
        `SELECT DISTINCT institute_name, course, college_code, city FROM ${table} WHERE LOWER(TRIM(institute_name)) LIKE ?`,
        [searchTerm]
      );

      if (rows.length > 0) {
        results.push(...rows);
      }
    }

    if (results.length === 0) {
      return res.json({ success: true, data: [], message: 'No matching colleges found' });
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