/* ===== KAMBIRE — App partage (header, panier, animations) ===== */
function getCart(){try{return JSON.parse(localStorage.getItem('kambire_cart'))||[];}catch(e){return[];}}
function saveCart(c){localStorage.setItem('kambire_cart',JSON.stringify(c));updateCartCount();}
function cartCount(){return getCart().reduce((s,i)=>s+i.qty,0);}
function cartTotal(){const p=getProducts();return getCart().reduce((s,i)=>{const pr=p.find(x=>x.id===i.id);return s+(pr?pr.price*i.qty:0);},0);}
function updateCartCount(){document.querySelectorAll('.cart-count').forEach(e=>{const n=cartCount();e.textContent=n;e.style.display=n>0?'grid':'none';});}

function addToCart(id,qty){qty=qty||1;const c=getCart();const ex=c.find(i=>i.id===id);if(ex)ex.qty+=qty;else c.push({id:id,qty:qty});saveCart(c);toast('Produit ajoute au panier');renderDrawer();}
function removeFromCart(id){saveCart(getCart().filter(i=>i.id!==id));renderDrawer();}
function setQty(id,d){const c=getCart();const it=c.find(i=>i.id===id);if(!it)return;it.qty+=d;if(it.qty<1)return removeFromCart(id);saveCart(c);renderDrawer();}

function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t);}t.innerHTML='<i class="fa-solid fa-circle-check"></i>'+msg;t.classList.add('show');clearTimeout(window._tt);window._tt=setTimeout(()=>t.classList.remove('show'),2600);}

/* ---- Header markup ---- */
function headerHTML(active){
  return `
  <div class="topbar"><div class="container">
    <span><i class="fa-solid fa-truck-fast"></i>&nbsp; Livraison partout en Côte d'Ivoire</span>
    <div class="tb-right">
      <span><i class="fa-solid fa-phone"></i> 054 662 21 77</span>
      <span><i class="fa-solid fa-envelope"></i> kambiretechnologie@gmail.com</span>
      <a href="admin.html"><i class="fa-solid fa-lock"></i> Espace Admin</a>
    </div>
  </div></div>
  <header class="header" id="hdr"><div class="container"><nav class="nav">
    <button class="burger" onclick="toggleMenu()"><i class="fa-solid fa-bars"></i></button>
    <a href="index.html" class="logo"><span class="mark"><i class="fa-solid fa-laptop-code"></i></span>
      <span class="lt"><b>KAMBIRE</b><small>INFORMATIQUE</small></span></a>
    <div class="nav-links">
      <a href="index.html" class="${active==='home'?'active':''}">Accueil</a>
      <a href="catalogue.html" class="${active==='cat'?'active':''}">Catalogue</a>
      <a href="suivi.html" class="${active==='suivi'?'active':''}">Suivre ma commande</a>
      <a href="index.html#categories">Catégories</a>
      <a href="index.html#pourquoi">Pourquoi nous</a>
      <a href="index.html#contact">Contact</a>
    </div>
    <div class="nav-actions">
      <a href="catalogue.html" class="icon-btn" title="Rechercher"><i class="fa-solid fa-magnifying-glass"></i></a>
      <button class="icon-btn" onclick="openDrawer()" title="Panier"><i class="fa-solid fa-cart-shopping"></i><span class="cart-count">0</span></button>
      <a href="catalogue.html" class="btn btn-orange btn-sm" style="display:none">Acheter</a>
    </div>
  </nav></div></header>
  <div class="mobile-menu" id="mmenu">
    <a href="index.html">Accueil</a><a href="catalogue.html">Catalogue</a>
    <a href="suivi.html">Suivre ma commande</a>
    <a href="index.html#categories">Catégories</a><a href="index.html#pourquoi">Pourquoi nous</a>
    <a href="index.html#contact">Contact</a><a href="admin.html">Espace Admin</a>
  </div>`;
}

