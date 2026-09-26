/* ===== Tunnel de commande (serveur) ===== */
mountChrome('');
let step=1;
const order={info:{},ship:{},pay:''};
const ZONES={'Abidjan (Cocody, Plateau, Marcory...)':1500,'Abidjan (Yopougon, Abobo, Port-Bou\u00ebt...)':2000,'Bouak\u00e9':3500,'Yamoussoukro':3000,'San-Pedro':4000,'Autre ville (int\u00e9rieur)':5000};

function items(){const p=getProducts();return getCart().map(i=>({...i,p:p.find(x=>x.id===i.id)})).filter(x=>x.p);}
function subtotal(){return items().reduce((s,i)=>s+i.p.price*i.qty,0);}
function shipCost(){return order.ship.zone?ZONES[order.ship.zone]:0;}

function setStep(n){step=n;document.querySelectorAll('#steps .step').forEach(s=>{const d=+s.dataset.s;s.classList.toggle('active',d===n);s.classList.toggle('done',d<n);});render();window.scrollTo({top:120,behavior:'smooth'});}

function sumBox(showShip){
  const it=items();const sub=subtotal();const sh=showShip?shipCost():0;
  return `<div class="co-card summary"><h3><i class="fa-solid fa-receipt"></i> R\u00e9capitulatif</h3>
    <div class="sum-items">${it.map(i=>`<div class="sum-item"><img src="${i.p.img}"><div style="flex:1"><b>${i.p.name}</b><br><span style="color:var(--gray)">${i.qty} \u00d7 ${fmt(i.p.price)}</span></div></div>`).join('')}</div>
    <div class="sum-line"><span>Sous-total</span><span>${fmt(sub)}</span></div>
    <div class="sum-line"><span>Livraison</span><span>${showShip&&sh?fmt(sh):(showShip?'\u00c0 calculer':'\u00c0 l\'\u00e9tape 3')}</span></div>
    <div class="sum-line total"><span>Total</span><span>${fmt(sub+sh)}</span></div></div>`;
}

