/*********************************************
  script.js
  - Handles all pages: index, admin, product-details, and cart
  - Uses Firebase (Auth + Firestore) and Cloudinary (image upload)
*********************************************/

/* =======================
   1) CONFIG - put your Firebase config here
   ========================= */
const firebaseConfig = {
  apiKey: "AIzaSyBUpr0ZmggaDukSVIoXeckeTVy09bK6_0s",
  authDomain: "my-shop-app-15b82.firebaseapp.com",
  projectId: "my-shop-app-15b82",
  storageBucket: "my-shop-app-15b82.firebasestorage.app",
  messagingSenderId: "343254203665",
  appId: "1:343254203665:web:ebeaa0c96837384a8ba0b0"
};
// Cloudinary info (you provided)
const CLOUDINARY_CLOUD = "durtzerpq";
const CLOUDINARY_UPLOAD_PRESET = "product_images";

/* ============ Initialize Firebase (compat scripts must be loaded in HTML) ============ */
if (typeof firebase === 'undefined') {
  console.error('Firebase SDK not loaded. Make sure you included firebase scripts in HTML.');
} else {
  firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

/* ============ Helpers ============= */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const page = document.body.dataset.page || 'index';

/* ============ CART (localStorage) ============= */
const CART_KEY = 'myshop_cart_v1';
function getCart(){
  try{
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }catch(e){ return [];}
}
function saveCart(c){ localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartCount(); }
function updateCartCount(){
  const c = getCart();
  const total = c.reduce((s,i)=>s+ (i.qty||1), 0);
  const el = document.getElementById('cart-count');
  if(el) el.textContent = total;
}

/* ============ Cloudinary upload (unsigned) ============= */
async function uploadToCloudinary(file){
  if(!file) throw new Error('No file provided');
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/upload`;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  const res = await fetch(url, { method: 'POST', body: form });
  if(!res.ok) throw new Error('Cloudinary upload failed: '+res.statusText);
  const data = await res.json();
  return data.secure_url || data.url;
}

/* ============ COMMON UI ============= */
function escapeHtml(s){
  if(!s) return '';
  return String(s).replace(/[&<>"]/g, (c)=> ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
// This function now handles adding to cart and redirecting
function addToCart(p, redirect=true){
    const cart = getCart();
    const idx = cart.findIndex(i=> i.id === p.id);
    if(idx>=0){ cart[idx].qty = (cart[idx].qty||1)+1; }
    else cart.push({ id:p.id, name:p.product_name, price: p.price, imageUrl: p.imageUrl, qty:1 });
    saveCart(cart);
    alert('প্রোডাক্ট কার্টে যুক্ত হয়েছে');
    if(redirect) {
        window.location.href = 'cart.html';
    }
}

/* ============ INDEX PAGE LOGIC ============= */
async function initIndexPage(){
  const grid = document.getElementById('product-grid');
  const noProducts = document.getElementById('no-products');
  updateCartCount();

  try{
    const snapshot = await db.collection('products').orderBy('createdAt','desc').get();
    if(snapshot.empty){
      if(noProducts) noProducts.style.display='block';
      return;
    }
    const products = snapshot.docs.map(d=> ({ id:d.id, ...d.data() }) );
    renderProductsGrid(products);
  }catch(err){
    console.error('Error loading products', err);
    if(noProducts) { noProducts.style.display='block'; noProducts.textContent = 'প্রোডাক্ট লোডে সমস্যা। কনসোল দেখুন।';}
  }

  function renderProductsGrid(products){
    if(!grid) return;
    grid.innerHTML = '';
    products.forEach(p=>{
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <img src="${escapeHtml(p.imageUrl||'')}" alt="${escapeHtml(p.product_name||'Product')}">
        <div class="card-body">
          <h4>${escapeHtml(p.product_name||'Unnamed')}</h4>
          <div class="small">${escapeHtml(p.category||'')}</div>
          <div class="price">${escapeHtml(p.price||'0')}৳</div>
          <div class="card-actions">
            <a class="btn view-btn" href="product_details.html?id=${p.id}">বিস্তারিত</a>
            <button class="btn alt add-cart-btn" data-id="${p.id}">Add to cart</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
      // Add event listener for "Add to cart" button
      card.querySelector('.add-cart-btn').addEventListener('click', async (e) => {
          const productId = e.target.dataset.id;
          try {
              const doc = await db.collection('products').doc(productId).get();
              if (doc.exists) {
                  const productData = { id: doc.id, ...doc.data() };
                  addToCart(productData, false); // No redirect on index page
              }
          } catch (err) {
              console.error('Error fetching product for cart', err);
          }
      });
    });
  }
}

/* ============ PRODUCT DETAILS PAGE LOGIC ============= */
async function initProductDetailsPage(){
    const container = $('#product-details-container');
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if(!productId){
        container.innerHTML = `<div style="text-align:center; padding: 20px;">
            Product not found. <a href="index.html">Go back to home</a>
        </div>`;
        return;
    }

    try {
        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) {
            container.innerHTML = `<div style="text-align:center; padding: 20px;">
                Product not found. <a href="index.html">Go back to home</a>
            </div>`;
            return;
        }
        const p = { id: doc.id, ...doc.data() };
        const html = `
            <div style="display:flex;flex-direction:column;gap:16px">
                <img src="${escapeHtml(p.imageUrl||'')}" style="width:100%;max-height:450px;object-fit:cover;border-radius:8px" alt="${escapeHtml(p.product_name)}">
                <h2>${escapeHtml(p.product_name)}</h2>
                <div class="small">SKU: ${escapeHtml(p.sku||'N/A')}</div>
                <div class="price" style="font-size:24px">${escapeHtml(p.price||'0')}৳</div>
                <p>${escapeHtml(p.description||'')}</p>
                <div style="display:flex;gap:8px">
                    <button id="add-to-cart-btn" class="btn">Add to cart</button>
                    <a class="btn alt" href="https://wa.me/8801778095805?text=${encodeURIComponent('Interested in '+(p.product_name||''))}" target="_blank">WhatsApp</a>
                </div>
            </div>
        `;
        container.innerHTML = html;
        
        $('#add-to-cart-btn').addEventListener('click', () => {
            addToCart(p);
        });

    } catch (err) {
        console.error('Error fetching product details', err);
        container.innerHTML = `<div style="text-align:center; padding: 20px;">
            Error loading product.
        </div>`;
    }
    updateCartCount();
}

/* ============ CART PAGE LOGIC ============= */
function initCartPage(){
    const container = $('#cart-inner');
    const renderCart = () => {
        const cart = getCart();
        if(cart.length===0){
            container.innerHTML = '<div style="padding:20px"><h3>আপনার কার্ট খালি</h3><p><a href="index.html">পণ্য কেনাকাটা শুরু করুন</a></p></div>';
            return;
        }
        let html = `<h3>Cart</h3><div class="cart-list">`;
        let total=0;
        cart.forEach((it,idx)=>{
            total += (Number(it.price||0) * (it.qty||1));
            html += `<div class="cart-item">
                <img src="${escapeHtml(it.imageUrl||'')}" alt="${escapeHtml(it.name)}">
                <div style="flex:1">
                    <div><strong>${escapeHtml(it.name)}</strong></div>
                    <div class="small">${escapeHtml(it.price)}৳ x ${escapeHtml(it.qty)}</div>
                    <div class="qty-controls" style="margin-top:8px">
                        <button class="btn small" data-idx="${idx}" data-op="dec">-</button>
                        <button class="btn small" data-idx="${idx}" data-op="inc">+</button>
                        <button class="btn alt small" data-idx="${idx}" data-op="rm">Remove</button>
                    </div>
                </div>
            </div>`;
        });
        html += `</div><div style="margin-top:12px"><strong>Total: ${total}৳</strong></div>
            <div style="margin-top:12px">
                <button id="checkout-btn" class="btn">Checkout via WhatsApp</button>
            </div>`;
        container.innerHTML = html;

        // attach handlers
        container.querySelectorAll('button[data-op]').forEach(b=>{
            b.addEventListener('click', ()=>{
                const op = b.dataset.op; const idx = Number(b.dataset.idx);
                const currentCart = getCart();
                if(op==='inc'){ currentCart[idx].qty = (currentCart[idx].qty||1) + 1; saveCart(currentCart); renderCart(); }
                if(op==='dec'){ currentCart[idx].qty = Math.max(1,(currentCart[idx].qty||1)-1); saveCart(currentCart); renderCart(); }
                if(op==='rm'){ currentCart.splice(idx,1); saveCart(currentCart); renderCart(); }
            });
        });
        const checkoutBtn = document.getElementById('checkout-btn');
        if(checkoutBtn){
            checkoutBtn.addEventListener('click', ()=>{
                const currentCart = getCart();
                if(currentCart.length===0){ alert('Cart is empty'); return; }
                let msg = 'Order: ';
                currentCart.forEach(it => { msg += `${it.name} x${it.qty} (${it.price}৳), `; });
                msg += `Total: ${total}৳`;
                window.open(`https://wa.me/8801778095805?text=${encodeURIComponent(msg)}`, '_blank');
            });
        }
    };
    renderCart();
    updateCartCount();
}

