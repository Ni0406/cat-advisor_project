// --- Ссылки на HTML-элементы ---
const movieButton = document.getElementById('movie-button');
const placeButton = document.getElementById('place-button');
const resultContainer = document.getElementById('result-container');
const moviePoster = document.getElementById('movie-poster');
const movieTitle = document.getElementById('movie-title');
const movieDescription = document.getElementById('movie-description');
const canvas = document.getElementById('cat-meme-canvas');
const ctx = canvas.getContext('2d');

// --- ВАШИ КЛЮЧИ API И ПРОКСИ ---
const TMDB_API_KEY = 'a99e35505f6555e562054ac85a8ae4e8'; // Ваш ключ TMDb
const CAT_API_KEY = 'live_ikYphFGXeiCBxRYuDklRqSDP9scf8CzWvIrIH2Yr9qv3a2uW7sYDLZzkryeIaDOV'; // Ваш ключ The Cat API
const GOOGLE_API_KEY = 'ВАШ_КЛЮЧ_GOOGLE_PLACES_API'; // Ваш ключ Google
const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Наш прокси

// --- Новая функция для создания мема на Canvas ---
async function generateCatMeme(text) {
    try {
        const catResponse = await fetch(`https://api.thecatapi.com/v1/images/search?api_key=${CAT_API_KEY}`);
        const catData = await catResponse.json();
        if (!catData || catData.length === 0) throw new Error('Не удалось получить котика');

        const catImageUrl = catData[0].url;

        const image = new Image();
        image.crossOrigin = "anonymous";
        
        // --- ИЗМЕНЕНИЕ №1: Загружаем картинку через прокси ---
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
        // Обработка ошибки загрузки самого изображения
        image.onerror = () => {
            console.error('CORS или другая ошибка при загрузке изображения котика.');
        };
    } catch (error) {
        console.error('Ошибка при создании мема с котиком:', error);
    }
}

// --- Основные функции ---

async function fetchMovieAndCat() {
    resultContainer.classList.remove('hidden');
    movieTitle.textContent = 'Загрузка...';
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
    movieTitle.textContent = 'Ищем ресторан...';
    moviePoster.style.display = 'none';

    try {
        const location = '55.7558,37.6173';
        const radius = 5000;
        const placesUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=restaurant&language=ru&key=${GOOGLE_API_KEY}`;
        
        const placesResponse = await fetch(placesUrl);
        
        // --- ИЗМЕНЕНИЕ №2: Улучшенная обработка ответа ---
        if (!placesResponse.ok) {
            // Если ответ НЕ успешный (например, 403 Forbidden от прокси)
            throw new Error(`Сетевая ошибка или ошибка прокси: ${placesResponse.statusText}`);
        }

        const placesData = await placesResponse.json(); // Эта строка больше не должна вызывать SyntaxError

        if (placesData.results && placesData.results.length > 0) {
            const randomPlace = placesData.results[Math.floor(Math.random() * placesData.results.length)];
            movieTitle.textContent = randomPlace.name || 'Название не найдено';
            let description = `Рейтинг: ${randomPlace.rating || 'Нет данных'} ⭐ (${randomPlace.user_ratings_total || 0} оценок)`;
            description += `\nАдрес: ${randomPlace.vicinity || 'Нет данных'}`;
            movieDescription.textContent = description;

            await generateCatMeme(randomPlace.name);
        } else {
            throw new Error('Не найдено ресторанов поблизости.');
        }

    } catch (error) {
        console.error('Ошибка при поиске места:', error);
        movieTitle.textContent = 'Ошибка загрузки места 🚫';
        movieDescription.textContent = `Подробности: ${error.message}. Убедитесь, что вы активировали прокси.`;
    }
}

// --- Обработчики событий ---
movieButton.addEventListener('click', fetchMovieAndCat);
placeButton.addEventListener('click', fetchPlaceAndCat);