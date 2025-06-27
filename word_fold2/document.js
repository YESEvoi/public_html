document.addEventListener('DOMContentLoaded', () => {
    // --- Create your sound effect ---
    // 1. Create a folder named 'sfx' in your 'public_html' directory.
    // 2. Place your button sound effect file inside it (e.g., 'button-click.mp3').
    // 3. If your file has a different name, change it in the line below.
    try {
        const clickSound = new Audio('sfx/button-click.mp3');
        clickSound.preload = 'auto';

        // --- Add sound to all buttons and links ---
        const clickableElements = document.querySelectorAll('button, a');

        clickableElements.forEach(element => {
            element.addEventListener('click', () => {
                clickSound.currentTime = 0;
                clickSound.play();
            });
        });
    } catch (e) {
        console.error("Could not initialize button sounds. Did you add the sfx/button-click.mp3 file?", e);
    }
});