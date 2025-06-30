// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBWjUDaD0S0__9BGzRNKNrxpd2Pf5YDGdI",
    authDomain: "billyshop-df152.firebaseapp.com",
    projectId: "billyshop-df152",
    storageBucket: "billyshop-df152.firebasestorage.app",
    messagingSenderId: "623280946542",
    appId: "1:623280946542:web:1d5856a90ca25a00db557f",
    measurementId: "G-MMYKXV18LJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Store products in memory for searching and sorting
let allProducts = [];

// Function to calculate discounted price
function calculateDiscountedPrice(price, discount) {
    return Math.round(price * (1 - discount / 100));
}

// Function to load products from Firebase
async function loadProducts() {
    try {
        // Determine if we are on the products page or the main page
        const isProductsPage = document.getElementById('products-grid') !== null;
        const isMainPage = document.querySelector('.products-container') !== null;
        
        // If we're not on either page, exit
        if (!isProductsPage && !isMainPage) {
            console.log('Not on products or main page');
            return;
        }

        console.log('Fetching products from Firebase...');
        
        // Query products from Firestore
        const productsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(productsQuery);
        
        if (querySnapshot.empty) {
            console.log('No products found in Firestore');
            if (isProductsPage) {
                const productsGrid = document.getElementById('products-grid');
                productsGrid.className = 'products-grid empty-grid';
                productsGrid.style.display = 'block';
                productsGrid.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>منتجات غير متوفرة</p>
                    </div>
                `;
            }
            if (isMainPage) {
                const productsContainer = document.querySelector('.products-container');
                productsContainer.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>منتجات غير متوفرة</p>
                    </div>
                `;
            }
            return;
        }
        
        // Store products in memory for filtering and sorting
        allProducts = [];
        querySnapshot.forEach((doc) => {
            const product = doc.data();
            product.id = doc.id; // Add id to the product object
            allProducts.push(product);
        });
        
        // If we're on the products page, set up search and sort
        if (isProductsPage) {
            // Initial display
            displayProducts();
            
            // Set up event listeners for search and sort
            setupEventListeners();
        }
        
        // If we're on the main page, display featured products
        if (isMainPage) {
            displayFeaturedProducts();
        }
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Display featured products on the main page
function displayFeaturedProducts() {
    const productsContainer = document.querySelector('.products-container');
    if (!productsContainer) return;
    
    // Clear the container
    productsContainer.innerHTML = '';
    
    // Get the first 4 products (or all if less than 4)
    const featuredProducts = allProducts.slice(0, 4);
    
    // Create and append product cards
    featuredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsContainer.appendChild(productCard);
    });
}

// Set up event listeners for search and sort
function setupEventListeners() {
    // Get DOM elements
    const searchInput = document.getElementById('product-search');
    const searchButton = document.getElementById('search-button');
    const sortSelect = document.getElementById('sort-select');
    
    // Search button click event
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            const searchTerm = searchInput ? searchInput.value : '';
            const sortValue = sortSelect ? sortSelect.value : 'default';
            displayProducts(searchTerm, sortValue);
        });
    }
    
    // Enter key in search input
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const sortValue = sortSelect ? sortSelect.value : 'default';
                displayProducts(searchInput.value, sortValue);
            }
        });
    }
    
    // Sort change event
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const searchTerm = searchInput ? searchInput.value : '';
            displayProducts(searchTerm, sortSelect.value);
        });
    }
}

// Display products based on search term and sort option
function displayProducts(searchTerm = '', sortOption = 'default') {
    const productsGrid = document.getElementById('products-grid');
    if (!productsGrid) return;
    
    // Clear previous products
    productsGrid.innerHTML = '';
    
    console.log(`Searching for: "${searchTerm}", Sort: ${sortOption}`);
    
    // Filter products based on search term
    let filteredProducts = [...allProducts];
    
    if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.trim().toLowerCase();
        
        filteredProducts = allProducts.filter(product => 
            (product.name && product.name.toLowerCase().includes(term))
        );
        
        console.log(`Found ${filteredProducts.length} matching products`);
    }
    
    // Sort products
    sortProducts(filteredProducts, sortOption);
    
    // Check if any products match the search
    if (filteredProducts.length === 0) {
        productsGrid.className = 'products-grid empty-grid';
        productsGrid.style.display = 'block';
        productsGrid.innerHTML = `
            <div class="no-products">
                <i class="fas fa-exclamation-circle"></i>
                <p>منتجات غير متوفرة</p>
            </div>
        `;
        return;
    }
    
    // Set grid display
    productsGrid.className = 'products-grid';
    productsGrid.style.display = 'grid';
    
    // Create product cards
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Sort products based on selected option
function sortProducts(products, sortOption) {
    switch (sortOption) {
        case 'price-low':
            products.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            products.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            // Sort by createdAt timestamp if available, otherwise by id
            products.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    return b.createdAt.seconds - a.createdAt.seconds;
                }
                return 0; // Default case
            });
            break;
        // Default case - no sorting or already sorted by createdAt desc
    }
}

