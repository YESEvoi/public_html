/**
 * script.js
 * Handles the interactive counter functionality.
 */

// Initialize a variable to store the count
let count = 0;

// Get references to the HTML elements
const incrementButton = document.getElementById('incrementButton');
const counterDisplay = document.getElementById('counterDisplay');

// Ensure elements exist before trying to manipulate them
if (incrementButton && counterDisplay) {
    // Set the initial display value
    counterDisplay.textContent = count;

    // Add an event listener to the button
    incrementButton.addEventListener('click', () => {
        count++; // Increment the count
        counterDisplay.textContent = count; // Update the display
    });
}