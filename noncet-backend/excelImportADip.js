const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const pool = require('./config/db');
const Path = require('path');
require('dotenv').config();

(async function importSportsData() {
  try {
    const filePath = Path.join(process.env.FILE_PATH, "Advance Diploma.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read and sanitize rows (trim header keys)
    const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: null });
    const rows = rawRows.map((row) => {
      const cleanRow = {};
      for (let key in row) {
        cleanRow[key.trim()] = row[key];
      }
      return cleanRow;
    });

    const insertQuery = `
      INSERT INTO dip_cutoffs(college_code, institute_name, city, course)
      VALUES (?, ?, ?, ?)
    `;

    for (let row of rows) {
      await pool.execute(insertQuery, [
        row["Code"]?.toString().trim() || null,
        row["College name"]?.toString().trim() || null,
        row["City name"]?.toString().trim() || null,
        row["Course name"]?.toString().trim() || null,
      ]);
    }

    console.log('Diploma course data imported successfully!');
    await pool.end();
  } catch (err) {
    console.error('Error importing certificate course data:', err);
  }
})();
