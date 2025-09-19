// আপনার Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBUpr0ZmggaDukSVIoXeckeTVy09bK6_0s",
  authDomain: "my-shop-app-15b82.firebaseapp.com",
  projectId: "my-shop-app-15b82",
  storageBucket: "my-shop-app-15b82.firebasestorage.app",
  messagingSenderId: "343254203665",
  appId: "1:343254203665:web:ebeaa0c96837384a8ba0b0"
};

// Firebase SDK ইম্পোর্ট করা
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase এবং Firestore initialize করা
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// আপনার Cloudinary তথ্য
const CLOUDINARY_CLOUD_NAME = "durtzerpq";
const CLOUDINARY_UPLOAD_PRESET = "product_images";

// ফ্রন্ট-এন্ড (index.html) এর জন্য কোড
document.addEventListener('DOMContentLoaded', () => {
    const productGrid = document.getElementById('product-grid');
    const categoryItems = document.querySelectorAll('.category-item');

    async function fetchProducts(category = 'all') {
        productGrid.innerHTML = '<h2>Loading products...</h2>';
        
        let productsRef = collection(db, "products");
        let q;

        if (category === 'all') {
            q = productsRef;
        } else {
            q = query(productsRef, where("category", "==", category));
        }

        try {
            const querySnapshot = await getDocs(q);
            productGrid.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                const productCard = document.createElement('div');
                productCard.classList.add('product-card');
                productCard.innerHTML = `
                    <div class="product-image">
                        <img src="${product.imageUrl}" alt="${product.name}">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">৳${product.price}</p>
                        <button class="order-btn">অর্ডার করুন</button>
                    </div>
                `;
                productGrid.appendChild(productCard);
            });
        } catch (e) {
            console.error("Error fetching documents: ", e);
            productGrid.innerHTML = '<h2>Failed to load products.</h2>';
        }
    }

    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const category = item.getAttribute('data-category');
            fetchProducts(category);
        });
    });

    fetchProducts();
});

// অ্যাডমিন প্যানেল (admin.html) এর জন্য কোড
if (document.getElementById('product-upload-form')) {
    const productUploadForm = document.getElementById('product-upload-form');

    productUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const productName = document.getElementById('productName').value;
        const productPrice = document.getElementById('productPrice').value;
        const productDescription = document.getElementById('productDescription').value;
        const productImageFile = document.getElementById('productImage').files[0];
        const productCategory = document.getElementById('productCategory').value;

        // বাটনের টেক্সট পরিবর্তন করা
        const submitBtn = productUploadForm.querySelector('button');
        submitBtn.textContent = 'আপলোড হচ্ছে...';
        submitBtn.disabled = true;

        try {
            // Cloudinary-তে ছবি আপলোড করা
            const formData = new FormData();
            formData.append('file', productImageFile);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });

            const cloudinaryData = await cloudinaryResponse.json();
            const imageUrl = cloudinaryData.secure_url;

            // Firebase-এ ডেটা সংরক্ষণ করা
            await addDoc(collection(db, "products"), {
                name: productName,
                price: productPrice,
                description: productDescription,
                imageUrl: imageUrl,
                category: productCategory
            });

            alert("পণ্য সফলভাবে আপলোড হয়েছে!");
            productUploadForm.reset();

        } catch (e) {
            console.error("পণ্য আপলোডে সমস্যা হয়েছে: ", e);
            alert("পণ্য আপলোডে সমস্যা হয়েছে।");
        } finally {
            submitBtn.textContent = 'পণ্য আপলোড করুন';
            submitBtn.disabled = false;
        }
    });
}
