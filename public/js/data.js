/* ===== KAMBIRE (version serveur) — couche API ===== */
const API = window.location.origin;
const WA_NUMS = ['2250546622177','2250586292127'];
const WA_MSG = 'Bonjour KAMBIRE INFORMATIQUE, je souhaite commander ce produit';
const DATA_SYNC_KEY = 'kambire_data_sync';
function waLink(num, text){return 'https://wa.me/'+num+'?text='+encodeURIComponent(text||WA_MSG);}
function fmt(n){return new Intl.NumberFormat('fr-FR').format(n)+' FCFA';}
function notifyDataSync(){
  try {
    localStorage.setItem(DATA_SYNC_KEY, JSON.stringify({ ts: Date.now() }));
  } catch (e) {}
}
function bindDataSyncListener(){
  if (window.__kambire_sync_bound) return;
  window.__kambire_sync_bound = true;
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key !== DATA_SYNC_KEY) return;
    if (window.location.pathname.includes('/admin.html')) return;
    setTimeout(() => window.location.reload(), 200);
  });
}
bindDataSyncListener();

const IMG = {
  laptop:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  hp:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  dell:'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
  lenovo:'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
  zbook:'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80',
  gamer:'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80',
  screen:'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800&q=80',
  printer:'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80',
  accessory:'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80',
  bag:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
};

function resolveProductImage(product){
  const source = product || {};
  const name = (source.name || '').toLowerCase();
  const brand = (source.brand || source.cat || '').toLowerCase();
  const cat = (source.cat || '').toLowerCase();

  const matchesCat = (list) => list.some(v => cat.includes(v) || name.includes(v));

  if (matchesCat(['écran','ecran','screen','monitor','ultrasharp'])) return IMG.screen;
  if (matchesCat(['imprimante','printer','laser'])) return IMG.printer;
  if (matchesCat(['souris','clavier','casque','ssd','sac','bag','accessoire'])) return IMG.accessory;
  if (matchesCat(['pc gamer','gaming','rtx'])) return IMG.gamer;
  if (matchesCat(['zbook','station de travail','workstation'])) return IMG.zbook;
  if (brand.includes('dell') || /dell|latitude|precision|ultrasharp/.test(name)) return IMG.dell;
  if (brand.includes('lenovo') || /lenovo|thinkpad|ideapad|x1 carbon|t14|t460s/.test(name)) return IMG.lenovo;
  if (brand.includes('hp') || /hp|pavilion|elitebook|probook|zbook|folio|840|830|850|450|440|640|820/.test(name)) return IMG.hp;

  if (source.img && /^https?:\/\//.test(source.img)) return source.img;
  if (source.img) return source.img;
  return IMG.laptop;
}

const CATEGORIES = [
  {name:'HP',img:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',desc:'Ordinateurs HP'},
  {name:'Dell',img:'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80',desc:'Gamme Dell'},
  {name:'Lenovo',img:'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=900&q=80',desc:'Serie ThinkPad'},
  {name:'ZBook',img:'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=900&q=80',desc:'Stations de travail'},
  {name:'PC Gamer',img:'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?auto=format&fit=crop&w=900&q=80',desc:'Machines gaming'},
  {name:'Écrans',img:'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?auto=format&fit=crop&w=900&q=80',desc:'Moniteurs HD/4K'},
  {name:'Imprimantes',img:'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=900&q=80',desc:'Laser & jet'},
  {name:'Accessoires',img:'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=900&q=80',desc:'Souris, clavier...'},
  {name:'Sacs d’ordinateur',img:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80',desc:'Protection'}
];

/* ---- Cache produits ---- */
let _products = [];
let _loadError = false;
async function loadProducts(){
  try{
    const r = await fetch(API+'/api/products');
    if(!r.ok) throw new Error('HTTP '+r.status);
    _products = await r.json();
    _loadError = false;
  }
  catch(e){ console.error('Erreur chargement produits', e); _products = []; _loadError = true; }
  return _products;
}
function getProducts(){ return _products; }
function productsLoadFailed(){ return _loadError; }
async function fetchProduct(id){
  const local = _products.find(p=>p.id===id);
  if(local) return local;
  try{ const r = await fetch(API+'/api/products/'+id); if(r.ok) return await r.json(); }catch(e){}
  return null;
}

/* ---- Boot: charge les produits puis execute le callback ---- */
function boot(cb){ loadProducts().then(()=>cb && cb()); }

/* ---- Auth admin (token JWT) ---- */
function adminToken(){ return sessionStorage.getItem('kambire_token'); }
function authHeaders(){ return { 'Content-Type':'application/json', 'Authorization':'Bearer '+adminToken() }; }
async function apiLogin(username,password){
  const r = await fetch(API+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
  if(!r.ok) return null;
  return await r.json();
}
