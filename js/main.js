// Global variables
let currentCategory = 'all';
let currentPage = 1;
const articlesPerPage = 6;
let filteredArticles = [];

// Initialize filteredArticles when articles data is available
function initializeFilteredArticles() {
    if (typeof articles !== 'undefined' && articles && articles.length > 0) {
        filteredArticles = [...articles];
    } else {
        filteredArticles = [];
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeFilters();
    initializeSearch();
    
    // Initialize filtered articles
    initializeFilteredArticles();
    
    // Only initialize article display and pagination on index page
    const pathname = window.location.pathname;
    const isIndexPage = pathname.includes('index.html') || 
                       pathname === '/' || 
                       pathname.endsWith('/') ||
                       (!pathname.includes('.html') && !pathname.includes('article'));
    
    if (isIndexPage) {
        // Ensure articles data is loaded before displaying
        function tryDisplayArticles() {
            if (typeof articles !== 'undefined' && articles && articles.length > 0) {
                initializeFilteredArticles();
                displayArticles();
                initializePagination();
            } else {
                // Wait for articles data to load
                setTimeout(tryDisplayArticles, 100);
            }
        }
        tryDisplayArticles();
    }
});

// Navigation initialization
function initializeNavigation() {
    // Category dropdown links
    const categoryLinks = document.querySelectorAll('.dropdown-menu a[data-category]');
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const category = link.getAttribute('data-category');
            filterByCategory(category);
        });
    });
}

// Filter initialization
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length === 0) return; // No filter buttons on article pages
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category');
            filterByCategory(category);
            
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;
    currentPage = 1;
    
    // Ensure articles data is available
    if (typeof articles === 'undefined' || !articles || articles.length === 0) {
        initializeFilteredArticles();
    }
    
    if (category === 'all') {
        filteredArticles = [...articles];
    } else {
        filteredArticles = articles.filter(article => article.category === category);
    }
    
    displayArticles();
    updatePagination();
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!searchInput || !searchBtn) return;
    
    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        
        // Check if we're on the article page or other non-index pages
        const isArticlePage = window.location.pathname.includes('article.html') || 
                             window.location.pathname.includes('about.html') || 
                             window.location.pathname.includes('contact.html');
        
        if (isArticlePage) {
            // Redirect to index page with search query
            if (query) {
                window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            } else {
                window.location.href = 'index.html';
            }
            return;
        }
        
        // On index page, perform search
        if (query === '') {
            if (currentCategory === 'all') {
                filteredArticles = [...articles];
            } else {
                filteredArticles = articles.filter(article => article.category === currentCategory);
            }
        } else {
            filteredArticles = articles.filter(article => {
                const matchesCategory = currentCategory === 'all' || article.category === currentCategory;
                const matchesSearch = 
                    article.title.toLowerCase().includes(query) ||
                    article.excerpt.toLowerCase().includes(query) ||
                    article.content.toLowerCase().includes(query);
                return matchesCategory && matchesSearch;
            });
        }
        
        currentPage = 1;
        displayArticles();
        updatePagination();
    };
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Check for search query in URL parameters (when redirected from other pages)
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('search');
    if (searchQuery && !window.location.pathname.includes('article.html')) {
        searchInput.value = searchQuery;
        performSearch();
    }
}

// Display articles
function displayArticles() {
    const articlesGrid = document.getElementById('articlesGrid');
    
    // Return early if articlesGrid doesn't exist (e.g., on article page)
    if (!articlesGrid) return;
    
    if (filteredArticles.length === 0) {
        articlesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem;">
                <h2 style="color: var(--primary-gold); margin-bottom: 1rem;">No articles found</h2>
                <p style="color: var(--text-light);">Try adjusting your search or filter criteria.</p>
            </div>
        `;
        return;
    }
    
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const articlesToShow = filteredArticles.slice(startIndex, endIndex);
    
    articlesGrid.innerHTML = articlesToShow.map(article => {
        const slug = generateSlug(article.title);
        return `
        <article class="article-card" onclick="window.location.href='article.html?name=${slug}'">
            <img src="${article.image}" alt="${article.title}" class="article-image">
            <div class="article-content">
                <div class="article-category">${categoryNames[article.category]}</div>
                <h2 class="article-title">${article.title}</h2>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-meta">
                    <span>${formatDate(article.date)}</span>
                </div>
            </div>
        </article>
    `;
    }).join('');
}

// Pagination
function initializePagination() {
    updatePagination();
}

function updatePagination() {
    const pagination = document.getElementById('pagination');
    
    // Return early if pagination doesn't exist (e.g., on article page)
    if (!pagination) return;
    
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            ‹
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span style="color: var(--text-light); padding: 0 0.5rem;">...</span>`;
        }
    }
    
    // Next button
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            ›
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    displayArticles();
    updatePagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Article page functionality
