document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const productGrid = document.getElementById('product-grid');
    const productDetailModal = document.getElementById('product-detail-modal');
    const productDetailContent = document.getElementById('product-detail-content');
    const relatedProductsGrid = document.getElementById('related-products-grid');
    const closeModalBtn = document.querySelector('.close-btn');
    const orderModal = document.getElementById('order-modal');
    const closeOrderModalBtn = document.querySelector('.order-close-btn');
    const orderForm = document.getElementById('order-form');
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');

    let products = []; // To store all product data

    // CSV File URL from Google Sheets
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRPm-h3hnXGp1r7HBXl6qam4_s8v1SNKnp0Xwa-VdrxJXRRaQihnxKl51fIGuLF6I4VLhGRZ0cHAv9/pub?gid=0&single=true&output=csv';

    // --- Data Fetching and Display ---

    // Fetch product data from Google Sheets CSV
    function fetchProducts() {
        Papa.parse(csvUrl, {
            download: true,
            header: true,
            complete: (results) => {
                products = results.data;
                displayProducts(products);
            },
            error: (err) => {
                console.error("Error fetching or parsing CSV data:", err);
                productGrid.innerHTML = '<p>দুঃখিত, পণ্য লোড করা সম্ভব হচ্ছে না।</p>';
            }
        });
    }

    // Display products on the homepage
    function displayProducts(productsToDisplay, container = productGrid) {
        container.innerHTML = ''; // Clear previous content
        productsToDisplay.forEach((product, index) => {
            if (!product.product_name) return; // Skip empty rows

            const isOutOfStock = product.stock_status === 'Out of Stock';
            
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.index = products.findIndex(p => p.product_name === product.product_name); // Use original index

            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image_url}" alt="${product.product_name}">
                    ${isOutOfStock ? '<div class="stock-status">Out of stock</div>' : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.product_name}</h3>
                    <p class="product-price">${product.price} ৳</p>
                    <button class="order-btn" ${isOutOfStock ? 'disabled' : ''}>অর্ডার করুন</button>
                </div>
            `;
            
            // Event listener for showing product details
            productCard.querySelector('.product-image').addEventListener('click', () => showProductDetail(product.product_name));
            productCard.querySelector('.product-name').addEventListener('click', () => showProductDetail(product.product_name));

            // Event listener for the order button
            const orderBtn = productCard.querySelector('.order-btn');
            if (orderBtn) {
                orderBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent modal from opening
                    openOrderModal(product.product_name);
                });
            }

            container.appendChild(productCard);
        });
    }

    // --- Modal Functionality ---

    // Show product detail modal
    function showProductDetail(productName) {
        const product = products.find(p => p.product_name === productName);
        if (!product) return;
        
        productDetailContent.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.image_url}" alt="${product.product_name}">
                </div>
                <div class="product-detail-info">
                    <h2>${product.product_name}</h2>
                    <p class="product-price">${product.price} ৳</p>
                    <p class="product-description">${product.description}</p>
                </div>
            </div>
        `;

        displayRelatedProducts(product.category, product.product_name);
        productDetailModal.style.display = 'block';
    }
    
    // Display related products in the detail modal
    function displayRelatedProducts(category, currentProductName) {
        const related = products.filter(p => p.category === category && p.product_name !== currentProductName);
        displayProducts(related, relatedProductsGrid);
    }
    
    // Open the order form modal and set the product name
    function openOrderModal(productName) {
        document.getElementById('product-name-input').value = productName;
        orderModal.style.display = 'block';
    }

    // Close modals
    closeModalBtn.onclick = () => productDetailModal.style.display = 'none';
    closeOrderModalBtn.onclick = () => orderModal.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target == productDetailModal) {
            productDetailModal.style.display = 'none';
        }
        if (event.target == orderModal) {
            orderModal.style.display = 'none';
        }
    };
    
    // --- Order Form Submission ---

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const productName = document.getElementById('product-name-input').value;
        const customerName = document.getElementById('customer-name').value;
        const customerAddress = document.getElementById('customer-address').value;
        const customerMobile = document.getElementById('customer-mobile').value;

        // WhatsApp Details
        const whatsappNumber = '01778095805';
        
        // Construct the message
        const message = `নমস্কার, আমি এই পণ্যটি অর্ডার করতে চাই।\nপ্রোডাক্ট: ${productName}\nনাম: ${customerName}\nঠিকানা: ${customerAddress}\nমোবাইল: ${customerMobile}`;
        
        // Encode the message for a URL
        const encodedMessage = encodeURIComponent(message);
        
        // Create the WhatsApp URL
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
        
        // Open WhatsApp in a new tab
        window.open(whatsappUrl, '_blank');

        // Reset and close the form
        orderForm.reset();
        orderModal.style.display = 'none';
    });

    // --- Mobile Navigation ---
    menuBtn.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });

    // --- Initial Load ---
    fetchProducts();
});