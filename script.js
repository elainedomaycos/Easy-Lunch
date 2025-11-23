// Loader functionality
        window.addEventListener('load', function() {
            setTimeout(function() {
                const loader = document.getElementById('loader-wrapper');
                const mainContent = document.getElementById('main-content');
                
                loader.classList.add('hidden');
                mainContent.classList.add('visible');
                
                setTimeout(function() {
                    loader.style.display = 'none';
                }, 500);
            }, 3000);
        });

        // Active navigation links
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                // Remove active class from all links except Contact Us (pill-nav-item)
                navLinks.forEach(l => {
                    if (!l.classList.contains('pill-nav-item')) {
                        l.classList.remove('active');
                    }
                });
                
                // Add active class to clicked link if not Contact Us
                if (!this.classList.contains('pill-nav-item')) {
                    this.classList.add('active');
                }
            });
        });

        // Scroll spy for active navigation
        window.addEventListener('scroll', function() {
            let current = '';
            const sections = document.querySelectorAll('section[id]');
            
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (pageYOffset >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });

            navLinks.forEach(link => {
                if (!link.classList.contains('pill-nav-item')) {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${current}`) {
                        link.classList.add('active');
                    }
                }
            });
        });

        // Testimonials carousel
        const carousel = document.getElementById('carousel');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        let currentPosition = 0;
        const cardWidth = 320;

        nextBtn.addEventListener('click', function() {
            const maxScroll = carousel.scrollWidth - carousel.parentElement.clientWidth;
            if (currentPosition < maxScroll) {
                currentPosition += cardWidth;
                if (currentPosition > maxScroll) currentPosition = maxScroll;
                carousel.style.transform = `translateX(-${currentPosition}px)`;
            }
        });

        prevBtn.addEventListener('click', function() {
            if (currentPosition > 0) {
                currentPosition -= cardWidth;
                if (currentPosition < 0) currentPosition = 0;
                carousel.style.transform = `translateX(-${currentPosition}px)`;
            }
        });

        // Newsletter form
        document.getElementById('newsletterForm').addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input').value;
            alert(`Thank you for subscribing with ${email}! We'll keep you updated with our latest offers.`);
            this.reset();
        });

        // Product popup
        function openProduct(card) {
          const imgSrc = card.querySelector('img').src;
          const title = card.querySelector('.product-name').innerText;
          const price = card.querySelector('.product-price').innerText;

          document.getElementById('popup-img').src = imgSrc;
          document.getElementById('popup-title').innerText = title;
          document.getElementById('popup-price').innerText = price;

          document.getElementById('product-popup').style.display = 'flex';
        }

        function closePopup() {
          document.getElementById('product-popup').style.display = 'none';
        }

        // Cart Modal
        const cartButton = document.getElementById("cartButton");
        const cartModal = document.getElementById("cartModal");
        const closeCart = document.getElementById("closeCart");

        cartButton.addEventListener("click", () => {
          cartModal.style.display = "flex";
          document.body.style.overflow = "hidden";
        });

        closeCart.addEventListener("click", () => {
          cartModal.style.display = "none";
          document.body.style.overflow = "auto";
        });

        window.addEventListener("click", (e) => {
          if (e.target === cartModal) {
            cartModal.style.display = "none";
            document.body.style.overflow = "auto";
          }
        });

        // Checkout Modal
        const checkoutBtn = document.getElementById("checkoutBtn");
        const checkoutModal = document.getElementById("checkoutModal");
        const closeCheckout = document.getElementById("closeCheckout");
        const placeOrderBtn = document.getElementById("placeOrderBtn");
        const confirmationModal = document.getElementById("confirmationModal");
        const closeConfirmation = document.getElementById("closeConfirmation");

        // Cart -> Checkout
        checkoutBtn.addEventListener("click", () => {
          // Check if cart is empty before proceeding to checkout
          const cart = JSON.parse(localStorage.getItem('easy_lunch_cart_v1') || '[]');
          if (cart.length === 0) {
            alert('Your cart is empty! Please add items before checking out.');
            return;
          }
          
          cartModal.style.display = "none";
          checkoutModal.classList.add("active");
          checkoutModal.style.display = "flex";
        });

        // Close Checkout
        closeCheckout.addEventListener("click", () => {
          checkoutModal.classList.remove("active");
          checkoutModal.style.display = "none";
          document.body.style.overflow = "auto";
        });

        // Checkout -> Confirmation
        placeOrderBtn.addEventListener("click", () => {
          checkoutModal.classList.remove("active");
          checkoutModal.style.display = "none";
          confirmationModal.classList.add("active");
          confirmationModal.style.display = "flex";
        });

        // Close Confirmation Modal
        closeConfirmation.addEventListener("click", () => {
          confirmationModal.classList.remove("active");
          confirmationModal.style.display = "none";
          document.body.style.overflow = "auto";
        });

        // Close modals when clicking outside
        window.addEventListener("click", (e) => {
          if (e.target === checkoutModal) {
            checkoutModal.classList.remove("active");
            checkoutModal.style.display = "none";
            document.body.style.overflow = "auto";
          }
          if (e.target === confirmationModal) {
            confirmationModal.classList.remove("active");
            confirmationModal.style.display = "none";
            document.body.style.overflow = "auto";
          }
        });

        // Search (navbar) - toggle and filter products
        (function () {
            const searchToggle = document.getElementById('searchToggle');
            const searchBox = document.getElementById('searchBox');
            const searchInput = document.getElementById('searchInput');
            const searchClear = document.getElementById('searchClear');

            if (!searchToggle || !searchBox || !searchInput || !searchClear) return;

            function openSearch() {
                searchBox.classList.add('active');
                searchBox.setAttribute('aria-hidden', 'false');
                const navbarContent = document.querySelector('.navbar-content');
                if (navbarContent) navbarContent.classList.add('search-active');
                // Small timeout to ensure transition applies before focus
                setTimeout(() => searchInput.focus(), 10);
            }

            function closeSearch() {
                searchBox.classList.remove('active');
                searchBox.setAttribute('aria-hidden', 'true');
                searchInput.value = '';
                applyFilter('');
                const navbarContent = document.querySelector('.navbar-content');
                if (navbarContent) navbarContent.classList.remove('search-active');
            }

            function toggleSearch() {
                if (searchBox.classList.contains('active')) {
                    closeSearch();
                } else {
                    openSearch();
                }
            }

            function applyFilter(query) {
                const normalized = query.trim().toLowerCase();
                const cards = document.querySelectorAll('.product-card');
                let visibleCount = 0;
                cards.forEach(card => {
                    const nameEl = card.querySelector('.product-name');
                    const name = nameEl ? nameEl.textContent.toLowerCase() : '';
                    const matches = !normalized || name.includes(normalized);
                    card.style.display = matches ? '' : 'none';
                    if (matches) visibleCount++;
                });

                // Ensure users see results area
                const productsSection = document.getElementById('products');
                if (productsSection && query.length > 0) {
                    productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }

                // Show a small status above the grid
                const productSectionEl = document.querySelector('.product-section');
                const grid = document.querySelector('.product-grid');
                if (productSectionEl && grid) {
                    let status = document.getElementById('searchStatus');
                    if (!status) {
                        status = document.createElement('div');
                        status.id = 'searchStatus';
                        status.style.margin = '0 auto 1rem';
                        status.style.maxWidth = '1200px';
                        status.style.textAlign = 'left';
                        status.style.color = '#8b0000';
                        status.style.fontWeight = '700';
                        status.style.fontSize = '1.4rem';
                        productSectionEl.insertBefore(status, grid);
                    }
                    if (!normalized) {
                        status.textContent = '';
                    } else if (visibleCount === 0) {
                        status.textContent = `No results for "${query}".`;
                    } else {
                        status.textContent = `${visibleCount} result${visibleCount === 1 ? '' : 's'} for "${query}".`;
                    }
                }
            }

            // Open/close via click or keyboard
            searchToggle.addEventListener('click', toggleSearch);
            searchToggle.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleSearch();
                }
            });

            // Live filter on input
            searchInput.addEventListener('input', (e) => {
                applyFilter(e.target.value);
            });

            // Enter key → go to full list page with query
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const term = searchInput.value.trim();
                    if (term.length > 0) {
                        window.location.href = `product.html?q=${encodeURIComponent(term)}`;
                    }
                }
            });

            // Clear button
            searchClear.addEventListener('click', () => {
                searchInput.value = '';
                applyFilter('');
                searchInput.focus();
            });

            // Close on Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && searchBox.classList.contains('active')) {
                    closeSearch();
                }
            });

            // Click outside to close
            document.addEventListener('click', (e) => {
                if (!searchBox.contains(e.target) && !searchToggle.contains(e.target) && searchBox.classList.contains('active')) {
                    closeSearch();
                }
            });
        })();

        // Authentication integration
        (function() {
            const userButton = document.getElementById('userButton');
            const accountDropdown = document.getElementById('accountDropdown');
            const logoutBtn = document.getElementById('logoutBtn');

            if (!userButton) return;

            // Function to update dropdown menu based on user role
            function updateDropdownMenu(user) {
                if (!accountDropdown) return;
                
                const ul = accountDropdown.querySelector('ul');
                if (!ul) return;
                
                // Clear existing menu items
                ul.innerHTML = '';
                
                if (user) {
                    console.log('Updating menu for user:', user.email);
                    const isAdmin = window.AuthModule && window.AuthModule.isAdminUser(user);
                    const isStaff = window.AuthModule && window.AuthModule.isStaffUser(user);
                    
                    console.log('Is Admin?', isAdmin, '| Is Staff?', isStaff);
                    
                    // Add dashboard links for admin/staff
                    if (isAdmin) {
                        console.log('Adding Admin Dashboard link');
                        ul.innerHTML += '<li><a href="admin.html" style="display:block; padding:0.8rem 1rem; color:#c0392b; font-weight:600; text-decoration:none;">Admin Dashboard</a></li>';
                    }
                    if (isStaff) {
                        console.log('Adding Staff Dashboard link');
                        ul.innerHTML += '<li><a href="staff.html" style="display:block; padding:0.8rem 1rem; color:#c0392b; font-weight:600; text-decoration:none;">Staff Dashboard</a></li>';
                    }
                    
                    // Add My Account for all users
                    ul.innerHTML += '<li><a href="account.html" style="display:block; padding:0.8rem 1rem; color:#c0392b; font-weight:600; text-decoration:none;">My Account</a></li>';
                    
                    // Add Logout button
                    ul.innerHTML += '<li><a href="#" id="logoutBtn" style="display:block; padding:0.8rem 1rem; color:#8b0000; font-weight:600; text-decoration:none;">Logout</a></li>';
                    
                    // Re-attach logout event listener
                    const newLogoutBtn = document.getElementById('logoutBtn');
                    if (newLogoutBtn) {
                        newLogoutBtn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            if (window.AuthModule) {
                                try {
                                    await window.AuthModule.signOut();
                                    if (accountDropdown) accountDropdown.style.display = 'none';
                                    alert('Logged out successfully');
                                    location.reload();
                                } catch (err) {
                                    console.error('Logout error:', err);
                                    alert('Error logging out. Please try again.');
                                }
                            }
                        });
                    }
                }
            }

            // Toggle dropdown or show auth modal based on login status
            userButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Check if user is logged in
                const currentUser = window.AuthModule ? window.AuthModule.getCurrentUser() : null;
                
                if (currentUser) {
                    // Update dropdown menu before showing (in case it wasn't updated)
                    updateDropdownMenu(currentUser);
                    
                    // User is logged in, toggle dropdown
                    if (accountDropdown) {
                        const isVisible = accountDropdown.style.display === 'block';
                        accountDropdown.style.display = isVisible ? 'none' : 'block';
                    }
                } else {
                    // User is not logged in, show auth modal
                    if (window.AuthModule) {
                        window.AuthModule.openModal();
                    }
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (accountDropdown && !userButton.contains(e.target) && !accountDropdown.contains(e.target)) {
                    accountDropdown.style.display = 'none';
                }
            });

            // Handle logout (initial setup)
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    if (window.AuthModule) {
                        try {
                            await window.AuthModule.signOut();
                            if (accountDropdown) accountDropdown.style.display = 'none';
                            alert('Logged out successfully');
                            location.reload();
                        } catch (err) {
                            console.error('Logout error:', err);
                            alert('Error logging out. Please try again.');
                        }
                    }
                });
            }

            // Update UI based on auth state
            if (window.AuthModule) {
                window.AuthModule.onAuthStateChanged((user) => {
                    // Update dropdown menu based on user role
                    updateDropdownMenu(user);
                    
                    if (accountDropdown) {
                        // Hide dropdown when auth state changes
                        accountDropdown.style.display = 'none';
                    }
                    
                    // Update user button appearance
                    if (user && userButton) {
                        userButton.style.background = 'linear-gradient(135deg, #8b0000, #c0392b)';
                        userButton.querySelector('svg path').style.fill = 'white';
                        userButton.title = 'Account';
                    } else if (userButton) {
                        userButton.style.background = '';
                        userButton.querySelector('svg path').style.fill = '';
                        userButton.title = 'Sign in';
                    }
                });
            }
        })();