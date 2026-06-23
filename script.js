//get html elements by id
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const WeatherIcon = document.getElementById("weatherIcon");
const locationEl = document.getElementById("location");
const temperatue = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("windSpeed");
const uvIndex = document.getElementById("uvIndex");
const forecastContainer = document.getElementById("forecastContainer");
const errorMessage = document.getElementById("errorMessage");

//Get cordinates for City name
async function getCoordinates(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

  const response = await fetch(url);

  if (!response.ok) throw new Error("Unable to fetch city coordinates.");

  const data = await response.json();

  // check if city exists
  if (!data.results || data.results.length === 0) {
    throw new Error("City not found.");
  }
  //return the first matching city result

  return data.results[0];
}

//fetch  current weather data & 5-day forecast
async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max&timezone=auto`;

  const response = await fetch(url);

  if (!response.ok) throw new Error("Weather data unavailable.");
  const data = await response.json();

  return data;
}

//convert WMO weather codes into descriptions and icons
function getWeatherInfo(code) {
  if (code === 0) {
    return { description: "Clear Sky", icon: "☀" };
  }

  if ([1, 2, 3].includes(code)) {
    return { description: "Partly Cloudy", icon: "⛅" };
  }

  if ([45, 48].includes(code)) {
    return { description: "Foggy", icon: "🌁" };
  }

  if ([51, 53, 55].includes(code)) {
    return { description: "Drizzle", icon: "🌦" };
  }
  if ([61, 63, 65].includes(code)) {
    return { description: "Rain", icon: "🌧" };
  }

  if ([71, 73, 75].includes(code)) {
    return { description: "Snow", icon: "❄" };
  }

  if ([80, 81, 82].includes(code)) {
    return { description: "Rain Showers", icon: "🌦" };
  }

  if (code === 95) {
    return { description: "Thunderstorm", icon: "⚡" };
  }

  return {
    description: "Unknown Weather",
    icon: "❓",
  };
}


//uv-index  num value converted to descriptive category
function getUVCategory(uvValue) {
  if (uvValue <= 2) {
    return "Low";
  } else if (uvValue <= 5) {
    return "Moderate";
  } else if (uvValue <= 7) {
    return "High";
  }else if (uvValue <= 10) {
    return "Very High";
  } else {
    return "Extreme";
  }
}


//UPdate the  Dom for current weather
function displayCurrentWeather(data, cityName, country) {
  const currentData = data.current;
  const dailyData = data.daily;
  const weatherInfo = getWeatherInfo(currentData.weather_code);

  //hide  any previous errors
  errorMessage.style.display = "none";

  //Hero section
  WeatherIcon.textContent = weatherInfo.icon;
  //Remove previous animation classes
  WeatherIcon.classList.remove("sunny-animation", "general-animation");
//Add animation class based on weather condition
weatherIcon.classList.add("weather-icon-hero");
if (weatherInfo.icon === "☀") {
  WeatherIcon.classList.add("sunny-animation");
}else {
  WeatherIcon.classList.add("general-animation");
}

  locationEl.textContent = `${cityName} , ${country};`;
  temperatue.innerHTML= `${Math.round(currentData.temperature_2m)}&#176;C`;
  description.textContent = weatherInfo.description;
  document.getElementById('feelslike').innerHTML = 
  `Feels like ${Math.round(currentData.apparent_temperature)}&#176;C`;

  //Weather Stats
  humidity.textContent = `${currentData.relative_humidity_2m}%`;
  windSpeed.textContent = `${currentData.wind_speed_10m} km/h`;
  const rawUV= dailyData.uv_index_max[0];
  uvIndex.textContent = getUVCategory(rawUV);
}

//Update the DOM with 5-day forecast

function showForecast(daily) {
  //clear previous forecast
  forecastContainer.innerHTML = "";

  //loop through the first 5 days
  for (let i = 0; i < 5; i++) {
    const date = new Date(daily.time[i]);

    const dayName = i === 0 ? "Today": date.toLocaleDateString("en-US", {  weekday: "short", });

    const weatherInfo = getWeatherInfo(daily.weather_code[i]);
    const forecastCard = document.createElement("div");
    forecastCard.className = "forecast-row";

    forecastCard.innerHTML = `
       <span class="day-name">${dayName}</span>
       <div class="forecast-icon">${weatherInfo.icon}</div>
       <div class="temp-container">
       <span class="max-temp">${Math.round(daily.temperature_2m_max[i])}&deg;</span>
        <span class="min-temp">${Math.round(daily.temperature_2m_min[i])}&deg;</span>
        </div>
         `;
    forecastContainer.appendChild(forecastCard);}
}

//Display error message on the page
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = "block";
}

//function triggered by search button
async function handleSearch(forcedCity) {
  errorMessage.style.display = "none";
  
  const city = typeof forcedCity === "string" ? forcedCity : cityInput.value.trim();
  
  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  try { 
    const locationData = await getCoordinates(city);
    const weatherData = await getWeather(locationData.latitude, locationData.longitude);

    //Render data to UI
    displayCurrentWeather(weatherData, locationData.name, locationData.country);
    showForecast(weatherData.daily);
  } catch (error) {
    showError(error.message);
  }
  }

//Adding Event listener
searchBtn.addEventListener("click", handleSearch); 
//initialize Lagos as default city on page load
window.addEventListener("DOMContentLoaded", () => {
  handleSearch("Lagos");
});
