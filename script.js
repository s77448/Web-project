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
    'Completed': { en: 'Completed', pl: 'Przeczytane' },
    'Plan to Read': { en: 'Plan to Read', pl: 'W planach' }
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
            
            const rawStatus = book.status || 'Plan to Read'; 
            const statusText = statusDict[rawStatus] ? statusDict[rawStatus][currentLang] : rawStatus;
            const statusClass = rawStatus.replace(/ /g, '-'); 
            
            const ratingNumber = book.rating || 5;
            const stars = '★'.repeat(ratingNumber) + '☆'.repeat(5 - ratingNumber);

            const coverHTML = book.image_url 
                ? `<img src="${book.image_url}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=\\'no-cover\\'>No Cover</div>'">`
                : `<div class="no-cover">No Cover</div>`;

            card.innerHTML = `
                <button class="btn-delete" onclick="deleteBook(${book.id})" data-en="Delete" data-pl="Usuń">${currentLang === 'en' ? 'Delete' : 'Usuń'}</button>
                <div class="manga-cover">
                    ${coverHTML}
                </div>
                <div class="manga-details">
                    <div class="manga-title" title="${book.title}">${book.title}</div>
                    <div class="manga-author">${book.author}</div>
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
    
    if (!title || !author) {
        alert(currentLang === 'en' ? 'Please fill in Title and Author!' : 'Proszę wypełnić Tytuł i Autora!');
        return;
    }

    const btn = document.querySelector('.btn-add');
    const originalText = btn.innerText;
    btn.innerText = '...';

    const { error } = await supabaseClient.from('books').insert([
        { title: title, author: author, image_url: image_url, status: status, rating: parseInt(rating) }
    ]);
    
    btn.innerText = originalText;

    if (error) {
        alert(currentLang === 'en' ? 'Error adding. Check console.' : 'Błąd dodawania. Sprawdź konsolę.');
        console.error(error);
    } else {
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        document.getElementById('image_url').value = '';
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

fetchBooks();