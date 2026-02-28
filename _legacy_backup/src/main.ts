import './styles/input.css';

// TypeScript Interface for Window extensions
declare global {
    interface Window {
        openResume: () => void;
        copyEmail: (event: MouseEvent) => void;
        showContactPopup: (event: MouseEvent) => void;
        closeContactPopup: () => void;
        openProjectModal: (url: string, title: string) => void;
        closeProjectModal: () => void;
        openCertificateModal: () => void;
        openImageModal: (src: string, title: string) => void;
    }
}

// Certificate Data (Minimalist)
const certificates = [
    {
        title: "Unreal Engine 5 C++ Multiplayer Shooter",
        instructor: "Stephen Ulibarri",
        // Using static background logic in HTML, but we could dynamic swap if we wanted.
        // For now, HTML has a static background logo.
        desc: "Advanced C++ network programming. Implemented lag compensation, client-side prediction, extensive replication for weapons and projectiles, and matchmaking logic."
    },
    {
        title: "Unreal Engine 5: The Ultimate Game Developer Course",
        instructor: "Stephen Ulibarri",
        desc: "Comprehensive study of the engine's core C++ architecture, gameplay framework (GameMode, PlayerController, Pawn), and physics interactions."
    },
    {
        title: "Unreal Engine 5 Dedicated Servers with AWS & GameLift",
        instructor: "Stephen Ulibarri",
        desc: "Cloud infrastructure mastery. Building Unreal Engine from source for Linux servers, deploying to AWS GameLift, and setting up FlexMatch with Lambda backend."
    }
];

let currentCarouselIndex = 0;

// Landing page logic
async function init(): Promise<void> {
    // Initialize things if needed
}

// Helper functions for landing page UI
window.openResume = function (): void {
    window.open('resume/index.html', '_blank');
};

window.copyEmail = function (event: MouseEvent): void {
    event.preventDefault();
    const email = 'philippeho27@gmail.com';
    navigator.clipboard.writeText(email).then(() => {
        showToast('Copied to clipboard!');
    });
};

function showToast(message: string): void {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-2 rounded-full font-mono text-sm font-bold shadow-2xl transition-all duration-300 opacity-0 translate-y-4 pointer-events-none z-[100]';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove('opacity-0', 'translate-y-4');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        if (toast) {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-4');
        }
    }, 2000);
}

window.showContactPopup = function (event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const popup = document.querySelector('.contact-popup') as HTMLElement | null;
    if (popup) {
        popup.style.display = 'block';
    }
};

window.closeContactPopup = function (): void {
    const popup = document.querySelector('.contact-popup') as HTMLElement | null;
    if (popup) {
        popup.style.display = 'none';
    }
};

// --- Project Modal Logic ---

function resetModal(): void {
    const modal = document.getElementById('project-modal');
    const iframeContainer = document.getElementById('iframe-container');
    const carouselContainer = document.getElementById('carousel-container');
    const imageContainer = document.getElementById('image-viewer-container');
    const iframe = document.getElementById('project-iframe') as HTMLIFrameElement | null;
    const titleEl = document.getElementById('modal-title');
    const urlEl = document.getElementById('modal-url-display');

    if (!modal) return;

    modal.classList.add('hidden');
    modal.classList.remove('flex');
    if (iframe) iframe.src = 'about:blank';

    // Reset view toggle
    if (iframeContainer) iframeContainer.classList.add('hidden');
    if (carouselContainer) {
        carouselContainer.classList.add('hidden');
        carouselContainer.classList.remove('flex');
    }
    if (imageContainer) {
        imageContainer.classList.add('hidden');
        imageContainer.classList.remove('flex');
    }

    // Reset top bar
    if (titleEl) titleEl.textContent = 'Web Preview';
    if (urlEl) urlEl.parentElement?.classList.remove('hidden');

    document.body.style.overflow = '';
}

