/* ===== Espace administrateur (serveur) ===== */
let ADM_PRODUCTS=[], ADM_ORDERS=[], ADM_ACTIVE_BRAND_FILTER='Tous';

function getBrandFilterOptions(products){
  const brands = [...new Set(products.map(p => (p.brand || p.cat || 'Autres').trim()).filter(Boolean))];
  return ['Tous', ...brands.sort((a, b) => {
    if (a.toLowerCase() === 'hp') return -1;
    if (b.toLowerCase() === 'hp') return 1;
    return a.localeCompare(b, 'fr');
  })];
}

function getFilteredProductsForAdmin(products){
  if (!ADM_ACTIVE_BRAND_FILTER || ADM_ACTIVE_BRAND_FILTER === 'Tous') return products;
  return products.filter(p => (p.brand || p.cat || 'Autres').trim() === ADM_ACTIVE_BRAND_FILTER);
}

function setBrandFilter(value){
  ADM_ACTIVE_BRAND_FILTER = value || 'Tous';
  const v = (document.getElementById('vTitle')?.textContent || '').toLowerCase();
  if (v.includes('produits')) return vProds();
  if (v.includes('promotions')) return vPromos();
  if (v.includes('stock')) return vStock();
  if (v.includes('commandes')) return vOrders();
  if (v.includes('clients')) return vClients();
  vProds();
}

function getBrandFilterSelect(label='Catégorie / marque'){
  const brands = getBrandFilterOptions(ADM_PRODUCTS || []);
  return `
    <div style="display:flex;flex-direction:column;gap:6px;min-width:180px">
      <label style="font-size:12px;color:var(--gray);font-weight:600">${label}</label>
      <select onchange="setBrandFilter(this.value)" style="padding:8px 10px;border:1px solid var(--line);border-radius:10px;background:#fff">
        ${brands.map(b => `<option value="${b}" ${ADM_ACTIVE_BRAND_FILTER === b ? 'selected' : ''}>${b}</option>`).join('')}
      </select>
    </div>`;
}

function getBrandMatches(products){
  if (!ADM_ACTIVE_BRAND_FILTER || ADM_ACTIVE_BRAND_FILTER === 'Tous') return products;
  return products.filter(p => (p.brand || p.cat || 'Autres').trim() === ADM_ACTIVE_BRAND_FILTER);
}

function getBrandProductIds(products){
  const selected = getBrandMatches(products);
  return new Set(selected.map(p => String(p.id)));
}

function getFilteredOrdersByBrand(orders, products){
  if (!ADM_ACTIVE_BRAND_FILTER || ADM_ACTIVE_BRAND_FILTER === 'Tous') return orders;
  const allowedIds = getBrandProductIds(products);
  return (orders || []).filter(order => (order.items || []).some(item => allowedIds.has(String(item.id || item.product_id || item.productId))));
}

function getFilteredClientsByBrand(clients, orders, products){
  if (!ADM_ACTIVE_BRAND_FILTER || ADM_ACTIVE_BRAND_FILTER === 'Tous') return clients;
  const filteredOrders = getFilteredOrdersByBrand(orders, products);
  const map = {};
  filteredOrders.forEach(order => {
    if (!map[order.phone]) map[order.phone] = { name: order.client, phone: order.phone, email: order.email || '', count: 0, total: 0 };
    map[order.phone].count += 1;
    map[order.phone].total += Number(order.total || 0);
  });
  return Object.values(map);
}

function isAuth(){return !!adminToken();}

function loginView(){
  document.getElementById('app').innerHTML=`<div class="admin-login"><form class="login-card" onsubmit="return doLogin(event)">
    <div class="mark"><i class="fa-solid fa-laptop-code"></i></div>
    <h2>KAMBIRE Admin</h2><p>Connectez-vous pour g\u00e9rer votre boutique</p>
    <div class="field" style="text-align:left"><label>Nom d'utilisateur</label><input id="user" value="admin"></div>
    <div class="field" style="text-align:left"><label>Mot de passe</label><input type="password" id="pass" placeholder="Mot de passe"></div>
    <button class="btn btn-primary btn-block"><i class="fa-solid fa-right-to-bracket"></i> Se connecter</button>
    <button type="button" class="btn btn-secondary btn-block" onclick="showPasswordResetForm()"><i class="fa-solid fa-key"></i> Mot de passe oublié ?</button>
    <a href="index.html" style="display:block;margin-top:14px;font-size:13px;color:var(--gray)"><i class="fa-solid fa-arrow-left"></i> Retour au site</a>
  </form></div>`;
  if (typeof ensureFloatingControls === 'function') ensureFloatingControls();
}
async function doLogin(e){
  e.preventDefault();
  const res=await apiLogin(document.getElementById('user').value.trim(),document.getElementById('pass').value);
  if(res&&res.token){sessionStorage.setItem('kambire_token',res.token);dashboard();}
  else toast('Identifiants incorrects');
  return false;
}
function logout(){sessionStorage.removeItem('kambire_token');loginView();}

