document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT24LzAo8c_NB4a-jT5hEwIsew-2v_E5X9o3L-lE5UABh_2s8Bv-v0j2Tf_m-F2E3a4_a4a4QzB_c/pub?output=csv';
    const WHATSAPP_NUMBER = '1234567890'; // আপনার WhatsApp নম্বর এখানে দিন

    // --- DOM ELEMENTS ---
    const featuredGrid = document.getElementById('featured-products-grid');
    const allProductsGrid = document.getElementById('all-products-grid');
    
    const detailModal = document.getElementById('product-detail-modal');
    const detailContent = document.getElementById('product-detail-content');
    const relatedGrid = document.getElementById('related-products-grid');
    
    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    
    const closeButtons = document.querySelectorAll('.close-btn');

    let allProducts = [];

    // --- DATA FETCHING ---
    const fetchProducts = () => {
        Papa.parse(GOOGLE_SHEET_URL, {
            download: true,
            header: true,
            complete: (results) => {
                allProducts = results.data.filter(p => p.ProductID && p.Name && p.Price && p.ImageURL);
                displayProducts();
            },
            error: (error) => {
                console.error("Error fetching product data:", error);
                const errorMessage = "<p>Sorry, products could not be loaded at this time. Please try again later.</p>";
                if (featuredGrid) featuredGrid.innerHTML = errorMessage;
                if (allProductsGrid) allProductsGrid.innerHTML = errorMessage;
            }
        });
    };

    // --- PRODUCT DISPLAY ---
    const displayProducts = () => {
        // For index.html (Featured Products)
        if (featuredGrid) {
            renderProductGrid(featuredGrid, allProducts.slice(0, 4)); // Show first 4 products
        }
        // For products.html (All Products)
        if (allProductsGrid) {
            renderProductGrid(allProductsGrid, allProducts);
        }
    };

    const renderProductGrid = (gridElement, productsToDisplay) => {
        if (productsToDisplay.length === 0) {
            gridElement.innerHTML = "<p>No products found.</p>";
            return;
        }
        gridElement.innerHTML = productsToDisplay.map(product => `
            <div class="product-card" data-product-id="${product.ProductID}">
                <img src="${product.ImageURL}" alt="${product.Name}">
                <div class="product-card-content">
                    <h3>${product.Name}</h3>
                    <p>Price: ${product.Price} Tk</p>
                    <button class="btn order-now-btn">Order Now</button>
                </div>
            </div>
        `).join('');
    };

    // --- MODAL HANDLING ---
    const openModal = (modal) => {
        modal.style.display = 'flex';
    };

    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    closeButtons.forEach(btn => {
        btn.onclick = () => {
            closeModal(detailModal);
            closeModal(orderModal);
        };
    });

    window.onclick = (event) => {
        if (event.target === detailModal) closeModal(detailModal);
        if (event.target === orderModal) closeModal(orderModal);
    };

    // --- EVENT LISTENERS ---
    document.body.addEventListener('click', (event) => {
        const card = event.target.closest('.product-card');
        if (card) {
            // If "Order Now" button is clicked, open order modal
            if (event.target.classList.contains('order-now-btn')) {
                const product = findProductById(card.dataset.productId);
                if (product) openOrderModal(product);
            } else { // Otherwise, open detail modal
                const productId = card.dataset.productId;
                openDetailModal(productId);
            }
        }
    });

    // --- PRODUCT DETAIL LOGIC ---
    const findProductById = (id) => allProducts.find(p => p.ProductID === id);

    const openDetailModal = (productId) => {
        const product = findProductById(productId);
        if (!product) return;

        detailContent.innerHTML = `
            <div class="product-detail-layout">
                <div class="product-detail-image">
                    <img src="${product.ImageURL}" alt="${product.Name}">
                </div>
                <div class="product-detail-info">
                    <h1>${product.Name}</h1>
                    <p class="price">Price: ${product.Price} Tk</p>
                    <p class="description">${product.Description || 'No description available.'}</p>
                    <button class="btn order-now-btn-modal">Order Now</button>
                </div>
            </div>`;
        
        // Add event listener for the new "Order Now" button inside the modal
        detailContent.querySelector('.order-now-btn-modal').onclick = () => {
            openOrderModal(product);
        };

        displayRelatedProducts(product.Category, product.ProductID);
        openModal(detailModal);
    };

    const displayRelatedProducts = (category, currentProductId) => {
        const related = allProducts.filter(p => p.Category === category && p.ProductID !== currentProductId).slice(0, 4);
        renderProductGrid(relatedGrid, related);
    };

    // --- ORDER FORM LOGIC ---
    const openOrderModal = (product) => {
        closeModal(detailModal); // Close detail modal if open
        document.getElementById('product-name-input').value = product.Name;
        document.getElementById('product-price-input').value = product.Price;
        openModal(orderModal);
    };

    orderForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const productName = document.getElementById('product-name-input').value;
        const productPrice = document.getElementById('product-price-input').value;
        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;
        const customerAddress = document.getElementById('customer-address').value;

        const message = `
*New Order*
-------------------------
*Product:* ${productName}
*Price:* ${productPrice} Tk
-------------------------
*Customer Name:* ${customerName}
*Address:* ${customerAddress}
*Phone:* ${customerPhone}
        `;

        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

        orderForm.reset();
        closeModal(orderModal);
    });

    // --- INITIALIZE ---
    fetchProducts();
});