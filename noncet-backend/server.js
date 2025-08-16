const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentRoutes = require('./routes/studentRoutes');

const app = express();
const allowedOrigins = [
  'https://non-cet.vercel.app',
  'https://prarthanaa-portfolio.netlify.app',
];

// Dynamic CORS check
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow Postman/mobile apps
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/non-.*-prarthana-05s-projects\.vercel\.app$/.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Preflight request handling
app.options('*', cors());

// Parse JSON
app.use(express.json());

// Routes
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