/* ============ ADMIN PAGE LOGIC (upload/edit/delete) ============= */
async function initAdminPage(){
  const loginForm = $('#login-form');
  const loginEmail = $('#login-email');
  const loginPassword = $('#login-password');
  const adminSection = $('#admin-panel-section');
  const loginSection = $('#admin-login-section');
  const signoutBtn = $('#btn-signout');

  const productForm = $('#product-form');
  const productsList = $('#admin-products-list');
  const clearBtn = $('#btn-clear-form');

  // 🔹 Register form elements (new)
  const showRegisterBtn = $('#show-register-btn');
  const registerForm = $('#register-form');
  const cancelRegisterBtn = $('#cancel-register-btn');

  // Optional: set a secret code to prevent open registration (leave '' to allow)
  const REGISTER_SECRET = "ILMORA_ADMIN_2025"; // <-- যদি চান সিক্রেট লাগান

  if(showRegisterBtn){
    showRegisterBtn.addEventListener('click', ()=>{
      if(registerForm) registerForm.style.display = 'block';
      showRegisterBtn.style.display = 'none';
      // scroll into view
      setTimeout(()=> { if(registerForm) registerForm.scrollIntoView({behavior:'smooth', block:'center'}); }, 120);
    });
  }
  if(cancelRegisterBtn){
    cancelRegisterBtn.addEventListener('click', ()=>{
      if(registerForm) registerForm.style.display = 'none';
      if(showRegisterBtn) showRegisterBtn.style.display = 'inline-block';
      if(registerForm) registerForm.reset();
    });
  }
  if(registerForm){
    registerForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = $('#reg-email').value.trim();
      const pass = $('#reg-password').value;
      const secret = $('#reg-secret').value.trim();
      if(REGISTER_SECRET && secret !== REGISTER_SECRET){
        alert('সিক্রেট কোড ভুল।');
        return;
      }
      try{
        await auth.createUserWithEmailAndPassword(email, pass);
        alert('রেজিস্ট্রেশন সফল এবং স্বয়ংক্রিয়ভাবে লগইন হয়েছে।');
        registerForm.reset();
        if(registerForm) registerForm.style.display='none';
        if(showRegisterBtn) showRegisterBtn.style.display='none';
      }catch(err){
        console.error(err);
        if(err && err.code === 'auth/email-already-in-use'){
          alert('এই ইমেইল ইতোমধ্যেই আছে। লগইন করুন।');
        } else if(err && err.code === 'auth/weak-password'){
          alert('পাসওয়ার্ড দুর্বল (6+ অক্ষর লাগবে)।');
        } else {
          alert('রেজিস্ট্রেশন সমস্যা: ' + (err.message || err.code || 'Unknown error'));
        }
      }
    });
  }

  // Auth state
  auth.onAuthStateChanged(user=>{
    if(user){
      // show admin UI
      if(loginSection) loginSection.style.display = 'none';
      if(adminSection) adminSection.style.display = 'block';
      if(signoutBtn) signoutBtn.style.display = 'inline-block';
      loadAdminProducts();
    } else {
      if(loginSection) loginSection.style.display = 'block';
      if(adminSection) adminSection.style.display = 'none';
      if(signoutBtn) signoutBtn.style.display = 'none';
    }
  });

  // login submit
  if(loginForm){
    loginForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const email = loginEmail.value.trim();
      const pass = loginPassword.value;
      try{
        await auth.signInWithEmailAndPassword(email, pass);
        alert('লগইন সফল');
        loginForm.reset();
      }catch(err){
        console.error(err);
        alert('লগইন সমস্যা: ' + (err.message || err.code || 'Unknown error'));
      }
    });
  }

  // signout
  if(signoutBtn) signoutBtn.addEventListener('click', ()=> auth.signOut());

  // product add
  if(productForm){
    productForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const name = $('#p-name').value.trim();
      const price = $('#p-price').value.trim();
      const sku = $('#p-sku').value.trim();
      const category = $('#p-category').value.trim();
      const desc = $('#p-desc').value.trim();
      const fileEl = $('#p-image');
      if(!name || !price){
        alert('প্রোডাক্ট নাম ও মূল্য দিন');
        return;
      }
      let imageUrl = '';
      if(fileEl && fileEl.files && fileEl.files[0]){
        try{
          imageUrl = await uploadToCloudinary(fileEl.files[0]);
        }catch(err){
          console.error(err);
          alert('ছবি আপলোডে সমস্যা: ' + err.message);
          return;
        }
      } else {
        // optional: default placeholder
        imageUrl = 'https://via.placeholder.com/600x400?text=No+Image';
      }

      try{
        await db.collection('products').add({
          product_name: name,
          price: price,
          sku: sku,
          category: category,
          description: desc,
          imageUrl: imageUrl,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert('Product saved');
        productForm.reset();
        loadAdminProducts();
      }catch(err){
        console.error(err);
        alert('Save error: ' + err.message);
      }
    });
  }

  // clear form
  if(clearBtn) clearBtn.addEventListener('click', ()=> productForm.reset());

  // load products in admin
  async function loadAdminProducts(){
    if(!productsList) return;
    productsList.innerHTML = '<div>Loading...</div>';
    try{
      const snap = await db.collection('products').orderBy('createdAt','desc').get();
      if(snap.empty){ productsList.innerHTML = '<div>No products yet.</div>'; return; }
      const html = snap.docs.map(doc=>{
        const d = doc.data();
        return `<div class="admin-product-row" data-id="${doc.id}">
          <img src="${escapeHtml(d.imageUrl||'')}" alt="${escapeHtml(d.product_name||'')}">
          <div style="flex:1">
            <div><strong>${escapeHtml(d.product_name||'')}</strong></div>
            <div class="small">${escapeHtml(d.price||'')}৳ - ${escapeHtml(d.sku||'')}</div>
            <div class="small">${escapeHtml(d.category||'')}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button class="btn admin-edit" data-id="${doc.id}">Edit</button>
            <button class="btn alt admin-delete" data-id="${doc.id}">Delete</button>
          </div>
        </div>`;
      }).join('');
      productsList.innerHTML = html;

      // bind edit/delete
      $$('.admin-delete', productsList).forEach(b=>{
        b.addEventListener('click', async ()=>{
          if(!confirm('Are you sure to delete?')) return;
          const id = b.dataset.id;
          try{
            await db.collection('products').doc(id).delete();
            alert('Deleted');
            loadAdminProducts();
          }catch(err){ console.error(err); alert('Delete error: '+err.message); }
        });
      });

      $$('.admin-edit', productsList).forEach(b=>{
        b.addEventListener('click', async ()=>{
          const id = b.dataset.id;
          const doc = await db.collection('products').doc(id).get();
          if(!doc.exists){ alert('Not found'); return; }
          const d = doc.data();
          // populate form for editing
          $('#p-name').value = d.product_name || '';
          $('#p-price').value = d.price || '';
          $('#p-sku').value = d.sku || '';
          $('#p-category').value = d.category || '';
          $('#p-desc').value = d.description || '';
          // if wants to update image: select file and submit will upload and replace
          // On update, we will call update path
          // Replace submit handler to update instead of add (simple approach: delete then re-add)
          if(confirm('Do you want to update this product? Press OK then submit the form to save changes (you can change image).')){
            // temporary store doc id in form
            productForm.dataset.editId = id;
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });

      // modify submit handler to support edit mode
      // Remove any previous custom handler if exists
      try{ productForm.removeEventListener('submit', productForm.__submitHandler); }catch(e){}
      const submitHandler = async function(e){
        e.preventDefault();
        const editId = productForm.dataset.editId;
        const name = $('#p-name').value.trim();
        const price = $('#p-price').value.trim();
        const sku = $('#p-sku').value.trim();
        const category = $('#p-category').value.trim();
        const desc = $('#p-desc').value.trim();
        const fileEl = $('#p-image');

        let imageUrl = '';
        if(fileEl && fileEl.files && fileEl.files[0]){
          try{ imageUrl = await uploadToCloudinary(fileEl.files[0]); }catch(err){ alert('Upload failed'); return; }
        }

        try{
          if(editId){
            // update doc
            const toUpdate = { product_name: name, price, sku, category, description: desc };
            if(imageUrl) toUpdate.imageUrl = imageUrl;
            await db.collection('products').doc(editId).update(toUpdate);
            alert('Updated');
            delete productForm.dataset.editId;
          } else {
            // add new
            if(!imageUrl) imageUrl = 'https://via.placeholder.com/600x400?text=No+Image';
            await db.collection('products').add({
              product_name: name, price, sku, category, description: desc, imageUrl,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert('Saved');
          }
          productForm.reset();
          loadAdminProducts();
        }catch(err){ console.error(err); alert('Save error: '+err.message); }
      };
      productForm.addEventListener('submit', submitHandler);
      productForm.__submitHandler = submitHandler;

    }catch(err){
      console.error(err);
      productsList.innerHTML = '<div>Error loading products. See console.</div>';
    }
  }
}

/* ============ Init based on page ============= */
document.addEventListener('DOMContentLoaded', ()=>{
  if(page === 'index') initIndexPage();
  if(page === 'admin') initAdminPage();
  if(page === 'product-details') initProductDetailsPage();
  if(page === 'cart') initCartPage();
});