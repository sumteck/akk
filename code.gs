// ═══════════════════════════════════════════════════════════════
// MASS MEMORANDUM — Google Apps Script (code.gs)
// ═══════════════════════════════════════════════════════════════
// SETUP: Open the Google Sheet you want to use as the database.
//        Go to Extensions → Apps Script, paste this entire file,
//        then deploy as a Web App (see README).
// ═══════════════════════════════════════════════════════════════

/* ─── SHEET CONFIGURATION ─────────────────────────────────── */
// Leave as '' to use the first / active sheet, or specify by name.
const SHEET_NAME = '';

// Column layout in the sheet:
const COL = {
  TIMESTAMP : 1,   // A
  NAME      : 2,   // B
  ADDRESS   : 3,   // C
  SIGNATURE : 4    // D  (Base64 PNG data-URL string)
};

/* ─── CORS HEADERS ────────────────────────────────────────── */
// Returned on every response so the browser won't block them.
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function makeJsonResponse(data, code) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  // GAS ContentService doesn't support setting HTTP status codes
  // directly, but we embed a status field in the payload for the
  // client to inspect.
  return output;
}

/* ─── HELPER: get sheet ───────────────────────────────────── */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = SHEET_NAME
    ? ss.getSheetByName(SHEET_NAME)
    : ss.getActiveSheet();

  if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);

  // Auto-create header row if the sheet is brand new (empty)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Timestamp', 'Full Name', 'Address / Designation', 'Signature (Base64)']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#2d1a08').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    // Make the signature column narrower in display
    sheet.setColumnWidth(4, 200);
  }

  return sheet;
}

/* ═══════════════════════════════════════════════════════════
   doPost — Receive a new signature submission
   ═══════════════════════════════════════════════════════════ */
function doPost(e) {
  try {
    // Parse the incoming JSON body
    const raw     = e.postData && e.postData.contents ? e.postData.contents : '{}';
    const payload = JSON.parse(raw);

    const name      = (payload.name      || '').toString().trim();
    const address   = (payload.address   || '').toString().trim();
    const signature = (payload.signature || '').toString().trim();
    const timestamp = payload.timestamp  || new Date().toISOString();

    // Basic validation
    if (!name || !address || !signature) {
      return makeJsonResponse({
        status : 'error',
        message: 'Missing required fields: name, address, or signature.'
      });
    }

    // Append to sheet
    const sheet = getSheet();
    sheet.appendRow([timestamp, name, address, signature]);

    // ── Optional: Flash-format the new row ──────────────────
    const lastRow = sheet.getLastRow();
    // Alternate row shading for readability
    if (lastRow % 2 === 0) {
      sheet.getRange(lastRow, 1, 1, 4).setBackground('#faf6ef');
    }

    return makeJsonResponse({
      status : 'success',
      message: 'Signature recorded successfully.',
      row    : lastRow
    });

  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return makeJsonResponse({
      status : 'error',
      message: 'Server error: ' + err.message
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   doGet — Return all signatures as JSON array
   Called by admin.html to display all records.
   ═══════════════════════════════════════════════════════════ */
function doGet(e) {
  try {
    const sheet    = getSheet();
    const lastRow  = sheet.getLastRow();

    // If only header row exists (or sheet is empty), return empty array
    if (lastRow <= 1) {
      return makeJsonResponse({ status: 'success', data: [] });
    }

    // Fetch all data rows (skip header row 1)
    const range  = sheet.getRange(2, 1, lastRow - 1, 4);
    const values = range.getValues();

    const records = values
      .filter(row => row[COL.NAME - 1] && row[COL.NAME - 1].toString().trim() !== '')
      .map((row, index) => ({
        id        : index + 1,
        timestamp : row[COL.TIMESTAMP - 1]  ? new Date(row[COL.TIMESTAMP - 1]).toISOString() : '',
        name      : row[COL.NAME      - 1]  ? row[COL.NAME - 1].toString().trim() : '',
        address   : row[COL.ADDRESS   - 1]  ? row[COL.ADDRESS - 1].toString().trim() : '',
        signature : row[COL.SIGNATURE - 1]  ? row[COL.SIGNATURE - 1].toString().trim() : ''
      }));

    return makeJsonResponse({ status: 'success', data: records });

  } catch (err) {
    Logger.log('doGet error: ' + err.message);
    return makeJsonResponse({
      status : 'error',
      message: 'Server error: ' + err.message,
      data   : []
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   doOptions — Handle CORS preflight (OPTIONS) requests
   ═══════════════════════════════════════════════════════════ */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/* ═══════════════════════════════════════════════════════════
   testPost — Run this manually in the GAS editor to verify
   ═══════════════════════════════════════════════════════════ */
function testPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        name      : 'Test User',
        address   : 'Ward 5, Test Town',
        signature : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg=='
      })
    }
  };
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}

/* ═══════════════════════════════════════════════════════════
   testGet — Run this manually to verify doGet works
   ═══════════════════════════════════════════════════════════ */
function testGet() {
  const result = doGet({});
  const parsed = JSON.parse(result.getContent());
  Logger.log('Total records: ' + parsed.data.length);
  if (parsed.data.length > 0) {
    Logger.log('First record: ' + JSON.stringify(parsed.data[0]));
  }
}
