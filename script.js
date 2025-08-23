document.addEventListener('DOMContentLoaded', () => {

    const CSV_FILE_PATH = './data/products.csv';  
    const GITHUB_REPO = './images/';  

    const path = window.location.pathname;

    async function fetchData() {
        try {
            const response = await fetch(CSV_FILE_PATH);
            const csvText = await response.text();
            return parseCSV(csvText);
        } catch (error) {
            console.error('Error fetching data:', error);
            return [];
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
        if (lines.length <= 1) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1);

        return data.map(line => {
            const values = line.split(',').map(v => v.trim());
            const product = {};
            headers.forEach((header, i) => {
                product[header] = values[i];
            });
            return product;
        });
    }

    function createProductCard(product) {
        const productCard = document.createElement('a');
        productCard.href = `product-detail.html?name=${encodeURIComponent(product.Name)}`;
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${GITHUB_REPO}${product.ImageFileName}" alt="${product.Name}">
            <div class="product-card-content">
                <h3>${product.Name}</h3>
                <p>${product.Price}</p>
            </div>
        `;
        return productCard;
    }

    // Home Page
    if (path.includes('index.html') || path === '/' || path.endsWith('/My-Shop/')) {
        fetchData().then(products => {
            const featuredProductsGrid = document.getElementById('featured-products-grid');
            if (featuredProductsGrid) {
                const featured = products.slice(0, 3); 
                featured.forEach(product => {
                    featuredProductsGrid.appendChild(createProductCard(product));
                });
            }
        });
    }

    // Products Page
    if (path.includes('products.html')) {
        fetchData().then(products => {
            const allProductsGrid = document.getElementById('all-products-grid');
            if (allProductsGrid) {
                products.forEach(product => {
                    allProductsGrid.appendChild(createProductCard(product));
                });
            }
        });
    }

    // Product Detail Page
    if (path.includes('product-detail.html')) {
        const params = new URLSearchParams(window.location.search);
        const productName = params.get('name');

        if (productName) {
            fetchData().then(products => {
                const product = products.find(p => p.Name === productName);
                if (product) {
                    renderProductDetail(product);
                } else {
                    document.getElementById('product-detail-container').innerHTML = '<p>Product not found.</p>';
                }
            });
        }
    }

    function renderProductDetail(product) {
        const container = document.getElementById('product-detail-container');
        if (!container) return;

        container.innerHTML = `
            <img src="${GITHUB_REPO}${product.ImageFileName}" alt="${product.Name}" class="product-detail-image">
            <div class="product-detail-content">
                <h1>${product.Name}</h1>
                <p class="price">${product.Price}</p>
                <p class="description">${product.Description}</p>
                <button class="btn" id="order-now-btn">Order Now</button>
            </div>
        `;
    }
});