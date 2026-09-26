/* ===== Catalogue (serveur) ===== */
mountChrome('cat');
let ALL=[];
const params=new URLSearchParams(location.search);
const initCat=params.get('cat');
const initPromo=params.get('promo');

const brands=CATEGORIES.map(c=>c.name);
document.getElementById('fBrand').innerHTML=brands.map(b=>`<label class="chk"><input type="checkbox" class="f-brand" value="${b}"> ${b}</label>`).join('');
const gens=['8e','9e','10e','11e','12e','13e'];
document.getElementById('fGen').innerHTML=gens.map(g=>`<label class="chk"><input type="checkbox" class="f-gen" value="${g}"> ${g} g\u00e9n\u00e9ration</label>`).join('');

if(initCat){document.querySelectorAll('.f-brand').forEach(c=>{if(c.value===initCat)c.checked=true;});document.getElementById('pageTitle').textContent=initCat;}
if(initPromo){document.getElementById('fPromo').checked=true;document.getElementById('pageTitle').textContent='Promotions';}

const priceRange=document.getElementById('priceRange');
const filterPanel=document.querySelector('.filters');

function keepFiltersVisible(){
  if (window.innerWidth <= 768 && filterPanel) {
    filterPanel.classList.add('open');
  }
}

priceRange.addEventListener('input',()=>{document.getElementById('priceVal').textContent=fmt(+priceRange.value);keepFiltersVisible();render();});
document.getElementById('search').addEventListener('input',render);
document.getElementById('sort').addEventListener('change',render);

document.querySelectorAll('.filters input[type=checkbox]').forEach(c=>{
  c.addEventListener('change',()=>{
    keepFiltersVisible();
    render();
  });
});

function vals(cls){return[...document.querySelectorAll('.'+cls+':checked')].map(c=>c.value);}
function resetFilters(){document.querySelectorAll('.filters input').forEach(i=>{if(i.type==='checkbox')i.checked=false;});priceRange.value=1500000;document.getElementById('priceVal').textContent=fmt(1500000);document.getElementById('search').value='';keepFiltersVisible();render();}

function render(){
  const q=document.getElementById('search').value.toLowerCase().trim();
  const br=vals('f-brand'),gn=vals('f-gen'),cp=vals('f-cpu'),rm=vals('f-ram').map(Number),sd=vals('f-ssd').map(Number);
  const tac=document.getElementById('fTactile').checked,dispo=document.getElementById('fDispo').checked,promo=document.getElementById('fPromo').checked;
  const maxP=+priceRange.value;
  let list=ALL.filter(p=>{
    if(q&&!(p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)||p.brand.toLowerCase().includes(q)||(p.desc||'').toLowerCase().includes(q)))return false;
    if(br.length&&!br.includes(p.cat)&&!br.includes(p.brand))return false;
    if(gn.length&&!gn.includes(p.gen))return false;
    if(cp.length&&!cp.includes(p.cpu))return false;
    if(rm.length&&!rm.includes(p.ram))return false;
    if(sd.length&&!sd.includes(p.ssd))return false;
    if(tac&&!p.tactile)return false;
    if(dispo&&!p.dispo)return false;
    if(promo&&!p.promo)return false;
    if(p.price>maxP)return false;
    return true;
  });
  const s=document.getElementById('sort').value;
  if(s==='price-asc')list.sort((a,b)=>a.price-b.price);
  else if(s==='price-desc')list.sort((a,b)=>b.price-a.price);
  else if(s==='new')list.sort((a,b)=>(b.neuf?1:0)-(a.neuf?1:0));
  else list.sort((a,b)=>b.sold-a.sold);
  document.getElementById('resCount').textContent=list.length+' produit'+(list.length>1?'s':'')+' trouv\u00e9'+(list.length>1?'s':'');
  const grid=document.getElementById('catGrid');
  if(!ALL.length&&productsLoadFailed()){
    grid.innerHTML='<div class="no-res"><i class="fa-solid fa-plug-circle-xmark"></i><h3>Impossible de charger les produits</h3><p>Le serveur ne r\u00e9pond pas. Assurez-vous d\'avoir d\u00e9marr\u00e9 le site avec <b>npm start</b>, puis rechargez la page.</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px"><button class="btn btn-primary btn-sm" onclick="location.reload()"><i class="fa-solid fa-rotate"></i> Recharger</button><a href="index.html" class="btn btn-ghost btn-sm"><i class="fa-solid fa-house"></i> Retour \u00e0 l\'accueil</a></div></div>';
    return;
  }
  grid.innerHTML=list.length?list.map(productCard).join(''):'<div class="no-res"><i class="fa-solid fa-magnifying-glass"></i><h3>Aucun produit trouv\u00e9</h3><p>Essayez de modifier vos filtres ou votre recherche.</p><a href="index.html" class="btn btn-ghost btn-sm" style="margin-top:14px"><i class="fa-solid fa-house"></i> Retour \u00e0 l\'accueil</a></div>';
  initReveal();
}
boot(function(){ ALL=getProducts(); render(); });
