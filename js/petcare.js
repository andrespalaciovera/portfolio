'use strict';

// 1. Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// 2. Define the MatchMedia (The "Hybrid" Logic)
const mm = gsap.matchMedia();

/* =========================================================
   DESKTOP LOGIC (Min-Width: 768px)
   ========================================================= */
mm.add("(min-width: 768px)", () => {
    
    const panels = gsap.utils.toArray(".panel");
    const stepLinks = document.querySelectorAll(".nav-steps li a");
    const allLinks = document.querySelectorAll(".nav-steps li a, a.inline-link[href^='#']");

    panels.forEach((panel, i) => {
        
        const header = panel.querySelector(".section-header");
        const body = panel.querySelector(".section-body");

        // 1. Measure Header (Fixed width + margin)
        const headerWidth = header.offsetWidth + 50; 

        // 2. SMART MEASUREMENT (The Fix)
        // Instead of measuring the container box (which might have empty space),
        // we create a 'Range' that selects the actual text content and measures that.
        // Walk backwards from the last child to find the last VISIBLE element.
        // Empty elements like <p class="support-note"></p> have zero dimensions
        // and would cause amountToScroll to be 0, breaking the scroll for panels
        // like Ideate that trail off with empty placeholders.
        let lastItem = body.lastElementChild;
        while (lastItem && lastItem.previousElementSibling) {
            const rect = lastItem.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) break;
            lastItem = lastItem.previousElementSibling;
        }

        const range = document.createRange();
        range.selectNodeContents(lastItem);
        const textRect = range.getBoundingClientRect();
        
        const bodyRect = body.getBoundingClientRect();
        const realContentWidth = (textRect.right - bodyRect.left);

        // 3. Calculate Scroll
        const availableSpace = window.innerWidth - headerWidth;
        const amountToScroll = realContentWidth - availableSpace + 300; // +300px buffer

        console.log(`[petcare.js] Panel ${i} ("${panel.id || i}") | lastItem: .${lastItem.className} | realContentWidth: ${realContentWidth.toFixed(0)} | amountToScroll: ${amountToScroll.toFixed(0)}`);

        if (amountToScroll > 0) {
            gsap.to(body, {
                x: -amountToScroll, 
                ease: "none",       
                scrollTrigger: {
                    trigger: panel,
                    start: "top top", 
                    end: "+=" + amountToScroll, 
                    pin: true,        
                    scrub: 1,         
                    anticipatePin: 1,
                    invalidateOnRefresh: true 
                }
            });
        }

        // --- ACTIVE CLASS SPY ---
        ScrollTrigger.create({
            trigger: panel,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
                if (self.isActive) {
                    document.querySelectorAll(".nav-steps li").forEach(li => li.classList.remove("active"));
                    if (stepLinks[i]) stepLinks[i].parentElement.classList.add("active");
                }
            }
        });
    });

    // --- SMOOTH SCROLL ---
    allLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: { y: targetSection, autoKill: false },
                    ease: "power2.inOut"
                });
            }
        });
    });
});

/* =========================================================
   MOBILE LOGIC (Max-Width: 767px)
   - Stack panels on top of each other.
   - Animate "Next" button clicks.
   - Handles Bidirectional (Left/Right) sliding.
   ========================================================= */
