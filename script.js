const toggleThemeBtn = document.getElementById('theme-toggle');
const toggleLangBtn = document.getElementById('lang-toggle');

let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLang = localStorage.getItem('lang') || 'en';

document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeBtn();
applyLanguage();

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeBtn();
}

function updateThemeBtn() {
    if (!toggleThemeBtn) return;
    if (currentLang === 'en') {
        toggleThemeBtn.innerText = currentTheme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';
    } else {
        toggleThemeBtn.innerText = currentTheme === 'dark' ? '☀️ Jasny tryb' : '🌙 Ciemny tryb';
    }
}

function toggleLang() {
    currentLang = currentLang === 'en' ? 'pl' : 'en';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
    updateThemeBtn();
    fetchBooks(); 
}

function applyLanguage() {
    if (toggleLangBtn) {
        toggleLangBtn.innerText = currentLang === 'en' ? '🇬🇧 EN' : '🇵🇱 PL';
    }

    document.querySelectorAll('[data-en]').forEach(el => {
        el.innerText = el.getAttribute(`data-${currentLang}`);
    });

    document.querySelectorAll('[data-en-placeholder]').forEach(el => {
        el.placeholder = el.getAttribute(`data-${currentLang}-placeholder`);
    });
}

const statusDict = {
    'Reading': { en: 'Reading', pl: 'Czytam' },
    'Czytam': { en: 'Reading', pl: 'Czytam' },
    'Completed': { en: 'Completed', pl: 'Przeczytane' },
    'Przeczytane': { en: 'Completed', pl: 'Przeczytane' },
    'Plan to Read': { en: 'Plan to Read', pl: 'W planach' },
    'W planach': { en: 'Plan to Read', pl: 'W planach' }
};

const supabaseUrl = 'https://ppumihanfubvfwjkdbwg.supabase.co';
const supabaseKey = 'sb_publishable_wqCAK1uB-dN4fsfEH1giAg_ST34VdJg';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

async function fetchBooks() {
    let { data: books, error } = await supabaseClient.from('books').select('*').order('id', { ascending: false });
    const list = document.getElementById('book-list');
    list.innerHTML = '';
    
    if (books && books.length > 0) {
        books.forEach(book => {
            const card = document.createElement('div');
            card.className = 'manga-card';
            card.id = `card-${book.id}`; 
            
            const rawStatus = book.status || 'Plan to Read'; 
            const statusText = statusDict[rawStatus] ? statusDict[rawStatus][currentLang] : rawStatus;
            
            let statusClass = 'Plan-to-Read';
            if (rawStatus === 'Completed' || rawStatus === 'Przeczytane') statusClass = 'Completed';
            if (rawStatus === 'Reading' || rawStatus === 'Czytam') statusClass = 'Reading';

            const ratingNumber = book.rating || 5;
            const stars = '★'.repeat(ratingNumber) + '☆'.repeat(5 - ratingNumber);

            const currentCh = book.chapter_current || 0;
            const totalCh = book.chapter_total || 0;
            
            let progressPercent = 0;
            if (totalCh > 0) {
                progressPercent = Math.min(100, Math.round((currentCh / totalCh) * 100));
            } else if (currentCh > 0) {
                progressPercent = 10; 
            }

            const totalDisplay = totalCh > 0 ? totalCh : '?';

            const coverHTML = book.image_url 
                ? `<img src="${book.image_url}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=\\'no-cover\\'>No Cover</div>'">`
                : `<div class="no-cover">No Cover</div>`;

            card.innerHTML = `
                <button class="btn-delete" onclick="deleteBook('${book.id}')">${currentLang === 'en' ? 'Delete' : 'Usuń'}</button>
                <div class="manga-cover">
                    ${coverHTML}
                </div>
                <div class="manga-details">
                    <div class="manga-title" title="${book.title}">${book.title}</div>
                    <div class="manga-author">${book.author}</div>
                    
                    <div class="chapters-text">
                        <span class="progress-percent-text" style="font-size: 12px; color: var(--text-muted);">${progressPercent}%</span>
                        <div class="chapter-controls">
                            <button class="btn-chapter btn-minus" onclick="updateChapter('${book.id}', ${currentCh}, ${totalCh}, -1, '${rawStatus}')">-</button>
                            <span class="chapter-count-text" style="cursor: pointer;" onclick="updateChapter('${book.id}', ${currentCh}, ${totalCh}, 'prompt', '${rawStatus}')" title="${currentLang === 'en' ? 'Click to edit' : 'Kliknij, aby edytować'}">${currentCh} / ${totalDisplay}</span>
                            <button class="btn-chapter btn-plus" onclick="updateChapter('${book.id}', ${currentCh}, ${totalCh}, 1, '${rawStatus}')">+</button>
                        </div>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    </div>

                    <div class="manga-rating">${stars}</div>
                    <span class="badge status-${statusClass}">${statusText.toUpperCase()}</span>
                </div>
            `;
            list.appendChild(card);
        });
    } else if (books && books.length === 0) {
        const emptyMsg = currentLang === 'en' ? 'Database is empty. Add your first title!' : 'Baza jest pusta. Dodaj pierwszy tytuł!';
        list.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">${emptyMsg}</div>`;
    } else if (error) {
        console.error(error);
    }
}

