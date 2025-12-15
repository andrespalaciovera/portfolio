// 1. Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

// 2. Define the MatchMedia (The "Hybrid" Logic)
let mm = gsap.matchMedia();

/* =========================================================
   DESKTOP LOGIC (Min-Width: 768px)
   - "Pin" the section.
   - Move content horizontally based on scroll.
   ========================================================= */
mm.add("(min-width: 768px)", () => {
    
    // Select all your sections
    const panels = gsap.utils.toArray(".panel");

    panels.forEach((panel, i) => {
        
        // Find the content wrapper inside this specific panel
        const content = panel.querySelector(".panel-content");
        
        // Calculate how wide the content is (so we know how far to scroll)
        // We subtract window.innerWidth so we stop exactly at the right edge
        const amountToScroll = content.scrollWidth - window.innerWidth;

        // Only create the animation if the content is actually wider than the screen
        if (amountToScroll > 0) {
            
            gsap.to(content, {
                x: -amountToScroll, // Move content to the left
                ease: "none",       // Linear movement (no easing) feels more like native scroll
                scrollTrigger: {
                    trigger: panel,
                    start: "top top", // When top of panel hits top of viewport
                    end: "+=" + amountToScroll, // Scroll distance equals content width
                    pin: true,        // Lock the screen in place
                    scrub: 1,         // Smooth out the scrubbing (1 second lag)
                    anticipatePin: 1
                }
            });
        }
    });
});

/* =========================================================
   MOBILE LOGIC (Max-Width: 767px)
   - Stack panels on top of each other.
   - Animate "Next" button clicks.
   ========================================================= */
mm.add("(max-width: 767px)", () => {
    
    const panels = document.querySelectorAll(".panel");
    const navLinks = document.querySelectorAll(".nav-steps li");
    let currentIndex = 0;

    // --- A. FIX SCROLLING (THE NEW PART) ---
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

    // --- C. FUNCTION: Transition between stages ---
    function goToStage(index) {
        if (index === currentIndex) return;

        let outgoing = panels[currentIndex];
        let incoming = panels[index];

        // 1. Animate Out (Slide Left)
        gsap.to(outgoing, { x: "-100%", duration: 0.5, ease: "power2.inOut" });

        // 2. Animate In (From Right)
        gsap.set(incoming, { visibility: "visible", x: "100%" });
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

    // Helper: Update Navbar Active State
    function updateNav(index) {
        navLinks.forEach(link => link.classList.remove("active"));
        if(navLinks[index]) navLinks[index].classList.add("active");
    }
});

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
    threshold: 0.1, // Trigger when 10% of the button is visible
    rootMargin: "0px 0px -20px 0px" // Trigger slightly before it hits bottom
});

// Start watching all next-stage buttons
document.querySelectorAll(".next-stage-btn").forEach(btn => {
    observer.observe(btn);
});

// Debug Log
console.log("GSAP Logic Loaded");