function loadArticle() {
    const urlParams = new URLSearchParams(window.location.search);
    const articleSlug = urlParams.get('name');
    const articleId = urlParams.get('id'); // Keep backward compatibility
    
    let article = null;
    
    if (articleSlug) {
        // Find article by slug
        article = articles.find(a => {
            const articleSlugGenerated = generateSlug(a.title);
            return articleSlugGenerated === articleSlug;
        });
    } else if (articleId) {
        // Fallback to ID for backward compatibility
        article = articles.find(a => a.id === parseInt(articleId));
    }
    
    if (!article && !articleSlug && !articleId) {
        const articlePage = document.querySelector('.article-page');
        if (articlePage) {
            articlePage.innerHTML = `
                <div style="text-align: center; padding: 4rem;">
                    <h1 style="color: var(--primary-gold);">Article Not Found</h1>
                    <p style="color: var(--text-light); margin-top: 1rem;">No article specified.</p>
                    <p style="color: var(--text-light); margin-top: 1rem;">
                        <a href="index.html" style="color: var(--primary-gold);">Return to Home</a>
                    </p>
                </div>
            `;
        }
        return;
    }
    
    if (!article) {
        const articlePage = document.querySelector('.article-page');
        if (articlePage) {
            articlePage.innerHTML = `
                <div style="text-align: center; padding: 4rem;">
                    <h1 style="color: var(--primary-gold);">Article Not Found</h1>
                    <p style="color: var(--text-light); margin-top: 1rem;">Could not find article with ${articleSlug ? 'slug: ' + articleSlug : 'ID: ' + articleId}</p>
                    <p style="color: var(--text-light); margin-top: 1rem;">
                        <a href="index.html" style="color: var(--primary-gold);">Return to Home</a>
                    </p>
                </div>
            `;
        }
        return;
    }
    
    const articleHeader = document.querySelector('.article-header');
    const articleBody = document.querySelector('.article-body');
    const productRecs = document.querySelector('.product-recommendations');
    
    if (articleHeader) {
        articleHeader.innerHTML = `
            <img src="${article.image}" alt="${article.title}" class="article-header-image">
            <h1>${article.title}</h1>
            <div class="article-header-meta">
                <span>${categoryNames[article.category]}</span>
                <span>${formatDate(article.date)}</span>
                <span>By ${article.author}</span>
            </div>
        `;
    }
    
    if (articleBody) {
        articleBody.innerHTML = article.content;
    }
    
    if (productRecs && article.products && article.products.length > 0) {
        productRecs.innerHTML = `
            <h2>Recommended Products</h2>
            <div class="products-grid">
                ${article.products.map(product => `
                    <div class="product-card">
                        <img src="${product.image}" alt="${product.name}" class="product-image">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    // Update page title
    document.title = `${article.title} - EverydayHaven`;
}

// Check if we're on article page and load article
function checkAndLoadArticle() {
    const pathname = window.location.pathname;
    const href = window.location.href;
    
    if (pathname.includes('article.html') || href.includes('article.html')) {
        // Ensure articles data is loaded
        if (typeof articles === 'undefined' || !articles || articles.length === 0) {
            // Wait a bit more for data.js to load
            setTimeout(checkAndLoadArticle, 200);
            return;
        }
        
        // Wait for DOM and articles data to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                loadArticle();
            });
        } else {
            // DOM is ready, load article
            loadArticle();
        }
    }
}

// Initialize article loading when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndLoadArticle);
} else {
    // DOM already loaded, check immediately
    checkAndLoadArticle();
}

