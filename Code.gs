/**
 * Ram's Grocery Hub — Google Sheets backend
 * ------------------------------------------------------------------
 * Paste this whole file into Extensions > Apps Script on your grocery
 * spreadsheet, run setup() once, then Deploy > New deployment >
 * Web app  (Execute as: Me   |   Who has access: Anyone).
 * Copy the /exec URL into the website's ⚙ Settings dialog.
 * ------------------------------------------------------------------
 */

/* ====== 1. CHANGE THESE TO MATCH THE WEBSITE ====== */
var AUTH_USER = 'ramanuja';
var AUTH_PASS = 'Pass@123';

/* Leave blank when this script lives inside the spreadsheet
   (Extensions > Apps Script). Otherwise paste the spreadsheet ID —
   the long string in the sheet URL between /d/ and /edit. */
var SPREADSHEET_ID = '';

/* ====== 2. Sheet layout (don't reorder — the site depends on it) ====== */
var GROCERY_SHEET = 'Groceries';
var TODO_SHEET    = 'Todos';

var GROCERY_COLS = ['id','item','store','qty','unit','category','priority','notes','status','addedAt','boughtAt'];
var TODO_COLS    = ['id','task','priority','due','notes','status','addedAt','doneAt'];


/* ==================================================================
   Public endpoints
   ================================================================== */

/** Read — open to anyone, so the site is viewable without signing in. */
function doGet(e) {
  try {
    var ss = getSS_();
    return json_({
      ok: true,
      groceries: readSheet_(ss, GROCERY_SHEET, GROCERY_COLS),
      todos:     readSheet_(ss, TODO_SHEET,    TODO_COLS),
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

/** Write — requires the token, so only the signed-in site can change data. */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);

    if (body.token !== AUTH_USER + ':' + AUTH_PASS) {
      return json_({ ok: false, error: 'Not authorised — sign in on the site first.' });
    }

    var ss = getSS_();
    var action = body.action;
    var p = body.payload || {};
    var out = { ok: true };

    switch (action) {
      case 'upsertGrocery': upsert_(ss, GROCERY_SHEET, GROCERY_COLS, p); break;
      case 'upsertTodo':    upsert_(ss, TODO_SHEET,    TODO_COLS,    p); break;
      case 'deleteGrocery': out.deleted = remove_(ss, GROCERY_SHEET, p.id); break;
      case 'deleteTodo':    out.deleted = remove_(ss, TODO_SHEET,    p.id); break;
      case 'clearBought':   out.deleted = clearWhere_(ss, GROCERY_SHEET, GROCERY_COLS, 'status', 'bought'); break;
      case 'ping':          out.pong = true; break;
      default:
        return json_({ ok: false, error: 'Unknown action: ' + action });
    }
    return json_(out);

  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}


/* ==================================================================
   One-time setup — run this from the editor before deploying
   ================================================================== */
function setup() {
  var ss = getSS_();
  makeSheet_(ss, GROCERY_SHEET, GROCERY_COLS);
  makeSheet_(ss, TODO_SHEET,    TODO_COLS);
  SpreadsheetApp.getActive() && SpreadsheetApp.getActive().toast('Sheets ready. Now deploy as a web app.');
  Logger.log('Setup complete: "%s" and "%s" are ready.', GROCERY_SHEET, TODO_SHEET);
}

function makeSheet_(ss, name, cols) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);

  var header = sh.getRange(1, 1, 1, cols.length);
  header.setValues([cols]);
  header.setFontWeight('bold')
        .setBackground('#3d7a4d')
        .setFontColor('#ffffff')
        .setVerticalAlignment('middle');
  sh.setFrozenRows(1);
  sh.setRowHeight(1, 30);

  // Keep everything as plain text so dates and ids never get mangled.
  sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');

  for (var i = 1; i <= cols.length; i++) sh.autoResizeColumn(i);
  if (sh.getMaxColumns() > cols.length) {
    sh.deleteColumns(cols.length + 1, sh.getMaxColumns() - cols.length);
  }
  return sh;
}


/* ==================================================================
   Helpers
   ================================================================== */
function getSS_() {
  if (SPREADSHEET_ID) return SpreadsheetApp.openById(SPREADSHEET_ID);
  var act = SpreadsheetApp.getActiveSpreadsheet();
  if (!act) throw new Error('No spreadsheet bound. Set SPREADSHEET_ID at the top of Code.gs.');
  return act;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheetOrThrow_(ss, name, cols) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = makeSheet_(ss, name, cols);
  return sh;
}

function readSheet_(ss, name, cols) {
  var sh = sheetOrThrow_(ss, name, cols);
  var last = sh.getLastRow();
  if (last < 2) return [];

  var values = sh.getRange(2, 1, last - 1, cols.length).getDisplayValues();
  var rows = [];
  for (var r = 0; r < values.length; r++) {
    var o = {}, blank = true;
    for (var c = 0; c < cols.length; c++) {
      var v = values[r][c];
      o[cols[c]] = v == null ? '' : String(v).trim();
      if (o[cols[c]] !== '') blank = false;
    }
    if (!blank && o.id) rows.push(o);
  }
  return rows;
}

function findRow_(sh, id) {
  var last = sh.getLastRow();
  if (last < 2) return -1;
  var ids = sh.getRange(2, 1, last - 1, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) {
    if (String(ids[i][0]).trim() === String(id).trim()) return i + 2;
  }
  return -1;
}

function upsert_(ss, name, cols, obj) {
  if (!obj || !obj.id) throw new Error('Missing row id.');
  var sh = sheetOrThrow_(ss, name, cols);

  var line = cols.map(function (c) {
    var v = obj[c];
    return (v === undefined || v === null) ? '' : String(v);
  });

  var r = findRow_(sh, obj.id);
  if (r > 0) {
    sh.getRange(r, 1, 1, cols.length).setValues([line]);
  } else {
    sh.appendRow(line);
    sh.getRange(sh.getLastRow(), 1, 1, cols.length).setNumberFormat('@');
  }
  return true;
}

function remove_(ss, name, id) {
  if (!id) throw new Error('Missing row id.');
  var sh = ss.getSheetByName(name);
  if (!sh) return 0;
  var r = findRow_(sh, id);
  if (r > 0) { sh.deleteRow(r); return 1; }
  return 0;
}

function clearWhere_(ss, name, cols, field, value) {
  var sh = ss.getSheetByName(name);
  if (!sh) return 0;
  var idx = cols.indexOf(field);
  if (idx < 0) return 0;
  var last = sh.getLastRow();
  if (last < 2) return 0;

  var vals = sh.getRange(2, 1, last - 1, cols.length).getDisplayValues();
  var n = 0;
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][idx]).trim() === value) { sh.deleteRow(i + 2); n++; }
  }
  return n;
}


/* ==================================================================
   Optional: a menu inside the spreadsheet
   ================================================================== */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Grocery Hub')
      .addItem('Set up sheets', 'setup')
      .addItem('Clear bought items', 'menuClearBought')
      .addToUi();
  } catch (ignore) {}
}

function menuClearBought() {
  var n = clearWhere_(getSS_(), GROCERY_SHEET, GROCERY_COLS, 'status', 'bought');
  SpreadsheetApp.getUi().alert('Removed ' + n + ' bought item(s) from history.');
}
