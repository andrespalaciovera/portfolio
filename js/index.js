
const slides = document.querySelectorAll('.carousel-slide');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
let currentSlide = 0;

function showSlide(index) {
    // 1. Remove 'active' class from all slides to hide them
    slides.forEach(slide => slide.classList.remove('active'));
    
    // 2. Handle wrapping (if you go past the last slide, loop to the first)
    if (index >= slides.length) {
        currentSlide = 0;
    } else if (index < 0) {
        currentSlide = slides.length - 1;
    } else {
        currentSlide = index;
    }
    
    // 3. Add 'active' class to the new current slide to show it
    slides[currentSlide].classList.add('active');
}

// Event Listeners for the buttons
nextBtn.addEventListener('click', () => {
    showSlide(currentSlide + 1);
});

prevBtn.addEventListener('click', () => {
    showSlide(currentSlide - 1);
});

// Init follow tranking 

const modelViewer = document.getElementById('legoModel');

    /* =========================================
       FEATURE 1: MOUSE TRACKING
       ========================================= */
    window.addEventListener('mousemove', (e) => {
        // Only track if the 3D slide is currently active in the carousel
        const parentSlide = modelViewer.closest('.carousel-slide');
        if (!parentSlide || !parentSlide.classList.contains('active')) return;

        // Calculate mouse position as a value between -1 and 1
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;

        // Map mouse position to rotation angles (in degrees)
        // Adjust the '40' and '20' to make the head turn more or less
        const orbitX = -x * 40; 
        const orbitY = 90 - (y * 20); // 90 is the default front-facing angle

        // Apply the new orbit to the model viewer
        modelViewer.cameraOrbit = `${orbitX}deg ${orbitY}deg auto`;
    });

    /* =========================================
   MOBILE CAMERA CONTROLS
   ========================================= */
const mediaQuery = window.matchMedia('(max-width: 767px)');

function handleDeviceChange(e) {
    if (e.matches) {
        // Mobile screen: Turn ON native touch controls
        modelViewer.setAttribute('camera-controls', 'true');
    } else {
        // Desktop screen: Turn OFF touch controls (let mouse tracking take over)
        modelViewer.removeAttribute('camera-controls');
        // Reset the camera orbit to default so it's ready for mouse tracking
        modelViewer.cameraOrbit = "0deg 90deg auto";
    }
}

// Check the screen size when the page loads
handleDeviceChange(mediaQuery);

// Keep checking if the user resizes the window
mediaQuery.addEventListener('change', handleDeviceChange);

/* =========================================
   FEATURE 2: CHECKOUT ANIMATION ON CLICK (+ PROGRESS BAR ONLY)
   ========================================= */
const addToTeamBtn = document.querySelector('.btn-primary');
const orderModal = document.getElementById('orderModal');
const modalProgressFill = document.getElementById('modal-progress-fill');
const btnOpenNow = document.getElementById('btn-open-now');
const btnCancel = document.getElementById('btn-cancel');

const totalCountdownTime = 3; 
let countdownValue = totalCountdownTime;
let countdownInterval;
let originalContent; 

// Helper: Reset UI
function closeModalAndReset() {
    clearInterval(countdownInterval);
    orderModal.classList.remove('active');
    addToTeamBtn.innerHTML = originalContent;
    
    // Wait 500ms for the modal to become completely invisible BEFORE emptying the bar
    setTimeout(() => {
        if (modalProgressFill) {
             modalProgressFill.style.transition = 'none'; 
             modalProgressFill.style.width = '0%';
        }
    }, 500);
}

// Helper: Trigger email
function openEmail() {
    window.location.href = "mailto:andres@andresaudits.com";
    setTimeout(closeModalAndReset, 1000); 
}