function footerHTML(){
  return `
  <div class="promo-strip"><div class="track">
    <span><i class="fa-solid fa-bolt"></i> Promotions jusqu'à -25%</span>
    <span><i class="fa-solid fa-shield-halved"></i> Garantie sur tous nos produits</span>
    <span><i class="fa-solid fa-truck-fast"></i> Livraison rapide en Côte d'Ivoire</span>
    <span><i class="fa-brands fa-whatsapp"></i> Commandez sur WhatsApp</span>
    <span><i class="fa-solid fa-bolt"></i> Promotions jusqu'à -25%</span>
    <span><i class="fa-solid fa-shield-halved"></i> Garantie sur tous nos produits</span>
    <span><i class="fa-solid fa-truck-fast"></i> Livraison rapide en Côte d'Ivoire</span>
    <span><i class="fa-brands fa-whatsapp"></i> Commandez sur WhatsApp</span>
  </div></div>
  <footer class="footer" id="contact"><div class="container">
    <div class="footer-grid">
      <div>
        <div class="flogo"><span class="mark"><i class="fa-solid fa-laptop-code"></i></span><b>KAMBIRE INFORMATIQUE</b></div>
        <p class="desc">Votre partenaire en solutions numériques. Vente de PC portables, PC bureau, accessoires, imprimantes et matériel professionnel de qualité.</p>
        <div class="socials">
          <a href="#" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>
          <a href="${waLink(WA_NUMS[0])}" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
        </div>
      </div>
      <div><h4>Navigation</h4>
        <a href="index.html">Accueil</a><a href="catalogue.html">Catalogue</a>
        <a href="suivi.html">Suivre ma commande</a>
        <a href="index.html#categories">Catégories</a><a href="index.html#temoignages">Témoignages</a>
        <a href="admin.html">Espace Admin</a>
      </div>
      <div><h4>Catégories</h4>
        <a href="catalogue.html?cat=HP">Ordinateurs HP</a><a href="catalogue.html?cat=Dell">Dell</a>
        <a href="catalogue.html?cat=Lenovo">Lenovo</a><a href="catalogue.html?cat=PC Gamer">PC Gamer</a>
        <a href="catalogue.html?cat=Imprimantes">Imprimantes</a>
      </div>
      <div><h4>Contact</h4>
        <li><i class="fa-solid fa-location-dot"></i>&nbsp; Côte d'Ivoire</li>
        <li><i class="fa-solid fa-phone"></i>&nbsp; 054 662 21 77</li>
        <li><i class="fa-solid fa-phone"></i>&nbsp; 058 629 21 27</li>
        <li><i class="fa-solid fa-envelope"></i>&nbsp; kambiretechnologie@gmail.com</li>
        <a href="${waLink(WA_NUMS[0])}" class="btn btn-wa btn-sm" style="margin-top:12px"><i class="fa-brands fa-whatsapp"></i> Écrire sur WhatsApp</a>
      </div>
    </div>
    <div class="foot-bottom">© 2026 KAMBIRE INFORMATIQUE — Votre partenaire en solutions numériques. Tous droits réservés.</div>
  </div></footer>`;
}

/* ---- Cart drawer ---- */
function drawerHTML(){return `
  <div class="overlay" id="ov" onclick="closeDrawer()"></div>
  <aside class="drawer" id="drawer">
    <div class="drawer-head"><h3><i class="fa-solid fa-cart-shopping"></i> Mon panier</h3>
      <button class="drawer-close" onclick="closeDrawer()">&times;</button></div>
    <div class="drawer-body" id="drawerBody"></div>
    <div class="drawer-foot" id="drawerFoot"></div>
  </aside>`;}

function renderDrawer(){
  const body=document.getElementById('drawerBody');if(!body)return;
  const cart=getCart();const prods=getProducts();
  if(!cart.length){body.innerHTML='<div class="empty-cart"><i class="fa-solid fa-cart-shopping"></i><p>Votre panier est vide</p></div>';document.getElementById('drawerFoot').innerHTML='<a href="catalogue.html" class="btn btn-primary btn-block">Voir le catalogue</a>';return;}
  body.innerHTML=cart.map(i=>{const p=prods.find(x=>x.id===i.id);if(!p)return'';const img=resolveProductImage(p);return `<div class="cart-item"><img src="${img}" alt="${p.name}"><div class="ci-info"><b>${p.name}</b><div class="p">${fmt(p.price)}</div><div class="qty"><button onclick="setQty('${p.id}',-1)">-</button><span>${i.qty}</span><button onclick="setQty('${p.id}',1)">+</button></div><br><button class="ci-remove" onclick="removeFromCart('${p.id}')"><i class="fa-solid fa-trash"></i> Retirer</button></div></div>`;}).join('');
  document.getElementById('drawerFoot').innerHTML=`<div class="tot"><span>Total</span><span>${fmt(cartTotal())}</span></div><a href="panier.html" class="btn btn-primary btn-block">Passer commande <i class="fa-solid fa-arrow-right"></i></a>`;
}
function openDrawer(){renderDrawer();document.getElementById('ov').classList.add('open');document.getElementById('drawer').classList.add('open');}
function closeDrawer(){document.getElementById('ov').classList.remove('open');document.getElementById('drawer').classList.remove('open');}
function toggleMenu(){document.getElementById('mmenu').classList.toggle('open');}

