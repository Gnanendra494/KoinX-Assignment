const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const fs = require('fs');

function readCsv(filePath) {
  const input = fs.readFileSync(filePath, 'utf8');
  return parse(input, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
}

function writeCsv(filePath, rows) {
  const csv = stringify(rows, { header: true });
  fs.writeFileSync(filePath, csv, 'utf8');
}

module.exports = { readCsv, writeCsv };
