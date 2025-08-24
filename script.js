document.addEventListener('DOMContentLoaded', () => {

    // ----------------------------------------------------------------------------------
    // গুরুত্বপূর্ণ: এখানে আপনার গুগল শিট CSV ফাইলের লিঙ্কটি বসাতে হবে।
    // কিভাবে লিঙ্ক তৈরি করবেন তা নিচের নির্দেশিকায় বলা আছে।
    // ----------------------------------------------------------------------------------
    const GOOGLE_SHEET_CSV_URL = 'YOUR_GOOGLE_SHEET_CSV_LINK_HERE';

    // প্রয়োজনীয় HTML এলিমেন্টগুলো সিলেক্ট করা
    const productGrid = document.getElementById('product-grid');
    const detailModal = document.getElementById('product-detail-modal');
    const orderModal = document.getElementById('order-modal');
    const detailContent = document.getElementById('product-detail-content');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    const closeBtns = document.querySelectorAll('.close-btn');
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');
    const orderForm = document.getElementById('order-form');

    let allProducts = []; // সব প্রোডাক্ট এখানে স্টোর করা হবে

    // গুগল শিট থেকে প্রোডাক্ট লোড করার ফাংশন
    function loadProducts() {
        // প্রোডাক্ট গ্রিডে লোডিং মেসেজ দেখানো
        productGrid.innerHTML = '<p>প্রোডাক্ট লোড হচ্ছে...</p>';

        Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: true,
            complete: (results) => {
                // যে সকল প্রোডাক্টের ID আছে শুধু সেগুলোই নেওয়া হবে
                allProducts = results.data.filter(p => p.id && p.id.trim() !== '');
                if(allProducts.length > 0) {
                    displayProducts(allProducts);
                } else {
                    productGrid.innerHTML = '<p>কোনো প্রোডাক্ট পাওয়া যায়নি। আপনার গুগল শিটটি চেক করুন।</p>';
                }
            },
            error: (err) => {
                console.error("CSV ফাইল লোড করতে সমস্যা হয়েছে:", err);
                productGrid.innerHTML = `<p>প্রোডাক্ট লোড করা যায়নি। অনুগ্রহ করে আপনার গুগল শিট CSV লিঙ্কটি সঠিক কি না তা চেক করুন।</p>`;
            }
        });
    }

    // ওয়েবসাইটে প্রোডাক্ট দেখানোর ফাংশন
    function displayProducts(products, gridElement = productGrid) {
        gridElement.innerHTML = ''; // আগের প্রোডাক্ট মুছে ফেলা
        products.forEach(product => {
            if (!product.name || !product.imageUrl) return; // নাম বা ছবি না থাকলে বাদ দেওয়া

            const isOutOfStock = product.stockStatus && product.stockStatus.toLowerCase() === 'out of stock';

            const productCardHTML = `
                <div class="product-card" data-id="${product.id}">
                    <div class="product-image">
                        <img src="${product.imageUrl}" alt="${product.name}">
                        ${isOutOfStock ? '<span class="stock-status">Out of Stock</span>' : ''}
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">৳ ${product.price}</p>
                        <button class="order-btn" data-product-name="${product.name}" ${isOutOfStock ? 'disabled' : ''}>
                            ${isOutOfStock ? 'Out of Stock' : 'অর্ডার করুন'}
                        </button>
                    </div>
                </div>
            `;
            gridElement.innerHTML += productCardHTML;
        });
        addCardEventListeners(); // ইভেন্ট যুক্ত করা
    }
    
    // প্রতিটি প্রোডাক্ট কার্ডে ক্লিক ইভেন্ট যুক্ত করা
    function addCardEventListeners() {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // অর্ডার বাটনে ক্লিক করলে যেন ডিটেইলস পপআপ না আসে
                if (!e.target.classList.contains('order-btn')) {
                    const productId = card.dataset.id;
                    showProductDetail(productId);
                }
            });
        });

        document.querySelectorAll('.order-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                if (!button.disabled) {
                    const productName = e.target.dataset.productName;
                    openOrderModal(productName);
                }
            });
        });
    }

    // প্রোডাক্টের বিস্তারিত তথ্য মডালে দেখানো
    function showProductDetail(productId) {
        const product = allProducts.find(p => p.id == productId);
        if (!product) return;
        
        const isOutOfStock = product.stockStatus && product.stockStatus.toLowerCase() === 'out of stock';

        detailContent.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.imageUrl}" alt="${product.name}">
                </div>
                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <p class="product-price">৳ ${product.price}</p>
                    <p class="product-description">${product.description || 'এই প্রোডাক্টের কোনো বিবরণ নেই।'}</p>
                     <button class="order-btn" data-product-name="${product.name}" ${isOutOfStock ? 'disabled' : ''}>
                        ${isOutOfStock ? 'Out of Stock' : 'অর্ডার করুন'}
                    </button>
                </div>
            </div>
        `;
        
        // একই ক্যাটাগরির অন্যান্য প্রোডাক্ট দেখানো
        const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
        displayProducts(relatedProducts, relatedProductsGrid);

        detailModal.style.display = 'block';

        // মডালের অর্ডার বাটনে ইভেন্ট যুক্ত করা
        detailContent.querySelector('.order-btn').addEventListener('click', (e) => {
            if(!e.target.disabled){
                const productName = e.target.dataset.productName;
                openOrderModal(productName);
            }
        });
    }
    
    // অর্ডার করার মডাল খোলা
    function openOrderModal(productName) {
        document.getElementById('product-name-input').value = productName;
        orderModal.style.display = 'block';
    }

    // অর্ডার ফর্ম সাবমিট হলে হোয়াটসঅ্যাপে মেসেজ পাঠানো
    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productName = document.getElementById('product-name-input').value;
        const customerName = document.getElementById('customer-name').value;
        const customerAddress = document.getElementById('customer-address').value;
        const customerMobile = document.getElementById('customer-mobile').value;

        // আপনার হোয়াটসঅ্যাপ নম্বর (footer থেকেও নেওয়া যায়)
        const yourWhatsAppNumber = '8801778095805'; 

        const message = `
Hello Ilmora Fashion,
I would like to place an order:
--------------------
Product: ${productName}
Name: ${customerName}
Address: ${customerAddress}
Mobile: ${customerMobile}
--------------------
        `;

        const whatsappURL = `https://wa.me/${yourWhatsAppNumber}?text=${encodeURIComponent(message.trim())}`;
        
        window.open(whatsappURL, '_blank'); // নতুন ট্যাবে হোয়াটসঅ্যাপ খুলবে
        
        orderForm.reset();
        orderModal.style.display = 'none';
    });
    
    // মোবাইল মেনু (হ্যামবার্গার) বাটন
    menuBtn.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

    // মডাল বন্ধ করার ফাংশন
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            detailModal.style.display = 'none';
            orderModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target == detailModal) {
            detailModal.style.display = 'none';
        }
        if (e.target == orderModal) {
            orderModal.style.display = 'none';
        }
    });

    // ওয়েবসাইট লোড হওয়ার সাথে সাথে প্রোডাক্ট লোড শুরু করা
    loadProducts();
});