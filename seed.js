/* ===== Remplissage initial de la base ===== */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

const IMG = {
  hp:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80',
  laptop:'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
  dell:'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80',
  lenovo:'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80',
  gamer:'https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80',
  gamer2:'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=800&q=80',
  screen:'https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=800&q=80',
  printer:'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800&q=80',
  mouse:'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800&q=80',
  keyboard:'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
  bag:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  headset:'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80',
  zbook:'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80',
  ultrabook:'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80',
  desktop:'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=800&q=80',
  ssd:'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&q=80'
};
const EXTRA_PRICE = 15000;

const P = [
  {name:'HP EliteBook 840 G8 - Core i7',cat:'HP',brand:'HP',price:485000,old:560000,gen:'11e',cpu:'i7',ram:16,ssd:512,tactile:0,dispo:1,promo:1,neuf:0,rating:5,sold:142,stock:8,img:IMG.hp,gallery:[IMG.hp,IMG.laptop,IMG.ultrabook],descr:"Ultrabook professionnel HP EliteBook 840 G8, chassis aluminium premium, ecran Full HD 14 pouces anti-reflet.",specs:{'Processeur':'Intel Core i7-1165G7','RAM':'16 Go DDR4','Stockage':'SSD 512 Go NVMe','Ecran':'14\" Full HD IPS','Systeme':'Windows 11 Pro','Poids':'1,32 kg'}},
  {name:'Dell Latitude 5420 - Core i5',cat:'Dell',brand:'Dell',price:365000,old:0,gen:'11e',cpu:'i5',ram:8,ssd:256,tactile:0,dispo:1,promo:0,neuf:1,rating:5,sold:98,stock:12,img:IMG.dell,gallery:[IMG.dell,IMG.laptop],descr:"Dell Latitude 5420, robuste et fiable, parfait pour les entreprises.",specs:{'Processeur':'Intel Core i5-1135G7','RAM':'8 Go DDR4','Stockage':'SSD 256 Go NVMe','Ecran':'14\" Full HD','Systeme':'Windows 11 Pro'}},
  {name:'Lenovo ThinkPad T14 - Core i7 Tactile',cat:'Lenovo',brand:'Lenovo',price:520000,old:590000,gen:'12e',cpu:'i7',ram:16,ssd:512,tactile:1,dispo:1,promo:1,neuf:0,rating:5,sold:76,stock:6,img:IMG.lenovo,gallery:[IMG.lenovo,IMG.ultrabook],descr:"Lenovo ThinkPad T14 ecran tactile, clavier legendaire, securite renforcee.",specs:{'Processeur':'Intel Core i7-1260P','RAM':'16 Go DDR4','Stockage':'SSD 512 Go NVMe','Ecran':'14\" tactile Full HD','Systeme':'Windows 11 Pro'}},
  {name:'HP ZBook Firefly 14 G9 - Station de travail',cat:'ZBook',brand:'HP',price:720000,old:0,gen:'12e',cpu:'i7',ram:32,ssd:1024,tactile:0,dispo:1,promo:0,neuf:1,rating:5,sold:41,stock:4,img:IMG.zbook,gallery:[IMG.zbook,IMG.hp],descr:"Station de travail mobile HP ZBook Firefly, certifiee pour applications pro (CAO, 3D).",specs:{'Processeur':'Intel Core i7-1265U','RAM':'32 Go DDR5','Stockage':'SSD 1 To NVMe','Carte graphique':'NVIDIA T550','Systeme':'Windows 11 Pro'}},
  {name:'PC Gamer KAMBIRE RTX 4060 - Core i7',cat:'PC Gamer',brand:'HP',price:950000,old:1100000,gen:'13e',cpu:'i7',ram:32,ssd:1024,tactile:0,dispo:1,promo:1,neuf:1,rating:5,sold:63,stock:5,img:IMG.gamer,gallery:[IMG.gamer,IMG.gamer2,IMG.desktop],descr:"PC Gamer haute performance avec RTX 4060, refroidissement optimise et RGB.",specs:{'Processeur':'Intel Core i7-13700H','RAM':'32 Go DDR5','Stockage':'SSD 1 To NVMe','Ecran':'15,6\" 165Hz','Carte graphique':'NVIDIA RTX 4060 8Go'}},
  {name:'Dell Precision 7560 - Workstation i7',cat:'Dell',brand:'Dell',price:680000,old:0,gen:'11e',cpu:'i7',ram:32,ssd:512,tactile:0,dispo:0,promo:0,neuf:0,rating:4,sold:29,stock:0,img:IMG.laptop,gallery:[IMG.laptop,IMG.dell],descr:"Dell Precision 7560, workstation puissante pour ingenieurs et graphistes.",specs:{'Processeur':'Intel Core i7-11850H','RAM':'32 Go DDR4','Stockage':'SSD 512 Go','Carte graphique':'NVIDIA RTX A2000'}},
  {name:'Ecran Dell UltraSharp 27\" 4K',cat:'\u00c9crans',brand:'Dell',price:245000,old:290000,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:1,neuf:0,rating:5,sold:87,stock:15,img:IMG.screen,gallery:[IMG.screen],descr:"Ecran Dell UltraSharp 27 pouces resolution 4K UHD, couleurs precises.",specs:{'Taille':'27 pouces','Resolution':'3840 x 2160 (4K)','Dalle':'IPS','Connectique':'HDMI, DisplayPort, USB-C'}},
  {name:'Ecran Gamer 24\" 165Hz',cat:'\u00c9crans',brand:'HP',price:135000,old:0,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:0,neuf:1,rating:4,sold:54,stock:20,img:IMG.desktop,gallery:[IMG.desktop,IMG.screen],descr:"Ecran gaming 24 pouces 165Hz, temps de reponse 1ms.",specs:{'Taille':'24 pouces','Resolution':'1920 x 1080','Frequence':'165 Hz','Temps de reponse':'1 ms'}},
  {name:'Imprimante HP LaserJet Pro M404',cat:'Imprimantes',brand:'HP',price:185000,old:215000,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:1,neuf:0,rating:5,sold:112,stock:9,img:IMG.printer,gallery:[IMG.printer],descr:"Imprimante laser monochrome rapide et economique.",specs:{'Type':'Laser monochrome','Vitesse':'38 pages/min','Connectivite':'USB, Ethernet, Wi-Fi','Recto-verso':'Automatique'}},
  {name:'Souris sans fil Logitech MX Master 3',cat:'Accessoires',brand:'Lenovo',price:42000,old:0,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:0,neuf:1,rating:5,sold:203,stock:30,img:IMG.mouse,gallery:[IMG.mouse],descr:"Souris ergonomique sans fil haut de gamme, autonomie 70 jours.",specs:{'Type':'Sans fil','Capteur':'4000 DPI','Autonomie':'70 jours','Boutons':'7 programmables'}},
  {name:'Clavier mecanique retro-eclaire RGB',cat:'Accessoires',brand:'HP',price:38000,old:48000,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:1,neuf:0,rating:4,sold:167,stock:25,img:IMG.keyboard,gallery:[IMG.keyboard],descr:"Clavier mecanique RGB, switches reactifs.",specs:{'Type':'Mecanique','Retro-eclairage':'RGB','Connexion':'USB filaire','Layout':'AZERTY'}},
  {name:'Casque Audio Pro Reduction de bruit',cat:'Accessoires',brand:'Lenovo',price:55000,old:0,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:0,neuf:1,rating:5,sold:91,stock:18,img:IMG.headset,gallery:[IMG.headset],descr:"Casque sans fil avec reduction de bruit active, micro integre.",specs:{'Type':'Sans fil','Reduction de bruit':'Active (ANC)','Autonomie':'30h','Connexion':'Bluetooth 5.0'}},
  {name:'Sac a dos ordinateur portable 15,6\" Premium',cat:'Sacs d\u2019ordinateur',brand:'HP',price:28000,old:35000,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:1,promo:1,neuf:0,rating:5,sold:178,stock:40,img:IMG.bag,gallery:[IMG.bag],descr:"Sac a dos impermeable avec port USB, compartiment matelasse 15,6 pouces.",specs:{'Compatibilite':'15,6 pouces','Materiau':'Polyester impermeable','Port USB':'Oui','Garantie':'1 an'}},
  {name:'Lenovo IdeaPad Slim 3 - Core i5',cat:'Lenovo',brand:'Lenovo',price:295000,old:0,gen:'10e',cpu:'i5',ram:8,ssd:256,tactile:0,dispo:1,promo:0,neuf:1,rating:4,sold:134,stock:11,img:IMG.ultrabook,gallery:[IMG.ultrabook,IMG.lenovo],descr:"Lenovo IdeaPad Slim 3, leger et polyvalent, ideal etudiants.",specs:{'Processeur':'Intel Core i5-1035G1','RAM':'8 Go DDR4','Stockage':'SSD 256 Go','Ecran':'15,6\" Full HD'}},
  {name:'HP Pavilion 15 - Core i5 Tactile',cat:'HP',brand:'HP',price:340000,old:395000,gen:'12e',cpu:'i5',ram:16,ssd:512,tactile:1,dispo:1,promo:1,neuf:1,rating:5,sold:88,stock:7,img:IMG.laptop,gallery:[IMG.laptop,IMG.hp,IMG.ultrabook],descr:"HP Pavilion 15 ecran tactile, design elegant, bon rapport performance/prix.",specs:{'Processeur':'Intel Core i5-1240P','RAM':'16 Go DDR4','Stockage':'SSD 512 Go NVMe','Ecran':'15,6\" tactile Full HD'}},
  {name:'PC Gamer Tour RTX 4070 - Core i9',cat:'PC Gamer',brand:'Dell',price:1450000,old:0,gen:'13e',cpu:'i7',ram:32,ssd:1024,tactile:0,dispo:1,promo:0,neuf:1,rating:5,sold:22,stock:3,img:IMG.desktop,gallery:[IMG.desktop,IMG.gamer,IMG.gamer2],descr:"PC Gamer tour ultra puissant, RTX 4070, refroidissement liquide.",specs:{'Processeur':'Intel Core i9-13900K','RAM':'32 Go DDR5','Stockage':'SSD 1 To + HDD 1 To','Carte graphique':'NVIDIA RTX 4070 12Go'}},
  {name:'SSD Externe Portable 1 To USB-C',cat:'Accessoires',brand:'HP',price:65000,old:78000,gen:'-',cpu:'-',ram:0,ssd:1024,tactile:0,dispo:1,promo:1,neuf:0,rating:5,sold:145,stock:22,img:IMG.ssd,gallery:[IMG.ssd],descr:"SSD externe ultra rapide 1 To, USB-C, transferts jusqu'a 1050 Mo/s.",specs:{'Capacite':'1 To','Interface':'USB-C 3.2','Vitesse':'1050 Mo/s','Format':'Portable'}},
  {name:'Imprimante Multifonction Couleur Wi-Fi',cat:'Imprimantes',brand:'HP',price:145000,old:0,gen:'-',cpu:'-',ram:0,ssd:0,tactile:0,dispo:0,promo:0,neuf:1,rating:4,sold:67,stock:0,img:IMG.printer,gallery:[IMG.printer],descr:"Imprimante multifonction couleur : impression, scan, copie, Wi-Fi.",specs:{'Type':'Jet d\'encre couleur','Fonctions':'Imprimer, scanner, copier','Vitesse':'22 pages/min','Connectivite':'Wi-Fi, USB'}}
];

