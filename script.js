// DOM elements - will be initialized properly in init function
let productsGrid;
let homePage;
let productDetail;
let productDetailOverlay;
let backToTopButton;
let quantityInput;
let orderForm;
let toast;
let mobileNav;
let mobileNavOverlay;
let closeNavBtn;
let menuButton;
let closeDetailBtn;

// Current product
let currentProduct = null;

// Current product selections
let selectedSize = null;
let currentQuantity = 1;

// Handle viewport height on mobile devices
function setViewportHeight() {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

// Update viewport height on resize and orientation change
window.addEventListener('resize', setViewportHeight);
window.addEventListener('orientationchange', setViewportHeight);

// Set initial viewport height
setViewportHeight();

// Function to close product detail
function hideProductDetail() {
    if (productDetail && productDetailOverlay && homePage) {
        productDetail.style.display = 'none';
        productDetailOverlay.style.display = 'none';
        homePage.style.display = 'block';
        document.body.style.overflow = ''; // Reset body overflow
        
        // Reset any form if it exists
        const form = document.getElementById('order-form');
        if (form) {
            form.reset();
        }

        // Reset scroll position
        window.scrollTo(0, window.lastScrollPosition || 0);
    }
}

// Function to show home page
function showHomePage() {
    hideProductDetail();
}

// Function to show products page
function showProductsPage() {
    hideProductDetail();
    if (homePage) {
        homePage.style.display = 'block';
    }
}

// Initialize the page
function init() {
    // Initialize DOM elements
    productsGrid = document.getElementById('products-grid');
    homePage = document.getElementById('home-page');
    productDetail = document.getElementById('product-detail');
    productDetailOverlay = document.getElementById('product-detail-overlay');
    backToTopButton = document.getElementById('back-to-top');
    quantityInput = document.getElementById('quantity');
    orderForm = document.getElementById('order-form');
    toast = document.getElementById('toast');
    mobileNav = document.getElementById('mobile-nav');
    mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    closeNavBtn = document.getElementById('close-nav');
    menuButton = document.querySelector('.menu-button');
    closeDetailBtn = document.getElementById('close-product-detail');
    
    // Thank you overlay handling
    const closeThankYouBtn = document.getElementById('close-thank-you');
    const thankYouOverlay = document.getElementById('thank-you-overlay');
    const backToShopBtn = document.querySelector('.back-to-shop-btn');
    
    if (closeThankYouBtn) {
        closeThankYouBtn.addEventListener('click', function() {
            document.getElementById('thank-you-overlay').style.display = 'none';
            document.getElementById('thank-you-container').style.display = 'none';
        });
    }
    
    if (backToShopBtn) {
        backToShopBtn.addEventListener('click', function() {
            document.getElementById('thank-you-overlay').style.display = 'none';
            document.getElementById('thank-you-container').style.display = 'none';
        });
    }
    
    if (thankYouOverlay) {
        thankYouOverlay.addEventListener('click', function() {
            document.getElementById('thank-you-overlay').style.display = 'none';
            document.getElementById('thank-you-container').style.display = 'none';
        });
    }

    // Mobile navigation setup
    if (menuButton) {
        menuButton.addEventListener('click', function(e) {
            e.preventDefault();
            if (mobileNav && mobileNavOverlay) {
                mobileNav.classList.add('active');
                mobileNavOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (closeNavBtn) {
        closeNavBtn.addEventListener('click', function(e) {
            e.preventDefault();
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Mobile nav links
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Contact modal functionality
    const contactLink = document.getElementById('contact-link');
    const mobileContactLink = document.getElementById('mobile-contact-link');
    const footerContactLink = document.getElementById('footer-contact-link');
    const contactModal = document.getElementById('contact-modal');
    const contactOverlay = document.getElementById('contact-modal-overlay');
    const closeContactBtn = document.getElementById('close-contact-btn');
    
    function showContactModal(e) {
        e.preventDefault();
        if (contactModal && contactOverlay) {
            contactModal.style.display = 'block';
            contactOverlay.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }
    
    function hideContactModal() {
        if (contactModal && contactOverlay) {
            contactModal.style.display = 'none';
            contactOverlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
    
    if (contactLink) {
        contactLink.addEventListener('click', showContactModal);
    }
    
    if (mobileContactLink) {
        mobileContactLink.addEventListener('click', showContactModal);
    }
    
    if (footerContactLink) {
        footerContactLink.addEventListener('click', showContactModal);
    }
    
    if (closeContactBtn) {
        closeContactBtn.addEventListener('click', hideContactModal);
    }
    
    if (contactOverlay) {
        contactOverlay.addEventListener('click', hideContactModal);
    }
    
    // Form submission handler
    if (orderForm) {
        // Check if we're on products.html (it has its own form handler)
        const isProductsPage = document.getElementById('products-grid') !== null;
        // Check if we're on index.html (it has its own form handler in the HTML)
        const isIndexPage = document.getElementById('home-page') !== null;
        
        // Only attach this handler if we're not on index.html or products.html
        if (!isProductsPage && !isIndexPage) {
            orderForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Check if size is selected
                if (!window.selectedSize) {
                    alert('الرجاء اختيار المقاس.');
                    return;
                }
                
                // Check if color is selected
                if (!window.selectedColor) {
                    alert('الرجاء اختيار اللون.');
                    return;
                }
                
                // Get form data
                const formData = new FormData(e.target);
                const formObject = {};
                formData.forEach((value, key) => {
                    formObject[key] = value;
                });

                // Add product details and metadata
                formObject.timestamp = new Date().toISOString();
                formObject.source = 'website_form';
                formObject.product_name = document.getElementById('product-name-input').value;
                formObject.product_price = document.getElementById('product-price-input').value;
                formObject.selected_size = document.getElementById('selected-size-input').value;
                formObject.selected_color = document.getElementById('selected-color-input').value;
                formObject.quantity = document.getElementById('quantity').value;
                formObject.province = document.getElementById('province').value;
                formObject.city = document.getElementById('city').value;
                formObject.address = document.getElementById('address').value;
                formObject.delivery_type = document.getElementById('delivery-type').value;

                // Calculate total price
                const price = parseFloat(formObject.product_price);
                const quantity = parseInt(formObject.quantity);
                formObject.total_price = (price * quantity).toFixed(2);

                // Show loading state
                const submitButton = e.target.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.textContent;
                submitButton.disabled = true;
                submitButton.textContent = 'جاري الإرسال...';

                try {
                    // Send data to Make.com webhook
                    const response = await fetch('https://hook.eu2.make.com/9er37htcup1gl21vwvdpaehdgkinz3p1', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formObject)
                    });

                    console.log('Response status:', response.status);
                    
                    if (response.ok) {
                        // Show thank you page
                        const thankYouOverlay = document.getElementById('thank-you-overlay');
                        const thankYouContainer = document.getElementById('thank-you-container');
                        if (thankYouOverlay && thankYouContainer) {
                            thankYouOverlay.style.display = 'block';
                            thankYouContainer.style.display = 'block';
                        }
                        
                        // Reset form
                        e.target.reset();
                        
                        // Hide product detail
                        hideProductDetail();
                        
                        // Reset selections
                        window.selectedSize = null;
                        window.selectedColor = null;
                    } else {
                        console.error('Server returned error status:', response.status);
                        alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.');
                } finally {
                    // Reset button state
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            });
        } else {
            console.log('Using page-specific form handler instead of script.js handler');
        }
    }

    // Close button handler
    const closeBtn = document.getElementById('close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            hideProductDetail();
        });
    }

    // Overlay click handler
    if (productDetailOverlay) {
        productDetailOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            hideProductDetail();
        });
    }

    // Prevent closing when clicking inside the product detail
    if (productDetail) {
        productDetail.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    // Show contact form when clicking contact links
    document.querySelectorAll('.nav-link, .footer-link, .mobile-nav-links a').forEach(link => {
        if (link.textContent.includes('اتصل بنا')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                contactForm.style.display = 'block';
                // Also hide mobile nav if it's open
                const mobileNav = document.getElementById('mobile-nav');
                const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
                if (mobileNav && mobileNavOverlay) {
                    mobileNav.classList.remove('active');
                    mobileNavOverlay.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    });

    // Close contact form
    closeContactForm.addEventListener('click', () => {
        contactForm.style.display = 'none';
    });

    // Close contact form when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target === contactForm) {
            contactForm.style.display = 'none';
        }
    });

    // Add click handlers to product cards
    if (productsGrid) {
        // Wait a bit for products to be loaded by products.js
        setTimeout(() => {
            const productCards = document.querySelectorAll('.product-card');
            productCards.forEach(card => {
                card.addEventListener('click', function() {
                    const productId = this.getAttribute('data-product-id');
                    if (productId && window.showProductDetail && window.allProducts) {
                        // Find the product in the allProducts array
                        const product = window.allProducts.find(p => p.id === productId);
                        if (product) {
                            window.showProductDetail(productId, product);
                        }
                    }
                });
            });
            console.log('Added click handlers to', productCards.length, 'product cards');
        }, 1000);
    }

    // Handle mobile scrolling
    if (productDetail) {
        productDetail.addEventListener('scroll', function(e) {
            const submitButton = this.querySelector('.submit-order');
            if (submitButton) {
                const rect = submitButton.getBoundingClientRect();
                const isVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
                
                if (!isVisible) {
                    submitButton.style.position = 'fixed';
                    submitButton.style.bottom = '0';
                } else {
                    submitButton.style.position = 'sticky';
                }
            }
        });
    }
}

// Update quantity
function updateQuantity(change) {
    const quantityInput = document.getElementById('quantity');
    let newQuantity = parseInt(quantityInput.value) + change;
    
    // Ensure quantity stays within bounds (1-10)
    newQuantity = Math.max(1, Math.min(10, newQuantity));
    
    quantityInput.value = newQuantity;
    currentQuantity = newQuantity;
}

// Calculate discounted price
function calculateDiscountedPrice(price, discount) {
    return Math.round(price * (1 - discount / 100));
}

// Toggle back to top button
function toggleBackToTopButton() {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
}

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Mobile navigation functions
function showMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    
    if (mobileNav && mobileNavOverlay) {
        mobileNav.classList.add('active');
        mobileNavOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function hideMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    
    if (mobileNav && mobileNavOverlay) {
        mobileNav.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Handle navbar scroll behavior
function setupNavbarScroll() {
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll <= 0) {
            navbar.classList.remove('hidden');
            return;
        }
        
        if (currentScroll > lastScroll && !navbar.classList.contains('hidden')) {
            // Scrolling down
            navbar.classList.add('hidden');
        } else if (currentScroll < lastScroll && navbar.classList.contains('hidden')) {
            // Scrolling up
            navbar.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// Initialize the page
document.addEventListener('DOMContentLoaded', init);