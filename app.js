
let menuData = loadMenuData();
let drinks = menuData.drinks.filter(d=>d.visible!==false);
const i18n = {
  en:{brandSub:"AI Cocktail Experience",navAI:"AI Bartender",navMenu:"Full Menu",navRituals:"Rituals",since:"A NIGHT OUT · SINCE 2007",heroTitle:"Tell us how you want to feel tonight.",heroLead:"Choose your mood, flavour and strength. The Sign AI Bartender will match you with the right drink.",findDrink:"Find my drink",seeAll:"See all drinks",romantic:"♥ Romantic",party:"✦ Party",fresh:"◌ Fresh",adventurous:"⚡ Adventurous",featureEyebrow:"AI-matched, just for you",featureTitle:"Your perfect drink, found in seconds.",featureSub:"Tell us your mood — the rest is on us.",yourAI:"YOUR AI BARTENDER",threeChoices:"Three choices. One perfect match.",mood:"Mood",romanticPlain:"Romantic",partyPlain:"Party",freshPlain:"Fresh",adventurousPlain:"Adventurous",classic:"Classic",surprise:"Surprise me",taste:"Taste",choose3:"Choose up to 3",sweet:"Sweet",sour:"Sour",bitter:"Bitter",spicy:"Spicy",smoky:"Smoky",strength:"Strength",easy:"Easy",balanced:"Balanced",strong:"Strong",recommend:"Recommend my cocktail",aiMatch:"AI MATCH",yourRec:"YOUR RECOMMENDATION",another:"Show another",addOrder:"Add to order",fullMenu:"FULL MENU",smartMenu:"Every drink. One smart menu.",searchPlaceholder:"Search cocktail, flavour or category",ritualEyebrow:"A LITTLE RITUAL WORTH KEEPING",ritualTitle:"Every night has its own story.",aperitivoDate:"Aperitivo Date",aperitivoText:"Raise a glass to gossip. Selected aperitivo highlights.",signatureTasting:"Signature Tasting",signatureText:"Choose three drinks from the tasting menu.",musicBingo:"Music Bingo",musicText:"Recognise the track, mark your card and play.",cheers:"Cheers & Shenanigans",cheersText:"Music, theatre, cocktails and late-night energy.",bartenderChoice:"Bartender Choice",bartenderText:"No menu, no limits. Let the bartender create.",yourOrder:"Your Selection",total:"Total",sendStaff:"🍸 Add to overview",cartHint:"This only saves your selection for today’s overview. It is not an order and is not sent to the POS.",order:"Tonight's Picks",added:"added",empty:"Your order is empty.",ready:"Recommendation ready",sweetBar:"Sweet",freshBar:"Fresh",boldBar:"Bold",curiousBar:"Curious",strengthHint:"Choose your preferred alcohol strength",level0:"Alcohol-free",level1:"Light",level2:"Medium",level3:"Strong",level4:"Very strong",baseSpirit:"Base spirit",baseHint:"Choose the spirit as a base",anySpirit:"Surprise me",liqueur:"Liqueur",exactMatch:"Exact match: all selected filters are applied.",closeMatch:"No exact match — showing the closest available cocktail.",photoComing:"Cocktail photo coming soon",saving:"Saving…",savedOverview:"Added to today’s overview",alreadySaved:"This unchanged selection is already in today’s overview",saveFailed:"Could not save. Please try again."},
  de:{brandSub:"KI-Cocktail-Erlebnis",navAI:"KI-Barkeeper",navMenu:"Gesamte Karte",navRituals:"Wochenprogramm",since:"A NIGHT OUT · SEIT 2007",heroTitle:"Wie möchtest du dich heute Abend fühlen?",heroLead:"Wähle Stimmung, Geschmack und Stärke. Der KI-Barkeeper von The Sign findet den passenden Drink für dich.",findDrink:"Meinen Drink finden",seeAll:"Alle Drinks ansehen",romantic:"♥ Romantisch",party:"✦ Party",fresh:"◌ Frisch",adventurous:"⚡ Abenteuerlustig",featureEyebrow:"KI-Empfehlung, nur für dich",featureTitle:"Dein perfekter Drink, in Sekunden gefunden.",featureSub:"Sag uns deine Stimmung — den Rest übernehmen wir.",yourAI:"DEIN KI-BARKEEPER",threeChoices:"Drei Entscheidungen. Ein perfekter Match.",mood:"Stimmung",romanticPlain:"Romantisch",partyPlain:"Party",freshPlain:"Frisch",adventurousPlain:"Abenteuerlustig",classic:"Klassisch",surprise:"Überrasch mich",taste:"Geschmack",choose3:"Bis zu 3 auswählen",sweet:"Süß",sour:"Sauer",bitter:"Bitter",spicy:"Scharf",smoky:"Rauchig",strength:"Stärke",easy:"Leicht",balanced:"Ausgewogen",strong:"Stark",recommend:"Cocktail empfehlen",aiMatch:"KI-MATCH",yourRec:"DEINE EMPFEHLUNG",another:"Weitere Empfehlung",addOrder:"Zur Bestellung hinzufügen",fullMenu:"GESAMTE KARTE",smartMenu:"Alle Drinks. Eine smarte Karte.",searchPlaceholder:"Cocktail, Geschmack oder Kategorie suchen",ritualEyebrow:"EIN KLEINES RITUAL, DAS BLEIBT",ritualTitle:"Jeder Abend erzählt seine eigene Geschichte.",aperitivoDate:"Aperitivo Date",aperitivoText:"Ein Glas, gute Gespräche und ausgewählte Aperitivo-Highlights.",signatureTasting:"Signature Tasting",signatureText:"Wähle drei Drinks aus dem Tasting-Menü.",musicBingo:"Music Bingo",musicText:"Song erkennen, Karte markieren und mitspielen.",cheers:"Cheers & Shenanigans",cheersText:"Musik, Show, Cocktails und Late-Night-Energie.",bartenderChoice:"Bartender Choice",bartenderText:"Keine Karte, keine Grenzen. Lass den Barkeeper kreieren.",yourOrder:"Meine Auswahl",total:"Gesamt",sendStaff:"🍸 Zur Übersicht hinzufügen",cartHint:"Dies speichert deine Auswahl nur für die heutige Übersicht. Es ist keine Bestellung und wird nicht an das Kassensystem übermittelt.",order:"Meine Auswahl",added:"hinzugefügt",empty:"Deine Bestellung ist leer.",ready:"Empfehlung ist bereit",sweetBar:"Süß",freshBar:"Frisch",boldBar:"Kräftig",curiousBar:"Abenteuer",strengthHint:"Wähle die gewünschte Alkoholstärke",level0:"Ohne Alkohol",level1:"Leicht alkoholisch",level2:"Mittel",level3:"Stark",level4:"Sehr stark",baseSpirit:"Basis Spirituose",baseHint:"Wähle den Spirit als Basis",anySpirit:"Überrasch mich",liqueur:"Likör",exactMatch:"Exakter Treffer: Alle gewählten Filter werden berücksichtigt.",closeMatch:"Kein exakter Treffer – wir zeigen den passendsten verfügbaren Cocktail.",photoComing:"Cocktailfoto folgt in Kürze",saving:"Wird gespeichert…",savedOverview:"Zur heutigen Übersicht hinzugefügt",alreadySaved:"Diese unveränderte Auswahl wurde bereits gespeichert",saveFailed:"Speichern nicht möglich. Bitte erneut versuchen."}
};
const grid=document.getElementById('menuGrid'),filters=document.getElementById('filters'),search=document.getElementById('search');
let currentCategory='All',matches=[],idx=0,currentRec=null,orderList=[],lang=activeLang();

