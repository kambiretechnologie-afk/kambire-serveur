/* ===== Suivi de commande (serveur) ===== */
mountChrome('suivi');

// Etapes de progression d'une commande
const STEPS = [
  { key: 'Nouvelle',  label: 'Commande re\u00e7ue',   icon: 'fa-receipt' },
  { key: 'En cours',  label: 'En pr\u00e9paration',   icon: 'fa-box-open' },
  { key: 'Livr\u00e9e',   label: 'Livr\u00e9e',           icon: 'fa-house-circle-check' }
];

function stepIndex(status){
  if(status==='Annul\u00e9e') return -1;
  const i = STEPS.findIndex(s=>s.key===status);
  return i<0 ? 0 : i;
}

function payLabel(p){
  return ({wave:'Wave',om:'Mobile Money',cash:'\u00c0 la livraison',wa:'Via WhatsApp'})[p] || p || '\u2014';
}

function statusPill(s){
  const cls = s==='Livr\u00e9e'?'pill-green':s==='En cours'?'pill-blue':s==='Annul\u00e9e'?'pill-red':'pill-orange';
  return '<span class="pill '+cls+'">'+s+'</span>';
}

async function doTrack(e){
  e.preventDefault();
  const ref = document.getElementById('t_ref').value.trim();
  const phone = document.getElementById('t_phone').value.trim();
  const box = document.getElementById('trackResult');
  if(!ref || !phone){ toast('Veuillez remplir les deux champs'); return false; }
  box.innerHTML = '<div class="co-card" style="text-align:center"><i class="fa-solid fa-spinner fa-spin" style="font-size:26px;color:var(--blue)"></i><p style="color:var(--gray);margin-top:10px">Recherche de votre commande...</p></div>';
  try{
    const r = await fetch(API+'/api/orders/track?ref='+encodeURIComponent(ref)+'&phone='+encodeURIComponent(phone));
    const data = await r.json();
    if(!r.ok){ throw new Error(data.error||'Introuvable'); }
    renderTrack(data);
  }catch(err){
    box.innerHTML = '<div class="co-card" style="border-left:4px solid #e74c3c"><h3 style="margin:0 0 6px"><i class="fa-solid fa-circle-xmark" style="color:#e74c3c"></i> Commande introuvable</h3><p style="color:var(--gray);margin:0">V\u00e9rifiez votre num\u00e9ro de commande et le t\u00e9l\u00e9phone utilis\u00e9. Besoin d\'aide ? <a href="'+waLink(WA_NUMS[0])+'" target="_blank" style="color:var(--blue)">Contactez-nous sur WhatsApp</a>.</p></div>';
  }
  return false;
}

function renderTrack(o){
  const box = document.getElementById('trackResult');
  const cancelled = o.status==='Annul\u00e9e';
  const idx = stepIndex(o.status);
  const date = new Date(o.created).toLocaleDateString('fr-FR',{day:'2-digit',month:'long',year:'numeric'});

  const timeline = cancelled
    ? '<div class="track-cancelled"><i class="fa-solid fa-ban"></i> Cette commande a \u00e9t\u00e9 annul\u00e9e. Contactez-nous pour toute question.</div>'
    : '<div class="track-steps">'+STEPS.map((s,i)=>{
        const state = i<idx?'done':(i===idx?'current':'todo');
        return '<div class="track-step '+state+'"><div class="ts-dot"><i class="fa-solid '+s.icon+'"></i></div><span class="ts-label">'+s.label+'</span></div>';
      }).join('<div class="ts-line"></div>')+'</div>';

  const lines = o.items.map(it=>'<div class="sum-item"><div style="flex:1"><b>'+it.name+'</b><br><span style="color:var(--gray)">'+it.qty+' \u00d7 '+fmt(it.price)+'</span></div><div style="font-weight:800;color:var(--blue)">'+fmt(it.price*it.qty)+'</div></div>').join('');

  box.innerHTML = '<div class="co-card track-card">'
    + '<div class="track-head"><div><span style="color:var(--gray);font-size:13px">Commande</span><h3 style="margin:2px 0">'+o.ref+'</h3><span style="color:var(--gray);font-size:13px">Pass\u00e9e le '+date+'</span></div>'+statusPill(o.status)+'</div>'
    + timeline
    + '<div class="sum-items" style="margin-top:20px">'+lines+'</div>'
    + '<div class="sum-line"><span>Client</span><span>'+o.client+'</span></div>'
    + '<div class="sum-line"><span>Livraison</span><span>'+(o.zone||'\u2014')+'</span></div>'
    + '<div class="sum-line"><span>Paiement</span><span>'+payLabel(o.pay)+'</span></div>'
    + '<div class="sum-line"><span>Frais de livraison</span><span>'+fmt(o.ship_cost||0)+'</span></div>'
    + '<div class="sum-line total"><span>Total</span><span>'+fmt(o.total)+'</span></div>'
    + '<a class="btn btn-wa btn-block" target="_blank" href="'+waLink(WA_NUMS[0],'Bonjour KAMBIRE INFORMATIQUE, je souhaite des nouvelles de ma commande '+o.ref)+'" style="margin-top:16px"><i class="fa-brands fa-whatsapp"></i> Une question sur cette commande ?</a>'
    + '</div>';
}

// Pre-remplissage via ?ref=... dans l'URL (lien depuis la page de confirmation)
boot(function(){
  const q = new URLSearchParams(location.search);
  if(q.get('ref')) document.getElementById('t_ref').value = q.get('ref');
});
