const toggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme') || 'dark';

document.documentElement.setAttribute('data-theme', currentTheme);
if (toggleBtn) toggleBtn.innerText = currentTheme === 'dark' ? '☀️ Light mode' : '🌙 Dark mode';

function toggleTheme() {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        if (toggleBtn) toggleBtn.innerText = '🌙 Dark mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        if (toggleBtn) toggleBtn.innerText = '☀️ Light mode';
    }
}

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
            
            const currentStatus = book.status || 'Plan to Read'; 
            const statusClass = currentStatus.replace(/ /g, '-'); 
            const ratingNumber = book.rating || 5;
            const stars = '★'.repeat(ratingNumber) + '☆'.repeat(5 - ratingNumber);

            const coverHTML = book.image_url 
                ? `<img src="${book.image_url}" alt="${book.title}" onerror="this.parentElement.innerHTML='<div class=\\'no-cover\\'>📖</div>'">`
                : `<div class="no-cover">📖</div>`;

            card.innerHTML = `
                <button class="btn-delete" onclick="deleteBook(${book.id})">Usuń</button>
                <div class="manga-cover">
                    ${coverHTML}
                </div>
                <div class="manga-details">
                    <div class="manga-title" title="${book.title}">${book.title}</div>
                    <div class="manga-author">✍️ ${book.author}</div>
                    <div class="manga-rating">${stars}</div>
                    <span class="badge status-${statusClass}">${currentStatus}</span>
                </div>
            `;
            list.appendChild(card);
        });
    } else if (books && books.length === 0) {
        list.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Baza jest pusta. Dodaj pierwszy tytuł!</div>';
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
        alert('Proszę wypełnić Title i Author!');
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
        alert('Błąd dodawania. Sprawdź konsolę.');
        console.error(error);
    } else {
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        document.getElementById('image_url').value = '';
        fetchBooks(); 
    }
}

async function deleteBook(id) {
    if(confirm('Na pewno usunąć?')) {
        const { error } = await supabaseClient.from('books').delete().eq('id', id);
        if (error) {
            alert('Błąd usuwania.');
            console.error(error);
        } else {
            fetchBooks();
        }
    }
}

fetchBooks();