// Create product card
function createProductCard(product) {
    const productId = product.id;
    
    // Calculate discounted price if applicable
    const discountedPrice = product.discount ? 
        calculateDiscountedPrice(product.price, product.discount) : 
        product.price;
    
    // Create product card
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.productId = productId;
    
    // Generate HTML for the product card
    const discountBadge = product.discount > 0 
        ? `<div class="product-badge">-${product.discount}%</div>` 
        : '';
        
    productCard.innerHTML = `
        <div class="product-image-container">
            ${discountBadge}
            <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
        </div>
        <div class="product-info">
            <h3 class="product-name" style="font-weight: bold;">${product.name}</h3>
            <div class="product-price-container">
                ${product.discount > 0 
                    ? `<span class="original-price">${product.price} دج</span>
                       <span class="discounted-price">${discountedPrice} دج</span>`
                    : `<span class="product-price">${product.price} دج</span>`
                }
            </div>
            <button class="buy-button">اطلب الآن</button>
        </div>
    `;
    
    // Add click event to the entire product card
    productCard.addEventListener('click', (e) => {
        e.preventDefault();
        showProductDetail(productId, product);
    });
    
    // Add separate click handler to buy button to avoid conflicts
    const buyButton = productCard.querySelector('.buy-button');
    buyButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        showProductDetail(productId, product);
    });
    
    return productCard;
}

