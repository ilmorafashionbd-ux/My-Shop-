document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG ===
  const CSV_URL   = './data/products.csv';            // products.csv লোকাল ফাইল
  const IMG_BASE  = './images/';                      // images ফোল্ডার
  const WHATSAPP  = '8801778095805';                  // আপনার নম্বর

  const path = location.pathname;

  const el = s => document.querySelector(s);
  const fmt = n => '৳'+(Number(n)||0).toLocaleString('bn-BD');

  // বছর
  const y = el('#yr'); if (y) y.textContent = new Date().getFullYear();

  // CSV ফেচ + পার্স (সিম্পল)
  async function fetchProducts(){
    const res = await fetch(CSV_URL, {cache:'no-store'});
    const text = await res.text();
    const rows = text.trim().split('\n').map(r => r.split(','));
    const header = rows[0].map(h=>h.trim());
    const idx = {
      name: header.indexOf('Name'),
      price: header.indexOf('Price'),
      desc: header.indexOf('Description'),
      img: header.indexOf('ImageFileName')
    };
    const list=[];
    for(let i=1;i<rows.length;i++){
      const r = rows[i];
      if(!r.length) continue;
      const name = r[idx.name]?.trim();
      const price = r[idx.price]?.trim();
      const desc = r[idx.desc]?.trim() || '';
      const imgFile = r[idx.img]?.trim();
      if(!name || !price || !imgFile) continue;
      list.push({
        id:i,
        name,
        price:Number(price),
        desc,
        img: IMG_BASE + imgFile
      });
    }
    return list;
  }

  function card(p){
    const a = document.createElement('a');
    a.className='product-card';
    a.href = `product-detail.html?name=${encodeURIComponent(p.name)}`;
    a.innerHTML = `
      <img src="${p.img}" alt="${p.name}" onerror="this.src='${IMG_BASE}product1.jpg'">
      <div class="product-card-content">
        <h3>${p.name}</h3>
        <p>${fmt(p.price)}</p>
      </div>`;
    return a;
  }

  // Home: ফিচার্ড
  if (path.endsWith('/') || path.endsWith('/index.html')) {
    fetchProducts().then(list=>{
      const grid = el('#featured-products-grid');
      if(!grid) return;
      const featured = list.slice(0,3);
      featured.forEach(p=>grid.appendChild(card(p)));
    }).catch(console.error);
  }

  // Products: সব পণ্য + সার্চ
  if (path.endsWith('/products.html')) {
    let ALL=[];
    const grid = el('#all-products-grid');
    const search = el('#search');
    function render(q=''){
      const L = ALL.filter(p =>
        !q || p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q)
      );
      grid.innerHTML = '';
      L.forEach(p=>grid.appendChild(card(p)));
    }
    fetchProducts().then(list=>{
      ALL=list;
      render('');
      search.addEventListener('input', e=>{
        render((e.target.value||'').toLowerCase().trim());
      });
    }).catch(console.error);
  }

  // Product detail
  if (path.endsWith('/product-detail.html')) {
    const params = new URLSearchParams(location.search);
    const pname = params.get('name');
    const box = el('#product-detail-container');
    const modal = el('#order-modal');
    const closeBtn = el('#close-modal');

    fetchProducts().then(list=>{
      const p = list.find(x=>x.name === pname);
      if(!p){ box.innerHTML='<p>প্রোডাক্ট পাওয়া যায়নি।</p>'; return; }
      box.innerHTML = `
        <img class="product-detail-image" src="${p.img}" alt="${p.name}" onerror="this.src='${IMG_BASE}product1.jpg'">
        <div class="product-detail-content">
          <h1>${p.name}</h1>
          <div class="price">${fmt(p.price)}</div>
          <p class="description">${p.desc}</p>
          <button class="btn" id="order-now-btn">এখনই অর্ডার</button>
        </div>
      `;

      el('#order-now-btn').addEventListener('click', ()=>{
        modal.style.display='flex';
        el('#product-name-input').value = p.name;
        el('#product-price-input').value = fmt(p.price);
      });

      closeBtn.addEventListener('click', ()=> modal.style.display='none');
      window.addEventListener('click', (e)=>{ if(e.target===modal) modal.style.display='none'; });

      el('#order-form').addEventListener('submit', (e)=>{
        e.preventDefault();
        const cName = el('#customer-name').value;
        const cPhone = el('#customer-phone').value;
        const cAddr  = el('#customer-address').value;
        const msg = `অর্ডার দিতে চাই:
প্রোডাক্ট: ${p.name}
দাম: ${fmt(p.price)}
নাম: ${cName}
ফোন: ${cPhone}
ঠিকানা: ${cAddr}`;
        const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
        window.open(url,'_blank');
      });
    }).catch(console.error);
  }

  // Contact → WhatsApp
  if (path.endsWith('/contact.html')) {
    const form = document.getElementById('contact-form');
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('contact-name').value;
      const phone= document.getElementById('contact-phone').value;
      const addr = document.getElementById('contact-address').value;
      const msg  = document.getElementById('contact-message').value;
      const text = `কন্টাক্ট:
নাম: ${name}
ফোন: ${phone}
ঠিকানা: ${addr}
বার্তা: ${msg}`;
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`,'_blank');
    });
  }
});