function render(){
  const it=items();const area=document.getElementById('coArea');
  if(!it.length&&step<5){area.innerHTML='<div class="confirm-box"><div class="empty-cart"><i class="fa-solid fa-cart-shopping"></i><h3>Votre panier est vide</h3><p>Ajoutez des produits pour passer commande.</p></div><a href="catalogue.html" class="btn btn-primary">Voir le catalogue</a></div>';return;}
  if(step===1){
    area.innerHTML=`<div class="co-grid"><div><div class="co-card"><h3><i class="fa-solid fa-cart-shopping"></i> Votre panier (${it.length})</h3>
      ${it.map(i=>`<div class="cart-item"><img src="${i.p.img}"><div class="ci-info" style="flex:1"><b>${i.p.name}</b><div class="p">${fmt(i.p.price)}</div><div class="qty"><button onclick="cq('${i.id}',-1)">-</button><span>${i.qty}</span><button onclick="cq('${i.id}',1)">+</button></div> <button class="ci-remove" onclick="cr('${i.id}')"><i class="fa-solid fa-trash"></i></button></div><div style="font-weight:800;color:var(--blue)">${fmt(i.p.price*i.qty)}</div></div>`).join('')}
      </div><button class="btn btn-primary btn-block" onclick="setStep(2)">Continuer <i class="fa-solid fa-arrow-right"></i></button></div>${sumBox(false)}</div>`;
  }
  else if(step===2){
    const i=order.info;
    area.innerHTML=`<div class="co-grid"><div><div class="co-card"><h3><i class="fa-solid fa-user"></i> Vos informations</h3>
      <div class="form-row"><div class="field"><label>Pr\u00e9nom *</label><input id="f_first" value="${i.first||''}"></div><div class="field"><label>Nom *</label><input id="f_last" value="${i.last||''}"></div></div>
      <div class="field"><label>T\u00e9l\u00e9phone *</label><input id="f_phone" placeholder="07 00 00 00 00" value="${i.phone||''}"></div>
      <div class="field"><label>Email (optionnel)</label><input id="f_email" type="email" value="${i.email||''}"></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn btn-ghost" onclick="setStep(1)"><i class="fa-solid fa-arrow-left"></i> Retour</button><button class="btn btn-primary" style="flex:1" onclick="saveInfo()">Continuer <i class="fa-solid fa-arrow-right"></i></button></div>
      </div></div>${sumBox(false)}</div>`;
  }
  else if(step===3){
    const opts=Object.keys(ZONES).map(z=>`<option ${order.ship.zone===z?'selected':''} value="${z}">${z} \u2014 ${fmt(ZONES[z])}</option>`).join('');
    area.innerHTML=`<div class="co-grid"><div><div class="co-card"><h3><i class="fa-solid fa-truck-fast"></i> Livraison</h3>
      <div class="field"><label>Zone de livraison *</label><select id="f_zone" onchange="order.ship.zone=this.value;render()"><option value="">-- Choisir une zone --</option>${opts}</select></div>
      <div class="field"><label>Adresse / Quartier *</label><input id="f_addr" value="${order.ship.addr||''}"></div>
      <div class="field"><label>Indications (optionnel)</label><textarea id="f_note" rows="2">${order.ship.note||''}</textarea></div>
      <div style="background:var(--blue-soft);padding:12px;border-radius:10px;font-size:14px;color:var(--blue)"><i class="fa-solid fa-circle-info"></i> Frais de livraison : <b>${order.ship.zone?fmt(shipCost()):'s\u00e9lectionnez une zone'}</b></div>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap"><button class="btn btn-ghost" onclick="setStep(2)"><i class="fa-solid fa-arrow-left"></i> Retour</button><button class="btn btn-primary" style="flex:1" onclick="saveShip()">Continuer <i class="fa-solid fa-arrow-right"></i></button></div>
      </div></div>${sumBox(true)}</div>`;
  }
  else if(step===4){
    area.innerHTML=`<div class="co-grid"><div><div class="co-card"><h3><i class="fa-solid fa-credit-card"></i> Mode de paiement</h3>
      <div class="pay-opt ${order.pay==='wave'?'sel':''}" onclick="selPay('wave',this)"><i class="fa-solid fa-mobile-screen"></i><div><b>Wave</b><span>Paiement mobile Wave</span></div></div>
      <div class="pay-opt ${order.pay==='om'?'sel':''}" onclick="selPay('om',this)"><i class="fa-solid fa-mobile-screen-button"></i><div><b>Orange / MTN / Moov Money</b><span>Mobile Money</span></div></div>
      <div class="pay-opt ${order.pay==='cash'?'sel':''}" onclick="selPay('cash',this)"><i class="fa-solid fa-money-bill-wave"></i><div><b>Paiement \u00e0 la livraison</b><span>Payez en recevant (Abidjan)</span></div></div>
      <div class="pay-opt ${order.pay==='wa'?'sel':''}" onclick="selPay('wa',this)"><i class="fa-brands fa-whatsapp"></i><div><b>Finaliser sur WhatsApp</b><span>Un conseiller vous r\u00e9pond</span></div></div>
      <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap"><button class="btn btn-ghost" onclick="setStep(3)"><i class="fa-solid fa-arrow-left"></i> Retour</button><button class="btn btn-orange" style="flex:1" onclick="placeOrder(this)"><i class="fa-solid fa-lock"></i> Confirmer la commande</button></div>
      </div></div>${sumBox(true)}</div>`;
  }
  else if(step===5){
    const ref=order.ref;const total=fmt(subtotal()+shipCost());
    const msg=`${WA_MSG}. Commande ${ref}. Client: ${order.info.first} ${order.info.last} (${order.info.phone}). Livraison: ${order.ship.zone}, ${order.ship.addr}. Total: ${total}.`;
    area.innerHTML=`<div class="confirm-box"><div class="ok"><i class="fa-solid fa-check"></i></div>
      <h1>Merci pour votre commande !</h1><p style="color:var(--gray)">Votre commande a bien \u00e9t\u00e9 enregistr\u00e9e dans notre syst\u00e8me. Notre \u00e9quipe vous contactera tr\u00e8s vite.</p>
      <div class="order-ref">R\u00e9f\u00e9rence : ${ref}</div>
      <div style="text-align:left;background:var(--bg);padding:18px;border-radius:12px;margin-bottom:20px">
        <div class="sum-line"><span>Client</span><span>${order.info.first} ${order.info.last}</span></div>
        <div class="sum-line"><span>T\u00e9l\u00e9phone</span><span>${order.info.phone}</span></div>
        <div class="sum-line"><span>Livraison</span><span>${order.ship.zone}</span></div>
        <div class="sum-line total"><span>Total</span><span>${total}</span></div>
      </div>
      <a class="btn btn-wa btn-block" target="_blank" href="${waLink(WA_NUMS[0],msg)}" style="margin-bottom:10px"><i class="fa-brands fa-whatsapp"></i> Confirmer sur WhatsApp</a>
      <a href="suivi.html?ref=${ref}" class="btn btn-primary btn-block" style="margin-bottom:10px"><i class="fa-solid fa-truck-fast"></i> Suivre ma commande</a>
      <a href="index.html" class="btn btn-ghost btn-block">Retour \u00e0 l'accueil</a></div>`;
  }
}
function cq(id,d){setQty(id,d);render();}
function cr(id){removeFromCart(id);render();}
function saveInfo(){const f=id=>document.getElementById(id).value.trim();order.info={first:f('f_first'),last:f('f_last'),phone:f('f_phone'),email:f('f_email')};if(!order.info.first||!order.info.last||!order.info.phone){toast('Veuillez remplir les champs obligatoires');return;}setStep(3);}
function saveShip(){order.ship.addr=document.getElementById('f_addr').value.trim();order.ship.note=document.getElementById('f_note').value.trim();if(!order.ship.zone||!order.ship.addr){toast('Veuillez choisir une zone et une adresse');return;}setStep(4);}
function selPay(p,el){order.pay=p;document.querySelectorAll('.pay-opt').forEach(o=>o.classList.remove('sel'));el.classList.add('sel');}

async function placeOrder(btn){
  if(!order.pay){toast('Veuillez choisir un mode de paiement');return;}
  if(btn){btn.disabled=true;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Envoi...';}
  const it=items();
  const payload={client:order.info.first+' '+order.info.last,phone:order.info.phone,email:order.info.email,
    zone:order.ship.zone,addr:order.ship.addr,note:order.ship.note,pay:order.pay,
    ship_cost:shipCost(),total:subtotal()+shipCost(),
    items:it.map(i=>({id:i.p.id,name:i.p.name,qty:i.qty,price:i.p.price}))};
  try{
    const r=await fetch(API+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await r.json();
    if(!r.ok||!data.ok)throw new Error(data.error||'Erreur');
    order.ref=data.ref;
    localStorage.setItem('kambire_cart','[]');updateCartCount();
    setStep(5);
  }catch(e){
    toast('Erreur lors de l\'envoi. R\u00e9essayez.');
    if(btn){btn.disabled=false;btn.innerHTML='<i class="fa-solid fa-lock"></i> Confirmer la commande';}
  }
}
boot(function(){ render(); });