// Function to show product details
function showProductDetail(productId, product) {
    if (!product) return;
    
    // Set current product
    window.currentProduct = product;
    window.selectedSize = null;
    window.selectedColor = null;
    window.currentQuantity = 1;
    window.currentImageIndex = 0;
    
    // Get elements
    const productDetail = document.getElementById('product-detail');
    const productDetailOverlay = document.getElementById('product-detail-overlay');
    
    // Update product details
    document.querySelector('.product-title').textContent = product.name;
    
    // Set up image gallery
    const detailImage = document.getElementById('detail-image');
    const imageContainer = document.getElementById('image-container');
    const thumbnailsContainer = document.getElementById('product-thumbnails');
    
    // Get all product images
    let productImages = [];
    
    // Check if product has multiple images
    if (product.imageUrls && product.imageUrls.length > 0) {
        productImages = product.imageUrls;
    } else if (product.imageUrl) {
        // Fallback to single image if imageUrls is not available
        productImages = [product.imageUrl];
    }
    
    // Clear existing thumbnails
    thumbnailsContainer.innerHTML = '';
    
    if (productImages.length > 0) {
        // Show loading state
        imageContainer.classList.add('image-loading');
        detailImage.style.opacity = "0";
        
        // Set up initial image
        const mainImage = productImages[0];
        
        // Preload the main image
        const img = new Image();
        img.src = mainImage;
        
        img.onload = function() {
            // Image loaded successfully
            detailImage.src = mainImage;
            detailImage.style.opacity = "1";
            imageContainer.classList.remove('image-loading');
        };
        
        img.onerror = function() {
            // Image failed to load
            console.error("Failed to load product image:", mainImage);
            detailImage.src = "https://via.placeholder.com/400x400?text=Image+Not+Available";
            detailImage.style.opacity = "1";
            imageContainer.classList.remove('image-loading');
        };
        
        // Set initial image src to start loading
        detailImage.src = mainImage;
        
        // Create thumbnails for all images
        productImages.forEach((imageUrl, index) => {
            const thumbnail = document.createElement('img');
            thumbnail.src = imageUrl;
            thumbnail.alt = `${product.name} - Image ${index + 1}`;
            thumbnail.className = 'thumbnail';
            if (index === 0) thumbnail.classList.add('active');
            
            thumbnail.addEventListener('click', () => {
                // Update main image when thumbnail is clicked
                imageContainer.classList.add('image-loading');
                detailImage.style.opacity = "0";
                
                const newImg = new Image();
                newImg.src = imageUrl;
                
                newImg.onload = function() {
                    detailImage.src = imageUrl;
                    detailImage.style.opacity = "1";
                    imageContainer.classList.remove('image-loading');
                    
                    // Update active thumbnail
                    document.querySelectorAll('.thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    thumbnail.classList.add('active');
                    window.currentImageIndex = index;
                };
                
                newImg.onerror = function() {
                    console.error("Failed to load thumbnail image:", imageUrl);
                    detailImage.src = "https://via.placeholder.com/400x400?text=Image+Not+Available";
                    detailImage.style.opacity = "1";
                    imageContainer.classList.remove('image-loading');
                };
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
        
        // Setup navigation buttons
        const prevBtn = document.getElementById('prev-image-btn');
        const nextBtn = document.getElementById('next-image-btn');
        
        // Show/hide navigation buttons based on number of images
        if (productImages.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
            
            prevBtn.onclick = function() {
                navigateImages(-1, productImages);
            };
            
            nextBtn.onclick = function() {
                navigateImages(1, productImages);
            };
        }
    } else {
        console.error("No images available for this product");
        detailImage.src = "https://via.placeholder.com/400x400?text=No+Image+Available";
        
        // Hide navigation
        const prevBtn = document.getElementById('prev-image-btn');
        const nextBtn = document.getElementById('next-image-btn');
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
    
    document.getElementById('product-name-input').value = product.name;
    
    // Set the discounted price in the hidden input field
    const basePrice = product.price;
    const discount = product.discount || 0;
    const discountedPrice = calculateDiscountedPrice(basePrice, discount);
    document.getElementById('product-price-input').value = discountedPrice;
    
    document.getElementById('selected-size-input').value = '';
    document.getElementById('selected-color-input').value = '';
    
    // Update size selection
    const sizeSelection = document.querySelector('.size-selection .spec-tags');
    sizeSelection.innerHTML = '';
    
    if (product.sizes && product.sizes.length > 0) {
        product.sizes.forEach(size => {
            const sizeButton = document.createElement('button');
            sizeButton.className = 'spec-tag';
            sizeButton.textContent = size;
            sizeButton.type = 'button';
            
            sizeButton.addEventListener('click', function() {
                document.querySelectorAll('.size-selection .spec-tag').forEach(btn => 
                    btn.classList.remove('selected'));
                sizeButton.classList.add('selected');
                window.selectedSize = size;
                document.getElementById('selected-size-input').value = size;
            });
            
            sizeSelection.appendChild(sizeButton);
        });
    }
    
    // Update color selection
    const colorSelection = document.querySelector('.color-selection .spec-tags');
    colorSelection.innerHTML = '';
    
    if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
            const colorButton = document.createElement('button');
            colorButton.className = 'spec-tag';
            colorButton.type = 'button';
            colorButton.setAttribute('data-color', color);
            
            // Add color name tooltip
            const colorName = document.createElement('span');
            colorName.className = 'color-name';
            colorName.textContent = color;
            colorButton.appendChild(colorName);
            
            colorButton.addEventListener('click', function() {
                document.querySelectorAll('.color-selection .spec-tag').forEach(btn => 
                    btn.classList.remove('selected'));
                colorButton.classList.add('selected');
                window.selectedColor = color;
                document.getElementById('selected-color-input').value = color;
            });
            
            colorSelection.appendChild(colorButton);
        });
    }
    
    // Update quantity and total price
    document.getElementById('quantity').value = 1;
    updateTotalPrice();
    
    // Show modal
    productDetail.style.display = 'block';
    productDetailOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
    window.lastScrollPosition = window.scrollY;

    // Add touch swipe functionality
    let touchStartX = 0;
    let touchEndX = 0;
    
    function handleTouchStart(event) {
        touchStartX = event.touches[0].clientX;
    }
    
    function handleTouchMove(event) {
        touchEndX = event.touches[0].clientX;
    }
    
    function handleTouchEnd() {
        if (!productImages || productImages.length <= 1) return;
        
        const swipeThreshold = 50; // minimum distance for swipe
        const swipeDistance = touchEndX - touchStartX;
        
        if (swipeDistance > swipeThreshold) {
            // Swiped right - show previous image
            navigateImages(-1, productImages);
        } else if (swipeDistance < -swipeThreshold) {
            // Swiped left - show next image
            navigateImages(1, productImages);
        }
        
        // Reset touch coordinates
        touchStartX = 0;
        touchEndX = 0;
    }
    
    // Remove any existing event listeners first to prevent duplicates
    if (imageContainer) {
        imageContainer.removeEventListener('touchstart', handleTouchStart);
        imageContainer.removeEventListener('touchmove', handleTouchMove);
        imageContainer.removeEventListener('touchend', handleTouchEnd);
        
        // Add touch event listeners
        imageContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
        imageContainer.addEventListener('touchmove', handleTouchMove, { passive: true });
        imageContainer.addEventListener('touchend', handleTouchEnd);
    }
}

// Function to navigate between product images
function navigateImages(direction, productImages) {
    if (!productImages || productImages.length <= 1) return;
    
    const detailImage = document.getElementById('detail-image');
    const imageContainer = document.getElementById('image-container');
    
    // Calculate new index
    let newIndex = (window.currentImageIndex + direction) % productImages.length;
    if (newIndex < 0) newIndex = productImages.length - 1;
    
    // Show loading state
    imageContainer.classList.add('image-loading');
    detailImage.style.opacity = "0";
    
    // Preload the new image
    const img = new Image();
    img.src = productImages[newIndex];
    
    img.onload = function() {
        // Image loaded successfully
        detailImage.src = productImages[newIndex];
        detailImage.style.opacity = "1";
        imageContainer.classList.remove('image-loading');
        
        // Update thumbnails
        const thumbnails = document.querySelectorAll('.thumbnail');
        thumbnails.forEach((thumb, index) => {
            thumb.classList.toggle('active', index === newIndex);
        });
        
        // Update current index
        window.currentImageIndex = newIndex;
    };
    
    img.onerror = function() {
        console.error("Failed to load image:", productImages[newIndex]);
        detailImage.src = "https://via.placeholder.com/400x400?text=Image+Not+Available";
        detailImage.style.opacity = "1";
        imageContainer.classList.remove('image-loading');
    };
}

// Function to update total price
function updateTotalPrice() {
    if (!window.currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value);
    const basePrice = window.currentProduct.price;
    const discount = window.currentProduct.discount || 0;
    
    // Calculate price with discount
    const discountedPrice = calculateDiscountedPrice(basePrice, discount);
    const total = discountedPrice * quantity;
    
    document.getElementById('total-price').textContent = `${total} دج`;
}

// Load products when the page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Loading products from Firebase');
    loadProducts();
    
    // Set up event listeners for product detail modal
    setupModalCloseHandlers();
});

// Setup close handlers for the product detail modal
function setupModalCloseHandlers() {
    // Get elements
    const closeBtn = document.getElementById('close-btn');
    const productDetailOverlay = document.getElementById('product-detail-overlay');
    const productDetail = document.getElementById('product-detail');
    
    // Close button handler
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideProductDetail();
        });
    }
    
    // Overlay click handler (close when clicking outside)
    if (productDetailOverlay) {
        productDetailOverlay.addEventListener('click', function(e) {
            if (e.target === productDetailOverlay) {
                hideProductDetail();
            }
        });
    }
    
    // Prevent closing when clicking inside the product detail
    if (productDetail) {
        productDetail.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// Function to hide product detail modal
function hideProductDetail() {
    const productDetail = document.getElementById('product-detail');
    const productDetailOverlay = document.getElementById('product-detail-overlay');
    const homePage = document.getElementById('home-page');
    
    if (productDetail && productDetailOverlay) {
        productDetail.style.display = 'none';
        productDetailOverlay.style.display = 'none';
        document.body.style.overflow = '';
        
        // Reset form if it exists
        const form = document.getElementById('order-form');
        if (form) {
            form.reset();
        }
        
        // Reset scroll position
        window.scrollTo(0, window.lastScrollPosition || 0);
    }
} 