function decodeJwtPayload(token){
  try {
    const part = (token || '').split('.')[1];
    if (!part) return {};
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const json = decodeURIComponent(atob(padded).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
}

function showPasswordResetForm(){
  const loggedIn = !!adminToken();
  const username = loggedIn ? (decodeJwtPayload(adminToken()).username || 'admin') : 'admin';
  document.getElementById('app').innerHTML = `<div class="admin-login"><div class="login-card" style="max-width:460px">
    <div class="mark"><i class="fa-solid fa-key"></i></div>
    <h2>${loggedIn ? 'Changer le mot de passe' : 'Réinitialiser le mot de passe'}</h2>
    <p>${loggedIn ? 'Choisissez un nouveau mot de passe sûr pour votre espace admin.' : 'Saisissez votre identifiant et recevez un code de validation par e-mail.'}</p>
    <div class="field" style="text-align:left"><label>Nom d'utilisateur</label><input id="pw_user" value="${username}"></div>
    ${loggedIn ? '<div class="field" style="text-align:left"><label>Mot de passe actuel</label><input type="password" id="pw_current" placeholder="Mot de passe actuel"></div>' : ''}
    <div class="field" style="text-align:left"><label>Code de validation</label><input type="text" id="pw_code" placeholder="Code à 6 chiffres" maxlength="6"></div>
    <button type="button" class="btn btn-secondary btn-block" onclick="requestPasswordCode()"><i class="fa-solid fa-envelope-circle-check"></i> Recevoir le code</button>
    <div class="field" style="text-align:left"><label>Nouveau mot de passe</label><input type="password" id="pw_new" placeholder="Minimum 6 caractères"></div>
    <div class="field" style="text-align:left"><label>Confirmer le nouveau mot de passe</label><input type="password" id="pw_confirm" placeholder="Confirmer le mot de passe"></div>
    <button class="btn btn-primary btn-block" onclick="${loggedIn ? 'submitPasswordChange()' : 'submitPasswordReset()'}"><i class="fa-solid fa-floppy-disk"></i> ${loggedIn ? 'Mettre à jour le mot de passe' : 'Réinitialiser'}</button>
    <button type="button" class="btn btn-secondary btn-block" onclick="${loggedIn ? 'dashboard()' : 'loginView()'}"><i class="fa-solid fa-arrow-left"></i> ${loggedIn ? 'Retour au tableau de bord' : 'Retour à la connexion'}</button>
  </div></div>`;
}

async function requestPasswordCode(){
  const username = document.getElementById('pw_user')?.value.trim() || '';
  if (!username) {
    toast('Saisissez votre nom d\'utilisateur avant de demander le code');
    return;
  }

  const headers = !!adminToken() ? authHeaders() : { 'Content-Type': 'application/json' };
  const res = await fetch(API + '/api/admin/request-password-code', {
    method: 'POST',
    headers,
    body: JSON.stringify({ username })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast(data.error || 'Impossible d\'envoyer le code');
    return;
  }
  if (data.code) {
    toast(`Code de validation : ${data.code}`);
  } else {
    toast(data.message || 'Code envoyé');
  }
}

async function submitPasswordChange(){
  const currentPassword = document.getElementById('pw_current')?.value || '';
  const validationCode = document.getElementById('pw_code')?.value.trim() || '';
  const newPassword = document.getElementById('pw_new')?.value || '';
  const confirmPassword = document.getElementById('pw_confirm')?.value || '';
  if (!currentPassword || !validationCode || !newPassword || !confirmPassword) { toast('Veuillez remplir tous les champs'); return; }
  if (newPassword !== confirmPassword) { toast('Les nouveaux mots de passe ne correspondent pas'); return; }
  const res = await fetch(API + '/api/admin/change-password', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ currentPassword, validationCode, newPassword }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { toast(data.error || 'Impossible de changer le mot de passe'); return; }
  toast('Mot de passe mis à jour');
  logout();
}

async function submitPasswordReset(){
  const username = document.getElementById('pw_user')?.value.trim() || '';
  const code = document.getElementById('pw_code')?.value.trim() || '';
  const newPassword = document.getElementById('pw_new')?.value || '';
  const confirmPassword = document.getElementById('pw_confirm')?.value || '';
  if (!username || !code || !newPassword || !confirmPassword) { toast('Veuillez remplir tous les champs'); return; }
  if (newPassword !== confirmPassword) { toast('Les mots de passe ne correspondent pas'); return; }
  const res = await fetch(API + '/api/admin/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, code, newPassword }) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { toast(data.error || 'Réinitialisation impossible'); return; }
  toast('Mot de passe réinitialisé');
  loginView();
}

async function apiGet(url){const r=await fetch(API+url,{headers:authHeaders()});if(r.status===401){logout();throw new Error('auth');}return r.json();}
async function apiSend(url,method,body){const r=await fetch(API+url,{method,headers:authHeaders(),body:body?JSON.stringify(body):undefined});if(r.status===401){logout();throw new Error('auth');}return r.json();}

function dashboard(){
  document.getElementById('app').innerHTML=`<div class="admin-wrap">
    <aside class="sidebar" id="sb">
      <div class="slogo"><span class="mark"><i class="fa-solid fa-laptop-code"></i></span><b>KAMBIRE Admin</b></div>
      <nav class="snav">
        <a class="active" data-v="dash" onclick="nav('dash',this)"><i class="fa-solid fa-chart-line"></i> Tableau de bord</a>
        <a data-v="prods" onclick="nav('prods',this)"><i class="fa-solid fa-box"></i> Produits</a>
        <a data-v="promos" onclick="nav('promos',this)"><i class="fa-solid fa-tags"></i> Promotions</a>
        <a data-v="stock" onclick="nav('stock',this)"><i class="fa-solid fa-warehouse"></i> Stock</a>
        <a data-v="orders" onclick="nav('orders',this)"><i class="fa-solid fa-cart-shopping"></i> Commandes</a>
        <a data-v="clients" onclick="nav('clients',this)"><i class="fa-solid fa-users"></i> Clients</a>
        <a onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> D\u00e9connexion</a>
        <a href="index.html"><i class="fa-solid fa-globe"></i> Voir le site</a>
      </nav>
    </aside>
    <main class="admin-main">
      <div class="admin-top"><button class="icon-btn" id="sbtog" onclick="document.getElementById('sb').classList.toggle('open')" style="display:none"><i class="fa-solid fa-bars"></i></button><h1 id="vTitle">Tableau de bord</h1><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="color:var(--gray);font-size:14px"><i class="fa-solid fa-user-shield"></i> Administrateur</span><button class="btn btn-secondary btn-sm" onclick="showPasswordResetForm()"><i class="fa-solid fa-key"></i> Changer le mot de passe</button></div></div>
      <div id="views"><p style="color:var(--gray)">Chargement...</p></div>
    </main></div>`;
  if (typeof ensureFloatingControls === 'function') ensureFloatingControls();
  if(window.innerWidth<=1024)document.getElementById('sbtog').style.display='grid';
  nav('dash');
}

function nav(v,el){
  if(el){document.querySelectorAll('.snav a').forEach(a=>a.classList.remove('active'));el.classList.add('active');}
  const titles={dash:'Tableau de bord',prods:'Gestion des produits',promos:'Promotions',stock:'Gestion du stock',orders:'Commandes',clients:'Clients'};
  document.getElementById('vTitle').textContent=titles[v];
  ({dash:vDash,prods:vProds,promos:vPromos,stock:vStock,orders:vOrders,clients:vClients})[v]();
  if(window.innerWidth<=1024)document.getElementById('sb').classList.remove('open');
}

async function vDash(){
  try{
    const [stats,ordersList]=await Promise.all([apiGet('/api/stats'),apiGet('/api/orders')]);
    ADM_ORDERS=ordersList;
    const bars=[820,940,760,1120,980,1340,1150];const max=Math.max(...bars);const days=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    const alertN=(stats.lowStockCount||0)+(stats.outOfStockCount||0);
    document.getElementById('views').innerHTML=`
    ${alertN?`<div class="card-box" style="border-left:4px solid #F7931E;background:#fff8ef;cursor:pointer" onclick="nav('stock',document.querySelector('.snav a[data-v=stock]'))"><div style="display:flex;align-items:center;gap:12px"><i class="fa-solid fa-triangle-exclamation" style="color:#F7931E;font-size:22px"></i><div><b style="display:block">Alerte stock : ${alertN} produit(s) \u00e0 surveiller</b><span style="color:var(--gray);font-size:13px">${stats.outOfStockCount||0} en rupture \u00b7 ${stats.lowStockCount||0} en stock faible \u2014 cliquez pour g\u00e9rer</span></div></div></div>`:''}
    <div class="stat-grid">
      <div class="stat"><div class="si" style="background:var(--blue)"><i class="fa-solid fa-sack-dollar"></i></div><b>${fmt(stats.revenue)}</b><span>Chiffre d'affaires</span></div>
      <div class="stat"><div class="si" style="background:var(--orange)"><i class="fa-solid fa-cart-shopping"></i></div><b>${stats.ordersCount}</b><span>Commandes</span></div>
      <div class="stat"><div class="si" style="background:#25D366"><i class="fa-solid fa-box"></i></div><b>${stats.productsCount}</b><span>Produits</span></div>
      <div class="stat"><div class="si" style="background:${alertN?'#e74c3c':'#7c4dff'}"><i class="fa-solid fa-triangle-exclamation"></i></div><b>${alertN}</b><span>Alertes stock</span></div>
    </div>
    <div class="card-box"><h3>Ventes de la semaine (illustration)</h3><div class="bar-chart">${bars.map((v,i)=>`<div class="bar" style="height:${v/max*100}%"><b>${v}k</b><span>${days[i]}</span></div>`).join('')}</div></div>
    <div class="card-box"><h3>Derni\u00e8res commandes</h3>${ordTable(ordersList.slice(0,5))}</div>`;
    updateStockBadge(alertN);
  }catch(e){}
}
function updateStockBadge(n){const el=document.querySelector('.snav a[data-v=stock]');if(!el)return;const old=el.querySelector('.sb-badge');if(old)old.remove();if(n>0){const b=document.createElement('span');b.className='sb-badge';b.textContent=n;b.style.cssText='margin-left:auto;background:#e74c3c;color:#fff;border-radius:10px;padding:1px 8px;font-size:11px;font-weight:700';el.style.display='flex';el.style.alignItems='center';el.appendChild(b);}}
function ordTable(O){
  if(!O.length)return '<p style="color:var(--gray)">Aucune commande pour le moment.</p>';
  return `<table class="tbl"><thead><tr><th>R\u00e9f</th><th>Client</th><th>T\u00e9l</th><th>Total</th><th>Statut</th><th>Date</th></tr></thead><tbody>${O.map(o=>`<tr><td><b>${o.ref}</b></td><td>${o.client}</td><td>${o.phone}</td><td>${fmt(o.total)}</td><td><span class="pill ${pillClass(o.status)}">${o.status}</span></td><td>${new Date(o.created).toLocaleDateString('fr-FR')}</td></tr>`).join('')}</tbody></table>`;
}
function pillClass(s){return s==='Livr\u00e9e'?'pill-green':s==='En cours'?'pill-blue':s==='Annul\u00e9e'?'pill-red':'pill-orange';}
function groupProductsByBrand(products) {
  const groups = {};
  products.forEach((p) => {
    const brand = (p.brand || 'Autres').trim() || 'Autres';
    if (!groups[brand]) groups[brand] = [];
    groups[brand].push(p);
  });

  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b, 'fr'))
    .map((brand) => ({
      brand,
      items: groups[brand].slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }));
}
async function vProds(){
  ADM_PRODUCTS=await apiGet('/api/products');
  const visibleProducts = getFilteredProductsForAdmin(ADM_PRODUCTS);

  document.getElementById('views').innerHTML=`<div class="card-box">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h3 style="margin:0">Produits ${ADM_ACTIVE_BRAND_FILTER !== 'Tous' ? '— ' + ADM_ACTIVE_BRAND_FILTER : ''} (${visibleProducts.length})</h3>
      <div style="display:flex;align-items:end;gap:10px;flex-wrap:wrap">
        ${getBrandFilterSelect()}
        <button class="btn btn-primary btn-sm" onclick="openModal()"><i class="fa-solid fa-plus"></i> Ajouter un produit</button>
      </div>
    </div>
    <table class="tbl"><thead><tr><th>Image</th><th>Nom</th><th>Catégorie</th><th>Prix</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
    ${visibleProducts.map(p=>`<tr><td><img src="${p.img}"></td><td><b>${p.name}</b></td><td>${p.brand || p.cat || 'Autres'}</td><td>${fmt(p.price)}${p.old?' <s style="color:#adb5c2;font-size:12px">'+fmt(p.old)+'</s>':''}</td><td><span class="pill ${p.stockStatus==='rupture'?'pill-red':p.stockStatus==='faible'?'pill-orange':'pill-green'}">${p.stockStatus==='rupture'?'Rupture':p.stockStatus==='faible'?'Faible ('+p.stock+')':'En stock ('+p.stock+')'}</span></td><td><button class="act-btn" onclick="openModal('${p.id}')"><i class="fa-solid fa-pen"></i></button><button class="act-btn del" onclick="delProduct('${p.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}
    ${!visibleProducts.length ? `<tr><td colspan="6" style="text-align:center;color:var(--gray);padding:20px">Aucun produit pour cette catégorie/marque.</td></tr>` : ''}
    </tbody></table></div>`;
}

async function vPromos(){
  ADM_PRODUCTS=await apiGet('/api/products');
  const filteredProducts = getBrandMatches(ADM_PRODUCTS);
  document.getElementById('views').innerHTML=`<div class="card-box">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h3 style="margin:0">Produits en promotion ${ADM_ACTIVE_BRAND_FILTER !== 'Tous' ? '— ' + ADM_ACTIVE_BRAND_FILTER : ''} (${filteredProducts.length})</h3>
      ${getBrandFilterSelect()}
    </div>
    <p style="color:var(--gray);font-size:14px;margin-bottom:16px">Fixez l'ancien prix et activez la promotion.</p>
    <table class="tbl"><thead><tr><th>Produit</th><th>Prix actuel</th><th>Ancien prix</th><th>R\u00e9duction</th><th>Promo</th></tr></thead><tbody>
    ${filteredProducts.map(p=>{const r=p.old&&p.old>p.price?Math.round((1-p.price/p.old)*100)+'%':'\u2014';return `<tr><td><b>${p.name}</b></td><td>${fmt(p.price)}</td><td><input type="number" value="${p.old||''}" onchange="setOld('${p.id}',this.value)" style="width:120px;padding:6px 8px;border:1px solid var(--line);border-radius:8px"></td><td>${r}</td><td><label class="chk" style="margin:0"><input type="checkbox" ${p.promo?'checked':''} onchange="togPromo('${p.id}',this.checked)"></label></td></tr>`;}).join('')}
    ${!filteredProducts.length ? '<tr><td colspan="5" style="text-align:center;color:var(--gray);padding:20px">Aucun produit pour cette marque.</td></tr>' : ''}
    </tbody></table></div>`;
}

async function vStock(){
  ADM_PRODUCTS=await apiGet('/api/products');
  const filteredProducts = getBrandMatches(ADM_PRODUCTS);
  const alerts=filteredProducts.filter(p=>p.stockStatus!=='ok');
  const rupture=filteredProducts.filter(p=>p.stockStatus==='rupture').length;
  const faible=filteredProducts.filter(p=>p.stockStatus==='faible').length;
  updateStockBadge(rupture+faible);
  const badge=s=>s==='rupture'?'<span class="pill pill-red">Rupture</span>':s==='faible'?'<span class="pill pill-orange">Stock faible</span>':'<span class="pill pill-green">En stock</span>';
  const row=p=>`<tr>
    <td><b>${p.name}</b><br><span style="font-size:12px;color:var(--gray)">${p.cat}</span></td>
    <td>
      <div style="display:flex;align-items:center;gap:6px">
        <button class="act-btn" title="Retirer 1" onclick="stockDelta('${p.id}',-1)"><i class="fa-solid fa-minus"></i></button>
        <input type="number" value="${p.stock}" min="0" onchange="stockSet('${p.id}',this.value)" style="width:70px;text-align:center;padding:6px;border:1px solid var(--line);border-radius:8px">
        <button class="act-btn" title="Ajouter 1" onclick="stockDelta('${p.id}',1)"><i class="fa-solid fa-plus"></i></button>
      </div>
    </td>
    <td><input type="number" value="${p.low_stock==null?3:p.low_stock}" min="0" onchange="stockLow('${p.id}',this.value)" style="width:70px;text-align:center;padding:6px;border:1px solid var(--line);border-radius:8px"></td>
    <td>${badge(p.stockStatus)}</td>
    <td>${p.sold}</td>
    <td><button class="btn btn-primary btn-sm" onclick="restock('${p.id}')"><i class="fa-solid fa-truck-ramp-box"></i> R\u00e9approvisionner</button></td>
  </tr>`;
  document.getElementById('views').innerHTML=`
  <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px">
    <h3 style="margin:0">Gestion du stock ${ADM_ACTIVE_BRAND_FILTER !== 'Tous' ? '— ' + ADM_ACTIVE_BRAND_FILTER : ''} (${filteredProducts.length})</h3>
    ${getBrandFilterSelect()}
  </div>
  ${alerts.length?`<div class="card-box" style="border-left:4px solid #e74c3c"><h3 style="margin:0 0 6px"><i class="fa-solid fa-triangle-exclamation" style="color:#e74c3c"></i> Alertes de stock (${alerts.length})</h3><p style="color:var(--gray);font-size:13px;margin:0 0 14px">${rupture} en rupture \u00b7 ${faible} en stock faible. Pensez \u00e0 r\u00e9approvisionner.</p>
  <table class="tbl"><thead><tr><th>Produit</th><th>Stock</th><th>Seuil</th><th>Statut</th><th>Ventes</th><th>Action</th></tr></thead><tbody>${alerts.map(row).join('')}</tbody></table></div>`:'<div class="card-box" style="border-left:4px solid #25D366"><h3 style="margin:0"><i class="fa-solid fa-circle-check" style="color:#25D366"></i> Aucun produit en alerte \u2014 tous les stocks sont sains.</h3></div>'}
  <div class="card-box"><h3>Inventaire complet (${filteredProducts.length})</h3><p style="color:var(--gray);font-size:13px;margin:0 0 14px">Ajustez les quantit\u00e9s, d\u00e9finissez le seuil d'alerte et r\u00e9approvisionnez. Le stock se d\u00e9cr\u00e9mente automatiquement \u00e0 chaque commande.</p>
  <table class="tbl"><thead><tr><th>Produit</th><th>Stock</th><th>Seuil</th><th>Statut</th><th>Ventes</th><th>Action</th></tr></thead><tbody>${filteredProducts.map(row).join('')}</tbody></table></div>`;
}

async function vOrders(){
  ADM_PRODUCTS=await apiGet('/api/products');
  ADM_ORDERS=await apiGet('/api/orders');
  const filteredOrders = getFilteredOrdersByBrand(ADM_ORDERS, ADM_PRODUCTS);
  document.getElementById('views').innerHTML=`<div class="card-box">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h3 style="margin:0">Commandes ${ADM_ACTIVE_BRAND_FILTER !== 'Tous' ? '— ' + ADM_ACTIVE_BRAND_FILTER : ''} (${filteredOrders.length})</h3>
      ${getBrandFilterSelect()}
    </div>
    ${filteredOrders.length?`
  <table class="tbl"><thead><tr><th>R\u00e9f</th><th>Client</th><th>T\u00e9l</th><th>Zone</th><th>Total</th><th>Statut</th></tr></thead><tbody>
  ${filteredOrders.map(o=>`<tr><td><b>${o.ref}</b><br><span style="font-size:12px;color:var(--gray)">${o.items.length} article(s)</span></td><td>${o.client}</td><td>${o.phone}</td><td style="font-size:13px">${o.zone||'\u2014'}</td><td>${fmt(o.total)}</td><td><select onchange="setStatus(${o.id},this.value)" style="padding:6px 10px;border:1px solid var(--line);border-radius:8px"><option ${o.status==='Nouvelle'?'selected':''}>Nouvelle</option><option ${o.status==='En cours'?'selected':''}>En cours</option><option ${o.status==='Livr\u00e9e'?'selected':''}>Livr\u00e9e</option><option ${o.status==='Annul\u00e9e'?'selected':''}>Annul\u00e9e</option></select></td></tr>`).join('')}
  </tbody></table>`:'<p style="color:var(--gray)">Aucune commande correspondant à cette marque.</p>'}</div>`;
}

async function vClients(){
  ADM_PRODUCTS=await apiGet('/api/products');
  const [list, ordersList] = await Promise.all([apiGet('/api/clients'), apiGet('/api/orders')]);
  const filteredClients = getFilteredClientsByBrand(list, ordersList, ADM_PRODUCTS);
  document.getElementById('views').innerHTML=`<div class="card-box">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <h3 style="margin:0">Clients ${ADM_ACTIVE_BRAND_FILTER !== 'Tous' ? '— ' + ADM_ACTIVE_BRAND_FILTER : ''} (${filteredClients.length})</h3>
      ${getBrandFilterSelect()}
    </div>
    ${filteredClients.length?`
  <table class="tbl"><thead><tr><th>Nom</th><th>T\u00e9l\u00e9phone</th><th>Email</th><th>Commandes</th><th>Total d\u00e9pens\u00e9</th></tr></thead><tbody>
  ${filteredClients.map(c=>`<tr><td><b>${c.name}</b></td><td>${c.phone}</td><td>${c.email||'\u2014'}</td><td><span class="pill pill-blue">${c.count}</span></td><td>${fmt(c.total)}</td></tr>`).join('')}
  </tbody></table>`:'<p style="color:var(--gray)">Aucun client pour cette marque.</p>'}</div>`;
}

/* ---- actions ---- */
async function setOld(id,v){const p=ADM_PRODUCTS.find(x=>x.id===id);const old=+v||0;await apiSend('/api/products/'+id,'PUT',{old,promo:old>p.price?true:p.promo});notifyDataSync();toast('Promotion mise à jour');vPromos();}
async function togPromo(id,c){await apiSend('/api/products/'+id,'PUT',{promo:c});notifyDataSync();toast('Promotion mise \u00e0 jour');}
async function setDispo(id,v){await apiSend('/api/products/'+id,'PUT',{dispo:v==='1'});notifyDataSync();toast('Stock mis \u00e0 jour');}
async function setStatus(id,v){await apiSend('/api/orders/'+id+'/status','PUT',{status:v});toast('Statut mis \u00e0 jour');}
async function delProduct(id){if(!confirm('Supprimer ce produit ?'))return;await apiSend('/api/products/'+id,'DELETE');notifyDataSync();toast('Produit supprimé');vProds();}

/* ---- gestion du stock ---- */
async function stockDelta(id,d){await apiSend('/api/products/'+id+'/stock','POST',{delta:d,reason:d>0?'Ajout manuel':'Retrait manuel'});notifyDataSync();toast(d>0?'+'+d+' en stock':d+' en stock');vStock();}
async function stockSet(id,v){const n=Math.max(0,parseInt(v)||0);await apiSend('/api/products/'+id+'/stock','POST',{set:n,reason:'Ajustement manuel'});notifyDataSync();toast('Stock mis à jour');vStock();}
async function stockLow(id,v){await apiSend('/api/products/'+id,'PUT',{low_stock:Math.max(0,parseInt(v)||0)});notifyDataSync();toast('Seuil d\'alerte mis à jour');vStock();}
async function restock(id){const p=ADM_PRODUCTS.find(x=>x.id===id);const v=prompt('Quantit\u00e9 \u00e0 ajouter en stock pour "'+p.name+'" :','10');if(v===null)return;const q=parseInt(v);if(!q||q<=0){toast('Quantit\u00e9 invalide');return;}await apiSend('/api/products/'+id+'/stock','POST',{delta:q,reason:'R\u00e9approvisionnement'});notifyDataSync();toast('R\u00e9approvisionnement : +'+q);vStock();}

function openModal(id){
  const sel=document.getElementById('m_cat');sel.innerHTML=CATEGORIES.map(c=>`<option>${c.name}</option>`).join('');
  if(id){const p=ADM_PRODUCTS.find(x=>x.id===id);document.getElementById('modalTitle').textContent='Modifier le produit';
    document.getElementById('m_id').value=p.id;document.getElementById('m_name').value=p.name;sel.value=p.cat;document.getElementById('m_brand').value=p.brand;document.getElementById('m_price').value=p.price;document.getElementById('m_old').value=p.old||'';document.getElementById('m_cpu').value=p.cpu;document.getElementById('m_gen').value=p.gen;document.getElementById('m_ram').value=p.ram;document.getElementById('m_ssd').value=p.ssd;document.getElementById('m_stock').value=p.stock||0;document.getElementById('m_low').value=(p.low_stock==null?3:p.low_stock);document.getElementById('m_desc').value=p.desc||'';document.getElementById('m_dispo').checked=p.dispo;document.getElementById('m_promo').checked=p.promo;document.getElementById('m_neuf').checked=p.neuf;document.getElementById('m_tactile').checked=p.tactile;
    const gallery = Array.isArray(p.gallery) && p.gallery.length ? p.gallery : [p.img];
    for (let i = 1; i <= 4; i++) {
      const input = document.getElementById('m_gallery_' + i);
      if (input) input.value = gallery[i - 1] || '';
      const fileInput = document.getElementById('m_file_' + i);
      if (fileInput) fileInput.value = '';
    }
    document.getElementById('m_img').value = gallery[0] || '';
  }else{document.getElementById('modalTitle').textContent='Ajouter un produit';['m_id','m_name','m_brand','m_price','m_old','m_desc'].forEach(i=>document.getElementById(i).value='');['m_gallery_1','m_gallery_2','m_gallery_3','m_gallery_4'].forEach(i=>document.getElementById(i).value='');document.getElementById('m_img').value='';document.getElementById('m_ram').value=0;document.getElementById('m_ssd').value=0;document.getElementById('m_stock').value=0;document.getElementById('m_low').value=3;document.getElementById('m_cpu').value='-';document.getElementById('m_gen').value='-';document.getElementById('m_dispo').checked=true;['m_promo','m_neuf','m_tactile'].forEach(i=>document.getElementById(i).checked=false);[1,2,3,4].forEach(i=>{const fileInput = document.getElementById('m_file_' + i); if (fileInput) fileInput.value='';});}
  document.getElementById('pModal').classList.add('open');
}
function closeModal(){document.getElementById('pModal').classList.remove('open');}
function getGallerySlots(){
  return [1,2,3,4].map(i => document.getElementById('m_gallery_' + i)).filter(Boolean);
}
function collectGallery(){
  const items = getGallerySlots().map(input => (input.value || '').trim()).filter(Boolean);
  if (!items.length) {
    const main = (document.getElementById('m_img')?.value || '').trim();
    return main ? [main] : [IMG.laptop];
  }
  return items.slice(0, 4);
}
function setGalleryPrimaryValue(){
  const items = collectGallery();
  const primary = document.getElementById('m_img');
  if (primary) primary.value = items[0] || '';
}
function bindImagePicker(){
  const slots = getGallerySlots();
  slots.forEach((input, index) => {
    const fileInput = document.getElementById('m_file_' + (index + 1));
    if (!fileInput) return;
    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        toast('Veuillez sélectionner une image valide');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        input.value = e.target.result;
        setGalleryPrimaryValue();
        toast('Image sélectionnée');
      };
      reader.readAsDataURL(file);
    });
  });
}
async function saveProduct(){
  const g=id=>document.getElementById(id);
  const name=g('m_name').value.trim();const price=+g('m_price').value;
  if(!name||!price){toast('Nom et prix obligatoires');return;}
  const id=g('m_id').value;
  const gallery = collectGallery();
  const img = gallery[0] || IMG.laptop;
  const data={name,cat:g('m_cat').value,brand:g('m_brand').value.trim()||g('m_cat').value,price,old:+g('m_old').value||0,cpu:g('m_cpu').value,gen:g('m_gen').value,ram:+g('m_ram').value,ssd:+g('m_ssd').value,stock:+g('m_stock').value||0,low_stock:+g('m_low').value||0,img,gallery,desc:g('m_desc').value.trim(),dispo:g('m_dispo').checked,promo:g('m_promo').checked,neuf:g('m_neuf').checked,tactile:g('m_tactile').checked};
  if(id)await apiSend('/api/products/'+id,'PUT',data);else await apiSend('/api/products','POST',data);  notifyDataSync();  closeModal();toast('Produit enregistr\u00e9');vProds();
}

bindImagePicker();
// boot
if(isAuth())dashboard();else loginView();
