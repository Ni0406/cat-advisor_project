const movieButton = document.getElementById('movie-button');
const placeButton = document.getElementById('place-button');
const resultContainer = document.getElementById('result-container');
const moviePoster = document.getElementById('movie-poster');
const movieTitle = document.getElementById('movie-title');
const movieDescription = document.getElementById('movie-description');
const canvas = document.getElementById('cat-meme-canvas');
const ctx = canvas.getContext('2d');

// --- КЛЮЧИ API ---
const TMDB_API_KEY = 'a99e35505f6555e562054ac85a8ae4e8';
const CAT_API_KEY = 'live_ikYphFGXeiCBxRYuDklRqSDP9scf8CzWvIrIH2Yr9qv3a2uW7sYDLZzkryeIaDOV'; 


const proxyUrl = 'https://cors-anywhere.herokuapp.com/';

// --- Функция для создания мема на Canvas ---
async function generateCatMeme(text) {
    try {
        const catResponse = await fetch(`https://api.thecatapi.com/v1/images/search?api_key=${CAT_API_KEY}`);
        const catData = await catResponse.json();
        if (!catData || catData.length === 0) throw new Error('Не удалось получить котика');
        const catImageUrl = catData[0].url;
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = proxyUrl + catImageUrl;

        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            ctx.drawImage(image, 0, 0);
            const fontSize = image.width / 10;
            ctx.font = `bold ${fontSize}px Impact`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = fontSize / 20;
            ctx.textAlign = 'center';
            const topText = text.toUpperCase();
            ctx.strokeText(topText, canvas.width / 2, fontSize * 1.2);
            ctx.fillText(topText, canvas.width / 2, fontSize * 1.2);
        };
        image.onerror = () => { console.error('Ошибка при загрузке изображения котика.'); };
    } catch (error) { console.error('Ошибка при создании мема с котиком:', error); }
}

// --- Функция для фильмов (без изменений) ---
async function fetchMovieAndCat() {
    resultContainer.classList.remove('hidden');
    movieTitle.textContent = 'Ищу фильм...';
    moviePoster.style.display = 'block';
    try {
        const moviePage = Math.floor(Math.random() * 10) + 1;
        const tmdbUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=ru-RU&page=${moviePage}`;
        const movieResponse = await fetch(tmdbUrl);
        const movieData = await movieResponse.json();
        const randomMovie = movieData.results[Math.floor(Math.random() * movieData.results.length)];
        
        movieTitle.textContent = randomMovie.title;
        movieDescription.textContent = randomMovie.overview;
        moviePoster.src = `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`;
        
        await generateCatMeme(randomMovie.title);

    } catch (error) {
        console.error('Ошибка при получении фильма:', error);
        movieTitle.textContent = 'Ошибка загрузки фильма';
    }
}

async function fetchPlaceAndCat() {
    resultContainer.classList.remove('hidden');
    movieTitle.textContent = 'Ищу место на бесплатных картах...';
    moviePoster.style.display = 'none';

    try {
        const overpassEndpoint = 'https://overpass-api.de/api/interpreter';
        const lat = '55.7558';
        const lon = '37.6173';
        const radius = 50000; // 50 км

        const query = `
            [out:json][timeout:25];
            (
              node["amenity"="restaurant"](around:${radius},${lat},${lon});
              way["amenity"="restaurant"](around:${radius},${lat},${lon});
              relation["amenity"="restaurant"](around:${radius},${lat},${lon});
            );
            out body;
            >;
            out skel qt;
        `;

        const response = await fetch(overpassEndpoint, {
            method: 'POST',
            body: query
        });

        if (!response.ok) {
            throw new Error(`Сетевая ошибка: ${response.statusText}`);
        }

        const data = await response.json();
        
        const placesWithName = data.elements.filter(element => element.tags && element.tags.name);

        if (placesWithName.length > 0) {
            const randomPlace = placesWithName[Math.floor(Math.random() * placesWithName.length)];
            const placeTags = randomPlace.tags;

            movieTitle.textContent = placeTags.name;
            let description = `Тип: ${placeTags.cuisine || 'кухня'}`; // Показываем тип кухни, если он есть
            description += `\nАдрес: ${placeTags["addr:street"] || ''} ${placeTags["addr:housenumber"] || ''}`;
            movieDescription.textContent = description.trim();

            await generateCatMeme(placeTags.name);
        } else {
            throw new Error('Не найдено ресторанов в OpenStreetMap.');
        }

    } catch (error) {
        console.error('Ошибка при поиске места в OpenStreetMap:', error);
        movieTitle.textContent = 'Ошибка загрузки места 🚫';
        movieDescription.textContent = `Подробности: ${error.message}.`;
    }
}


// --- Обработчики событий  ---
movieButton.addEventListener('click', fetchMovieAndCat);
placeButton.addEventListener('click', fetchPlaceAndCat);