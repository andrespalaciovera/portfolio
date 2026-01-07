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

        // 1. Measure the static Header width
        const headerWidth = header ? header.offsetWidth + 50 : 0; 

        // 2. NEW DYNAMIC MEASUREMENT
        // Instead of measuring just the last item, we get the total 
        // scrollable width of everything inside .section-body
        const totalContentWidth = body.scrollWidth;
        
        // 3. Calculate Scroll Distance
        // How much of the content is actually 'overflowing' the screen?
        const availableSpace = window.innerWidth - headerWidth;
        const amountToScroll = totalContentWidth - availableSpace + 100; // 100px extra buffer

        if (amountToScroll > 0) {
            gsap.to(body, {
                x: -amountToScroll, 
                ease: "none",       
                scrollTrigger: {
                    trigger: panel,
                    start: "top top", 
                    end: () => "+=" + amountToScroll, 
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
                    if(navLinks[i]) navLinks[i].parentElement.classList.add("active");
                }
            }
        });
    });

    // --- SMOOTH SCROLL ---
    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href");
            const targetSection = document.querySelector(targetId);
            if(targetSection) {
                gsap.to(window, {
                    duration: 1.5,
                    scrollTo: { y: targetSection, autoKill: false },
                    ease: "power2.inOut"
                });
            }
        });
    });

    /* =========================================================
   PHYSICS-BASED GLITCH (Velocity Reactive)
   - Distortion intensity depends on mouse speed.
   - Direction affects the noise "stretch".
   - Settles to zero when mouse stops.
   ========================================================= */
console.log("Physics Glitch Logic Starting...");

const glitchTitles = document.querySelectorAll(".mega-title");
const displacementMap = document.querySelector("#liquid-disp"); 
const turbulence = document.querySelector("#liquid-glitch feTurbulence");

if (displacementMap && turbulence && glitchTitles.length > 0) {

    // 1. SPLIT TEXT INTO SPANS (Setup)
    glitchTitles.forEach(title => {
        const text = title.innerText;
        const chars = text.split("").map(char => 
            char === " " ? `<span class="char">&nbsp;</span>` : `<span class="char">${char}</span>`
        ).join("");
        title.innerHTML = chars;
    });

    // 2. THE PHYSICS ENGINE
    // We create a proxy object to hold our "target" values.
    // GSAP will tween these numbers smoothly, and the Ticker will apply them.
    let proxy = {
        skew: 0,
        scale: 0,
        freqX: 0.01,
        freqY: 0.4
    };

    // This tracks the raw mouse velocity
    let lastMouseX = 0;
    let lastMouseY = 0;

    // 3. MOUSE VELOCITY TRACKER (Updated for Directional Smear)
    window.addEventListener("mousemove", (e) => {
        
        // A. Calculate Speed & Direction
        const dx = e.clientX - lastMouseX;
        const dy = e.clientY - lastMouseY;
        const speed = Math.sqrt(dx * dx + dy * dy);

        // B. Update Last Position
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        // C. Calculate Intensity
        // Cap the speed at 150 to prevent total explosion
        const targetScale = Math.min(speed * 4, 150); 
        
        // D. DIRECTIONAL LOGIC (The Fix)
        // Check if movement is mostly Vertical or Horizontal
        const isVertical = Math.abs(dy) > Math.abs(dx);

        let targetFreqX, targetFreqY;

        if (isVertical) {
            // MOVING UP/DOWN -> VERTICAL SMEAR
            // High X freq breaks lines horizontally. Low Y freq stretches them vertically.
            targetFreqX = 0.3;  
            targetFreqY = 0.005; 
        } else {
            // MOVING LEFT/RIGHT -> HORIZONTAL SMEAR
            // Low X freq stretches horizontally. High Y freq breaks vertical structure.
            targetFreqX = 0.005; 
            targetFreqY = 0.3;
        }

        // E. Animate the Proxy
        gsap.to(proxy, {
            scale: targetScale,
            freqX: targetFreqX,
            freqY: targetFreqY,
            duration: 0.4,       // Slightly faster reaction
            ease: "power2.out", 
            overwrite: true
        });

        // F. Return to rest (Zero distortion)
        gsap.to(proxy, {
            scale: 0,
            freqX: 0.01, 
            freqY: 0.01, // Balanced rest state
            delay: 0.1,
            duration: 0.6,
            ease: "power2.out"
        });
    });

    // 4. THE RENDER LOOP (Syncs JS values to HTML SVG)
    // We use gsap.ticker to update the filter efficiently on every frame
    gsap.ticker.add(() => {
        // Apply the smooth proxy values to the SVG attributes
        displacementMap.setAttribute("scale", proxy.scale);
        turbulence.setAttribute("baseFrequency", `${proxy.freqX} ${proxy.freqY}`);
    });

   // 5. HOVER HANDOFF (With Decay Delay)
    const allChars = document.querySelectorAll(".mega-title .char");

    allChars.forEach(char => {
        // We attach the timer to the element itself so we can cancel it cleanly
        char.leaveTimer = null; 

        char.addEventListener("mouseenter", () => {
            // 1. If we were about to turn it off, cancel that! We are back.
            if (char.leaveTimer) {
                char.leaveTimer.kill();
                char.leaveTimer = null;
            }

            // 2. Make sure filter is applied
            gsap.set(char, { filter: "url(#liquid-glitch)" });
        });

        char.addEventListener("mouseleave", () => {
            // 3. Instead of removing immediately, wait for the physics to settle.
            // We use 0.5s because that matches the "duration" in the mousemove logic.
            char.leaveTimer = gsap.delayedCall(0.5, () => {
                gsap.set(char, { filter: "none" });
                char.leaveTimer = null;
            });
        });
    });

} else {
    console.warn("Glitch elements missing from DOM");
}

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


/* =========================================================
   PAGE TRANSITION LOGIC (Global)
   ========================================================= */
console.log("Page Transition Logic Loaded");

document.addEventListener("click", (e) => {
    // 1. Look for a click on an A tag inside a glass-card
    const link = e.target.closest(".glass-card-standalone a");

    // 2. Only proceed if we found a link AND it has an href
    if (link && link.href) {
        
        console.log("Link Clicked:", link.href);

        e.preventDefault(); 
        const targetUrl = link.href;
        const curtain = document.querySelector(".page-transition-curtain");

        if (curtain) {
            gsap.to(curtain, {
                opacity: 1,
                duration: 0.8,
                ease: "power2.inOut",
                onStart: () => {
                    // Block clicks while fading
                    curtain.style.pointerEvents = "auto"; 
                },
                onComplete: () => {
                    window.location.href = targetUrl;
                }
            });
        } else {
            window.location.href = targetUrl;
        }
    }
});