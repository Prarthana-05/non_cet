const mysql = require('mysql2/promise');
const xlsx = require('xlsx');
const pool = require('./config/db');
const Path = require('path');
require('dotenv').config();

(async function importBcomData() {
  try {
    const filePath = Path.join(process.env.FILE_PATH, "Advance Diploma.xlsx");
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const insertQuery = `
      INSERT INTO DIPLOMA_cutoffs (college_code, institute_name, city, course)
      VALUES (?, ?, ?, ?)
    `;

    for (let row of rows) {
      await pool.execute(insertQuery, [
        row["Code"] || null,
        row["College name"] || null,
        row["City name"] || null,
        row["Course name"] || null,
      ]);
    }

    console.log('diploma course data imported successfully!');
    await pool.end();
  } catch (err) {
    console.error('Error importing diploma course data:', err);
  }
})();
