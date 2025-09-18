// আপনার Firebase কনফিগারেশন কী এখানে বসান
// এখান থেকে শুরু
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
// এখানে শেষ

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const productsCollection = db.collection('products');

// DOM Elements
const productsSection = document.getElementById('products-section');
const adminPanel = document.getElementById('admin-panel');
const cartSection = document.getElementById('cart-section');
const adminLoginBtn = document.querySelector('.admin-login-btn');
const adminLogoutBtn = document.querySelector('.admin-logout-btn');
const loginForm = document.getElementById('login-form');
const adminDashboard = document.getElementById('admin-dashboard');
const adminLoginContainer = document.getElementById('admin-login-form');
const productForm = document.getElementById('product-form');
const productList = document.getElementById('product-list');
const adminProductList = document.getElementById('admin-product-list');
const cartCountSpan = document.getElementById('cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalSpan = document.getElementById('cart-total');
const submitBtn = document.getElementById('submit-btn');

let cart = [];

// --- Page Navigation and UI Management ---

function showSection(sectionId) {
    const sections = [productsSection, adminPanel, cartSection];
    sections.forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
}

document.querySelector('.view-products-btn').addEventListener('click', () => {
    showSection('products-section');
    loadProducts();
});
adminLoginBtn.addEventListener('click', () => showSection('admin-panel'));
document.querySelector('.cart-btn').addEventListener('click', () => {
    showSection('cart-section');
    renderCart();
});
adminLogoutBtn.addEventListener('click', () => auth.signOut());

// --- Firebase Authentication ---

auth.onAuthStateChanged(user => {
    if (user && user.email === 'admin@example.com') { // Change this to your admin email
        adminLoginBtn.style.display = 'none';
        adminLogoutBtn.style.display = 'inline-block';
        adminLoginContainer.style.display = 'none';
        adminDashboard.style.display = 'block';
        showSection('admin-panel');
        loadAdminProducts();
    } else {
        adminLoginBtn.style.display = 'inline-block';
        adminLogoutBtn.style.display = 'none';
        adminDashboard.style.display = 'none';
        adminLoginContainer.style.display = 'block';
        if (productsSection.style.display !== 'block' && cartSection.style.display !== 'block') {
            showSection('products-section');
        }
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        document.getElementById('login-error-message').textContent = 'লগইন ব্যর্থ হয়েছে।';
    }
});

// --- Firebase Firestore & Storage (Admin Panel) ---

productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = productForm['product-name'].value;
    const price = parseFloat(productForm['product-price'].value);
    const description = productForm['product-description'].value;
    const imageFile = productForm['product-image'].files[0];
    const productId = productForm['product-id'].value;

    if (productId) {
        // Edit existing product
        const productRef = productsCollection.doc(productId);
        const data = { name, price, description };
        if (imageFile) {
            const storageRef = storage.ref(`products/${productId}-${imageFile.name}`);
            await storageRef.put(imageFile);
            data.imageUrl = await storageRef.getDownloadURL();
        }
        await productRef.update(data);
    } else {
        // Add new product
        const newProductRef = productsCollection.doc();
        const storageRef = storage.ref(`products/${newProductRef.id}-${imageFile.name}`);
        await storageRef.put(imageFile);
        const imageUrl = await storageRef.getDownloadURL();
        await newProductRef.set({ name, price, description, imageUrl, id: newProductRef.id });
    }

    productForm.reset();
    submitBtn.textContent = 'পণ্য যোগ করুন';
    loadAdminProducts();
    loadProducts();
});

// Load products for Admin
const loadAdminProducts = () => {
    productsCollection.orderBy('name').onSnapshot(snapshot => {
        adminProductList.innerHTML = '';
        snapshot.docs.forEach(doc => {
            const product = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${product.imageUrl}" alt="${product.name}" class="admin-product-img"></td>
                <td>${product.name}</td>
                <td>${product.price} টাকা</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${product.id}">এডিট</button>
                    <button class="delete-btn" data-id="${product.id}">ডিলিট</button>
                </td>
            `;
            adminProductList.appendChild(tr);
        });
    });
};

// Edit and Delete handlers
adminProductList.addEventListener('click', async (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains('delete-btn')) {
        await productsCollection.doc(id).delete();
    } else if (e.target.classList.contains('edit-btn')) {
        const doc = await productsCollection.doc(id).get();
        const product = doc.data();
        productForm['product-id'].value = product.id;
        productForm['product-name'].value = product.name;
        productForm['product-price'].value = product.price;
        productForm['product-description'].value = product.description;
        productForm['product-image'].required = false;
        submitBtn.textContent = 'পণ্য আপডেট করুন';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// --- Firebase Firestore (User View) ---

const loadProducts = () => {
    productsCollection.orderBy('name').onSnapshot(snapshot => {
        productList.innerHTML = '';
        snapshot.docs.forEach(doc => {
            const product = doc.data();
            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.innerHTML = `
                <img src="${product.imageUrl}" alt="${product.name}">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.price} টাকা</p>
                    <p>${product.description}</p>
                    <button class="add-to-cart-btn" data-id="${product.id}">কার্টে যোগ করুন</button>
                </div>
            `;
            productList.appendChild(productCard);
        });
    });
};

// Load products initially
loadProducts();

// --- Cart System ---

productList.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const id = e.target.dataset.id;
        addToCart(id);
    }
});

const addToCart = async (id) => {
    const doc = await productsCollection.doc(id).get();
    const product = doc.data();
    
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    updateCartUI();
};

const renderCart = () => {
    cartItemsContainer.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>আপনার কার্ট খালি।</p>';
    } else {
        cart.forEach(item => {
            total += item.price * item.quantity;
            const cartItemEl = document.createElement('div');
            cartItemEl.classList.add('cart-item');
            cartItemEl.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>${item.price} টাকা x ${item.quantity}</p>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        });
    }
    cartTotalSpan.textContent = total;
};

const updateCartUI = () => {
    cartCountSpan.textContent = cart.length;
    renderCart();
};

document.getElementById('checkout-btn').addEventListener('click', () => {
    alert('চেকআউট সফল হয়েছে! ধন্যবাদ।');
    cart = [];
    updateCartUI();
    showSection('products-section');
});