const generatedProducts = [];
const filters = ['8e','9e','10e','11e','12e','13e'];
const brandsForGenerated = ['HP','Dell','Lenovo'];
const cpuPool = ['i5','i7'];
const variantSet = [
  {ram:8,ssd:256,price:290000,old:340000,stock:14,dispo:1,promo:1},
  {ram:8,ssd:512,price:330000,old:390000,stock:12,dispo:1,promo:1},
  {ram:16,ssd:256,price:360000,old:420000,stock:11,dispo:1,promo:0},
  {ram:16,ssd:512,price:420000,old:480000,stock:10,dispo:1,promo:1},
  {ram:16,ssd:1024,price:510000,old:590000,stock:9,dispo:1,promo:0},
  {ram:32,ssd:512,price:620000,old:710000,stock:8,dispo:1,promo:1},
  {ram:32,ssd:1024,price:760000,old:870000,stock:7,dispo:1,promo:0},
  {ram:32,ssd:1024,price:845000,old:940000,stock:6,dispo:1,promo:1},
  {ram:16,ssd:512,price:480000,old:560000,stock:10,dispo:1,promo:1},
  {ram:32,ssd:1024,price:920000,old:1010000,stock:5,dispo:1,promo:1}
];

for (const gen of filters) {
  for (const brand of brandsForGenerated) {
    for (const cpu of cpuPool) {
      for (let i = 0; i < variantSet.length; i++) {
        const v = variantSet[i];
        const tactile = (i % 2 === 0) ? 1 : 0;
        const promo = v.promo;
        const name = `${brand} ${cpu.toUpperCase()} ${gen} ${i + 1}`;
        generatedProducts.push({
          name,
          cat: brand,
          brand,
          price: v.price + (i * 22000),
          old: v.old + (i * 26000),
          gen,
          cpu,
          ram: v.ram,
          ssd: v.ssd,
          tactile,
          dispo: v.dispo,
          promo,
          neuf: i % 3 === 0 ? 1 : 0,
          rating: 5,
          sold: 21 + i * 7,
          stock: v.stock + i,
          low_stock: 4,
          img: brand === 'HP' ? IMG.hp : brand === 'Dell' ? IMG.dell : IMG.lenovo,
          gallery: [brand === 'HP' ? IMG.hp : brand === 'Dell' ? IMG.dell : IMG.lenovo],
          descr: `${brand} ${cpu.toUpperCase()} ${gen}, parfait pour un usage professionnel et quotidien.`,
          specs: {
            'Processeur': `Intel Core ${cpu.toUpperCase()}`,
            'RAM': `${v.ram} Go`,
            'Stockage': `${v.ssd} Go SSD`,
            'Generation': gen,
            'Ecran tactile': tactile ? 'Oui' : 'Non'
          }
        });
      }
    }
  }
}

