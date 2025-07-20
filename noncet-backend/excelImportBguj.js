const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const pool = require('./config/db');
const Path = require('path');
require('dotenv').config();

(async function importSportsData() {
  try {
    const filePath = Path.join(process.env.FILE_PATH, "BA (Gujarati).xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const insertQuery = `
      INSERT INTO  ba_gujarati_cutoffs(college_code, institute_name, city, course)
      VALUES (?, ?, ?, ?)
    `;

    for (let row of rows) {
      await pool.execute(insertQuery, [
        row["Code"] || null,
        row["College"] || null,
        row["City"] || null,
        row["Course"] || null,
      ]);
    }

    console.log('Barch course data imported successfully!');
    await pool.end();
  } catch (err) {
    console.error('Error importing BSports course data:', err);
  }
})();