// Updated display.js with background change based on weather
let units = "imperial";
let units_temp = `°F`;
let units_humid = `%`;
let units_speed = "mph";

let omGeocode = new OMGeocode();
let omWeather = new OMWeather(units);
let omForecast = new OMForecast(units);
let omPollution = new OMPollution();

function displayLocation() {
    const loc = document.getElementById("location");
    loc.textContent = `${omGeocode.getName()}, ${omGeocode.getState()}, ${omGeocode.getCountry()}`;
}

function displayWeather() {
    const card = document.getElementById("weather-card");
    card.innerHTML = "";

    const weather = omWeather.json.weather[0];
    const main = omWeather.json.main;

    const cardHTML = `
        <div style="padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 20px auto;">
            <h3 style="margin-top: 0; color: #4CAF50;">Current Weather</h3>
            <div style="font-size: 48px; margin: 10px 0;">${getWeatherEmoji(weather.main)}</div>
            <p style="margin: 5px 0;">Condition: <strong>${weather.description}</strong></p>
            <p style="margin: 5px 0;">Temperature: <strong>${main.temp.toFixed(1)}${units_temp}</strong></p>
            <p style="margin: 5px 0;">Feels Like: <strong>${main.feels_like.toFixed(1)}${units_temp}</strong></p>
        </div>
    `;

    card.innerHTML = cardHTML;

    updateBackground(weather.main);
}

function updateBackground(condition) {
    const body = document.body;
    const backgrounds = {
        "Clear": "linear-gradient(to top, #fceabb, #f8b500)",
        "Clouds": "linear-gradient(to top, #d7d2cc, #304352)",
        "Rain": "linear-gradient(to top, #4e54c8, #8f94fb)",
        "Drizzle": "linear-gradient(to top, #89f7fe, #66a6ff)",
        "Thunderstorm": "linear-gradient(to top, #373B44, #4286f4)",
        "Snow": "linear-gradient(to top, #e6dada, #274046)",
        "Mist": "linear-gradient(to top, #757f9a, #d7dde8)",
        "Fog": "linear-gradient(to top, #3e5151, #decba4)"
    };
    
    body.style.background = backgrounds[condition] || "linear-gradient(to top, #cfd9df, #e2ebf0)";
}

function getWeatherEmoji(condition) {
    const emojiMap = {
        "Clear": "☀️",
        "Clouds": "☁️",
        "Rain": "🌧️",
        "Drizzle": "🌦️",
        "Thunderstorm": "⛈️",
        "Snow": "❄️",
        "Mist": "🌫️",
        "Fog": "🌫️"
    };
    return emojiMap[condition] || "🌤️";
}

function displayForecast() {
    const table = document.getElementById('forecast-table');
    table.innerHTML = '';

    const headers = ["Time", "Temp", "Condition", "Humidity", "Icon"];
    const headerRow = document.createElement('tr');
    headers.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    if (omWeather.json !== undefined) {
        table.appendChild(createRow(omWeather.json));
    }

    omForecast.json.list.forEach(item => {
        table.appendChild(createRow(item));
    });
}

function createRow(json) {
    const row = document.createElement('tr');

    const time = document.createElement('td');
    time.textContent = omForecast.convertTimecode(json.dt);
    row.appendChild(time);

    const temp = document.createElement('td');
    temp.textContent = `${json.main.temp.toFixed(1)}${units_temp}`;
    row.appendChild(temp);

    const condition = document.createElement('td');
    condition.textContent = json.weather[0].main;
    row.appendChild(condition);

    const humidity = document.createElement('td');
    humidity.textContent = `${json.main.humidity}${units_humid}`;
    row.appendChild(humidity);

    const icon = document.createElement('td');
    icon.innerHTML = getWeatherEmoji(json.weather[0].main);
    row.appendChild(icon);

    return row;
}

function displayPollution() {
    const pollutionReport = document.getElementById("pollution-report");
    const pollution = omPollution.json.list[0];

    pollutionReport.innerHTML = `
        <div style="padding: 20px; background: #fff; border-radius: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); max-width: 500px; margin: 20px auto;">
            <h3 style="margin-top: 0; color: #f44336;">Air Quality</h3>
            <p><strong>AQI:</strong> ${pollution.main.aqi}</p>
            <p><strong>Components:</strong><br>${Object.entries(pollution.components).map(([key, value]) => `${key}: ${value}`).join('<br>')}</p>
        </div>
    `;
}
// ticker.js
const tickerCities = ['New York', 'London', 'Tokyo', 'Paris', 'Sydney'];
const tickerDiv = document.getElementById("ticker-content");

async function refreshTicker() {
    const apiKey = 'YOUR_API_KEY'; // replace with OpenWeather API key
    let content = "";

    for (let city of tickerCities) {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=imperial`);
            const json = await response.json();
            const emoji = getWeatherEmoji(json.weather[0].main);
            content += `<span>${emoji} ${city}: ${json.main.temp.toFixed(0)}°F</span>`;
        } catch {
            content += `<span>${city}: Error</span>`;
        }
    }

    tickerDiv.innerHTML = content;
}
refreshTicker();
setInterval(refreshTicker, 60000);
