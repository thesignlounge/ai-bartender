/**
 * THE SIGN CLUB V1.2 – Google Sheets backend
 * Bind this script to a NEW Google Spreadsheet.
 * Run setupClubSheets() once, then deploy as Web App.
 */
const CLUB = {
  MEMBERS: 'Members',
  REWARDS: 'Rewards',
  VISITS: 'Visits',
  SESSIONS: 'Sessions',
  SETTINGS: 'Settings',
  OFFERS: 'Offers',
  TZ: 'Europe/Vienna',
  SESSION_DAYS: 90,
  WELCOME_DAYS: 30
};

function setupClubSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheet_(ss, CLUB.MEMBERS, ['Member ID','Vorname','Telefon normalisiert','Telefon Anzeige','E-Mail','Geburtstag Tag','Geburtstag Monat','Passwort Hash','Passwort Salt','Marketing Zustimmung','Datenschutz Zeitpunkt','Marketing Zeitpunkt','Registriert am','Status','Welcome gültig bis','Welcome eingelöst am','Visits']);
  setupSheet_(ss, CLUB.REWARDS, ['Reward ID','Member ID','Offer ID','Status','Erstellt am','Gültig bis','Eingelöst am','Staff','Notiz']);
  setupSheet_(ss, CLUB.VISITS, ['Visit ID','Member ID','Zeitpunkt','Staff','Quelle','Notiz']);
  setupSheet_(ss, CLUB.SESSIONS, ['Session Token','Member ID','Erstellt am','Gültig bis','Letzte Nutzung']);
  setupSheet_(ss, CLUB.SETTINGS, ['Key','Value','Beschreibung']);
  setupSheet_(ss, CLUB.OFFERS, ['Offer ID','Typ','Name DE','Name EN','Beschreibung DE','Beschreibung EN','Bild URL','Startdatum','Enddatum','Mitglieder only','Max Nutzungen','Aktiv','Drink/Produkt','Preis Mitglied','Preis Normal','Aktualisiert am']);
  const settings = ss.getSheetByName(CLUB.SETTINGS);
  upsertSetting_(settings, 'STAFF_PIN', '2580', 'Bitte vor echtem Einsatz ändern');
  upsertSetting_(settings, 'WELCOME_DAYS', String(CLUB.WELCOME_DAYS), 'Gültigkeit Welcome Drink');
  upsertSetting_(settings, 'MANAGER_PIN', '2580', 'Manager PIN – vor echtem Einsatz ändern');
  seedOffers_();
  SpreadsheetApp.flush();
}

