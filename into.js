function myFunction()  {
    const mytext1 = document.getElementById("mytext1");
    mytext1.innerHTML = "WOOOOOOOOOOOOOOOOOOOO!!!!!!!!!!!!!!!!!!!!"
    const mytext2 = document.getElementById("mytext2");
    const myinput = document.getElementById("myinput");
   document.body.style.backgroundColor = myinput.value;
}

/**
 * Generates a random RGB color string.
 * @returns {string} A string in the format "rgb(r, g, b)".
 */
function getRandomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgb(${r}, ${g}, ${b})`;
}

// Select all elements with the class 'myclass'.
const elementsToChange = document.querySelectorAll('.myclass');

// Set an interval to change the background color of the selected elements every 670ms.
setInterval(() => {
  const newColor = getRandomColor();
  elementsToChange.forEach(element => {
    element.style.backgroundColor = newColor;
  });
}, 6070);