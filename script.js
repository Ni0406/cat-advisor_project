// Получаем ссылки на HTML-элементы
const movieButton = document.getElementById('movie-button');
const placeButton = document.getElementById('place-button');

const resultContainer = document.getElementById('result-container');
const moviePoster = document.getElementById('movie-poster');
const movieTitle = document.getElementById('movie-title');
const movieDescription = document.getElementById('movie-description');
const catImage = document.getElementById('cat-image');

// Ключи API
const TMDB_API_KEY = 'a99e35505f6555e562054ac85a8ae4e8';
const CAT_API_KEY = 'live_ikYphFGXeiCBxRYuDklRqSDP9scf8CzWvIrIH2Yr9qv3a2uW7sYDLZzkryeIaDOV';
const GOOGLE_API_KEY = 'ВАШ_КЛЮЧ_GOOGLE_PLACES_API'; // <-- ВСТАВЬТЕ СЮДА ВАШ КЛЮЧ GOOGLE PLACES

// Данные для Imgflip API
const IMGFLIP_USERNAME = 'GeminiOpat'; // <-- ВАШ ЛОГИН IMGFLIP
const IMGFLIP_PASSWORD = 'GeminiOpat'; // <-- ВАШ ПАРОЛЬ IMGFLIP

// Список ID популярных шаблонов с котиками с Imgflip
// Вы можете найти больше ID на https://imgflip.com/memetemplates
const catMemeTemplates = ['101288', '40565853', '114585149', '25968021', '89370399', '182449514']; // Добавил пару для разнообразия