window.openProjectModal = function (url: string, title: string): void {
    resetModal(); // Ensure clean state

    const modal = document.getElementById('project-modal');
    const iframeContainer = document.getElementById('iframe-container');
    const iframe = document.getElementById('project-iframe') as HTMLIFrameElement | null;
    const titleEl = document.getElementById('modal-title');
    const urlEl = document.getElementById('modal-url-display');
    const spinner = document.getElementById('loading-spinner');
    const errorState = document.getElementById('modal-error');
    const externalLink = document.getElementById('modal-external-link') as HTMLAnchorElement | null;
    const retryBtn = document.getElementById('error-retry-btn');

    if (modal && iframe && titleEl && urlEl && spinner && errorState && iframeContainer) {
        // Mode Setup
        iframeContainer.classList.remove('hidden');
        if (urlEl) urlEl.parentElement?.classList.remove('hidden');

        // Logic
        errorState.classList.add('hidden');
        spinner.classList.remove('hidden');
        spinner.classList.add('flex');

        iframe.src = url;
        if (externalLink) externalLink.href = url;
        titleEl.textContent = title;
        urlEl.textContent = url.replace(/^https?:\/\//, '');

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';

        // Load Timeout
        const loadTimeout = setTimeout(() => {
            if (!spinner.classList.contains('hidden')) {
                spinner.classList.add('hidden');
                errorState.classList.remove('hidden');
            }
        }, 10000);

        iframe.onload = () => {
            clearTimeout(loadTimeout);
            spinner.classList.remove('flex');
            spinner.classList.add('hidden');
        };

        if (retryBtn) {
            retryBtn.onclick = () => {
                iframe.src = url;
                errorState.classList.add('hidden');
                spinner.classList.remove('hidden');
                spinner.classList.add('flex');
            };
        }
    }
};

window.closeProjectModal = function (): void {
    resetModal();
};

window.openImageModal = function (src: string, title: string): void {
    resetModal();

    const modal = document.getElementById('project-modal');
    const imageContainer = document.getElementById('image-viewer-container');
    const imgEl = document.getElementById('modal-single-image') as HTMLImageElement;
    const titleEl = document.getElementById('modal-title');
    const urlEl = document.getElementById('modal-url-display');

    if (modal && imageContainer && imgEl && titleEl) {
        // Mode Setup
        imageContainer.classList.remove('hidden');
        imageContainer.classList.add('flex');

        // Hide URL bar used for web preview
        if (urlEl) urlEl.parentElement?.classList.add('hidden');

        titleEl.textContent = title;
        imgEl.src = src;

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
}

// --- Carousel Logic (Minimalist) ---

window.openCertificateModal = function (): void {
    resetModal(); // Ensure clean state

    const modal = document.getElementById('project-modal');
    const carouselContainer = document.getElementById('carousel-container');
    const titleEl = document.getElementById('modal-title');
    const urlEl = document.getElementById('modal-url-display');

    if (modal && carouselContainer && titleEl) {
        // Mode Setup
        carouselContainer.classList.remove('hidden');
        carouselContainer.classList.add('flex');

        // Hide URL bar since it's local content
        if (urlEl) urlEl.parentElement?.classList.add('hidden');

        titleEl.textContent = 'Certifications & Coursework';

        // Reset index
        currentCarouselIndex = 0;
        updateCarousel();

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
    }
};

function updateCarousel(): void {
    const data = certificates[currentCarouselIndex];
    if (!data) return;

    // We removed 'carousel-image' container in HTML, so we don't set it here.
    // HTML has a static BG image.

    const titleEl = document.getElementById('carousel-title');
    const instructorEl = document.getElementById('carousel-instructor');
    const descEl = document.getElementById('carousel-desc');
    const dotsContainer = document.getElementById('carousel-dots');

    if (titleEl) titleEl.textContent = data.title;
    if (instructorEl) instructorEl.textContent = `Instructor: ${data.instructor}`;
    if (descEl) descEl.textContent = data.desc;

    // Update dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        certificates.forEach((_, idx) => {
            const dot = document.createElement('div');
            // Minimalist styling for dots: larger when active
            dot.className = `transition-all duration-300 rounded-full cursor-pointer border border-white/20 hover:border-white/60 ${idx === currentCarouselIndex ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-transparent'}`;
            dot.onclick = () => {
                currentCarouselIndex = idx;
                updateCarousel();
            };
            dotsContainer.appendChild(dot);
        });
    }
}

// Navigation Event Listeners
document.getElementById('carousel-prev')?.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent modal close
    currentCarouselIndex = (currentCarouselIndex - 1 + certificates.length) % certificates.length;
    updateCarousel();
});

document.getElementById('carousel-next')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentCarouselIndex = (currentCarouselIndex + 1) % certificates.length;
    updateCarousel();
});

// Touch / Swipe Logic
let touchStartX = 0;
let touchEndX = 0;

const carouselEl = document.getElementById('carousel-container');
if (carouselEl) {
    carouselEl.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselEl.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const threshold = 50;
    if (touchEndX < touchStartX - threshold) {
        // Swipe Left -> Next
        currentCarouselIndex = (currentCarouselIndex + 1) % certificates.length;
        updateCarousel();
    }
    if (touchEndX > touchStartX + threshold) {
        // Swipe Right -> Prev
        currentCarouselIndex = (currentCarouselIndex - 1 + certificates.length) % certificates.length;
        updateCarousel();
    }
}

// Global Event Listeners (Close popups etc)
document.addEventListener('click', (e: MouseEvent) => {
    const popup = document.querySelector('.contact-popup') as HTMLElement | null;
    const btn = document.getElementById('contact-info-btn');
    if (popup && popup.style.display === 'block' && !popup.contains(e.target as Node) && e.target !== btn) {
        window.closeContactPopup();
    }

    // Close project modal on backdrop click
    const modal = document.getElementById('project-modal');
    if (modal && !modal.classList.contains('hidden') && e.target === modal) {
        window.closeProjectModal();
    }
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('project-modal');
        if (modal && !modal.classList.contains('hidden')) {
            window.closeProjectModal();
        }
    }
    // Arrow keys for carousel support
    if (!document.getElementById('carousel-container')?.classList.contains('hidden')) {
        if (e.key === 'ArrowRight') {
            currentCarouselIndex = (currentCarouselIndex + 1) % certificates.length;
            updateCarousel();
        }
        if (e.key === 'ArrowLeft') {
            currentCarouselIndex = (currentCarouselIndex - 1 + certificates.length) % certificates.length;
            updateCarousel();
        }
    }
});

init();
