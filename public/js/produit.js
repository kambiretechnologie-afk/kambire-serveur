/* ===== Fiche produit (serveur) ===== */
mountChrome('cat');
const PID=new URLSearchParams(location.search).get('id');
let q=1;
function getQ(){return q;}
function chQ(d){q=Math.max(1,q+d);document.getElementById('qv').textContent=q;}
function normalizeGallery(product){
  const raw = Array.isArray(product && product.gallery) ? product.gallery : [];
  const list = raw.filter(Boolean);
  const fallbackPool = [
    product && product.img,
    resolveProductImage(product),
    IMG.laptop,
    IMG.hp,
    IMG.dell,
    IMG.lenovo,
    IMG.gamer,
    IMG.screen,
    IMG.printer,
    IMG.accessory,
    IMG.zbook
  ].filter(Boolean);
  const base = [...list, ...fallbackPool];
  const unique = [];
  base.forEach(url => { if (url && !unique.includes(url)) unique.push(url); });
  if (!unique.length) unique.push('https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80');
  return unique.slice(0, 4);
}
function setMain(src,el){
  const main = document.getElementById('mainImg');
  if (!main || !el) return;
  main.src = src;
  main.alt = el.getAttribute('alt') || 'Produit';
  document.querySelectorAll('.thumbs img').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}
function moveGallery(dir){
  const thumbs = Array.from(document.querySelectorAll('.thumbs img'));
  if (!thumbs.length) return;
  const activeIndex = thumbs.findIndex(t => t.classList.contains('active'));
  const nextIndex = activeIndex === -1 ? 0 : (activeIndex + dir + thumbs.length) % thumbs.length;
  const target = thumbs[nextIndex];
  setMain(target.src, target);
}
function tab(i,el){document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));el.classList.add('active');document.querySelectorAll('.tab-pane')[i].classList.add('active');}

boot(async function(){
  const PRODS=getProducts();
  const P=await fetchProduct(PID)||PRODS[0];
  if(!P){document.getElementById('pdContent').innerHTML='<p>Produit introuvable.</p>';return;}
  document.getElementById('crumb').innerHTML=`<a href="index.html" style="color:var(--blue)">Accueil</a> / <a href="catalogue.html" style="color:var(--blue)">Catalogue</a> / <span>${P.name}</span>`;
  const gallery = normalizeGallery(P);
  const save=P.old?Math.round((1-P.price/P.old)*100):0;
  const specRows=Object.entries(P.specs||{}).map(([k,v])=>`<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  const waMsg=WA_MSG+' : '+P.name+' ('+fmt(P.price)+')';
  document.getElementById('pdContent').innerHTML=`
  <div class="pd">
    <div class="gallery">
      <div class="main-img"><img id="mainImg" src="${gallery[0]}" alt="${P.name}"></div>
      <div class="gallery-nav">
        <button type="button" aria-label="Image précédente" class="gallery-arrow" onclick="moveGallery(-1)"><i class="fa-solid fa-chevron-left"></i></button>
        <div class="thumbs">${gallery.map((g,i)=>`<img src="${g}" alt="${P.name} ${i+1}" class="${i===0?'active':''}" onclick="setMain('${g}',this)">`).join('')}</div>
        <button type="button" aria-label="Image suivante" class="gallery-arrow" onclick="moveGallery(1)"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
    </div>
    <div class="pd-info">
      <span class="pcat" style="color:var(--orange);font-weight:700;text-transform:uppercase;font-size:12px">${P.cat}</span>
      <h1>${P.name}</h1>
      <div style="color:var(--orange)">${'\u2605'.repeat(P.rating||5)}<span style="color:var(--gray);font-size:13px">&nbsp;(${P.sold} vendus)</span></div>
      <div class="pd-price"><span class="now">${fmt(P.price)}</span>${P.old?'<span class="old">'+fmt(P.old)+'</span><span class="save">-'+save+'%</span>':''}</div>
      <div class="pd-meta">
        <div class="row"><i class="fa-solid ${P.dispo?'fa-circle-check':'fa-circle-xmark'}" style="color:${P.dispo?'#25D366':'#e05555'}"></i> <b>${P.dispo?'En stock \u2014 Disponible':'Rupture de stock'}</b></div>
        <div class="row"><i class="fa-solid fa-shield-halved"></i> Garantie incluse sur ce produit</div>
        <div class="row"><i class="fa-solid fa-truck-fast"></i> Livraison partout en C\u00f4te d'Ivoire</div>
      </div>
      <div class="pd-actions">
        <button class="btn btn-primary" onclick="addToCart('${P.id}',getQ())" ${P.dispo?'':'disabled'}><i class="fa-solid fa-cart-plus"></i> Ajouter au panier</button>
        <a class="btn btn-wa" target="_blank" href="${waLink(WA_NUMS[0],waMsg)}"><i class="fa-brands fa-whatsapp"></i> Commander sur WhatsApp</a>
      </div>
      <div class="qty" style="margin-bottom:6px"><button onclick="chQ(-1)">-</button><span id="qv">1</span><button onclick="chQ(1)">+</button></div>
      <div class="tabs">
        <div class="tab-btns">
          <button class="tab-btn active" onclick="tab(0,this)">Description</button>
          <button class="tab-btn" onclick="tab(1,this)">Caract\u00e9ristiques</button>
          <button class="tab-btn" onclick="tab(2,this)">Livraison</button>
        </div>
        <div class="tab-pane active"><p style="color:#404a58">${P.desc||''}</p></div>
        <div class="tab-pane"><table class="spec-table">${specRows||'<tr><td>Informations</td><td>Voir description</td></tr>'}</table></div>
        <div class="tab-pane"><p style="color:#404a58">Livraison rapide partout en C\u00f4te d'Ivoire. Les frais sont calcul\u00e9s selon votre zone au moment de la commande. Paiement \u00e0 la livraison possible sur Abidjan.</p></div>
      </div>
    </div>
  </div>`;
  const sim=PRODS.filter(p=>p.id!==P.id&&(p.cat===P.cat||p.brand===P.brand)).slice(0,4);
  if(sim.length){document.getElementById('simWrap').hidden=false;document.getElementById('simGrid').innerHTML=sim.map(productCard).join('');initReveal();}
  document.title=P.name+' \u2014 KAMBIRE INFORMATIQUE';
});