// --- Функция для генерации мема с Imgflip ---
async function generateMeme(text) {
    catImage.src = ''; // Очищаем старую картинку
    catImage.alt = '';
    catImage.style.display = 'none'; // Скрываем, пока не получим новый мем

    const randomTemplate = catMemeTemplates[Math.floor(Math.random() * catMemeTemplates.length)];

    const params = new URLSearchParams({
        template_id: randomTemplate,
        username: IMGFLIP_USERNAME,
        password: IMGFLIP_PASSWORD,
        'boxes[0][text]': text, // Текст для верхней части мема
        // 'boxes[1][text]': 'А что, неплохо!' // Можно добавить второй текст, если шаблон поддерживает
    });

    try {
        const response = await fetch('https://api.imgflip.com/caption_image', {
            method: 'POST',
            body: params
        });
        const json = await response.json();

        if (json.success) {
            catImage.src = json.data.url;
            catImage.alt = 'Сгенерированный мем с котиком';
            catImage.style.display = 'block';
        } else {
            console.error('Imgflip error:', json.error_message);
            // Если мем не сгенерировался, можно fallback на обычного котика или скрыть изображение
            // Временно добавим сюда Cat API как запасной вариант, если Imgflip не сработает
            try {
                const catResponse = await fetch(`https://api.thecatapi.com/v1/images/search?api_key=${CAT_API_KEY}`);
                const catData = await catResponse.json();
                if (catData && catData.length > 0 && catData[0].url) {
                    catImage.src = catData[0].url;
                    catImage.alt = 'Случайный котик (не мем)';
                    catImage.style.display = 'block';
                }
            } catch (catError) {
                console.error('Fallback cat API error:', catError);
                catImage.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Ошибка при создании мема:', error);
        // Аналогично, если fetch к Imgflip упал, попробуем Cat API
        try {
            const catResponse = await fetch(`https://api.thecatapi.com/v1/images/search?api_key=${CAT_API_KEY}`);
            const catData = await catResponse.json();
            if (catData && catData.length > 0 && catData[0].url) {
                catImage.src = catData[0].url;
                catImage.alt = 'Случайный котик (не мем)';
                catImage.style.display = 'block';
            }
        } catch (catError) {
            console.error('Fallback cat API error:', catError);
            catImage.style.display = 'none';
        }
    }
}

// --- Функция для получения фильма и генерации мема ---
async function fetchMovieAndCat() {
    resultContainer.classList.remove('hidden');
    movieTitle.textContent = 'Загрузка...';
    movieDescription.textContent = 'Получаем фильм для вас...';
    moviePoster.src = '';
    moviePoster.alt = '';
    moviePoster.style.display = 'none';
    
    // Блокируем кнопки
    movieButton.disabled = true;
    placeButton.disabled = true;
    movieButton.textContent = 'Ищем идеальный вариант...';

    let movieText = 'Фильм не найден 😿'; // Дефолтный текст для мема

    try {
        const moviePage = Math.floor(Math.random() * 10) + 1;
        const tmdbUrl = `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=ru-RU&page=${moviePage}`;

        const movieResponse = await fetch(tmdbUrl);
        if (!movieResponse.ok) {
            throw new Error(`Ошибка HTTP при получении фильма: ${movieResponse.status}`);
        }
        const movieData = await movieResponse.json();

        if (movieData.results && movieData.results.length > 0) {
            const randomMovie = movieData.results[Math.floor(Math.random() * movieData.results.length)];
            movieTitle.textContent = randomMovie.title || 'Название фильма не найдено';
            movieDescription.textContent = randomMovie.overview || 'Описание фильма не найдено.';
            const posterPath = randomMovie.poster_path ? `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}` : '';
            moviePoster.src = posterPath;
            moviePoster.alt = randomMovie.title || 'Постер фильма';
            moviePoster.style.display = posterPath ? 'block' : 'none';
            movieText = movieTitle.textContent; // Обновляем текст для мема
        } else {
            console.warn('Не удалось получить список фильмов из TMDb.');
            movieTitle.textContent = 'Фильм не найден 😿';
            movieDescription.textContent = 'Котик растерялся, фильмов не нашлось. Попробуйте ещё раз.';
            moviePoster.style.display = 'none';
        }
    } catch (error) {
        console.error('Ошибка при получении фильма:', error);
        movieTitle.textContent = 'Ошибка загрузки фильма 🚫';
        movieDescription.textContent = 'Упс! Что-то пошло не так при поиске фильма. Попробуйте позже.';
        moviePoster.style.display = 'none';
    } finally {
        // Генерируем мем после получения фильма
        await generateMeme(movieText); // Используем полученное название фильма как текст для мема

        // Разблокируем кнопки и возвращаем им исходный текст
        movieButton.disabled = false;
        placeButton.disabled = false;
        movieButton.textContent = 'Подобрать фильм';
    }
}

// --- Функция для получения ресторана и генерации мема ---
async function fetchPlaceAndCat() {
    resultContainer.classList.remove('hidden');
    movieTitle.textContent = 'Ищем ресторан...';
    movieDescription.textContent = 'Подбираем для вас отличное место...';
    moviePoster.style.display = 'none'; // Скрываем постер, он нам не нужен
    
    // Блокируем кнопки
    movieButton.disabled = true;
    placeButton.disabled = true;
    placeButton.textContent = 'Ищем идеальный ресторан...';

    const location = '55.7558,37.6173'; // Координаты Москвы
    const radius = 5000; // Радиус 5 км
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/'; // Прокси для обхода CORS
    const placesUrl = `${proxyUrl}https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=restaurant&language=ru&key=${GOOGLE_API_KEY}`;
    
    let placeText = 'Ресторан не найден 😿'; // Дефолтный текст для мема

    try {
        const placesResponse = await fetch(placesUrl);
        if (!placesResponse.ok) {
             throw new Error(`Ошибка HTTP при получении места: ${placesResponse.status}`);
        }
        const placesData = await placesResponse.json();

        if (placesData.results && placesData.results.length > 0) {
            const randomPlace = placesData.results[Math.floor(Math.random() * placesData.results.length)];
            movieTitle.textContent = randomPlace.name || 'Название не найдено';
            let description = `Рейтинг: ${randomPlace.rating || 'Нет данных'} ⭐ (${randomPlace.user_ratings_total || 0} оценок)`;
            description += `\nАдрес: ${randomPlace.vicinity || 'Нет данных'}`;
            movieDescription.textContent = description;
            placeText = movieTitle.textContent; // Обновляем текст для мема
        } else {
            movieTitle.textContent = 'Ресторан не найден 😿';
            movieDescription.textContent = 'Не удалось найти места поблизости. Проверьте ключ API и CORS прокси.';
        }
    } catch (error) {
        console.error('Ошибка при поиске места:', error);
        movieTitle.textContent = 'Ошибка загрузки 🚫';
        movieDescription.textContent = 'Попробуйте позже. Возможно, проблема с сетью или ключом Google Places API.';
    } finally {
        // Генерируем мем после получения ресторана
        await generateMeme(placeText); // Используем название ресторана как текст для мема

        // Разблокируем кнопки
        movieButton.disabled = false;
        placeButton.disabled = false;
        placeButton.textContent = 'Подобрать ресторан'; // Возвращаем исходный текст
    }
}


// --- Обработчики событий для кнопок ---
movieButton.addEventListener('click', fetchMovieAndCat);
placeButton.addEventListener('click', fetchPlaceAndCat);