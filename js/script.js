// 1. Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// 2. Define the MatchMedia (The "Hybrid" Logic)
let mm = gsap.matchMedia();

/* =========================================================
   DESKTOP LOGIC (Min-Width: 768px)
   ========================================================= */
mm.add("(min-width: 768px)", () => {
    
    const panels = gsap.utils.toArray(".panel");
    const navLinks = document.querySelectorAll(".nav-steps li a, a.inline-link[href^='#']");

    panels.forEach((panel, i) => {
        
        const header = panel.querySelector(".section-header");
        const body = panel.querySelector(".section-body");

        // 1. Measure Header (Fixed width + margin)
        const headerWidth = header.offsetWidth + 50; 

        // 2. SMART MEASUREMENT (The Fix)
        // Instead of measuring the container box (which might have empty space),
        // we create a 'Range' that selects the actual text content and measures that.
        const lastItem = body.lastElementChild; // The story-container
        const range = document.createRange();
        range.selectNodeContents(lastItem); // Select all text inside
        const textRect = range.getBoundingClientRect();
        
        // Use the text's edge, OR the container's edge (whichever is smaller)
        // This ensures we stop exactly at the text.
        const bodyRect = body.getBoundingClientRect();
        const realContentWidth = (textRect.right - bodyRect.left);

        // 3. Calculate Scroll
        const availableSpace = window.innerWidth - headerWidth;
        const amountToScroll = realContentWidth - availableSpace + 300; // +50px buffer

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

        // --- ACTIVE CLASS SPY (Unchanged) ---
        ScrollTrigger.create({
            trigger: panel,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
                if (self.isActive) {
                    document.querySelectorAll(".nav-steps li").forEach(li => li.classList.remove("active"));
                    if(navLinks[i]) navLinks[i].parentElement.classList.add("active");
                }
            }
        });
    });

    // --- SMOOTH SCROLL (Unchanged) ---
    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            gsap.to(window, {
                duration: 1.5,
                scrollTo: { y: targetSection, autoKill: false },
                ease: "power2.inOut"
            });
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
    function goToStage(index) {
        if (index === currentIndex) return;

        let outgoing = panels[currentIndex];
        let incoming = panels[index];

        // 1. Determine Direction
        // If index is higher (e.g. 1 -> 2), direction is 1 (Forward/Right)
        // If index is lower (e.g. 2 -> 1), direction is -1 (Backward/Left)
        const direction = index > currentIndex ? 1 : -1;

        // 2. Set Start/End positions based on direction
        const xEnter = direction * 100; // 100% or -100%
        const xExit = direction * -100; // -100% or 100%

        // 3. Animate Out (The current one leaves)
        gsap.to(outgoing, { 
            x: xExit + "%", 
            duration: 0.5, 
            ease: "power2.inOut" 
        });

        // 4. Animate In (The new one enters)
        // First, place it instantly at the starting position
        gsap.set(incoming, { visibility: "visible", x: xEnter + "%" });
        
        // Then slide it to the center
        gsap.to(incoming, { 
            x: "0%", 
            duration: 0.5, 
            ease: "power2.inOut",
            onComplete: () => {
                gsap.set(outgoing, { visibility: "hidden" });
                // Reset scroll position of the new panel to the top
                incoming.scrollTop = 0; 
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

    // 2. NEW: Inline Paragraph Links for Mobile
    document.querySelectorAll(".inline-link").forEach((link) => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            
            // If it's a link to a section (starts with #)
            if (href && href.startsWith("#")) {
                e.preventDefault();
                
                // Find which panel index matches this ID
                // We search through the 'panels' array to find the one with the matching ID
                const targetId = href.substring(1); // remove the #
                const targetIndex = Array.from(panels).findIndex(panel => panel.id === targetId);

                if (targetIndex !== -1) {
                    goToStage(targetIndex);
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
    // Defines when the navbar should hide behind the button
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
console.log("GSAP Logic Loaded");

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
const lightbox = document.getElementById('image-lightbox');
const lbImg = document.getElementById('lightbox-image');
const lbClose = document.querySelector('.lightbox-close');

let isZoomed = false;
let isDragging = false;
let startX, startY;
let translateX = 0, translateY = 0;

// 1. OPEN LOGIC
document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.image-user-journey img, .persona-card img, img.zoomable');
    if (trigger) {
        lbImg.src = trigger.src;
        resetLightbox();
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
    gsap.set(lbImg, { x: 0, y: 0, scale: 1, xPercent: -50, yPercent: -50, maxWidth: "90%", maxHeight: "90%" });
}

// --- HELPER: Get Coordinates for Mouse OR Touch ---
const getCoords = (e) => {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
};

// 2. INTERACTION START (MouseDown / TouchStart)
const startAction = (e) => {
    if (!isZoomed) return;
    isDragging = true;
    const coords = getCoords(e);
    startX = coords.x - translateX;
    startY = coords.y - translateY;
};

// 3. INTERACTION MOVE (MouseMove / TouchMove)
const moveAction = (e) => {
    if (!isDragging || !isZoomed) return;
    // Prevent mobile from scrolling the page while dragging the image
    if (e.cancelable) e.preventDefault(); 

    const coords = getCoords(e);
    translateX = coords.x - startX;
    translateY = coords.y - startY;

    gsap.set(lbImg, { x: translateX, y: translateY });
};

// 4. INTERACTION END (MouseUp / TouchEnd)
const endAction = (e) => {
    const wasDragging = isDragging;
    isDragging = false;

    // If it was just a tap/click (hardly any movement), toggle zoom
    if (!wasDragging || (Math.abs(translateX) < 5 && Math.abs(translateY) < 5)) {
        if (e.target === lbImg) toggleZoom();
    }
};

// --- EVENT LISTENERS (Mouse + Touch) ---
lbImg.addEventListener('mousedown', startAction);
window.addEventListener('mousemove', moveAction);
window.addEventListener('mouseup', endAction);

lbImg.addEventListener('touchstart', startAction, { passive: false });
window.addEventListener('touchmove', moveAction, { passive: false });
window.addEventListener('touchend', endAction);

function toggleZoom() {
    isZoomed = !isZoomed;
    
    if (isZoomed) {
        // SMART SCALE: Use 1.5x for mobile, 2.5x for desktop
        const finalScale = window.innerWidth < 768 ? 1.3 : 1.8;
        
        gsap.to(lbImg, {
            scale: finalScale,
            maxWidth: "none",
            maxHeight: "none",
            duration: 0.4,
            ease: "power2.out"
        });
        lbImg.style.cursor = 'grab';
    } else {
        resetLightbox();
    }
}

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
lightbox.onclick = (e) => { if (e.target !== lbImg) closeLightbox(); };