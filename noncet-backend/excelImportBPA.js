const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const pool = require('./config/db');
const Path = require('path');
require('dotenv').config();

(async function importBPAData() {
  try {
    const filePath = Path.join(process.env.FILE_PATH, "Bachelor of performing arts.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const insertQuery = `
      INSERT INTO BPA_cutoffs (college_code, institute_name, city, course)
      VALUES (?, ?, ?, ?)
    `;

    for (let row of rows) {
      await pool.execute(insertQuery, [
        row["College Code"] || null,
        row["College/Institute"] || null,
        row["City"] || null,
        row["Course"] || null,
      ]);
    }

    console.log('BPA course data imported successfully!');
    await pool.end();
  } catch (err) {
    console.error('Error importing BPA course data:', err);
  }
})();
