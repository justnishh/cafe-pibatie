document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Beverage Menu Tabs - handle both Beverages and Food Menu sections separately
    document.querySelectorAll('.beverage-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = tab.dataset.tab;
            const parentSection = tab.closest('.beverage-menu, .menu-section');
            
            // Update tab active state within same section only
            parentSection.querySelectorAll('.beverage-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show target panel within same section only
            parentSection.querySelectorAll('.beverage-panel').forEach(panel => panel.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Mega Menu toggle
    window.toggleMenu = function() {
        const menu = document.getElementById('megaMenu');
        const hamburger = document.querySelector('.nav__hamburger');
        const isActive = menu.classList.toggle('active');
        hamburger.setAttribute('aria-expanded', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    };

    // Menu item popup
    const popup = document.getElementById('menuPopup');
    const popupImage = document.getElementById('popupImage');
    const popupLabel = document.getElementById('popupLabel');

    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', () => {
            const img = item.querySelector('img');
            const sectionTitle = item.closest('.menu-section').querySelector('.menu-section__title').textContent;
            popupImage.src = img.src;
            popupLabel.textContent = sectionTitle;
            popup.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePopup();
        }
    });

    window.closePopup = function() {
        popup.classList.remove('active');
        document.body.style.overflow = '';
    };

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.menu-card, .location-card, .story__text').forEach(el => {
        observer.observe(el);
    });

    // Navigation background on scroll
    const nav = document.querySelector('.nav');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            nav.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });

    // Mobile menu toggle (can be expanded)
    console.log('Cafe Pibatie website initialized');

    // Reviews Carousel - Smooth Scroll with Infinite Loop
    const reviewsContainer = document.querySelector('.reviews__grid');
    const reviewsArrowPrev = document.querySelector('.reviews__arrow--prev');
    const reviewsArrowNext = document.querySelector('.reviews__arrow--next');
    
    if (reviewsContainer && reviewsArrowPrev && reviewsArrowNext) {
        const reviewCards = Array.from(reviewsContainer.querySelectorAll('.review-card'));
        const totalCards = reviewCards.length;
        
        function getCardsToShow() {
            if (window.innerWidth > 1024) return 4;
            if (window.innerWidth > 600) return 2;
            return 1;
        }
        
        let scrollAmount = 0;
        const cardWidth = reviewCards[0].offsetWidth + 16; // including gap
        
        reviewsArrowNext.addEventListener('click', function(e) {
            e.preventDefault();
            const cardsToShow = getCardsToShow();
            const maxScroll = (totalCards - cardsToShow) * cardWidth;
            
            scrollAmount += cardWidth * cardsToShow;
            
            // If reached end, reset to 0 for infinite loop effect
            if (scrollAmount > maxScroll) {
                scrollAmount = 0;
            }
            
            reviewsContainer.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        reviewsArrowPrev.addEventListener('click', function(e) {
            e.preventDefault();
            const cardsToShow = getCardsToShow();
            const maxScroll = (totalCards - cardsToShow) * cardWidth;
            
            scrollAmount -= cardWidth * cardsToShow;
            
            // If at start, go to end for infinite loop
            if (scrollAmount < 0) {
                scrollAmount = maxScroll;
            }
            
            reviewsContainer.scrollTo({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });
        
        // Clone cards for infinite scroll effect
        function setupInfiniteScroll() {
            const cardsToShow = getCardsToShow();
            
            // Clone first few cards for smooth infinite loop
            for (let i = 0; i < cardsToShow; i++) {
                const clone = reviewCards[i].cloneNode(true);
                clone.classList.add('clone');
                reviewsContainer.appendChild(clone);
            }
            
            // Clone last few cards to the beginning
            for (let i = totalCards - cardsToShow; i < totalCards; i++) {
                const clone = reviewCards[i].cloneNode(true);
                clone.classList.add('clone');
                reviewsContainer.insertBefore(clone, reviewCards[0]);
            }
            
            // Adjust scroll position to show actual first card
            setTimeout(() => {
                const cloneWidth = cardsToShow * cardWidth;
                reviewsContainer.scrollLeft = cloneWidth;
                scrollAmount = cloneWidth;
            }, 10);
        }
        
        setupInfiniteScroll();
        
        // Handle scroll to create infinite loop
        reviewsContainer.addEventListener('scroll', function() {
            const cloneWidth = getCardsToShow() * cardWidth;
            const maxScroll = reviewsContainer.scrollWidth - reviewsContainer.clientWidth;
            
            // If scrolled past all original cards, jump back to start
            if (reviewsContainer.scrollLeft >= reviewsContainer.scrollWidth - reviewsContainer.clientWidth - 10) {
                reviewsContainer.scrollLeft = cloneWidth;
                scrollAmount = cloneWidth;
            }
            
            // If scrolled before cloned cards, jump to end
            if (reviewsContainer.scrollLeft <= 0) {
                reviewsContainer.scrollLeft = reviewsContainer.scrollWidth - reviewsContainer.clientWidth - cloneWidth;
                scrollAmount = reviewsContainer.scrollWidth - reviewsContainer.clientWidth - cloneWidth;
            }
        });
        
        // Update on resize
        window.addEventListener('resize', function() {
            reviewsContainer.innerHTML = '';
            reviewCards.forEach(card => reviewsContainer.appendChild(card));
            setupInfiniteScroll();
        });
    }
});
