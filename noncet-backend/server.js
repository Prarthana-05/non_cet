const express = require('express');
const cors = require('cors');
require('dotenv').config();

const studentRoutes = require('./routes/studentRoutes');

const app = express();
// ✅ CORS middleware with frontend URL
app.use(cors({
  origin: 'https://non-ey37no9yp-prarthana-05s-projects.vercel.app',
  credentials: true
}));

app.use(express.json());

app.use('/api/students', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



