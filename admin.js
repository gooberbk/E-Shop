// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, reauthenticateWithCredential, updateEmail, updatePassword } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy, limit, getDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";
import { EmailAuthProvider } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";

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
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage();

// DOM Elements
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const pageTitle = document.getElementById('pageTitle');
const totalProducts = document.getElementById('totalProducts');
const totalOrders = document.getElementById('totalOrders');
const totalCustomers = document.getElementById('totalCustomers');
const totalRevenue = document.getElementById('totalRevenue');
const recentProducts = document.getElementById('recentProducts');
const productList = document.getElementById('productList');
const toastNotification = document.getElementById('toast-notification');

// Check authentication state
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        loginSection.style.display = 'none';
        adminPanel.style.display = 'flex';
        
        // Update user information in dropdown
        const userNameSpan = document.querySelector('.user-dropdown-btn span');
        if (userNameSpan) {
            userNameSpan.textContent = user.email || 'Admin';
        }
        
        // Update admin email in settings
        const adminEmailInput = document.getElementById('adminEmail');
        if (adminEmailInput) {
            adminEmailInput.value = user.email || '';
        }
        
        loadDashboard();
    } else {
        // User is signed out
        loginSection.style.display = 'flex';
        adminPanel.style.display = 'none';
    }
});

// Login function
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Login successful - the onAuthStateChanged listener will handle the UI update
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
}

// Logout function
async function logout() {
    try {
        await signOut(auth);
        // Logout successful - the onAuthStateChanged listener will handle the UI update
    } catch (error) {
        alert('Logout failed: ' + error.message);
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load total products
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsCount = productsSnapshot.size;
        totalProducts.textContent = productsCount;
        
        // Calculate total revenue from products
        let totalRevenueValue = 0;
        productsSnapshot.forEach((doc) => {
            const product = doc.data();
            const discountedPrice = product.discount ? 
                product.price * (1 - product.discount / 100) : 
                product.price;
            totalRevenueValue += discountedPrice;
        });
        totalRevenue.textContent = `${totalRevenueValue.toFixed(2)} DA`;
        
        // Load recent products
        const recentProductsQuery = query(
            collection(db, 'products'),
            orderBy('createdAt', 'desc'),
            limit(4)
        );
        
        const recentProductsSnapshot = await getDocs(recentProductsQuery);
        recentProducts.innerHTML = '';
        
        recentProductsSnapshot.forEach((doc) => {
            const product = doc.data();
            const productCard = createProductCard(product, doc.id);
            recentProducts.appendChild(productCard);
        });
        
        // Load all products for the products tab
        loadProducts();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Update settings
async function updateSettings() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const adminEmail = document.getElementById('adminEmail').value;

    // Validate current password
    if (currentPassword) {
        try {
            // Re-authenticate user with current password
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
        } catch (error) {
            alert('Current password is incorrect');
            return;
        }
    }

    // Update email if changed
    if (adminEmail && adminEmail !== auth.currentUser.email) {
        try {
            await updateEmail(auth.currentUser, adminEmail);
        } catch (error) {
            alert('Error updating email: ' + error.message);
            return;
        }
    }

    // Update password if changed
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            alert('New passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters long');
            return;
        }
        try {
            await updatePassword(auth.currentUser, newPassword);
            alert('Settings updated successfully');
            // Clear password fields
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } catch (error) {
            alert('Error updating password: ' + error.message);
            return;
        }
    }
}

