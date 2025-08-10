// Service Worker for Government Job Portal PWA

const CACHE_NAME = 'gov-jobs-v2.0';
const CACHE_STATIC = 'gov-jobs-static-v2.0';
const CACHE_DATA = 'gov-jobs-data-v2.0';

// Static files to cache immediately
const urlsToCache = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.svg',
    './icon-512.svg'
];

// External resources to cache
const externalResources = [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
    'https://cdn.replit.com/agent/bootstrap-agent-dark-theme.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js'
];

// Data files that change frequently
const dataFiles = [
    './jobs_data.js'
];

// Install event
self.addEventListener('install', function(event) {
    console.log('[Service Worker] 설치 시작');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(CACHE_STATIC).then(cache => {
                console.log('[Service Worker] 정적 파일 캐시 중');
                return cache.addAll(urlsToCache.concat(externalResources));
            }),
            // Cache data files
            caches.open(CACHE_DATA).then(cache => {
                console.log('[Service Worker] 데이터 파일 캐시 중');
                return cache.addAll(dataFiles);
            })
        ]).then(() => {
            console.log('[Service Worker] 설치 완료');
            return self.skipWaiting();
        })
    );
});

// Fetch event
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                // Cache hit - return response
                if (response) {
                    console.log('[Service Worker] 캐시에서 반환:', event.request.url);
                    return response;
                }
                
                // Network request
                return fetch(event.request)
                    .then(function(response) {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        var responseToCache = response.clone();
                        
                        // Determine which cache to use
                        let cacheName = CACHE_STATIC;
                        if (event.request.url.includes('jobs_data.js')) {
                            cacheName = CACHE_DATA;
                        }
                        
                        // Add to cache
                        caches.open(cacheName)
                            .then(function(cache) {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(function() {
                        // Return offline page if available
                        if (event.request.destination === 'document') {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Activate event
self.addEventListener('activate', function(event) {
    console.log('[Service Worker] 활성화');
    
    event.waitUntil(
        Promise.all([
            // Clean old caches
            caches.keys().then(function(cacheNames) {
                return Promise.all(
                    cacheNames.map(function(cacheName) {
                        if (cacheName !== CACHE_STATIC && cacheName !== CACHE_DATA) {
                            console.log('[Service Worker] 이전 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all pages
            self.clients.claim()
        ])
    );
});

// Background sync for data updates
self.addEventListener('sync', function(event) {
    if (event.tag === 'background-sync') {
        console.log('[Service Worker] 백그라운드 동기화');
        event.waitUntil(updateJobsData());
    }
});

// Update jobs data
function updateJobsData() {
    return fetch('./jobs_data.js')
        .then(response => {
            if (response.ok) {
                return caches.open(CACHE_DATA).then(cache => {
                    cache.put('./jobs_data.js', response.clone());
                    console.log('[Service Worker] 채용 데이터 업데이트됨');
                    return response;
                });
            }
        })
        .catch(err => {
            console.log('[Service Worker] 데이터 업데이트 실패:', err);
        });
}

// Message handler for manual updates
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'UPDATE_DATA') {
        updateJobsData().then(() => {
            event.ports[0].postMessage({success: true});
        });
    }
});

console.log('[Service Worker] 정부 채용 정보 Service Worker 로드 완료');