/* ---- WhatsApp float ---- */
function waFloatHTML(){return `<a href="${waLink(WA_NUMS[0])}" class="wa-float" title="Commander sur WhatsApp" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>`;}

function backOrTop(){
  if (document.referrer && document.referrer.startsWith(window.location.origin)) {
    history.back();
    return;
  }
  if (window.scrollY > 0) {
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }
  window.location.href = 'index.html';
}
function scrollTopHTML(){return `
  <button class="back-float" id="backBtn" title="Retour en arrière" aria-label="Retour en arrière"><i class="fa-solid fa-arrow-left"></i></button>
  <button class="scroll-top-float" id="scrollTopBtn" title="Retour en haut" aria-label="Retour en haut"><i class="fa-solid fa-arrow-up"></i></button>
`;} 
function scrollToTop(){window.scrollTo({top:0,behavior:'smooth'});}
function toggleScrollTopBtn(){const btn=document.getElementById('scrollTopBtn'); if(!btn)return; btn.classList.toggle('visible', window.scrollY > 260);}
function ensureFloatingControls(){
  if (document.getElementById('backBtn') || document.getElementById('scrollTopBtn')) return;
  document.body.insertAdjacentHTML('beforeend', scrollTopHTML());
  const backBtn=document.getElementById('backBtn');
  const scrollBtn=document.getElementById('scrollTopBtn');
  if(backBtn){backBtn.addEventListener('click', backOrTop);}
  if(scrollBtn){scrollBtn.addEventListener('click', scrollToTop);}
  toggleScrollTopBtn();
}

/* ---- Reveal on scroll ---- */
function initReveal(){
  const els=document.querySelectorAll('.reveal:not(.in)');
  // Fallback : si IntersectionObserver n'est pas dispo, on affiche tout
  if(!('IntersectionObserver' in window)){els.forEach(e=>e.classList.add('in'));return;}
  const io=new IntersectionObserver((ents)=>{ents.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.08});
  els.forEach(e=>io.observe(e));
  // Securite : rien ne doit rester invisible plus de 1,2s (evite une page "vide")
  setTimeout(()=>{document.querySelectorAll('.reveal:not(.in)').forEach(e=>{const r=e.getBoundingClientRect();if(r.top<window.innerHeight+100)e.classList.add('in');});},1200);
}

/* ---- Product card markup ---- */
function productCard(p){
  const badges=[];if(p.promo)badges.push('<span class="badge-tag b-promo">PROMO</span>');if(p.neuf)badges.push('<span class="badge-tag b-new">NOUVEAU</span>');
  const specs=[];if(p.cpu&&p.cpu!=='-')specs.push('<span>Core '+p.cpu+'</span>');if(p.ram)specs.push('<span>'+p.ram+'Go RAM</span>');if(p.ssd)specs.push('<span>'+p.ssd+'Go SSD</span>');
  const img = resolveProductImage(p);
  return `<article class="pcard reveal">
    <a href="produit.html?id=${p.id}" class="pimg">
      <div class="badges">${badges.join('')}</div>
      ${p.dispo?'<span class="badge-tag b-dispo"><i class="fa-solid fa-check"></i> Disponible</span>':'<span class="badge-tag b-dispo" style="background:#e05555">Rupture</span>'}
      <img src="${img}" alt="${p.name}" loading="lazy"></a>
    <div class="pbody">
      <span class="pcat">${p.cat}</span>
      <h3><a href="produit.html?id=${p.id}">${p.name}</a></h3>
      <div class="specs">${specs.join('')}</div>
      <div class="price"><span class="now">${fmt(p.price)}</span>${p.old?'<span class="old">'+fmt(p.old)+'</span>':''}</div>
      <div class="pactions">
        <a href="produit.html?id=${p.id}" class="btn btn-ghost btn-sm">Voir</a>
        <button class="btn btn-primary btn-sm" onclick="addToCart('${p.id}')"><i class="fa-solid fa-cart-plus"></i></button>
      </div>
    </div></article>`;
}

/* ---- Init shared UI ---- */
function mountChrome(active){
  const h=document.getElementById('site-header');if(h)h.innerHTML=headerHTML(active);
  const f=document.getElementById('site-footer');if(f)f.innerHTML=footerHTML();
  document.body.insertAdjacentHTML('beforeend',drawerHTML()+waFloatHTML());
  ensureFloatingControls();
  updateCartCount();
  window.addEventListener('scroll',()=>{const hd=document.getElementById('hdr');if(hd)hd.classList.toggle('scrolled',window.scrollY>10);toggleScrollTopBtn();},{passive:true});
  toggleScrollTopBtn();
}
