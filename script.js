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

        // Note: Place Order button is handled in payment.js with full validation

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

        // Mobile Menu Toggle
        (function() {
            const hamburger = document.getElementById('hamburgerBtn');
            const navCenter = document.getElementById('navCenter');
            
            if (hamburger && navCenter) {
                hamburger.addEventListener('click', function(e) {
                    e.stopPropagation();
                    hamburger.classList.toggle('open');
                    navCenter.classList.toggle('open');
                });
                
                // Close menu when clicking on a nav link
                const navLinks = navCenter.querySelectorAll('a');
                navLinks.forEach(link => {
                    link.addEventListener('click', function() {
                        hamburger.classList.remove('open');
                        navCenter.classList.remove('open');
                    });
                });
                
                // Close menu when clicking outside
                document.addEventListener('click', function(e) {
                    if (!navCenter.contains(e.target) && !hamburger.contains(e.target)) {
                        hamburger.classList.remove('open');
                        navCenter.classList.remove('open');
                    }
                });
            }
        })();