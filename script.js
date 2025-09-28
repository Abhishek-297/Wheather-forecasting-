const API_KEY = '3e57efcb6f59407da39101756252809';
const BASE_URL = 'https://api.weatherapi.com/v1';

// Initialize with user's location or Delhi
window.addEventListener('DOMContentLoaded', function() {
    getCurrentLocation() || searchWeather('Delhi');
    initializeTheme();
});

// Handle Enter key in search input
document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Add search suggestions
document.getElementById('cityInput').addEventListener('input', function() {
    const query = this.value.trim();
    if (query.length > 2) {
        searchSuggestions(query);
    } else {
        hideSuggestions();
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.search-container')) {
        hideSuggestions();
    }
});

// Theme toggle functionality
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeIcon').classList.replace('fa-moon', 'fa-sun');
    }
}

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    
    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        themeIcon.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-mode');
        themeIcon.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('theme', 'dark');
    }
}

function showLoading() {
    document.getElementById('loadingSpinner').classList.add('active');
    document.getElementById('weatherDisplay').style.display = 'none';
    hideError();
}

function hideLoading() {
    document.getElementById('loadingSpinner').classList.remove('active');
}

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
    hideLoading();
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}

async function searchSuggestions(query) {
    try {
        const response = await fetch(`${BASE_URL}/search.json?key=${API_KEY}&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        const suggestionsContainer = document.getElementById('suggestions');
        suggestionsContainer.innerHTML = '';
        
        if (data && data.length > 0) {
            data.slice(0, 5).forEach(city => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = `${city.name}, ${city.region}, ${city.country}`;
                item.onclick = () => {
                    document.getElementById('cityInput').value = city.name;
                    hideSuggestions();
                    searchWeather(city.name);
                };
                suggestionsContainer.appendChild(item);
            });
            suggestionsContainer.style.display = 'block';
        }
    } catch (error) {
        console.log('Suggestions not available');
    }
}

function hideSuggestions() {
    document.getElementById('suggestions').style.display = 'none';
}

async function searchWeather(cityName = null) {
    const city = cityName || document.getElementById('cityInput').value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading();
    hideSuggestions();

    try {
        const response = await fetch(
            `${BASE_URL}/forecast.json?key=${API_KEY}&q=${encodeURIComponent(city)}&days=3&aqi=yes&alerts=no`
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayWeather(data);
        hideLoading();
    } catch (error) {
        console.error('Weather fetch error:', error);
        showError('City not found or API error. Please try again.');
    }
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        showLoading();
        navigator.geolocation.getCurrentPosition(
            async function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                try {
                    const response = await fetch(
                        `${BASE_URL}/forecast.json?key=${API_KEY}&q=${lat},${lon}&days=3&aqi=yes&alerts=no`
                    );
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    displayWeather(data);
                    hideLoading();
                } catch (error) {
                    console.error('Location weather fetch error:', error);
                    showError('Unable to fetch weather for your location');
                }
            },
            function(error) {
                console.error('Geolocation error:', error);
                // Fallback to Delhi
                searchWeather('Delhi');
            }
        );
    } else {
        // Fallback to Delhi
        searchWeather('Delhi');
    }
}

function getPopularCities() {
    const cities = ['London', 'New York', 'Tokyo', 'Paris', 'Sydney', 'Mumbai', 'Dubai', 'Singapore'];
    const randomCity = cities[Math.floor(Math.random() * cities.length)];
    document.getElementById('cityInput').value = randomCity;
    searchWeather(randomCity);
}

function searchIndianCity(cityName) {
    document.getElementById('cityInput').value = cityName;
    searchWeather(cityName);
}

function displayWeather(data) {
    const current = data.current;
    const location = data.location;
    const forecast = data.forecast.forecastday;

    // Update main weather display
    document.getElementById('locationName').innerHTML = 
        `<i class="fas fa-map-marker-alt me-2"></i>${location.name}, ${location.region}, ${location.country}`;
    
    document.getElementById('currentTime').textContent = 
        `Local time: ${new Date(location.localtime).toLocaleString()}`;
    
    document.getElementById('temperature').textContent = `${Math.round(current.temp_c)}°`;
    document.getElementById('description').textContent = current.condition.text;
    document.getElementById('feelsLike').textContent = `Feels like ${Math.round(current.feelslike_c)}°`;
    
    // Weather icon
    const weatherIconContainer = document.getElementById('weatherIcon');
    weatherIconContainer.innerHTML = `<img src="https:${current.condition.icon}" alt="${current.condition.text}">`;

    // Update metrics
    document.getElementById('visibility').textContent = `${current.vis_km} km`;
    document.getElementById('humidity').textContent = `${current.humidity}%`;
    document.getElementById('windSpeed').textContent = `${current.wind_kph} km/h`;
    document.getElementById('pressure').textContent = `${current.pressure_mb} mb`;
    document.getElementById('heatIndex').textContent = `${Math.round(current.heatindex_c)}°`;
    document.getElementById('uvIndex').textContent = current.uv;
    document.getElementById('windGust').textContent = `${current.gust_kph} km/h`;
    document.getElementById('precipitation').textContent = `${current.precip_mm} mm`;

    // Air quality
    if (current.air_quality) {
        const aqi = current.air_quality['us-epa-index'];
        const aqiLabels = ['Good', 'Moderate', 'Unhealthy for Sensitive', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
        document.getElementById('aqiValue').textContent = aqiLabels[aqi - 1] || 'Unknown';
        document.getElementById('airQuality').style.display = 'inline-block';
    }

    // Update forecast
    const forecastContainer = document.getElementById('forecast');
    forecastContainer.innerHTML = '';
    
    forecast.forEach((day, index) => {
        const date = new Date(day.date);
        const dayName = index === 0 ? 'Today' : 
                      index === 1 ? 'Tomorrow' : 
                      date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const forecastCard = document.createElement('div');
        forecastCard.className = 'col-md-4 col-sm-6 mb-3';
        forecastCard.innerHTML = `
            <div class="forecast-card h-100">
                <div class="fw-bold mb-2">${dayName}</div>
                <div class="mb-2">
                    <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
                </div>
                <div class="small mb-1">${day.day.condition.text}</div>
                <div class="small">
                    <span class="fw-bold">${Math.round(day.day.maxtemp_c)}°</span>
                    <span class="opacity-75"> / ${Math.round(day.day.mintemp_c)}°</span>
                </div>
                <div class="mt-2 small">
                    <i class="fas fa-cloud-rain me-1"></i>${day.day.daily_chance_of_rain}%
                    <br>
                    <i class="fas fa-wind me-1"></i>${day.day.maxwind_kph} km/h
                </div>
            </div>
        `;
        forecastContainer.appendChild(forecastCard);
    });

    // Show weather display
    document.getElementById('weatherDisplay').style.display = 'block';
    
    // Update background based on weather and time
    updateBackground(current.condition.text.toLowerCase(), current.is_day);
    
    // Update input with current city
    document.getElementById('cityInput').value = location.name;
}

function updateBackground(condition, isDay) {
    const body = document.body;
    
    if (!isDay) {
        body.style.background = 'var(--night-gradient)';
    } else if (condition.includes('sun') || condition.includes('clear')) {
        body.style.background = 'var(--sunny-gradient)';
    } else if (condition.includes('rain') || condition.includes('storm') || condition.includes('drizzle')) {
        body.style.background = 'var(--rainy-gradient)';
    } else if (condition.includes('snow') || condition.includes('blizzard')) {
        body.style.background = 'var(--snow-gradient)';
        document.body.style.color = '#333';
    } else if (condition.includes('cloud') || condition.includes('overcast')) {
        body.style.background = 'var(--cloudy-gradient)';
    } else {
        body.style.background = 'var(--primary-gradient)';
    }
}

// Add some interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Add hover effects to metric cards
    setTimeout(() => {
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }, 1000);
});