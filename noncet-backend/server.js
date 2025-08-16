const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentRoutes = require('./routes/studentRoutes');

const app = express();

const allowedOrigins = [
  'https://non-cet.vercel.app',
  'https://prarthanaa-portfolio.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// More explicit CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('CORS check for origin:', origin);
    
    if (!origin) return callback(null, true);
    
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/non-.*-prarthana-05s-projects\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(express.json());
app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));