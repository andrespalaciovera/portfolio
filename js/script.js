// 1. Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

// 2. Define the MatchMedia (The "Hybrid" Logic)
let mm = gsap.matchMedia();

/* =========================================================
   DESKTOP LOGIC (Min-Width: 768px)
   - "Pin" the section.
   - FIXED HEADER.
   - SCROLLING BODY (Exact Content Measurement).
   ========================================================= */
mm.add("(min-width: 768px)", () => {
    
    const panels = gsap.utils.toArray(".panel");
    const navLinks = document.querySelectorAll(".nav-steps li a");

    panels.forEach((panel, i) => {
        
        const header = panel.querySelector(".section-header");
        const body = panel.querySelector(".section-body");

        // 1. Measure the Header
        // We include its width + its right margin (50px from your CSS)
        const headerWidth = header.offsetWidth + 50;

        // 2. Measure the "Real" Content Width
        // Instead of asking the body how wide it is (which gives wrong answers),
        // we find the last item inside and ask where IT ends.
        const lastItem = body.lastElementChild; 
        const bodyRect = body.getBoundingClientRect();
        const lastItemRect = lastItem.getBoundingClientRect();
        
        // This calculates exactly how many pixels of content you actually have
        const realContentWidth = lastItemRect.right - bodyRect.left;

        // 3. Calculate Scroll Distance
        // Formula: (Real Content Width) - (Screen Space available after header)
        const availableSpace = window.innerWidth - headerWidth;
        
        // We add a tiny buffer (20px) so the text doesn't hit the exact screen edge
        const amountToScroll = realContentWidth - availableSpace + 20;

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