// 1. MAIN BUTTON CLICK
addToTeamBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    originalContent = addToTeamBtn.innerHTML;

    addToTeamBtn.innerHTML = `
        <span class="btn-label jumping-dots">
            Completing order<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
        </span>
    `;

    setTimeout(() => {
        orderModal.classList.add('active');
        
        // Reset countdown math
        countdownValue = totalCountdownTime;
        
        // Ensure the bar starts completely empty
        if (modalProgressFill) {
             modalProgressFill.style.transition = 'none';
             modalProgressFill.style.width = '0%'; // Start empty
             modalProgressFill.offsetHeight; // Force the browser to register the 0%
             modalProgressFill.style.transition = 'width 1s linear'; // Turn smooth animation back on
        }

        // Start the interval loop
        countdownInterval = setInterval(() => {
            countdownValue--;
            
            // Calculate the percentage FILLED (elapsed time)
            const percentFilled = ((totalCountdownTime - countdownValue) / totalCountdownTime) * 100;
            if (modalProgressFill) modalProgressFill.style.width = `${percentFilled}%`;

            if (countdownValue <= 0) {
                // Finished! Stop the clock.
                clearInterval(countdownInterval);
                
                // Add a tiny 300ms delay so the user can visually see the bar hit 100%
                setTimeout(openEmail, 900);
            }
        }, 1000);

    }, 1000);
}); 

// 2. OPEN NOW BUTTON CLICK
btnOpenNow.addEventListener('click', () => {
    clearInterval(countdownInterval);
    // Snap the bar to 100% instantly to show completion
    if (modalProgressFill) {
        modalProgressFill.style.transition = 'none';
        modalProgressFill.style.width = '100%';
    }
    openEmail();
});

// 3. CANCEL BUTTON CLICK
btnCancel.addEventListener('click', () => {
    closeModalAndReset();
});

// 4. CLICK OUTSIDE / ESCAPE
orderModal.addEventListener('click', (e) => {
    if (e.target === orderModal) closeModalAndReset();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && orderModal.classList.contains('active')) closeModalAndReset();
});

/* =========================================
   3D MODEL PROGRESS TRACKER (GSAP SMOOTH)
   ========================================= */
const progressText = document.getElementById('dot-progress');
const customLoader = document.getElementById('custom-3d-loader');

// We create a dummy object for GSAP to animate
let loaderProxy = { percentage: 0 };

if (modelViewer && progressText) {
    
    // 1. TRACK THE DOWNLOAD
    modelViewer.addEventListener('progress', (event) => {
        const targetPercentage = Math.round(event.detail.totalProgress * 100);
        
        // Use GSAP to smoothly spin the numbers up to the target
        gsap.to(loaderProxy, {
            percentage: targetPercentage,
            duration: 0.8, // Takes almost a second to catch up, making it look smooth
            ease: "power2.out",
            onUpdate: () => {
                // Format the animated number to always have 3 digits (e.g., 042%)
                const currentVal = Math.round(loaderProxy.percentage);
                progressText.innerText = currentVal.toString().padStart(3, '0') + '%';
            }
        });
    });

    // 2. WAIT FOR THE GPU TO FINISH DRAWING
    // The 'load' event only fires when the 3D model is actually visible on screen
    modelViewer.addEventListener('load', () => {
        
        // Force the counter to 100% just in case it got stuck
        gsap.to(loaderProxy, {
            percentage: 100,
            duration: 0.4,
            onUpdate: () => {
                progressText.innerText = Math.round(loaderProxy.percentage).toString().padStart(3, '0') + '%';
            },
            onComplete: () => {
                // Gracefully fade out the loader now that the 3D model is visible
                customLoader.style.transition = 'opacity 0.6s ease-out';
                customLoader.style.opacity = '0';
                
                setTimeout(() => {
                    customLoader.style.display = 'none';
                }, 600);
            }
        });
    });
}

/* =========================================
   IMAGE ZOOM TRACKING
   ========================================= */
const zoomableImages = document.querySelectorAll('.zoomable');

zoomableImages.forEach(img => {
    img.addEventListener('mousemove', function(e) {
        // 1. Get the exact size and position of the image on the screen
        const rect = img.getBoundingClientRect();
        
        // 2. Calculate where the mouse is inside the image (0.0 to 1.0)
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        
        // 3. Convert those to percentages and move the transform-origin
        img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    });

    // 4. When the mouse leaves, smoothly snap the origin back to the center
    img.addEventListener('mouseleave', function() {
        img.style.transformOrigin = 'center center';
    });
});