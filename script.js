// Function to handle the navigation menu toggle on mobile
document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.querySelector('.menu-btn');
    const navbar = document.querySelector('.navbar');

    menuBtn.addEventListener('click', () => {
        navbar.classList.toggle('active');
    });
});

// Main JavaScript for handling products, modals, and cart functionality
document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRDl-cw7a6X_kIJh_e6Q_lIllD9_9R_IXPnCCs3HCGMhTHD9OG67rqKT2NGiHmY7hsSyeZ9sM6urutp/pub?gid=0&single=true&output=csv';
    const GITHUB_IMAGE_BASE_URL = 'https://ilmorafashionbd-ux.github.io/My-Shop-/images/';

    let allProducts = [];
    let cart = [];
    let currentProduct = null;
    let currentVariant = null;

    // Selectors
    const productGrid = document.getElementById('product-grid');
    const productDetailModal = document.getElementById('product-detail-modal');
    const productModalCloseBtn = document.getElementById('product-modal-close');
    const orderModal = document.getElementById('order-modal');
    const orderForm = document.getElementById('order-form');
    const cartCountTop = document.querySelector('.cart-count');
    const cartCountBottom = document.querySelector('.cart-count-bottom');
    const categoryItems = document.querySelectorAll('.category-item');
    const relatedProductsGrid = document.getElementById('related-products-grid');

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
                    if (allProducts.length > 0) {
                        displayProducts(allProducts);
                    } else {
                        productGrid.innerHTML = '<p>কোনো প্রোডাক্ট পাওয়া যায়নি।</p>';
                    }
                }
            });
        } catch (error) {
            console.error('Failed to fetch products:', error);
        }
    };

    // Display products
    const displayProducts = (productsToDisplay) => {
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

            productCard.addEventListener('click', () => showProductDetail(product));
        });
    };

    // Show product detail (UPDATED)
    const showProductDetail = (product) => {
        currentProduct = product;
        
        const mainImage = document.getElementById('main-product-image');
        const stockBadge = document.querySelector('.stock-status-badge');
        const thumbnailContainer = document.getElementById('thumbnail-images');
        const productNameEl = document.getElementById('product-name');
        const productCategoryEl = document.getElementById('product-category');
        const productSkuEl = document.getElementById('product-sku');
        const discountedPriceEl = document.getElementById('discounted-price');
        const originalPriceEl = document.getElementById('original-price');
        const variantsSection = document.getElementById('variants-section');
        const variantSelector = document.getElementById('product-variant');
        const productDescriptionEl = document.getElementById('product-description');
        const quantityInput = document.getElementById('quantity-selector');

        // Reset state
        originalPriceEl.style.display = 'none';
        variantsSection.style.display = 'none';
        thumbnailContainer.innerHTML = '';
        quantityInput.value = 1;

        // Populate images
        const mainImageUrl = GITHUB_IMAGE_BASE_URL + product.image_url;
        const otherImages = product.other_images ? product.other_images.split(',').map(img => GITHUB_IMAGE_BASE_URL + img.trim()) : [];
        const allImages = [mainImageUrl, ...otherImages];
        mainImage.src = allImages[0];
        
        if (allImages.length > 1) {
            allImages.forEach((img, i) => {
                const thumb = document.createElement('img');
                thumb.classList.add('thumbnail');
                if (i === 0) thumb.classList.add('active');
                thumb.src = img;
                thumb.dataset.imgUrl = img;
                thumbnailContainer.appendChild(thumb);
            });
            thumbnailContainer.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.addEventListener('click', e => {
                    mainImage.src = e.target.dataset.imgUrl;
                    thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    e.target.classList.add('active');
                });
            });
        }
        
        // Populate info
        productNameEl.textContent = product.product_name;
        productCategoryEl.textContent = product.category ? `ক্যাটাগরি: ${product.category}` : '';
        productSkuEl.textContent = product.sku ? `SKU: ${product.sku}` : '';
        productDescriptionEl.textContent = product.description || 'পণ্যের বিবরণ পাওয়া যায়নি।';

        if (product.stock_status && product.stock_status.toLowerCase() === 'out of stock') {
            stockBadge.textContent = 'Out of Stock';
            stockBadge.style.display = 'block';
        } else {
            stockBadge.style.display = 'none';
        }
        
        // Handle prices (discount)
        if (product.discount_price && product.discount_price < product.price) {
            discountedPriceEl.textContent = `${product.discount_price}৳`;
            originalPriceEl.textContent = `${product.price}৳`;
            originalPriceEl.style.display = 'inline-block';
        } else {
            discountedPriceEl.textContent = `${product.price}৳`;
            originalPriceEl.style.display = 'none';
        }
        
        // Handle variants
        if (product.variants) {
            variantsSection.style.display = 'block';
            const variants = product.variants.split(',').map(v => v.trim());
            variantSelector.innerHTML = variants.map(v => `<option value="${v}">${v}</option>`).join('');
            currentVariant = variants[0];
            variantSelector.addEventListener('change', (e) => {
                currentVariant = e.target.value;
            });
        } else {
            variantsSection.style.display = 'none';
            currentVariant = null;
        }
        
        // Handle quantity buttons
        const decreaseBtn = document.getElementById('decrease-quantity');
        const increaseBtn = document.getElementById('increase-quantity');
        
        decreaseBtn.addEventListener('click', () => {
            let currentQuantity = parseInt(quantityInput.value);
            if (currentQuantity > 1) {
                quantityInput.value = currentQuantity - 1;
            }
        });

        increaseBtn.addEventListener('click', () => {
            let currentQuantity = parseInt(quantityInput.value);
            quantityInput.value = currentQuantity + 1;
        });

        // Action buttons
        document.getElementById('whatsapp-order-btn').onclick = () => {
            const quantity = quantityInput.value;
            const variantText = currentVariant ? `\nভ্যারিয়েন্ট: ${currentVariant}` : '';
            const message = `🛒 নতুন অর্ডার!\n\nপণ্যের নাম: ${product.product_name}${variantText}\nপরিমাণ: ${quantity}\nমূল্য: ${discountedPriceEl.textContent}\nলিংক: ${window.location.href}`;
            window.open(`https://wa.me/8801778095805?text=${encodeURIComponent(message)}`, '_blank');
        };
        
        document.getElementById('messenger-order-btn').onclick = () => {
            const quantity = quantityInput.value;
            const variantText = currentVariant ? `\nভ্যারিয়েন্ট: ${currentVariant}` : '';
            const message = `🛒 নতুন অর্ডার!\n\nপণ্যের নাম: ${product.product_name}${variantText}\nপরিমাণ: ${quantity}\nমূল্য: ${discountedPriceEl.textContent}\nলিংক: ${window.location.href}`;
            window.open(`https://www.facebook.com/messages/t/61578353266944?text=${encodeURIComponent(message)}`, '_blank');
        };

        productDetailModal.style.display = 'block';
        document.body.classList.add('modal-open');
        showRelatedProducts(product);
        history.pushState({ modalOpen: true }, '', '#product-' + product.id);
    };

    // Close product modal
    const closeProductDetailModal = () => {
        productDetailModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };

    productModalCloseBtn.addEventListener('click', closeProductDetailModal);

    window.addEventListener('popstate', e => {
        if (!(e.state && e.state.modalOpen)) closeProductDetailModal();
    });

    // Cart
    const addToCart = (product) => {
        const existing = cart.find(p => p.id === product.id);
        if (existing) existing.quantity++;
        else cart.push({...product, quantity:1});
        updateCartCount();
        alert(`${product.product_name} কার্টে যুক্ত হয়েছে`);
    };

    const updateCartCount = () => {
        const total = cart.reduce((s, i) => s + i.quantity, 0);
        cartCountTop.textContent = total;
        cartCountBottom.textContent = total;
    };

    // Order form
    const showOrderForm = (product) => {
        document.getElementById('product-name-input').value = product.product_name;
        document.getElementById('product-id-input').value = product.id;
        orderModal.style.display = 'block';
        document.body.classList.add('modal-open');
    };

    document.getElementById('order-modal-close').addEventListener('click', () => {
        orderModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    });

    orderForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('customer-name').value;
        const address = document.getElementById('customer-address').value;
        const mobile = document.getElementById('customer-mobile').value;
        const productName = document.getElementById('product-name-input').value;
        const productId = document.getElementById('product-id-input').value;

        const msg = `🛒 নতুন অর্ডার!\nপণ্যের নাম: ${productName}\nID: ${productId}\n\nক্রেতা: ${name}\nঠিকানা: ${address}\nমোবাইল: ${mobile}`;
        window.open(`https://wa.me/8801778095805?text=${encodeURIComponent(msg)}`, '_blank');
        orderModal.style.display = 'none';
    });

    // Related products
    const showRelatedProducts = (product) => {
        relatedProductsGrid.innerHTML = '';
        const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0,4);
        related.forEach(r => {
            const img = GITHUB_IMAGE_BASE_URL + r.image_url;
            const card = document.createElement('div');
            card.classList.add('product-card');
            card.innerHTML = `
                <div class="product-image"><img src="${img}"></div>
                <div class="product-info"><h3>${r.product_name}</h3><div class="product-price">${r.price}৳</div></div>
            `;
            card.addEventListener('click', () => showProductDetail(r));
            relatedProductsGrid.appendChild(card);
        });
    };

    // Category filter
    categoryItems.forEach(item => {
        item.addEventListener('click', () => {
            const cat = item.dataset.category;
            const filtered = cat === 'all' ? allProducts : allProducts.filter(p => p.category && p.category.toLowerCase().replace(/\s/g,'-') === cat);
            displayProducts(filtered);
        });
    });

    // Init
    fetchProducts();
});
