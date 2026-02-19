
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
   FEATURE 2: CHECKOUT ANIMATION ON CLICK
   ========================================= */
const addToTeamBtn = document.querySelector('.btn-primary');
const orderModal = document.getElementById('orderModal');

addToTeamBtn.addEventListener('click', (e) => {
    e.preventDefault(); // Stop the email from opening instantly

    // 1. Store the original button HTML so we can reset it later
    const originalContent = addToTeamBtn.innerHTML;

    // 2. Change the button text and inject the jumping dots
    addToTeamBtn.innerHTML = `
        <span class="btn-label jumping-dots">
            Completing order<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
        </span>
    `;

    // 3. Wait exactly 1000ms (1 second), then show the modal
    setTimeout(() => {
        orderModal.classList.add('active');

        // 4. Give the user 2.5 seconds to watch the GIF and read the text
        setTimeout(() => {
            
            // Trigger the mail client
            window.location.href = "mailto:hello@andresaudits.com";
            
            // Reset the UI shortly after the email app opens
            setTimeout(() => {
                orderModal.classList.remove('active');
                addToTeamBtn.innerHTML = originalContent;
            }, 1000);

        }, 2500); // Time the modal stays on screen

    }, 1000); // Delay before modal appears
});

/* =========================================
   MOBILE CAMERA CONTROLS
   ========================================= */
const mediaQuery = window.matchMedia('(max-width: 767px)');

function handleDeviceChange(e) {
    if (e.matches) {
        // Mobile screen: Turn ON touch controls
        modelViewer.setAttribute('camera-controls', 'true');
    } else {
        // Desktop screen: Turn OFF touch controls (let the mouse tracking take over)
        modelViewer.removeAttribute('camera-controls');
        // Reset the camera orbit to default so it's ready for mouse tracking
        modelViewer.cameraOrbit = "0deg 90deg auto";
    }
}

// Check the screen size when the page loads
handleDeviceChange(mediaQuery);

// Keep checking if they resize the window
mediaQuery.addEventListener('change', handleDeviceChange);