mm.add("(max-width: 767px)", () => {
    
    const panels = document.querySelectorAll(".panel");
    const navLinks = document.querySelectorAll(".nav-steps li");
    let currentIndex = 0;

    // --- A. FIX SCROLLING ---
    // 1. Lock the main wrapper so the whole page doesn't bounce
    gsap.set("#main-wrapper", { 
        height: "100vh", 
        overflow: "hidden" 
    });

    // 2. Enable scrolling INSIDE the individual panels
    gsap.set(panels, { 
        position: "absolute", 
        top: 0, 
        left: 0, 
        width: "100%",
        height: "100%",       // Force full height
        overflowY: "auto",    // ALLOW VERTICAL SCROLLING
        zIndex: (i) => 10 - i,
        visibility: "hidden",
        x: "100%"
    });

    // --- B. Show the first panel immediately ---
    gsap.set(panels[0], { visibility: "visible", x: "0%" });
    updateNav(0);

    // --- C. FUNCTION: Transition between stages (Updated) ---
    function goToStage(index, scrollTargetElement = null) {
        if (index === currentIndex) {
            if (scrollTargetElement) {
                scrollTargetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            return;
        }

        const outgoing = panels[currentIndex];
        const incoming = panels[index];

        // 1. Determine Direction
        const direction = index > currentIndex ? 1 : -1;

        // 2. Set Start/End positions based on direction
        const xEnter = direction * 100;
        const xExit = direction * -100;

        // 3. Animate Out (The current one leaves)
        gsap.to(outgoing, { 
            x: xExit + "%", 
            duration: 0.5, 
            ease: "power2.inOut" 
        });

        // 4. Animate In (The new one enters)
        gsap.set(incoming, { visibility: "visible", x: xEnter + "%" });
        
        // Then slide it to the center
        gsap.to(incoming, { 
            x: "0%", 
            duration: 0.5, 
            ease: "power2.inOut",
            onComplete: () => {
                gsap.set(outgoing, { visibility: "hidden" });
                // Reset scroll position or scroll to target element
                if (scrollTargetElement) {
                    scrollTargetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    incoming.scrollTop = 0; 
                }
            }
        });

        currentIndex = index;
        updateNav(currentIndex);
    }

    // --- D. LISTENERS: "Next Stage" Buttons ---
    document.querySelectorAll(".next-stage-btn").forEach((btn, i) => {
        btn.addEventListener("click", () => {
            if (currentIndex < panels.length - 1) {
                goToStage(currentIndex + 1);
            }
        });
    });

    // --- E. LISTENERS: Navbar Links ---
    navLinks.forEach((link, i) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            goToStage(i);
        });
    });

    // 2. Inline Paragraph Links for Mobile (Fixed lookup parent container)
    document.querySelectorAll(".inline-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            
            // If it's a link to a section (starts with #)
            if (href && href.startsWith("#")) {
                e.preventDefault();
                
                const targetId = href.substring(1); // remove the #
                const targetElement = document.getElementById(targetId);
                const targetPanel = targetElement ? targetElement.closest('.panel') : null;

                if (targetPanel) {
                    const targetIndex = Array.from(panels).indexOf(targetPanel);
                    if (targetIndex !== -1) {
                        goToStage(targetIndex, targetElement);
                    }
                }
            }
        });
    });

    // Helper: Update Navbar Active State
    function updateNav(index) {
        navLinks.forEach(link => link.classList.remove("active"));
        if(navLinks[index]) navLinks[index].classList.add("active");
    }

    // --- F. NAVBAR AUTO-HIDE (Intersection Observer) ---
    const navbar = document.querySelector(".navbar");
        
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Button is visible -> Hide Navbar
                navbar.classList.add("nav-hidden");
            } else {
                // Button is gone -> Show Navbar
                navbar.classList.remove("nav-hidden");
            }
        });
    }, {
        root: null,
        threshold: 0.1, 
        rootMargin: "0px 0px -20px 0px"
    });

    // Start watching all next-stage buttons
    document.querySelectorAll(".next-stage-btn").forEach(btn => {
        observer.observe(btn);
    });

});

// Debug Log
console.log("[petcare.js] GSAP Logic Loaded");

/* =========================================================
   GLOBAL MODAL LOGIC
   - Opens modal from top.
   - Injects content dynamically based on ID.
   ========================================================= */

const modalOverlay = document.getElementById("global-modal");
const modalContainer = document.querySelector(".modal-container");
const modalTarget = document.getElementById("modal-target");
const modalTitle = document.querySelector(".modal-title");

// 1. OPEN MODAL FUNCTION
function openModal(contentId, titleText) {
    // A. Grab content from the hidden template
    const hiddenContent = document.getElementById(contentId);
    if (!hiddenContent) return console.error("Content not found:", contentId);
    
    // B. Inject content into the modal
    modalTarget.innerHTML = hiddenContent.innerHTML;
    if(titleText) modalTitle.innerText = titleText;

    // C. Show Overlay
    modalOverlay.classList.add("is-open");
    
    // D. Animate Container Drop-in (GSAP for smoothness)
    gsap.fromTo(modalContainer, 
        { y: -100, opacity: 0 }, 
        { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.2)" }
    );
}

// 2. CLOSE MODAL FUNCTION
function closeModal() {
    // Animate Out
    gsap.to(modalContainer, { 
        y: -50, 
        opacity: 0, 
        duration: 0.3, 
        ease: "power2.in",
        onComplete: () => {
            modalOverlay.classList.remove("is-open");
            modalTarget.innerHTML = ""; // Clear content
        }
    });
}

// 3. EVENT LISTENERS

// A. Watch for clicks on ANY element with class "modal-trigger"
document.addEventListener("click", (e) => {
    if (e.target.closest(".modal-trigger")) {
        const btn = e.target.closest(".modal-trigger");
        const contentId = btn.getAttribute("data-source");
        const title = btn.getAttribute("data-title");
        openModal(contentId, title);
    }
});

// B. Close Button
document.querySelector(".modal-close-btn").addEventListener("click", closeModal);

// C. Click Outside (Overlay Click)
modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
        closeModal();
    }
});

// D. Escape Key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("is-open")) {
        closeModal();
    }
});


/* =========================================================
   UNIVERSAL LIGHTBOX ENGINE (Desktop + Mobile Touch)
   ========================================================= */
