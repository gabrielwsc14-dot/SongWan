const audio = document.getElementById('audio-engine');
const resultsArea = document.getElementById('results');
const sidebar = document.getElementById('sidebar');
const playPauseBtn = document.getElementById('play-pause');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalTimeEl = document.getElementById('total-time');

let favoritos = JSON.parse(localStorage.getItem('songwan_favs')) || [];
let currentSong = null;

// 1. Busca de Músicas
document.getElementById('search-action').onclick = async () => {
    const term = document.getElementById('query').value;
    if (!term) return;
    resultsArea.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--wander-blue);'>SongWan escaneando rede...</p>";
    
    try {
        const resp = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&limit=20&entity=song`);
        const data = await resp.json();
        render(data.results);
    } catch (e) {
        resultsArea.innerHTML = "Erro ao buscar músicas.";
    }
};

function render(songs) {
    resultsArea.innerHTML = "";
    if (songs.length === 0) {
        resultsArea.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Nenhuma música encontrada.</p>";
        return;
    }
    songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-card';
        div.onclick = () => play(song);
        div.innerHTML = `
            <img src="${song.artworkUrl100.replace('100x100','400x400')}">
            <h4>${song.trackName}</h4>
            <p style="font-size: 0.7rem; color: #a0a0a0;">${song.artistName}</p>
        `;
        resultsArea.appendChild(div);
    });
}

// 2. Lógica do Player
function play(song) {
    currentSong = song;
    audio.src = song.previewUrl;
    audio.play();
    
    document.getElementById('current-title').innerText = song.trackName;
    document.getElementById('current-artist').innerText = song.artistName;
    const cover = document.getElementById('current-cover');
    cover.src = song.artworkUrl100.replace('100x100','400x400');
    cover.style.display = 'block';
    playPauseBtn.innerText = "⏸";
    
    updateFavButton();

    // Configura o "Segundo Plano" para o Android/iOS
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.trackName,
            artist: song.artistName,
            artwork: [{ src: song.artworkUrl100, sizes: '512x512', type: 'image/png' }]
        });
    }
}

// ATUALIZAR A "CORDINHA" (BARRA DE PROGRESSO) E O TEMPO
audio.ontimeupdate = () => {
    if (audio.duration) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressBar.value = pct;
        currentTimeEl.innerText = formatTime(audio.currentTime);
        totalTimeEl.innerText = formatTime(audio.duration);
    }
};

// Arrastar a cordinha para mudar o tempo da música
progressBar.oninput = () => {
    const time = (progressBar.value * audio.duration) / 100;
    audio.currentTime = time;
};

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// 3. Controles e Menu
playPauseBtn.onclick = () => {
    if (audio.paused) {
        audio.play();
        playPauseBtn.innerText = "⏸";
    } else {
        audio.pause();
        playPauseBtn.innerText = "▶";
    }
};

document.getElementById('menu-toggle').onclick = (e) => {
    e.stopPropagation();
    sidebar.classList.toggle('active');
};

document.getElementById('nav-library').onclick = () => {
    render(favoritos);
    sidebar.classList.remove('active');
};

document.getElementById('nav-search').onclick = () => {
    resultsArea.innerHTML = ""; // Limpa para nova busca
    sidebar.classList.remove('active');
};

// 4. Sistema de Favoritos
document.getElementById('fav-btn').onclick = () => {
    if (!currentSong) return;
    const index = favoritos.findIndex(s => s.trackId === currentSong.trackId);
    if (index === -1) {
        favoritos.push(currentSong);
    } else {
        favoritos.splice(index, 1);
    }
    localStorage.setItem('songwan_favs', JSON.stringify(favoritos));
    updateFavButton();
};

function updateFavButton() {
    const isFav = favoritos.some(s => s.trackId === currentSong?.trackId);
    document.getElementById('fav-btn').innerText = isFav ? "★" : "☆";
}