function t(k){return i18n[lang][k]||k}
function categoryOrder(){return ['All',...new Set(drinks.map(d=>d.category))]}
function categoryLabel(cat){if(cat==='All')return lang==='en'?'All':'Alle';const d=drinks.find(x=>x.category===cat);return lang==='de'?(d?.category_de||cat):cat}
function applyLanguage(){
 document.documentElement.lang=lang;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=t(el.dataset.i18n));
 document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>el.placeholder=t(el.dataset.i18nPlaceholder));
 document.getElementById('lang').textContent=lang==='en'?'DE':'EN';
 renderFilters();renderMenu();renderCart();if(currentRec)show(currentRec,false);
}

function photoSlug(name){
 return String(name||'cocktail').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function cocktailPhoto(d){return d.image||`images/cocktails/${photoSlug(d.name)}.jpg`}
function photoMarkup(d,extraClass=''){
 const src=cocktailPhoto(d);
 return `<div class="cocktail-photo ${extraClass}"><img src="${src}" alt="${d.name}" loading="lazy" onload="this.parentElement.classList.add('has-photo')" onerror="this.remove()"><div class="photo-placeholder" aria-hidden="true"><img src="logo.png" alt=""><span>${t('photoComing')}</span></div></div>`;
}
function renderFilters(){filters.innerHTML=categoryOrder().map(c=>`<button class="${c===currentCategory?'active':''}" data-cat="${c}">${categoryLabel(c)}</button>`).join('')}
function renderMenu(){
 const q=search.value.toLowerCase().trim();
 const list=drinks.filter(d=>{
  const hay=[d.name,d.category,d.category_de,d.desc,d.desc_de,...(d.tags||[]),...(d.tags_de||[])].join(' ').toLowerCase();
  return (currentCategory==='All'||d.category===currentCategory)&&(!q||hay.includes(q))
 }).sort(bySort);
 grid.innerHTML=list.map(d=>`<article class="menu-card">${photoMarkup(d,'menu-photo')}<span class="cat">${lang==='de'?d.category_de:d.category}</span><span class="price">${euro(d.price)}</span><h3>${d.name}</h3><p>${lang==='de'?d.desc_de:d.desc}</p><div class="tags">${(lang==='de'?d.tags_de:d.tags).map(x=>`<span>${x}</span>`).join('')}</div><button class="card-order" data-name="${d.name}">${t('addOrder')}</button></article>`).join('');
}
function normaliseDrink(d){
 if(typeof d.alcoholLevel!=="number")d.alcoholLevel=d.category==='Zero'?0:Math.max(1,Math.min(4,d.strength||2));
 if(!Array.isArray(d.baseSpirits))d.baseSpirits=[];
 return d;
}
function score(d,mood,tastes,alcoholLevel,baseSpirit){
 d=normaliseDrink(d);let s=0;
 if(mood==='surprise')s+=2;else if((d.moods||[]).includes(mood))s+=18;
 const n=tastes.filter(x=>(d.tastes||[]).includes(x)).length;
 s+=n*14;if(tastes.length)s+=(n/tastes.length)*8;
 s+=Math.max(0,12-Math.abs(d.alcoholLevel-alcoholLevel)*6);
 if(baseSpirit==='any')s+=2;else if(d.baseSpirits.includes(baseSpirit))s+=24;
 return s;
}
function isExact(d,mood,tastes,alcoholLevel,baseSpirit){
 d=normaliseDrink(d);
 const moodOK=mood==='surprise'||(d.moods||[]).includes(mood);
 const tastesOK=tastes.every(x=>(d.tastes||[]).includes(x));
 const levelOK=d.alcoholLevel===alcoholLevel;
 const spiritOK=baseSpirit==='any'||d.baseSpirits.includes(baseSpirit);
 return moodOK&&tastesOK&&levelOK&&spiritOK;
}
function recommend(){
 const fd=new FormData(quiz),mood=fd.get('mood'),tastes=fd.getAll('taste');
 const alcoholLevel=Number(fd.get('alcoholLevel')??2),baseSpirit=fd.get('baseSpirit')||'any';
 const exact=drinks.filter(d=>isExact(d,mood,tastes,alcoholLevel,baseSpirit));
 const pool=exact.length?exact:drinks;
 matches=pool.map(d=>({...normaliseDrink(d),s:score(d,mood,tastes,alcoholLevel,baseSpirit)})).sort((a,b)=>b.s-a.s||a.sort-b.sort).slice(0,6);
 idx=0;
 const note=document.getElementById('matchNote');if(note){note.textContent=t(exact.length?'exactMatch':'closeMatch');note.classList.toggle('fallback',!exact.length)}
 show(matches[0],true);
}
function show(d,notify=true){if(!d)return;currentRec=d;recName.textContent=d.name;recDesc.textContent=lang==='de'?d.desc_de:d.desc;recPrice.textContent=euro(d.price);match.textContent=Math.min(99,86+Math.round(d.s||8))+'%';const wrap=document.getElementById('recPhotoWrap'),img=document.getElementById('recPhoto');if(wrap&&img){wrap.classList.remove('has-photo');img.alt=d.name;img.onload=()=>wrap.classList.add('has-photo');img.onerror=()=>wrap.classList.remove('has-photo');img.src=cocktailPhoto(d);}const vals={[t('sweetBar')]:d.tastes.includes('sweet')?88:36,[t('freshBar')]:d.tastes.includes('fresh')?91:48,[t('boldBar')]:Math.min(100,(d.alcoholLevel??d.strength)*23),[t('curiousBar')]:d.moods.includes('adventurous')?92:58};bars.innerHTML=Object.entries(vals).map(([k,v])=>`<div class="barrow"><span>${k}</span><div class="bar"><i style="width:${v}%"></i></div><b>${v}</b></div>`).join('');if(notify)toast(t('ready'))}
function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1400)}
const ORDER_EXPIRY_HOURS=6;
function saveOrder(){try{localStorage.setItem('sign_order',JSON.stringify({items:orderList,savedAt:Date.now()}))}catch(e){}}
function loadOrder(){
  try{
    const s=localStorage.getItem('sign_order');
    if(!s){orderList=[];return}
    const parsed=JSON.parse(s);
    const ageHours=(Date.now()-(parsed.savedAt||0))/3600000;
    if(ageHours>ORDER_EXPIRY_HOURS){localStorage.removeItem('sign_order');orderList=[]}
    else orderList=parsed.items||[]
  }catch(e){orderList=[]}
}
function addToCart(name){const d=drinks.find(x=>x.name===name);if(!d)return;const f=orderList.find(x=>x.name===name);f?f.qty++:orderList.push({...d,qty:1});saveOrder();renderCart();toast(`${name} ${t('added')}`)}
function changeQty(name,delta){const f=orderList.find(x=>x.name===name);if(!f)return;f.qty+=delta;if(f.qty<=0)orderList=orderList.filter(x=>x.name!==name);saveOrder();renderCart()}
function removeItem(name){orderList=orderList.filter(x=>x.name!==name);saveOrder();renderCart()}
function renderCart(){cartItems.innerHTML=orderList.length?orderList.map(i=>`<div class="cart-item"><span>${i.name}</span><div class="qty-control"><button type="button" class="qty-btn" data-act="minus" data-name="${i.name}">−</button><b>${i.qty}</b><button type="button" class="qty-btn" data-act="plus" data-name="${i.name}">+</button></div><strong>${euro(i.price*i.qty)}</strong><button type="button" class="remove-btn" data-name="${i.name}" aria-label="Remove">×</button></div>`).join(''):`<p>${t('empty')}</p>`;cartTotal.textContent=euro(orderList.reduce((s,i)=>s+i.price*i.qty,0));cartCount.textContent=orderList.reduce((s,i)=>s+i.qty,0)}
cartItems.addEventListener('click',e=>{
  const qtyBtn=e.target.closest('.qty-btn');
  if(qtyBtn){changeQty(qtyBtn.dataset.name,qtyBtn.dataset.act==='plus'?1:-1);return}
  const rmBtn=e.target.closest('.remove-btn');
  if(rmBtn){removeItem(rmBtn.dataset.name)}
});
const tasteInputs=[...document.querySelectorAll('input[name="taste"]')];
function updateTasteLimitState(){const count=tasteInputs.filter(i=>i.checked).length;tasteInputs.forEach(i=>{const blocked=count>=3&&!i.checked;i.disabled=blocked;i.closest('label').classList.toggle('limit-blocked',blocked)})}
tasteInputs.forEach(i=>i.addEventListener('change',updateTasteLimitState));updateTasteLimitState();
quiz.addEventListener('submit',e=>{e.preventDefault();recommend()});another.addEventListener('click',()=>{idx=(idx+1)%matches.length;show(matches[idx],true)});orderBtn.addEventListener('click',()=>currentRec&&addToCart(currentRec.name));
filters.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;currentCategory=b.dataset.cat;renderFilters();renderMenu()});
search.addEventListener('input',renderMenu);grid.addEventListener('click',e=>{const b=e.target.closest('[data-name]');if(b)addToCart(b.dataset.name)});
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.go).scrollIntoView({behavior:'smooth'})));
const navToggle=document.getElementById('navToggle'),mobileNav=document.getElementById('mobileNav');
if(navToggle&&mobileNav){
 navToggle.addEventListener('click',()=>{const open=mobileNav.classList.toggle('open');navToggle.classList.toggle('open',open);navToggle.setAttribute('aria-expanded',open)});
 mobileNav.querySelectorAll('button,a').forEach(el=>el.addEventListener('click',()=>{mobileNav.classList.remove('open');navToggle.classList.remove('open');navToggle.setAttribute('aria-expanded',false)}));
}
document.querySelectorAll('[data-mood]').forEach(b=>b.addEventListener('click',()=>{const r=document.querySelector(`input[name="mood"][value="${b.dataset.mood}"]`);if(r)r.checked=true;document.getElementById('ai').scrollIntoView({behavior:'smooth'})}));
cartFab.addEventListener('click',()=>cart.classList.add('open'));closeCart.addEventListener('click',()=>cart.classList.remove('open'));
const confirmOrder=document.getElementById('confirmOrder');
const LEDGER_URL='https://script.google.com/macros/s/AKfycbyrOMaBe9yDIFBcHZD0PEV4SKdAhL16Na-AxsWCNntucgK7lUGhaA_OjjIwS2E9T6fV/exec';
function makeRecordId(){
  const d=new Date(),pad=n=>String(n).padStart(2,'0');
  return `SIGN-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
}
function orderFingerprint(){
  return orderList.map(i=>`${i.name}:${i.qty}`).sort().join('|');
}
async function logSelectionToLedger(){
  if(!orderList.length){toast(t('empty'));return false}
  const fingerprint=orderFingerprint();
  if(sessionStorage.getItem('sign_last_saved_selection')===fingerprint){toast(t('alreadySaved'));return false}
  const payload={
    recordId:makeRecordId(),
    submittedAt:new Date().toISOString(),
    language:lang,
    totalQuantity:orderList.reduce((s,i)=>s+i.qty,0),
    total:orderList.reduce((s,i)=>s+i.price*i.qty,0),
    items:orderList.map(i=>({
      name:i.name,
      quantity:i.qty,
      unitPrice:Number(i.price)||0,
      subtotal:(Number(i.price)||0)*i.qty,
      alcoholLevel:Number(i.alcoholLevel??i.strength??0),
      baseSpirits:Array.isArray(i.baseSpirits)?i.baseSpirits:[],
      tastes:Array.isArray(i.tastes)?i.tastes:[],
      category:i.category||''
    }))
  };
  confirmOrder.disabled=true;
  confirmOrder.textContent=t('saving');
  try{
    await fetch(LEDGER_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    sessionStorage.setItem('sign_last_saved_selection',fingerprint);
    toast(t('savedOverview'));
    return true;
  }catch(err){
    console.error(err);toast(t('saveFailed'));return false;
  }finally{
    confirmOrder.disabled=false;
    confirmOrder.textContent=t('sendStaff');
  }
}
if(confirmOrder)confirmOrder.addEventListener('click',async()=>{const ok=await logSelectionToLedger();if(ok)setTimeout(()=>cart.classList.remove('open'),500)});
document.getElementById('lang').addEventListener('click',()=>{lang=lang==='en'?'de':'en';setActiveLang(lang);applyLanguage()});
window.addEventListener('the-sign-menu-updated',()=>{menuData=loadMenuData();drinks=menuData.drinks.filter(d=>d.visible!==false).map(normaliseDrink);renderFilters();renderMenu();recommend()});
applyLanguage();recommend();loadOrder();renderCart();