/* =========================================================
   COMPLETE LIGHTBOX ENGINE (Zoom + Pan + Gallery)
   ========================================================= */
const lightbox = document.getElementById('image-lightbox');
const lbImg = document.getElementById('lightbox-image');
const lbClose = document.querySelector('.lightbox-close');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let isZoomed = false;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;
let currentGroup = [];
let currentIndexInGroup = 0;

// 1. OPEN LOGIC & GROUPING
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.image-user-journey img, .persona-card img, img.zoomable');
    if (trigger) {
        lbImg.src = trigger.src;
        resetLightbox();

        // Build the gallery group based on the section
        const parentSection = trigger.closest('.section-body');
        if (parentSection) {
            currentGroup = Array.from(parentSection.querySelectorAll('img.zoomable, .image-user-journey img, .persona-card img'));
            currentIndexInGroup = currentGroup.indexOf(trigger);
            
            // Show/Hide buttons if multiple images exist
            if (currentGroup.length > 1) {
                prevBtn.style.display = 'block';
                nextBtn.style.display = 'block';
            } else {
                prevBtn.style.display = 'none';
                nextBtn.style.display = 'none';
            }
        }

        lightbox.style.display = 'block';
        document.body.style.overflow = 'hidden';
        gsap.to(lightbox, {opacity: 1, duration: 0.3});
    }
});

function resetLightbox() {
    isZoomed = false;
    isDragging = false;
    translateX = 0;
    translateY = 0;
    lbImg.style.cursor = 'zoom-in';
    gsap.set(lbImg, { 
        x: 0, y: 0, scale: 1, xPercent: -50, yPercent: -50, 
        maxWidth: "90%", maxHeight: "90%", opacity: 1 
    });
}

// 2. GALLERY NAVIGATION
function changeImage(direction) {
    currentIndexInGroup += direction;
    if (currentIndexInGroup >= currentGroup.length) currentIndexInGroup = 0;
    if (currentIndexInGroup < 0) currentIndexInGroup = currentGroup.length - 1;

    const nextImg = currentGroup[currentIndexInGroup];
    
    gsap.to(lbImg, {
        opacity: 0, 
        duration: 0.2, 
        onComplete: () => {
            lbImg.src = nextImg.src;
            resetLightbox();
            gsap.to(lbImg, { opacity: 1, duration: 0.2 });
        }
    });
}

prevBtn.addEventListener('click', (e) => { e.stopPropagation(); changeImage(-1); });
nextBtn.addEventListener('click', (e) => { e.stopPropagation(); changeImage(1); });

// 3. ZOOM & PAN LOGIC (Core functionality)
const getCoords = (e) => {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
};

const startAction = (e) => {
    if (!isZoomed) return;
    isDragging = true;
    const coords = getCoords(e);
    startX = coords.x - translateX;
    startY = coords.y - translateY;
};

const moveAction = (e) => {
    if (!isDragging || !isZoomed) return;
    if (e.cancelable) e.preventDefault(); 
    const coords = getCoords(e);
    translateX = coords.x - startX;
    translateY = coords.y - startY;
    gsap.set(lbImg, { x: translateX, y: translateY });
};

const endAction = (e) => {
    const wasDragging = isDragging;
    isDragging = false;
    if (!wasDragging && e.target === lbImg) toggleZoom();
};

function toggleZoom() {
    isZoomed = !isZoomed;
    if (isZoomed) {
        const finalScale = window.innerWidth < 768 ? 1.3 : 1.8;
        gsap.to(lbImg, { scale: finalScale, maxWidth: "none", maxHeight: "none", duration: 0.4 });
        lbImg.style.cursor = 'grab';
    } else {
        resetLightbox();
    }
}

// 4. EVENT LISTENERS
lbImg.addEventListener('mousedown', startAction);
window.addEventListener('mousemove', moveAction);
window.addEventListener('mouseup', endAction);
lbImg.addEventListener('touchstart', startAction, { passive: false });
window.addEventListener('touchmove', moveAction, { passive: false });
window.addEventListener('touchend', endAction);

// Keyboard Support
document.addEventListener('keydown', (e) => {
    if (lightbox.style.display === 'block') {
        if (e.key === "ArrowRight") changeImage(1);
        if (e.key === "ArrowLeft") changeImage(-1);
        if (e.key === "Escape") closeLightbox();
    }
});

// 5. CLOSE LOGIC
function closeLightbox() {
    gsap.to(lightbox, {
        opacity: 0, duration: 0.2, onComplete: () => {
            lightbox.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
}

lbClose.onclick = closeLightbox;
lightbox.onclick = (e) => { if (e.target !== lbImg && e.target !== prevBtn && e.target !== nextBtn) closeLightbox(); };