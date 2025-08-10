/* Government Job Portal - Static Site JavaScript */

// Global variables
let currentPage = 1;
let itemsPerPage = 12;
let filteredJobs = [];
let currentFilters = {
    search: '',
    agency: ''
};

// Agency colors
const agencyColors = {
    '기획재정부': '#2c5530',
    '행정안전부': '#1f4e79',
    '환경부': '#2d5016',
    '고용노동부': '#8b4513',
    '교육부': '#4a90e2',
    '과학기술정보통신부': '#6a1b9a',
    '외교부': '#d32f2f',
    '국방부': '#2e7d32',
    '법무부': '#7b1fa2',
    '보건복지부': '#00796b',
    '국토교통부': '#f57c00',
    '농림축산식품부': '#689f38'
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('정부 채용 정보 앱 시작');
    
    // Initialize data
    filteredJobs = [...jobsData];
    
    // Setup UI
    setupAgencySelect();
    setupEventListeners();
    
    // Display initial data
    displayJobs();
    updateStats();
    
    // Update last updated time
    document.getElementById('footer-updated').textContent = lastUpdated;
    
    console.log(`${jobsData.length}개 채용공고 로드 완료`);
}

function setupAgencySelect() {
    const agencySelect = document.getElementById('agency');
    
    agenciesList.forEach(agency => {
        const option = document.createElement('option');
        option.value = agency;
        option.textContent = agency;
        agencySelect.appendChild(option);
    });
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', debounce(applyFilters, 300));
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Agency select
    document.getElementById('agency').addEventListener('change', applyFilters);
    
    // Touch events for mobile
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
}

function applyFilters() {
    const searchValue = document.getElementById('search').value.toLowerCase().trim();
    const agencyValue = document.getElementById('agency').value;
    
    currentFilters.search = searchValue;
    currentFilters.agency = agencyValue;
    currentPage = 1;
    
    // Filter jobs
    filteredJobs = jobsData.filter(job => {
        const matchesSearch = !searchValue || 
            job.title.toLowerCase().includes(searchValue) ||
            job.agency.toLowerCase().includes(searchValue) ||
            (job.department && job.department.toLowerCase().includes(searchValue)) ||
            (job.position && job.position.toLowerCase().includes(searchValue));
        
        const matchesAgency = !agencyValue || job.agency === agencyValue;
        
        return matchesSearch && matchesAgency;
    });
    
    displayJobs();
    updateResultsTitle();
}

function resetFilters() {
    document.getElementById('search').value = '';
    document.getElementById('agency').value = '';
    currentFilters = { search: '', agency: '' };
    currentPage = 1;
    filteredJobs = [...jobsData];
    
    displayJobs();
    updateResultsTitle();
}

function displayJobs() {
    const container = document.getElementById('job-cards');
    const emptyState = document.getElementById('empty-state');
    
    if (filteredJobs.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('d-none');
        document.getElementById('pagination').innerHTML = '';
        return;
    }
    
    emptyState.classList.add('d-none');
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentJobs = filteredJobs.slice(startIndex, endIndex);
    
    // Generate job cards
    container.innerHTML = currentJobs.map(job => createJobCard(job)).join('');
    
    // Apply agency colors
    applyAgencyColors();
    
    // Update pagination
    updatePagination(totalPages);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createJobCard(job) {
    return `
        <div class="col-lg-6 col-xl-4 mb-4">
            <div class="card h-100 job-card" data-agency="${job.agency}">
                <div class="card-header d-flex justify-content-between align-items-start">
                    <span class="badge bg-primary agency-badge">${job.agency}</span>
                    ${job.deadline ? `<small class="text-muted"><i class="fas fa-calendar-alt me-1"></i>${job.deadline}</small>` : ''}
                </div>
                <div class="card-body">
                    <h6 class="card-title">${job.title}</h6>
                    ${job.department ? `<p class="text-muted mb-1"><i class="fas fa-sitemap me-1"></i>${job.department}</p>` : ''}
                    ${job.position ? `<p class="text-muted mb-1"><i class="fas fa-user-tie me-1"></i>${job.position}</p>` : ''}
                    ${job.employment_type ? `<p class="text-muted mb-2"><i class="fas fa-briefcase me-1"></i>${job.employment_type}</p>` : ''}
                    ${job.posted_date ? `<small class="text-muted"><i class="fas fa-clock me-1"></i>게시일: ${job.posted_date}</small>` : ''}
                </div>
                <div class="card-footer">
                    <a href="${job.url}" target="_blank" class="btn btn-outline-primary btn-sm w-100" 
                       title="${job.agency} 채용 공지사항 페이지로 이동">
                        <i class="fas fa-external-link-alt me-1"></i>${job.agency} 채용 페이지
                    </a>
                </div>
            </div>
        </div>
    `;
}

function applyAgencyColors() {
    const agencyBadges = document.querySelectorAll('.agency-badge');
    agencyBadges.forEach(badge => {
        const agency = badge.textContent.trim();
        if (agencyColors[agency]) {
            badge.style.backgroundColor = agencyColors[agency];
            badge.style.borderColor = agencyColors[agency];
        }
    });
    
    // Apply border colors to job cards
    const jobCards = document.querySelectorAll('.job-card');
    jobCards.forEach(card => {
        const agency = card.dataset.agency;
        if (agencyColors[agency]) {
            card.style.borderTopColor = agencyColors[agency];
            card.style.borderTopWidth = '3px';
        }
    });
}

function updatePagination(totalPages) {
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="goToPage(${currentPage - 1})">
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `;
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="goToPage(1)">1</button>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">…</span></li>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="goToPage(${i})">${i}</button>
            </li>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">…</span></li>';
        }
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="goToPage(${totalPages})">${totalPages}</button>
            </li>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `
            <li class="page-item">
                <button class="page-link" onclick="goToPage(${currentPage + 1})">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </li>
        `;
    }
    
    pagination.innerHTML = paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    displayJobs();
}

function updateResultsTitle() {
    const title = document.getElementById('results-title');
    if (currentFilters.search || currentFilters.agency) {
        title.textContent = `채용 공고 목록 (${filteredJobs.length}개 결과)`;
    } else {
        title.textContent = '채용 공고 목록';
    }
}

function updateStats() {
    document.getElementById('total-jobs').textContent = jobsData.length;
    document.getElementById('total-agencies').textContent = agenciesList.length;
}

function shareApp() {
    if (navigator.share) {
        navigator.share({
            title: '정부 기관 채용 정보',
            text: '정부 중앙부처의 채용 정보를 한눈에 확인하세요',
            url: window.location.href
        }).catch(console.error);
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('링크가 클립보드에 복사되었습니다!');
        }).catch(() => {
            alert('링크 복사에 실패했습니다.');
        });
    }
}

// Utility function: Debounce
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Service Worker registration (for PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('sw.js').then(function(registration) {
            console.log('SW 등록 성공:', registration.scope);
        }).catch(function(err) {
            console.log('SW 등록 실패:', err);
        });
    });
}

console.log('정부 채용 정보 앱 JavaScript 로드 완료');