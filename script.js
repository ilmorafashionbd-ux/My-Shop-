// Function to handle the navigation menu toggle on mobile
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');

    if (menuBtn && navbar) {
        menuBtn.addEventListener('click', () => {
            navbar.classList.toggle('active');
        });
    }
});

// Main JavaScript for handling products, modals, and cart functionality
document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = https://raw.githubusercontent.com/ilmorafashionbd-ux/My-Shop-/main/products.csv/Shihab%20-%20Sheet1.csv';
    const GITHUB_IMAGE_BASE_URL = 'https://ilmorafashionbd-ux.github.io/My-Shop-/images/';

    let allProducts = [];
    let cart = [];

    // Selectors
    const productGrid = document.getElementById('product-grid');
    const productDetailContainer = document.getElementById('product-detail-container');
    const productDetailModal = document.getElementById('product-detail-modal');
    const productModalCloseBtn = document.getElementById('product-modal-close');
    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const cartCountTop = document.querySelector('.cart-count');
    const cartCountBottom = document.querySelector('.cart-count-bottom');
    const categoryItems = document.querySelectorAll('.category-item');

    // Check if we're on the product detail page
    const isProductDetailPage = window.location.pathname.includes('product.html');
    
    // Get product ID from URL if on product detail page
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('id');

    // Fetch products from Google Sheet
    const fetchProducts = async () => {
        try {
            const response = await fetch(csvUrl);
            const text = await response.text();
            Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                complete: (results) => {
                    allProducts = results.data.filter(product => product.id);
                    
                    if (isProductDetailPage && productIdFromUrl) {
                        // If on product detail page, show only the specific product
                        const product = allProducts.find(p => p.id == productIdFromUrl);
                        if (product) {
                            showProductDetailPage(product);
                        } else {
                            productDetailContainer.innerHTML = '<p>পণ্যটি পাওয়া যায়নি। <a href="index.html">হোমপেজে ফিরে যান</a></p>';
                        }
                    } else if (productGrid && allProducts.length > 0) {
                        // If on homepage, display all products
                        displayProducts(allProducts);
                    } else if (productGrid) {
                        productGrid.innerHTML = '<p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
                    }
                }
            });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    // Display products on homepage
    const displayProducts = (productsToDisplay) => {
        if (!productGrid) return;
        
        productGrid.innerHTML = '';
        if (productsToDisplay.length === 0) {
            productGrid.innerHTML = '<p>এই ক্যাটাগরিতে কোনো পণ্য নেই।</p>';
            return;
        }

        productsToDisplay.forEach(product => {
            if (!product.id || !product.product_name || !product.price || !product.image_url) return;

            const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
            const isOutOfStock = product.stock_status && product.stock_status.toLowerCase() === 'out of stock';

            const productCard = document.createElement('div');
            productCard.classList.add('product-card');
            productCard.dataset.productId = product.id;

            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${mainImageUrl}" alt="${product.product_name}" 
                        onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=No+Image';">
                    ${isOutOfStock ? `<span class="stock-status">Out of stock</span>` : ''}
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.product_name}</h3>
                    <div class="product-price">${product.price}৳</div>
                </div>
            `;
            productGrid.appendChild(productCard);

            productCard.addEventListener('click', () => {
                // Redirect to product detail page instead of showing modal
                window.location.href = `product.html?id=${product.id}`;
            });
        });
    };

    // Show product detail on its own page
    const showProductDetailPage = (product) => {
        if (!productDetailContainer) return;
        
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];
        
        // Generate variant options if available
        const variants = product.variants ? product.variants.split(',').map(v => v.trim()) : ['500g', '1kg'];
        const variantOptions = variants.map(v => 
            `<div class="variant-option" data-value="${v}">${v}</div>`
        ).join('');
        
        // Generate related products
        const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
        const relatedProductsHTML = relatedProducts.map(p => {
            const imgUrl = GITHUB_IMAGE_BASE_URL + p.image_url;
            return `
                <div class="product-card" data-product-id="${p.id}">
                    <div class="product-image">
                        <img src="${imgUrl}" alt="${p.product_name}" 
                            onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=No+Image';">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${p.product_name}</h3>
                        <div class="product-price">${p.price}৳</div>
                    </div>
                </div>
            `;
        }).join('');

        productDetailContainer.innerHTML = `
            <div class="product-detail-premium">
                <div class="product-detail-images">
                    <img id="main-product-image" class="main-image" src="${allImages[0]}" alt="${product.product_name}">
                    ${allImages.length > 1 ? `
                        <div class="thumbnail-images">
                            ${allImages.map((img, i) => `<img class="thumbnail ${i===0?'active':''}" src="${img}" data-img-url="${img}">`).join('')}
                        </div>` : ''}
                </div>
                
                <div class="product-detail-info">
                    <h2 class="product-title">${product.product_name}</h2>
                    
                    <div class="product-meta">
                        <div class="meta-item">
                            <strong>SKU:</strong> <span>${product.sku || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Category:</strong> <span>${product.category || 'N/A'}</span>
                        </div>
                        <div class="meta-item">
                            <strong>Status:</strong> 
                            <span class="${product.stock_status === 'In Stock' ? 'in-stock' : 'out-of-stock'}">
                                ${product.stock_status || 'In Stock'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="product-price-section">
                        <div class="price-main">${product.price}৳</div>
                        ${product.price_range ? `<div class="price-range">${product.price_range}</div>` : ''}
                    </div>
                    
                    <div class="variant-selector">
                        <label class="variant-label">Weight / Variant:</label>
                        <div class="variant-options">
                            ${variantOptions}
                        </div>
                    </div>
                    
                    <div class="quantity-selector">
                        <span class="quantity-label">Quantity:</span>
                        <div class="quantity-controls">
                            <button class="quantity-btn minus">-</button>
                            <input type="number" class="quantity-input" value="1" min="1">
                            <button class="quantity-btn plus">+</button>
                        </div>
                    </div>
                    
                    <div class="order-buttons">
                        <button class="whatsapp-order-btn" id="whatsapp-order-btn">
                            <i class="fab fa-whatsapp"></i> WhatsApp Order
                        </button>
                        <button class="messenger-order-btn" id="messenger-order-btn">
                            <i class="fab fa-facebook-messenger"></i> Messenger Order
                        </button>
                    </div>
                    
                    <div class="product-description">
                        <h3 class="description-title">Product Description</h3>
                        <div class="description-content">
                            ${product.description || 'বিবরণ পাওয়া যায়নি।'}
                        </div>
                    </div>
                </div>
                
                ${relatedProducts.length > 0 ? `
                <div class="related-products">
                    <h3 class="related-title">Related Products</h3>
                    <div class="related-grid">
                        ${relatedProductsHTML}
                    </div>
                </div>
                ` : ''}
                
                <div style="text-align: center; margin-top: 30px;">
                    <a href="index.html" class="order-btn" style="display: inline-block; width: auto; padding: 10px 20px;">
                        <i class="fas fa-arrow-left"></i> সকল পণ্য দেখুন
                    </a>
                </div>
            </div>
        `;
        
        // Thumbnails functionality
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.addEventListener('click', e => {
                document.getElementById('main-product-image').src = e.target.dataset.imgUrl;
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Variant selection
        const variantOptionsEl = document.querySelectorAll('.variant-option');
        if (variantOptionsEl.length > 0) {
            variantOptionsEl[0].classList.add('selected');
            
            variantOptionsEl.forEach(option => {
                option.addEventListener('click', () => {
                    variantOptionsEl.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                });
            });
        }

        // Quantity controls
        const quantityInput = document.querySelector('.quantity-input');
        document.querySelector('.quantity-btn.plus').addEventListener('click', () => {
            quantityInput.value = parseInt(quantityInput.value) + 1;
        });
        
        document.querySelector('.quantity-btn.minus').addEventListener('click', () => {
            if (parseInt(quantityInput.value) > 1) {
                quantityInput.value = parseInt(quantityInput.value) - 1;
            }
        });

        // WhatsApp order button
        document.querySelector('#whatsapp-order-btn').addEventListener('click', () => {
            const selectedVariant = document.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = quantityInput.value;
            showOrderForm(product, selectedVariant, quantity);
        });

        // Messenger order button
        document.querySelector('#messenger-order-btn').addEventListener('click', () => {
            const selectedVariant = document.querySelector('.variant-option.selected')?.dataset.value || '';
            const quantity = quantityInput.value;
            const productNameWithVariant = `${product.product_name} ${selectedVariant}`;
            
            // Open Facebook Messenger with pre-filled message
            const msg = `I want to order: ${productNameWithVariant} (Quantity: ${quantity})`;
            window.open(`https://m.me/61578353266944?text=${encodeURIComponent(msg)}`, '_blank');
        });

        // Related products click event
        document.querySelectorAll('.related-grid .product-card').forEach(card => {
            card.addEventListener('click', () => {
                const productId = card.dataset.productId;
                // Redirect to the related product's detail page
                window.location.href = `product.html?id=${productId}`;
            });
        });
    };

    // Show product detail in modal (for homepage)
    const showProductDetailModal = (product) => {
        if (!productDetailModal || !productDetailContainer) return;
        
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];
        
        // Generate variant options if available
        const variants = product.variants ? product.variants.split(',').map(v => v.trim()) : ['500g', '1kg'];
        const variantOptions = variants.map(v => 
            `<div class="variant-option" data-value="${v}">${v}</div>`
        ).join('');
        
        // Generate related products
        const relatedProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
        const relatedProductsHTML = relatedProducts.map(p => {
            const imgUrl = GITHUB_IMAGE_BASE_URL + p.image_url;
            return `
                <div class="product-card" data-product-id="${p.id}">
                    <div class="product-image">
                        <img src="${imgUrl}" alt="${p.product_name}" 
                            onerror="this.onerror=null;this.src='https://placehold.co/400x400?text=No+Image';">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name">${p.product_name}</h3>
                        <div class