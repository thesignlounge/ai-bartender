const DETAILS_SHEET = 'Auswahl-Details';
const DAILY_SHEET = 'Tagesübersicht';

function doGet() {
  return ContentService.createTextOutput('The Sign Overview API OK');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    if (!e || !e.postData || !e.postData.contents) throw new Error('Keine Daten empfangen.');

    const data = JSON.parse(e.postData.contents);
    const items = Array.isArray(data.items) ? data.items : [];
    if (!items.length) throw new Error('Keine Auswahl empfangen.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timezone = ss.getSpreadsheetTimeZone() || 'Europe/Vienna';
    const now = new Date();
    const dateKey = Utilities.formatDate(now, timezone, 'yyyy-MM-dd');
    const dateLabel = Utilities.formatDate(now, timezone, 'dd.MM.yyyy');
    const timeLabel = Utilities.formatDate(now, timezone, 'HH:mm:ss');
    const recordId = cleanText(data.recordId || ('SIGN-' + Utilities.formatDate(now, timezone, 'yyyyMMdd-HHmmss')));
    const language = cleanText(data.language || '');

    const details = getOrCreateDetailsSheet(ss);
    const existingIds = details.getLastRow() > 1
      ? details.getRange(2, 4, details.getLastRow() - 1, 1).getDisplayValues().flat()
      : [];
    if (existingIds.includes(recordId)) return jsonResponse({success:true, duplicate:true, recordId:recordId});

    const rows = items.map(item => {
      const quantity = positiveNumber(item.quantity, 1);
      const unitPrice = positiveNumber(item.unitPrice, 0);
      return [
        now,
        dateLabel,
        timeLabel,
        recordId,
        cleanText(item.name || 'Unbekannt'),
        quantity,
        unitPrice,
        quantity * unitPrice,
        language,
        positiveNumber(item.alcoholLevel, 0),
        cleanText((item.baseSpirits || []).join(', ')),
        cleanText((item.tastes || []).join(', ')),
        cleanText(item.category || '')
      ];
    });

    details.getRange(details.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    details.getRange(details.getLastRow() - rows.length + 1, 1, rows.length, 1).setNumberFormat('dd.MM.yyyy HH:mm:ss');
    details.getRange(details.getLastRow() - rows.length + 1, 7, rows.length, 2).setNumberFormat('€0.00');

    updateDailySummary(ss, dateKey, dateLabel, rows);
    return jsonResponse({success:true, recordId:recordId, rows:rows.length});
  } catch (err) {
    return jsonResponse({success:false, error:String(err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function getOrCreateDetailsSheet(ss) {
  let sheet = ss.getSheetByName(DETAILS_SHEET);
  if (!sheet) sheet = ss.insertSheet(DETAILS_SHEET);
  if (sheet.getLastRow() === 0) {
    const headers = ['Zeitstempel','Datum','Uhrzeit','Referenz','Cocktail','Anzahl','Einzelpreis','Summe','Sprache','Stärke','Basis Spirituose','Geschmack','Kategorie'];
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1,13,110);
    sheet.setColumnWidth(4,210);
    sheet.setColumnWidth(5,240);
    sheet.setColumnWidth(11,180);
    sheet.setColumnWidth(12,180);
  }
  return sheet;
}

function updateDailySummary(ss, dateKey, dateLabel, detailRows) {
  let sheet = ss.getSheetByName(DAILY_SHEET);
  if (!sheet) sheet = ss.insertSheet(DAILY_SHEET);
  if (sheet.getLastRow() === 0) {
    const headers = ['Datum','Cocktail','Gesamtanzahl','Gesamtwert','Letzte Aktualisierung'];
    sheet.appendRow(headers);
    sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1,110); sheet.setColumnWidth(2,260); sheet.setColumnWidth(3,120); sheet.setColumnWidth(4,120); sheet.setColumnWidth(5,180);
  }

  const aggregate = {};
  detailRows.forEach(r => {
    const name = r[4], qty = Number(r[5]) || 0, value = Number(r[7]) || 0;
    if (!aggregate[name]) aggregate[name] = {qty:0,value:0};
    aggregate[name].qty += qty; aggregate[name].value += value;
  });

  const existing = sheet.getLastRow() > 1 ? sheet.getRange(2,1,sheet.getLastRow()-1,5).getValues() : [];
  Object.keys(aggregate).forEach(name => {
    const index = existing.findIndex(r => formatDateKey(r[0]) === dateKey && String(r[1]) === name);
    if (index >= 0) {
      const row = index + 2;
      sheet.getRange(row,3).setValue((Number(existing[index][2]) || 0) + aggregate[name].qty);
      sheet.getRange(row,4).setValue((Number(existing[index][3]) || 0) + aggregate[name].value);
      sheet.getRange(row,5).setValue(new Date());
    } else {
      sheet.appendRow([dateLabel,name,aggregate[name].qty,aggregate[name].value,new Date()]);
    }
  });
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2,4,sheet.getLastRow()-1,1).setNumberFormat('€0.00');
    sheet.getRange(2,5,sheet.getLastRow()-1,1).setNumberFormat('dd.MM.yyyy HH:mm:ss');
  }
}

function formatDateKey(value) {
  if (value instanceof Date) return Utilities.formatDate(value, Session.getScriptTimeZone() || 'Europe/Vienna', 'yyyy-MM-dd');
  const s = String(value || '');
  const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
}

function cleanText(value) {
  let text = String(value == null ? '' : value).trim();
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text.substring(0,500);
}

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
