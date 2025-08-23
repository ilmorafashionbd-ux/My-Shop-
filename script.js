// CSV ফাইল থেকে ডেটা লোড করার ফাংশন
async function loadProducts() {
    try {
        const response = await fetch("data/products.csv"); // products.csv ফাইল লোড
        const data = await response.text();
        const products = parseCSV(data);

        // Featured Products Grid (index.html এর জন্য)
        const featuredGrid = document.getElementById("featured-products-grid");
        if (featuredGrid) {
            featuredGrid.innerHTML = "";
            products.slice(0, 3).forEach(product => {
                featuredGrid.innerHTML += createProductCard(product);
            });
        }

        // All Products Grid (products.html এর জন্য)
        const productsGrid = document.getElementById("all-products-grid");
        if (productsGrid) {
            productsGrid.innerHTML = "";
            products.forEach(product => {
                productsGrid.innerHTML += createProductCard(product);
            });
        }
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

// CSV পার্স করার ফাংশন
function parseCSV(data) {
    const rows = data.trim().split("\n");
    const headers = rows.shift().split(",");
    return rows.map(row => {
        const values = row.split(",");
        let product = {};
        headers.forEach((header, index) => {
            product[header.trim()] = values[index].trim();
        });
        return product;
    });
}

// প্রোডাক্ট কার্ড তৈরি করার ফাংশন
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-card-content">
                <h3>${product.name}</h3>
                <p>${product.price} ৳</p>
                <a href="product-detail.html?id=${product.id}" class="btn">View Details</a>
            </div>
        </div>
    `;
}

// ডিটেইল পেজ লোড করা
async function loadProductDetail() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    if (!productId) return;

    try {
        const response = await fetch("data/products.csv");
        const data = await response.text();
        const products = parseCSV(data);
        const product = products.find(p => p.id === productId);

        if (product) {
            document.getElementById("product-detail").innerHTML = `
                <div class="product-detail-container">
                    <img src="${product.image}" alt="${product.name}" class="product-detail-image">
                    <div class="product-detail-content">
                        <h1>${product.name}</h1>
                        <p class="price">${product.price} ৳</p>
                        <p class="description">${product.description}</p>
                        <button class="btn">Add to Cart</button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error loading product detail:", error);
    }
}

// পেজ লোড হলে ফাংশন চালু
document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
    loadProductDetail();
});