const allProducts = [...P, ...generatedProducts].map(r => {
  const isComputer = ['HP', 'Dell', 'Lenovo', 'ZBook', 'PC Gamer'].includes(String(r.cat || r.brand || '').trim()) || /^(HP|Dell|Lenovo)\b/i.test(String(r.name || ''));
  return {
    ...r,
    price: Number(r.price || 0) + (isComputer ? EXTRA_PRICE : 0),
    old: r.old ? Number(r.old || 0) + (isComputer ? EXTRA_PRICE : 0) : 0,
    low_stock: r.low_stock == null ? 3 : r.low_stock
  };
});
const count = db.prepare('SELECT COUNT(*) c FROM products').get().c;
if (count === 0) {
  const ins = db.prepare(`INSERT INTO products (name,cat,brand,price,old,gen,cpu,ram,ssd,tactile,dispo,promo,neuf,rating,sold,stock,low_stock,img,gallery,descr,specs)
    VALUES (@name,@cat,@brand,@price,@old,@gen,@cpu,@ram,@ssd,@tactile,@dispo,@promo,@neuf,@rating,@sold,@stock,@low_stock,@img,@gallery,@descr,@specs)`);
  const tx = db.transaction(rows => rows.forEach(r => ins.run({ ...r, gallery: JSON.stringify(r.gallery), specs: JSON.stringify(r.specs) })));
  tx(allProducts);
  console.log('\u2705 ' + allProducts.length + ' produits ajoutes.');
} else {
  console.log('\u2139\uFE0F  Produits deja presents (' + count + '), aucun ajout.');
}

// Admin par defaut
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'Lemourte1@';
const existing = db.prepare('SELECT id, pass_hash FROM admins WHERE username=?').get(adminUser);
if (!existing) {
  db.prepare('INSERT INTO admins (username,pass_hash) VALUES (?,?)').run(adminUser, bcrypt.hashSync(adminPass, 10));
  console.log('\u2705 Admin cree : ' + adminUser + ' / ' + adminPass);
} else if (!bcrypt.compareSync(adminPass, existing.pass_hash)) {
  db.prepare('UPDATE admins SET pass_hash=? WHERE username=?').run(bcrypt.hashSync(adminPass, 10), adminUser);
  console.log('\u2705 Mot de passe admin synchronise : ' + adminUser + ' / ' + adminPass);
} else {
  console.log('\u2139\uFE0F  Admin "' + adminUser + '" existe deja avec le bon mot de passe.');
}
console.log('Base de donnees prete.');