function doGet() {
  return json_({success:true, service:'THE SIGN CLUB API', version:'1.2'});
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');
    const handlers = {
      register: register_, login: login_, getMember: getMember_,
      updateMarketing: updateMarketing_, verifyStaff: verifyStaff_, validateOffer: validateOffer_,
      redeemOffer: redeemOffer_, getStaffMember: getStaffMember_, addVisit: addVisit_,
      managerDashboard: managerDashboard_, listMembers: listMembers_, listOffers: listOffers_,
      saveOffer: saveOffer_, getManagerSettings: getManagerSettings_, updateManagerSetting: updateManagerSetting_
    };
    if (!handlers[action]) return json_({success:false, code:'UNKNOWN_ACTION', error:'Unbekannte Aktion.'});
    return json_(handlers[action](body));
  } catch (err) {
    return json_({success:false, code:err.code || 'SERVER_ERROR', error:String(err.message || err)});
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function register_(d) {
  const name = clean_(d.name, 80);
  const phone = normalizePhone_(d.phone);
  const phoneDisplay = clean_(d.phoneDisplay || d.phone, 40);
  const email = clean_(d.email, 150).toLowerCase();
  const password = String(d.password || '');
  const birthDay = Number(d.birthDay), birthMonth = Number(d.birthMonth);
  if (!name || phone.length < 8 || !email || password.length < 6 || birthDay < 1 || birthDay > 31 || birthMonth < 1 || birthMonth > 12 || !d.privacyConsent) fail_('INVALID_INPUT','Pflichtfelder fehlen.');

  const members = sheet_(CLUB.MEMBERS);
  const rows = data_(members);
  if (rows.some(r => String(r[2]) === phone)) fail_('PHONE_EXISTS','Diese Telefonnummer ist bereits registriert.');
  if (rows.some(r => String(r[4]).toLowerCase() === email && String(r[13]) !== 'DELETED')) fail_('EMAIL_EXISTS','Diese E-Mail ist bereits registriert.');

  const now = new Date();
  const welcomeDays = Number(setting_('WELCOME_DAYS') || CLUB.WELCOME_DAYS);
  const welcomeExpiry = new Date(now.getTime() + welcomeDays * 86400000);
  const memberId = nextMemberId_(members);
  const salt = Utilities.getUuid();
  const hash = passwordHash_(password, salt);
  members.appendRow([memberId,name,phone,phoneDisplay,email,birthDay,birthMonth,hash,salt,!!d.marketingConsent,now,d.marketingConsent?now:'',now,'ACTIVE',welcomeExpiry,'',0]);
  sheet_(CLUB.REWARDS).appendRow([Utilities.getUuid(),memberId,'welcome','AVAILABLE',now,welcomeExpiry,'','','Automatic registration reward']);
  const token = createSession_(memberId);
  return {success:true, token, member: memberObject_(memberId)};
}

function login_(d) {
  const phone = normalizePhone_(d.phone), password = String(d.password || '');
  const row = findMemberRowByPhone_(phone);
  if (!row || row.values[13] !== 'ACTIVE' || passwordHash_(password, row.values[8]) !== row.values[7]) fail_('LOGIN_INVALID','Telefonnummer oder Passwort ist nicht korrekt.');
  const token = createSession_(row.values[0]);
  return {success:true, token, member:memberObject_(row.values[0])};
}

function getMember_(d) {
  const memberId = requireSession_(d.token);
  return {success:true, member:memberObject_(memberId)};
}

function updateMarketing_(d) {
  const memberId = requireSession_(d.token);
  const found = findMemberRowById_(memberId);
  found.sheet.getRange(found.row,10).setValue(!!d.marketingConsent);
  found.sheet.getRange(found.row,12).setValue(d.marketingConsent ? new Date() : '');
  return {success:true, member:memberObject_(memberId)};
}

function verifyStaff_(d) {
  requireStaff_(d.staffPin);
  return {success:true, role:'STAFF'};
}

function validateOffer_(d) {
  requireStaff_(d.staffPin);
  return {success:true, result:offerResult_(clean_(d.memberId,40), clean_(d.offerId,40))};
}

function redeemOffer_(d) {
  requireStaff_(d.staffPin);
  const memberId = clean_(d.memberId,40), offerId = clean_(d.offerId,40);
  const result = offerResult_(memberId, offerId);
  if (!result.valid) fail_('OFFER_INVALID',result.message || 'Angebot ist nicht gültig.');
  const rewards = sheet_(CLUB.REWARDS);
  const row = findReward_(memberId, offerId);
  if (!row) fail_('REWARD_NOT_FOUND','Reward nicht gefunden.');
  const now = new Date();
  rewards.getRange(row.row,4).setValue('REDEEMED');
  rewards.getRange(row.row,7).setValue(now);
  rewards.getRange(row.row,8).setValue('Staff Scanner');
  if (offerId === 'welcome') {
    const member = findMemberRowById_(memberId);
    member.sheet.getRange(member.row,16).setValue(now);
  }
  return {success:true, result:offerResult_(memberId, offerId)};
}

function getStaffMember_(d) {
  requireStaff_(d.staffPin);
  const memberId = clean_(d.memberId,40);
  return {success:true, member:memberObject_(memberId)};
}

function addVisit_(d) {
  requireStaff_(d.staffPin);
  const memberId = clean_(d.memberId,40);
  const member = findMemberRowById_(memberId);
  if (!member || member.values[13] !== 'ACTIVE') fail_('MEMBER_NOT_FOUND','Mitglied nicht gefunden.');
  const visitsSheet = sheet_(CLUB.VISITS);
  const now = new Date();
  visitsSheet.appendRow([Utilities.getUuid(),memberId,now,'Staff Scanner','Paid drink',clean_(d.note,120)]);
  const newCount = Number(member.values[16] || 0) + 1;
  member.sheet.getRange(member.row,17).setValue(newCount);
  if (newCount >= 10 && !findAvailableReward_(memberId,'loyalty')) {
    sheet_(CLUB.REWARDS).appendRow([Utilities.getUuid(),memberId,'loyalty','AVAILABLE',now,'','','','Reached 10 confirmed drinks']);
  }
  return {success:true, member:memberObject_(memberId)};
}

function memberObject_(memberId) {
  const found = findMemberRowById_(memberId);
  if (!found) fail_('MEMBER_NOT_FOUND','Mitglied nicht gefunden.');
  const r = found.values;
  const welcome = findReward_(memberId,'welcome');
  return {
    memberId:r[0], name:r[1], phone:r[2], phoneDisplay:r[3], email:r[4],
    birthDay:Number(r[5]), birthMonth:Number(r[6]), marketingConsent:r[9] === true,
    privacyConsentAt:iso_(r[10]), marketingConsentAt:iso_(r[11]), createdAt:iso_(r[12]),
    status:r[13], welcomeExpires:iso_(r[14]), welcomeRedeemedAt:iso_(r[15]), visits:Number(r[16] || 0),
    rewards:{welcome:welcome ? {status:welcome.values[3], expires:iso_(welcome.values[5]), redeemedAt:iso_(welcome.values[6])} : null,
      loyalty:findAvailableReward_(memberId,'loyalty') ? {status:'AVAILABLE'} : null}
  };
}

function offerResult_(memberId, offerId) {
  const member = memberObject_(memberId);
  if (member.status !== 'ACTIVE') return {valid:false,status:'INACTIVE',message:'Mitglied ist nicht aktiv.',member};
  if (offerId === 'monthly') return {valid:true,status:'AVAILABLE',offerId,offerName:'COCKTAIL OF THE MONTH',member};
  if (offerId === 'birthday') {
    const valid = member.birthMonth === Number(Utilities.formatDate(new Date(),CLUB.TZ,'M'));
    return {valid,status:valid?'AVAILABLE':'COMING_SOON',offerId,offerName:'BIRTHDAY DRINK',message:valid?'':'Nur im Geburtstagsmonat verfügbar.',member};
  }
  const reward = findReward_(memberId,offerId);
  if (!reward) return {valid:false,status:'NOT_FOUND',offerId,message:'Kein Reward vorhanden.',member};
  const status = String(reward.values[3]);
  const expiry = reward.values[5] instanceof Date ? reward.values[5] : null;
  const expired = expiry && expiry.getTime() < Date.now();
  const valid = status === 'AVAILABLE' && !expired;
  return {valid,status:expired?'EXPIRED':status,offerId,offerName:offerId==='welcome'?'WELCOME DRINK':'LOYALTY REWARD',expires:iso_(reward.values[5]),redeemedAt:iso_(reward.values[6]),message:valid?'':expired?'Angebot ist abgelaufen.':'Angebot wurde bereits eingelöst.',member};
}


function managerDashboard_(d) {
  requireManager_(d.managerPin);
  const members = data_(sheet_(CLUB.MEMBERS));
  const rewards = data_(sheet_(CLUB.REWARDS));
  const visits = data_(sheet_(CLUB.VISITS));
  const today = Utilities.formatDate(new Date(), CLUB.TZ, 'yyyy-MM-dd');
  const month = Utilities.formatDate(new Date(), CLUB.TZ, 'yyyy-MM');
  const activeMembers = members.filter(r => String(r[13]) === 'ACTIVE');
  return {success:true, dashboard:{
    totalMembers: activeMembers.length,
    newToday: activeMembers.filter(r => dateKey_(r[12]) === today).length,
    welcomeRedeemed: rewards.filter(r => String(r[2]) === 'welcome' && String(r[3]) === 'REDEEMED').length,
    visitsToday: visits.filter(r => dateKey_(r[2]) === today).length,
    birthdaysThisMonth: activeMembers.filter(r => Number(r[6]) === Number(Utilities.formatDate(new Date(),CLUB.TZ,'M'))).length,
    loyaltyReady: rewards.filter(r => String(r[2]) === 'loyalty' && String(r[3]) === 'AVAILABLE').length,
    month
  }};
}

function listMembers_(d) {
  requireManager_(d.managerPin);
  const q = clean_(d.query || '', 100).toLowerCase();
  const limit = Math.min(Math.max(Number(d.limit)||100,1),500);
  let rows = data_(sheet_(CLUB.MEMBERS)).map(r => ({
    memberId:String(r[0]), name:String(r[1]), phone:String(r[3]||r[2]), email:String(r[4]),
    birthday:String(r[5]).padStart(2,'0')+'.'+String(r[6]).padStart(2,'0'),
    marketing:r[9]===true, createdAt:iso_(r[12]), status:String(r[13]), visits:Number(r[16]||0)
  }));
  if(q) rows = rows.filter(x => [x.memberId,x.name,x.phone,x.email].join(' ').toLowerCase().indexOf(q)>=0);
  rows.sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  return {success:true, members:rows.slice(0,limit), total:rows.length};
}

function listOffers_(d) {
  requireManager_(d.managerPin);
  const rows = data_(sheet_(CLUB.OFFERS)).map(r => ({
    offerId:String(r[0]), type:String(r[1]), nameDe:String(r[2]), nameEn:String(r[3]),
    descriptionDe:String(r[4]), descriptionEn:String(r[5]), imageUrl:String(r[6]),
    startDate:dateOnly_(r[7]), endDate:dateOnly_(r[8]), memberOnly:r[9]===true,
    maxUses:Number(r[10]||1), active:r[11]===true, product:String(r[12]),
    memberPrice:r[13], normalPrice:r[14], updatedAt:iso_(r[15])
  }));
  return {success:true, offers:rows};
}

function saveOffer_(d) {
  requireManager_(d.managerPin);
  const o = d.offer || {};
  const id = clean_(o.offerId || Utilities.getUuid(), 60);
  const s = sheet_(CLUB.OFFERS);
  const found = findRow_(s,1,id);
  const row = [id,clean_(o.type,40),clean_(o.nameDe,100),clean_(o.nameEn,100),clean_(o.descriptionDe,300),clean_(o.descriptionEn,300),clean_(o.imageUrl,500),parseDate_(o.startDate),parseDate_(o.endDate),!!o.memberOnly,Math.max(1,Number(o.maxUses)||1),!!o.active,clean_(o.product,120),o.memberPrice===''?'':Number(o.memberPrice),o.normalPrice===''?'':Number(o.normalPrice),new Date()];
  if(found) s.getRange(found.row,1,1,row.length).setValues([row]); else s.appendRow(row);
  return {success:true, offerId:id};
}

function getManagerSettings_(d) {
  requireManager_(d.managerPin);
  const keys=['STAFF_PIN','WELCOME_DAYS'];
  const out={}; keys.forEach(k=>out[k]=String(setting_(k)||''));
  return {success:true, settings:out};
}

function updateManagerSetting_(d) {
  requireManager_(d.managerPin);
  const key=clean_(d.key,40), value=clean_(d.value,100);
  if(['STAFF_PIN','WELCOME_DAYS'].indexOf(key)<0) fail_('SETTING_INVALID','Setting ist nicht erlaubt.');
  const s=sheet_(CLUB.SETTINGS), found=findRow_(s,1,key);
  if(found) s.getRange(found.row,2).setValue(value); else s.appendRow([key,value,'Manager update']);
  return {success:true};
}

function requireManager_(pin) { if (String(pin || '') !== String(setting_('MANAGER_PIN') || '2580')) fail_('MANAGER_AUTH','Manager PIN ist nicht korrekt.'); }
function dateKey_(v) { return v instanceof Date ? Utilities.formatDate(v,CLUB.TZ,'yyyy-MM-dd') : ''; }
function dateOnly_(v) { return v instanceof Date ? Utilities.formatDate(v,CLUB.TZ,'yyyy-MM-dd') : (v?String(v):''); }
function parseDate_(v) { if(!v) return ''; const d=new Date(String(v)+'T12:00:00'); return isNaN(d.getTime())?'':d; }
function seedOffers_() {
  const s=sheet_(CLUB.OFFERS); if(s.getLastRow()>1) return;
  const now=new Date();
  [
    ['welcome','Welcome','WELCOME DRINK','WELCOME DRINK','Ein kostenloses Getränk für neue Mitglieder.','A complimentary drink for new members.','',now,'',true,1,true,'Ausgewählte Getränke','','',now],
    ['birthday','Birthday','BIRTHDAY DRINK','BIRTHDAY DRINK','Dein Geburtstagsdrink wartet auf dich.','Your birthday drink is waiting for you.','',now,'',true,1,true,'Ausgewählte Getränke','','',now],
    ['monthly','Monthly Deal','COCKTAIL OF THE MONTH','COCKTAIL OF THE MONTH','Exklusiver Clubpreis.','Exclusive club price.','',now,'',true,1,true,'Espresso Martini',8.9,11.9,now],
    ['loyalty','Loyalty Reward','LOYALTY REWARD','LOYALTY REWARD','10 Drinks = 1 Reward.','10 drinks = 1 reward.','',now,'',true,1,true,'Ausgewählter Drink','','',now]
  ].forEach(r=>s.appendRow(r));
}

function createSession_(memberId) {
  const token = Utilities.getUuid() + Utilities.getUuid();
  const now = new Date(), expires = new Date(now.getTime() + CLUB.SESSION_DAYS*86400000);
  sheet_(CLUB.SESSIONS).appendRow([token,memberId,now,expires,now]);
  return token;
}
function requireSession_(token) {
  const rows = data_(sheet_(CLUB.SESSIONS));
  const i = rows.findIndex(r => String(r[0]) === String(token || ''));
  if (i < 0 || !(rows[i][3] instanceof Date) || rows[i][3].getTime() < Date.now()) fail_('SESSION_INVALID','Bitte erneut anmelden.');
  sheet_(CLUB.SESSIONS).getRange(i+2,5).setValue(new Date());
  return String(rows[i][1]);
}
function requireStaff_(pin) { if (String(pin || '') !== String(setting_('STAFF_PIN') || '2580')) fail_('STAFF_AUTH','Staff PIN ist nicht korrekt.'); }

function findMemberRowByPhone_(phone) { return findRow_(sheet_(CLUB.MEMBERS),3,phone); }
function findMemberRowById_(id) { return findRow_(sheet_(CLUB.MEMBERS),1,id); }
function findReward_(memberId,offerId) {
  const s=sheet_(CLUB.REWARDS), rows=data_(s);
  for(let i=rows.length-1;i>=0;i--) if(String(rows[i][1])===memberId && String(rows[i][2])===offerId) return {sheet:s,row:i+2,values:rows[i]};
  return null;
}
function findAvailableReward_(memberId,offerId) { const r=findReward_(memberId,offerId); return r && String(r.values[3])==='AVAILABLE' ? r : null; }
function findRow_(s,col,value) { const rows=data_(s); const i=rows.findIndex(r=>String(r[col-1])===String(value)); return i<0?null:{sheet:s,row:i+2,values:rows[i]}; }
function data_(s) { const n=s.getLastRow(); return n<2?[]:s.getRange(2,1,n-1,s.getLastColumn()).getValues(); }
function sheet_(name) { const s=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); if(!s) fail_('SETUP_REQUIRED','Bitte zuerst setupClubSheets() ausführen.'); return s; }
function setupSheet_(ss,name,headers) { let s=ss.getSheetByName(name); if(!s)s=ss.insertSheet(name); if(s.getLastRow()===0)s.appendRow(headers); else s.getRange(1,1,1,headers.length).setValues([headers]); s.setFrozenRows(1); s.getRange(1,1,1,headers.length).setFontWeight('bold'); }
function upsertSetting_(s,key,value,description) { const rows=data_(s), i=rows.findIndex(r=>String(r[0])===key); if(i<0)s.appendRow([key,value,description]); }
function setting_(key) { const r=findRow_(sheet_(CLUB.SETTINGS),1,key); return r?r.values[1]:''; }
function nextMemberId_(members) { const n=Math.max(1,members.getLastRow()); return 'TS'+String(n).padStart(6,'0'); }
function normalizePhone_(v) { let x=String(v||'').trim().replace(/[\s()\-\/.]/g,''); if(x.indexOf('00')===0)x='+'+x.slice(2); if(x.indexOf('0')===0)x='+43'+x.slice(1); return x; }
function passwordHash_(password,salt) { const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt)+'|'+String(password), Utilities.Charset.UTF_8); return bytes.map(b=>(b+256)%256).map(b=>('0'+b.toString(16)).slice(-2)).join(''); }
function clean_(v,max) { let x=String(v==null?'':v).trim(); if(/^[=+\-@]/.test(x))x="'"+x; return x.slice(0,max||500); }
function iso_(v) { return v instanceof Date ? v.toISOString() : (v ? String(v) : null); }
function fail_(code,msg) { const e=new Error(msg); e.code=code; throw e; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
