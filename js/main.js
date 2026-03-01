document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            // Skip external links
            if (!href || href.StartsWith('http') || href.StartsWith('//')) return;
            e.preventDefault();
            const target = document.querySelector(href);
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

    // Initialize reviews carousel after content loads
    initReviewsCarousel();
});

function initReviewsCarousel() {
    const reviewsContainer = document.querySelector('.reviews__grid');
    const reviewsArrowPrev = document.querySelector('.reviews__arrow--prev');
    const reviewsArrowNext = document.querySelector('.reviews__arrow--next');
    
    // Wait for reviews to be rendered
    const checkReviews = setInterval(() => {
        const reviewCards = document.querySelectorAll('.reviews__grid .review-card');
        if (reviewCards.length > 0) {
            clearInterval(checkReviews);
            setupCarousel(reviewsContainer, reviewsArrowPrev, reviewsArrowNext, reviewCards);
        }
    }, 100);
    
    // Timeout after 3 seconds
    setTimeout(() => clearInterval(checkReviews), 3000);
}

function setupCarousel(reviewsContainer, reviewsArrowPrev, reviewsArrowNext, reviewCards) {
    if (!reviewsContainer || !reviewsArrowPrev || !reviewsArrowNext || reviewCards.length === 0) {
        return;
    }
    
    const totalCards = reviewCards.length;
    
    function getCardsToShow() {
        if (window.innerWidth > 1024) return 4;
        if (window.innerWidth > 600) return 2;
        return 1;
    }
    
    let scrollAmount = 0;
    const cardWidth = reviewCards[0].offsetWidth + 16;
    
    reviewsArrowNext.addEventListener('click', function(e) {
        e.preventDefault();
        const cardsToShow = getCardsToShow();
        const maxScroll = (totalCards - cardsToShow) * cardWidth;
        
        scrollAmount += cardWidth * cardsToShow;
        
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
        
        for (let i = 0; i < cardsToShow; i++) {
            const clone = reviewCards[i].cloneNode(true);
            clone.classList.add('clone');
            reviewsContainer.appendChild(clone);
        }
        
        for (let i = totalCards - cardsToShow; i < totalCards; i++) {
            const clone = reviewCards[i].cloneNode(true);
            clone.classList.add('clone');
            reviewsContainer.insertBefore(clone, reviewCards[0]);
        }
        
        setTimeout(() => {
            const cloneWidth = cardsToShow * cardWidth;
            reviewsContainer.scrollLeft = cloneWidth;
            scrollAmount = cloneWidth;
        }, 10);
    }
    
    setupInfiniteScroll();
    
    reviewsContainer.addEventListener('scroll', function() {
        const cloneWidth = getCardsToShow() * cardWidth;
        
        if (reviewsContainer.scrollLeft >= reviewsContainer.scrollWidth - reviewsContainer.clientWidth - 10) {
            reviewsContainer.scrollLeft = cloneWidth;
            scrollAmount = cloneWidth;
        }
        
        if (reviewsContainer.scrollLeft <= 0) {
            reviewsContainer.scrollLeft = reviewsContainer.scrollWidth - reviewsContainer.clientWidth - cloneWidth;
            scrollAmount = reviewsContainer.scrollWidth - reviewsContainer.clientWidth - cloneWidth;
        }
    });
    
    window.addEventListener('resize', function() {
        reviewsContainer.innerHTML = '';
        reviewCards.forEach(card => reviewsContainer.appendChild(card));
        setupInfiniteScroll();
    });
}

