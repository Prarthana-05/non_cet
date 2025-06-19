// const express = require('express');
// const router = express.Router();
// const { registerStudent, loginStudent } = require('../controllers/studentController');

// router.post('/register', registerStudent);
// router.post('/login', loginStudent);

// module.exports = router;
 

const express = require('express');
const router = express.Router();
const pool = require('../config/db');

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


module.exports = router;