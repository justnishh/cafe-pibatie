// Google Analytics Event Tracking for Cafe Pibatie

// Track all link clicks
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    
    const href = link.href || '';
    const text = link.textContent?.trim() || '';
    
    // Track Zomato clicks
    if (href.includes('zomato.com')) {
        gtag('event', 'click', {
            event_category: 'External Link',
            event_label: 'Zomato - ' + text,
            transport_type: 'beacon'
        });
    } 
    // Track Swiggy clicks
    else if (href.includes('swiggy.com')) {
        gtag('event', 'click', {
            event_category: 'External Link',
            event_label: 'Swiggy - ' + text,
            transport_type: 'beacon'
        });
    } 
    // Track Instagram
    else if (href.includes('instagram.com')) {
        gtag('event', 'click', {
            event_category: 'External Link',
            event_label: 'Instagram',
            transport_type: 'beacon'
        });
    } 
    // Track Facebook
    else if (href.includes('facebook.com')) {
        gtag('event', 'click', {
            event_category: 'External Link',
            event_label: 'Facebook',
            transport_type: 'beacon'
        });
    } 
    // Track Google Maps
    else if (href.includes('maps.google')) {
        gtag('event', 'click', {
            event_category: 'External Link',
            event_label: 'Google Maps - Directions',
            transport_type: 'beacon'
        });
    } 
    // Track Table Booking
    else if (href.includes('zomato.com') && href.includes('/book')) {
        gtag('event', 'click', {
            event_category: 'Booking',
            event_label: 'Table Booking',
            transport_type: 'beacon'
        });
    } 
    // Track Phone calls
    else if (href.startsWith('tel:')) {
        gtag('event', 'click', {
            event_category: 'Contact',
            event_label: 'Phone Call - ' + href.replace('tel:', ''),
            transport_type: 'beacon'
        });
    }
});

// Track CTA buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.cta__button, .order-platform__btn');
    if (btn) {
        const text = btn.textContent?.trim() || '';
        gtag('event', 'click', {
            event_category: 'CTA Button',
            event_label: text,
            transport_type: 'beacon'
        });
    }
});

// Track scroll depth
let scroll25 = false, scroll50 = false, scroll75 = false, scroll100 = false;
window.addEventListener('scroll', () => {
    const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    if (scrollPercent >= 25 && !scroll25) {
        scroll25 = true;
        gtag('event', 'scroll', {
            event_category: 'Engagement',
            event_label: '25% Scroll'
        });
    }
    if (scrollPercent >= 50 && !scroll50) {
        scroll50 = true;
        gtag('event', 'scroll', {
            event_category: 'Engagement',
            event_label: '50% Scroll'
        });
    }
    if (scrollPercent >= 75 && !scroll75) {
        scroll75 = true;
        gtag('event', 'scroll', {
            event_category: 'Engagement',
            event_label: '75% Scroll'
        });
    }
    if (scrollPercent >= 95 && !scroll100) {
        scroll100 = true;
        gtag('event', 'scroll', {
            event_category: 'Engagement',
            event_label: '95% Scroll - Finished'
        });
    }
});

// Track menu tab clicks
document.addEventListener('click', (e) => {
    const tab = e.target.closest('.beverage-tab');
    if (tab) {
        const tabName = tab.textContent?.trim() || tab.dataset.tab;
        const parent = tab.closest('.beverage-menu, .menu-section');
        const section = parent?.classList.contains('beverage-menu') ? 'Beverages' : 'Food';
        gtag('event', 'click', {
            event_category: 'Menu Tab',
            event_label: section + ' - ' + tabName
        });
    }
});

// Track section views (when user scrolls to section)
const sections = ['story', 'menu', 'ambiance', 'locations', 'reviews'];
const observedSections = new Set();

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !observedSections.has(entry.target.id)) {
            observedSections.add(entry.target.id);
            gtag('event', 'view_section', {
                event_category: 'Navigation',
                event_label: entry.target.id
            });
        }
    });
}, { threshold: 0.5 });

sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
});