async function addBook() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const image_url = document.getElementById('image_url').value;
    const status = document.getElementById('status').value; 
    const rating = document.getElementById('rating').value; 
    const chapter_current = document.getElementById('chapter_current').value;
    const chapter_total = document.getElementById('chapter_total').value;
    
    if (!title || !author) {
        alert(currentLang === 'en' ? 'Please fill in Title and Author!' : 'Proszę wypełnić Tytuł i Autora!');
        return;
    }

    const btn = document.querySelector('.btn-add');
    const originalText = btn.innerText;
    btn.innerText = '...';

    const { error } = await supabaseClient.from('books').insert([
        { 
            title: title, 
            author: author, 
            image_url: image_url, 
            status: status, 
            rating: parseInt(rating),
            chapter_current: parseInt(chapter_current) || 0,
            chapter_total: parseInt(chapter_total) || 0
        }
    ]);
    
    btn.innerText = originalText;

    if (error) {
        alert(currentLang === 'en' ? 'Error adding. Check console.' : 'Błąd dodawania. Sprawdź konsolę.');
        console.error(error);
    } else {
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        document.getElementById('image_url').value = '';
        document.getElementById('chapter_current').value = '';
        document.getElementById('chapter_total').value = '';
        fetchBooks(); 
    }
}

async function deleteBook(id) {
    const msg = currentLang === 'en' ? 'Are you sure you want to delete this?' : 'Na pewno usunąć?';
    if(confirm(msg)) {
        const { error } = await supabaseClient.from('books').delete().eq('id', id);
        if (error) {
            alert(currentLang === 'en' ? 'Delete error.' : 'Błąd usuwania.');
            console.error(error);
        } else {
            fetchBooks();
        }
    }
}

async function updateChapter(id, currentCh, totalCh, change, currentStatus) {
    let newCh = currentCh;
    
    if (change === 'prompt') {
        const msg = currentLang === 'en' ? 'Enter current chapter:' : 'Wprowadź obecny rozdział:';
        const input = prompt(msg, currentCh);
        if (input === null || input.trim() === '') return;
        newCh = parseInt(input);
        if (isNaN(newCh)) return;
    } else {
        newCh = currentCh + change;
    }
    
    if (newCh < 0) newCh = 0;
    if (totalCh > 0 && newCh > totalCh) newCh = totalCh;
    
    if (newCh === currentCh) return; 

    let dbStatus = currentStatus;
    if (dbStatus === 'Czytam') dbStatus = 'Reading';
    if (dbStatus === 'Przeczytane') dbStatus = 'Completed';
    if (dbStatus === 'W planach') dbStatus = 'Plan to Read';

    if (totalCh > 0 && newCh === totalCh) {
        dbStatus = 'Completed';
    } else if (newCh > 0 && dbStatus === 'Plan to Read') {
        dbStatus = 'Reading';
    } else if (newCh < totalCh && dbStatus === 'Completed') {
        dbStatus = 'Reading';
    }

    let progressPercent = 0;
    if (totalCh > 0) {
        progressPercent = Math.min(100, Math.round((newCh / totalCh) * 100));
    } else if (newCh > 0) {
        progressPercent = 10; 
    }

    const card = document.getElementById(`card-${id}`);
    if (card) {
        const percentSpan = card.querySelector('.progress-percent-text');
        if (percentSpan) percentSpan.innerText = `${progressPercent}%`;

        const progressBar = card.querySelector('.progress-bar');
        if (progressBar) progressBar.style.width = `${progressPercent}%`;

        const totalDisplay = totalCh > 0 ? totalCh : '?';
        const chapterCountSpan = card.querySelector('.chapter-count-text');
        if (chapterCountSpan) {
            chapterCountSpan.innerText = `${newCh} / ${totalDisplay}`;
            chapterCountSpan.setAttribute('onclick', `updateChapter('${id}', ${newCh}, ${totalCh}, 'prompt', '${dbStatus}')`);
        }

        const btnMinus = card.querySelector('.btn-minus');
        const btnPlus = card.querySelector('.btn-plus');
        if (btnMinus) btnMinus.setAttribute('onclick', `updateChapter('${id}', ${newCh}, ${totalCh}, -1, '${dbStatus}')`);
        if (btnPlus) btnPlus.setAttribute('onclick', `updateChapter('${id}', ${newCh}, ${totalCh}, 1, '${dbStatus}')`);

        const badge = card.querySelector('.badge');
        if (badge) {
            let statusClass = 'Plan-to-Read';
            if (dbStatus === 'Completed') statusClass = 'Completed';
            if (dbStatus === 'Reading') statusClass = 'Reading';
            const statusText = statusDict[dbStatus] ? statusDict[dbStatus][currentLang] : dbStatus;
            badge.className = `badge status-${statusClass}`;
            badge.innerText = statusText.toUpperCase();
        }
    }

    const { error } = await supabaseClient
        .from('books')
        .update({ chapter_current: newCh, status: dbStatus })
        .eq('id', id);

    if (error) console.error(error);
}

function filterManga() {
    const searchText = document.getElementById('search-input').value.toLowerCase();
    const cards = document.querySelectorAll('.manga-card');

    cards.forEach(card => {
        const title = card.querySelector('.manga-title').innerText.toLowerCase();
        if (title.includes(searchText)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

fetchBooks();