// Show toast notification
function showToast(message, duration = 3000) {
    // Set message if provided
    if (message) {
        const messageElement = toastNotification.querySelector('.toast-notification-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
    
    // Show the toast
    toastNotification.classList.add('show');
    
    // Hide after duration
    setTimeout(() => {
        toastNotification.classList.remove('show');
    }, duration);
}

// Convert image file to base64
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Add new product
async function addProduct() {
    const name = document.getElementById('productName').value;
    const price = document.getElementById('productPrice').value;
    const discount = document.getElementById('productDiscount').value;
    
    // Get all image URLs
    const imageInputs = document.querySelectorAll('#image-url-container .image-url-input');
    const imageUrls = Array.from(imageInputs).map(input => input.value.trim()).filter(url => url !== '');
    
    // For backward compatibility, keep the main image URL
    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

    // Get selected sizes
    const sizeCheckboxes = document.querySelectorAll('input[name="size"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);

    // Get selected colors
    const colorCheckboxes = document.querySelectorAll('input[name="color"]:checked');
    const colors = Array.from(colorCheckboxes).map(checkbox => checkbox.value);

    // Validate image URLs
    if (imageUrls.length === 0) {
        alert('Please enter at least one image URL');
        return;
    }

    // Validate that at least one size is selected
    if (sizes.length === 0) {
        alert('Please select at least one size');
        return;
    }

    // Validate that at least one color is selected
    if (colors.length === 0) {
        alert('Please select at least one color');
        return;
    }

    try {
        // Add product to Firestore
        await addDoc(collection(db, 'products'), {
            name: name,
            price: parseFloat(price),
            discount: parseFloat(discount) || 0,
            imageUrl: imageUrl, // Keep main image URL for backward compatibility
            imageUrls: imageUrls, // Store all image URLs
            sizes: sizes,
            colors: colors,
            createdAt: serverTimestamp()
        });

        // Show success toast
        showToast('تم إضافة المنتج بنجاح');

        // Clear form
        document.getElementById('productName').value = '';
        document.getElementById('productPrice').value = '';
        document.getElementById('productDiscount').value = '0';
        document.getElementById('productImage').value = '';
        
        // Reset image container
        const imageContainer = document.getElementById('image-url-container');
        if (imageContainer) {
            // Remove all but the first input
            const inputs = imageContainer.querySelectorAll('.image-url-input-group');
            for (let i = 1; i < inputs.length; i++) {
                inputs[i].remove();
            }
            // Clear the first input
            const firstInput = imageContainer.querySelector('.image-url-input');
            if (firstInput) firstInput.value = '';
        }
        
        // Clear size checkboxes
        document.querySelectorAll('input[name="size"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        // Clear color checkboxes
        document.querySelectorAll('input[name="color"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        // Reload dashboard and products
        loadDashboard();
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Error adding product: ' + error.message);
    }
}

// Load all products
async function loadProducts() {
    try {
        const productsSnapshot = await getDocs(collection(db, 'products'));
        productList.innerHTML = '';
        
        productsSnapshot.forEach((doc) => {
            const product = doc.data();
            const productCard = createProductCard(product, doc.id);
            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Create product card
function createProductCard(product, productId) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Calculate discounted price
    const discountedPrice = product.discount ? 
        product.price * (1 - product.discount / 100) : 
        product.price;
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="product-details">
            <div class="product-text">
                <h3 class="product-name">${product.name}</h3>
            </div>
            <div class="product-price-container">
                ${product.discount ? 
                    `<span class="original-price">${product.price.toFixed(2)} DA</span>
                     <span class="discounted-price">${discountedPrice.toFixed(2)} DA</span>
                     <span class="discount-badge">-${product.discount}%</span>` :
                    `<span class="product-price">${product.price.toFixed(2)} DA</span>`
                }
            </div>
            <div class="product-sizes">
                ${product.sizes && product.sizes.length ? 'Sizes: ' + product.sizes.join(', ') : ''}
            </div>
            <div class="product-colors">
                ${product.colors && product.colors.length ? 'Colors: ' + product.colors.join(', ') : ''}
            </div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct('${productId}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-delete" onclick="deleteProduct('${productId}')">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Delete product
async function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showToast('تم حذف المنتج بنجاح');
            loadDashboard();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Error deleting product: ' + error.message);
        }
    }
}

// Edit product
async function editProduct(productId) {
    try {
        const productDoc = await getDoc(doc(db, 'products', productId));
        
        if (productDoc.exists()) {
            const product = productDoc.data();
            
            // Populate edit form with product data
            document.getElementById('editProductId').value = productId;
            document.getElementById('editProductName').value = product.name || '';
            document.getElementById('editProductPrice').value = product.price || '';
            document.getElementById('editProductDiscount').value = product.discount || '0';
            
            // Clear previous image inputs except the first one
            const imageContainer = document.getElementById('edit-image-url-container');
            if (imageContainer) {
                // Remove all but the first input group
                const inputs = imageContainer.querySelectorAll('.image-url-input-group');
                for (let i = 1; i < inputs.length; i++) {
                    inputs[i].remove();
                }
                
                // Set the first image
                const firstInput = imageContainer.querySelector('.edit-image-url-input');
                if (firstInput) firstInput.value = product.imageUrl || '';
                
                // Add additional image inputs if product has multiple images
                if (product.imageUrls && product.imageUrls.length > 1) {
                    for (let i = 1; i < product.imageUrls.length; i++) {
                        addEditImageInput(product.imageUrls[i]);
                    }
                }
            } else {
                // Fallback to the single image input if container not found
                document.getElementById('editProductImage').value = product.imageUrl || '';
            }
            
            // Check the appropriate size checkboxes
            document.querySelectorAll('input[name="editSize"]').forEach(checkbox => {
                checkbox.checked = product.sizes && product.sizes.includes(checkbox.value);
            });
            
            // Check the appropriate color checkboxes
            document.querySelectorAll('input[name="editColor"]').forEach(checkbox => {
                checkbox.checked = product.colors && product.colors.includes(checkbox.value);
            });
            
            // Show edit form modal
            document.getElementById('editProductModal').style.display = 'block';
        } else {
            alert('Product not found');
        }
    } catch (error) {
        console.error('Error loading product for edit:', error);
        alert('Error loading product: ' + error.message);
    }
}

// Update product
async function updateProduct() {
    const productId = document.getElementById('editProductId').value;
    const name = document.getElementById('editProductName').value;
    const price = document.getElementById('editProductPrice').value;
    const discount = document.getElementById('editProductDiscount').value;
    
    // Get all image URLs
    const imageInputs = document.querySelectorAll('#edit-image-url-container .edit-image-url-input');
    const imageUrls = Array.from(imageInputs).map(input => input.value.trim()).filter(url => url !== '');
    
    // For backward compatibility, keep the main image URL
    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : '';

    // Get selected sizes
    const sizeCheckboxes = document.querySelectorAll('input[name="editSize"]:checked');
    const sizes = Array.from(sizeCheckboxes).map(checkbox => checkbox.value);

    // Get selected colors
    const colorCheckboxes = document.querySelectorAll('input[name="editColor"]:checked');
    const colors = Array.from(colorCheckboxes).map(checkbox => checkbox.value);

    // Validate that at least one image URL is entered
    if (imageUrls.length === 0) {
        alert('Please enter at least one image URL');
        return;
    }

    // Validate that at least one size is selected
    if (sizes.length === 0) {
        alert('Please select at least one size');
        return;
    }

    // Validate that at least one color is selected
    if (colors.length === 0) {
        alert('Please select at least one color');
        return;
    }

    try {
        // Update product in Firestore
        await updateDoc(doc(db, 'products', productId), {
            name: name,
            price: parseFloat(price),
            discount: parseFloat(discount) || 0,
            imageUrl: imageUrl, // Keep main image URL for backward compatibility
            imageUrls: imageUrls, // Store all image URLs
            sizes: sizes,
            colors: colors,
            updatedAt: serverTimestamp()
        });

        // Show success toast
        showToast('تم تحديث المنتج بنجاح');

        // Close modal and reload products
        closeEditModal();
        loadProducts();
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Error updating product: ' + error.message);
    }
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editProductModal').style.display = 'none';
}

// Add functions for managing image inputs
function addEditImageInput(imageUrl = '') {
    const container = document.getElementById('edit-image-url-container');
    if (!container) return;
    
    // Create new input group
    const inputGroup = document.createElement('div');
    inputGroup.className = 'image-url-input-group';
    inputGroup.style.display = 'flex';
    inputGroup.style.marginBottom = '5px';
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'form-control edit-image-url-input';
    input.placeholder = 'Enter additional image URL';
    input.value = imageUrl;
    
    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger remove-edit-image-btn';
    removeBtn.textContent = '✕';
    removeBtn.style.marginLeft = '5px';
    removeBtn.addEventListener('click', function() {
        container.removeChild(inputGroup);
        
        // Hide remove button on the first input if it's the only one
        if (container.querySelectorAll('.image-url-input-group').length === 1) {
            const firstRemoveBtn = container.querySelector('.remove-edit-image-btn');
            if (firstRemoveBtn) firstRemoveBtn.style.display = 'none';
        }
    });
    
    // Append elements
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeBtn);
    container.appendChild(inputGroup);
    
    // Show remove button on the first input
    const inputs = container.querySelectorAll('.image-url-input-group');
    if (inputs.length > 1) {
        const firstRemoveBtn = inputs[0].querySelector('.remove-edit-image-btn');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'block';
    }
}

function addImageInput() {
    const container = document.getElementById('image-url-container');
    if (!container) return;
    
    // Create new input group
    const inputGroup = document.createElement('div');
    inputGroup.className = 'image-url-input-group';
    inputGroup.style.display = 'flex';
    inputGroup.style.marginBottom = '5px';
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'url';
    input.className = 'form-control image-url-input';
    input.placeholder = 'Enter additional image URL';
    
    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger remove-image-btn';
    removeBtn.textContent = '✕';
    removeBtn.style.marginLeft = '5px';
    removeBtn.addEventListener('click', function() {
        container.removeChild(inputGroup);
        
        // Hide remove button on the first input if it's the only one
        if (container.querySelectorAll('.image-url-input-group').length === 1) {
            const firstRemoveBtn = container.querySelector('.remove-image-btn');
            if (firstRemoveBtn) firstRemoveBtn.style.display = 'none';
        }
    });
    
    // Append elements
    inputGroup.appendChild(input);
    inputGroup.appendChild(removeBtn);
    container.appendChild(inputGroup);
    
    // Show remove button on the first input
    const inputs = container.querySelectorAll('.image-url-input-group');
    if (inputs.length > 1) {
        const firstRemoveBtn = inputs[0].querySelector('.remove-image-btn');
        if (firstRemoveBtn) firstRemoveBtn.style.display = 'block';
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            login();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
    
    // Add product form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addProduct();
        });
    }
    
    // Update product form submission
    const updateProductForm = document.getElementById('updateProductForm');
    if (updateProductForm) {
        updateProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProduct();
        });
    }
    
    // Close edit modal button
    const closeEditModalBtn = document.getElementById('closeEditModal');
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', closeEditModal);
    }
    
    // Settings form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateSettings();
        });
    }
    
    // Navigation menu items
    const navItems = document.querySelectorAll('.sidebar-menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            // Get target section ID
            const targetId = item.getAttribute('href').substring(1);
            
            // Update page title
            if (pageTitle) {
                pageTitle.textContent = item.querySelector('span').textContent;
            }
            
            // Hide all sections
            contentSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show target section
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
    
    // Initialize first tab
    if (navItems.length > 0 && contentSections.length > 0) {
        navItems[0].classList.add('active');
        contentSections[0].style.display = 'block';
    }
    
    // User dropdown toggle
    const userDropdownBtn = document.querySelector('.user-dropdown-btn');
    const userDropdownContent = document.querySelector('.user-dropdown-content');
    
    if (userDropdownBtn && userDropdownContent) {
        userDropdownBtn.addEventListener('click', () => {
            userDropdownContent.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        window.addEventListener('click', (event) => {
            if (!event.target.matches('.user-dropdown-btn') && 
                !event.target.matches('.user-dropdown-btn *')) {
                if (userDropdownContent.classList.contains('show')) {
                    userDropdownContent.classList.remove('show');
                }
            }
        });
    }
    
    // Add image URL button
    const addImageBtn = document.getElementById('add-image-btn');
    if (addImageBtn) {
        addImageBtn.addEventListener('click', addImageInput);
    }
    
    // Add edit image URL button
    const addEditImageBtn = document.getElementById('add-edit-image-btn');
    if (addEditImageBtn) {
        addEditImageBtn.addEventListener('click', () => addEditImageInput());
    }
    
    // Show remove button on the first image input if not already visible
    const firstRemoveBtn = document.querySelector('.remove-image-btn');
    if (firstRemoveBtn) {
        const container = document.getElementById('image-url-container');
        if (container && container.querySelectorAll('.image-url-input-group').length > 1) {
            firstRemoveBtn.style.display = 'block';
        }
    }
    
    // Same for edit form
    const firstEditRemoveBtn = document.querySelector('.remove-edit-image-btn');
    if (firstEditRemoveBtn) {
        const container = document.getElementById('edit-image-url-container');
        if (container && container.querySelectorAll('.image-url-input-group').length > 1) {
            firstEditRemoveBtn.style.display = 'block';
        }
    }
});

// Make functions globally available
window.login = login;
window.logout = logout;
window.addProduct = addProduct;
window.editProduct = editProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.closeEditModal = closeEditModal; 