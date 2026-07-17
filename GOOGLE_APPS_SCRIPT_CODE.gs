const DETAILS_SHEET = 'Auswahl-Details';
const DAILY_SHEET = 'Tagesübersicht';

function doGet() {
  return ContentService.createTextOutput('The Sign V10.1 Business Sync API OK');
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    if (!e || !e.postData || !e.postData.contents) throw new Error('Keine Daten empfangen.');

    const data = JSON.parse(e.postData.contents);
    const action = cleanText(data.action || 'update').toLowerCase();
    const recordId = cleanText(data.recordId || '');
    if (!recordId) throw new Error('Referenz fehlt.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timezone = ss.getSpreadsheetTimeZone() || 'Europe/Vienna';
    const details = getOrCreateDetailsSheet(ss);

    // 同一个记录编号始终覆盖旧内容：先删除旧行。
    deleteRowsForRecord(details, recordId);

    const items = Array.isArray(data.items) ? data.items : [];
    if (action !== 'cancel' && items.length) {
      const now = new Date();
      const dateLabel = Utilities.formatDate(now, timezone, 'dd.MM.yyyy');
      const timeLabel = Utilities.formatDate(now, timezone, 'HH:mm:ss');
      const language = cleanText(data.language || '');
      const rows = items.map(item => {
        const quantity = positiveNumber(item.quantity, 1);
        const unitPrice = positiveNumber(item.unitPrice, 0);
        return [
          now, dateLabel, timeLabel, recordId,
          cleanText(item.name || 'Unbekannt'), quantity, unitPrice,
          quantity * unitPrice, language,
          positiveNumber(item.alcoholLevel, 0),
          cleanText((item.baseSpirits || []).join(', ')),
          cleanText((item.tastes || []).join(', ')),
          cleanText(item.category || ''), cleanText(item.itemType || ''), cleanText(item.volume || ''),
          action === 'create' ? 'AKTIV' : 'AKTUALISIERT'
        ];
      });
      const firstRow = details.getLastRow() + 1;
      details.getRange(firstRow, 1, rows.length, rows[0].length).setValues(rows);
      details.getRange(firstRow, 1, rows.length, 1).setNumberFormat('dd.MM.yyyy HH:mm:ss');
      details.getRange(firstRow, 7, rows.length, 2).setNumberFormat('€0.00');
    }

    rebuildDailySummary(ss, timezone);
    return jsonResponse({success:true, action:action, recordId:recordId, rows:items.length});
  } catch (err) {
    return jsonResponse({success:false, error:String(err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

function deleteRowsForRecord(sheet, recordId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const ids = sheet.getRange(2, 4, lastRow - 1, 1).getDisplayValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === recordId) sheet.deleteRow(i + 2);
  }
}

function getOrCreateDetailsSheet(ss) {
  let sheet = ss.getSheetByName(DETAILS_SHEET);
  if (!sheet) sheet = ss.insertSheet(DETAILS_SHEET);
  const headers = ['Zeitstempel','Datum','Uhrzeit','Referenz','Artikel','Anzahl','Einzelpreis','Summe','Sprache','Stärke','Basis Spirituose','Geschmack','Kategorie','Typ','Größe','Status'];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  } else if (sheet.getLastColumn() < headers.length) {
    sheet.getRange(1,1,1,headers.length).setValues([headers]);
  }
  sheet.getRange(1,1,1,headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1,170); sheet.setColumnWidth(4,220); sheet.setColumnWidth(5,250);
  sheet.setColumnWidth(11,180); sheet.setColumnWidth(12,180); sheet.setColumnWidth(14,120); sheet.setColumnWidth(15,100); sheet.setColumnWidth(16,120);
  return sheet;
}

function rebuildDailySummary(ss, timezone) {
  const details = getOrCreateDetailsSheet(ss);
  let summary = ss.getSheetByName(DAILY_SHEET);
  if (!summary) summary = ss.insertSheet(DAILY_SHEET);
  summary.clearContents();
  const headers = ['Datum','Artikel','Gesamtanzahl','Gesamtwert','Letzte Aktualisierung'];
  summary.getRange(1,1,1,headers.length).setValues([headers]).setFontWeight('bold');
  summary.setFrozenRows(1);

  const aggregate = {};
  if (details.getLastRow() > 1) {
    const rows = details.getRange(2,1,details.getLastRow()-1,details.getLastColumn()).getValues();
    rows.forEach(row => {
      const date = String(row[1] || '');
      const name = String(row[4] || '');
      if (!date || !name) return;
      const key = date + '\u0000' + name;
      if (!aggregate[key]) aggregate[key] = {date:date,name:name,qty:0,value:0};
      aggregate[key].qty += Number(row[5]) || 0;
      aggregate[key].value += Number(row[7]) || 0;
    });
  }

  const output = Object.values(aggregate)
    .sort((a,b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name))
    .map(x => [x.date,x.name,x.qty,x.value,new Date()]);
  if (output.length) {
    summary.getRange(2,1,output.length,5).setValues(output);
    summary.getRange(2,4,output.length,1).setNumberFormat('€0.00');
    summary.getRange(2,5,output.length,1).setNumberFormat('dd.MM.yyyy HH:mm:ss');
  }
  summary.setColumnWidth(1,110); summary.setColumnWidth(2,260); summary.setColumnWidth(3,120);
  summary.setColumnWidth(4,120); summary.setColumnWidth(5,180);
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
