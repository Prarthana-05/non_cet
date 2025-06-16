// const pool = require('../config/db');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// exports.registerStudent = async (req, res) => {
//   const { name, email, password, dob, marks, course } = req.body;
//   try {
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const [result] = await pool.query(
//       'INSERT INTO students (name, email, password, dob, marks, course) VALUES (?, ?, ?, ?, ?, ?)',
//       [name, email, hashedPassword, dob, marks, course]
//     );
//     res.status(201).json({ message: 'Registered successfully' });
//   } catch (err) {
//     res.status(400).json({ error: 'Registration failed. Email may already exist.' });
//   }
// };

// exports.loginStudent = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const [rows] = await pool.query('SELECT * FROM students WHERE email = ?', [email]);
//     if (rows.length === 0) return res.status(400).json({ error: 'Invalid email' });

//     const student = rows[0];
//     const match = await bcrypt.compare(password, student.password);
//     if (!match) return res.status(400).json({ error: 'Invalid password' });

//     const token = jwt.sign({ id: student.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.json({ token, name: student.name });
//   } catch (err) {
//     res.status(500).json({ error: 'Login failed' });
//   }
// };
