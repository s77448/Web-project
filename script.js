
const toggleBtn = document.getElementById('theme-toggle');
const currentTheme = localStorage.getItem('theme');


if (currentTheme) {
    document.documentElement.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'dark' && toggleBtn) {
        toggleBtn.innerText = '☀️ Jasny tryb';
    }
}


function toggleTheme() {
    let theme = document.documentElement.getAttribute('data-theme');
    
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        if (toggleBtn) toggleBtn.innerText = '🌙 Ciemny tryb';
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        if (toggleBtn) toggleBtn.innerText = '☀️ Jasny tryb';
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
            const li = document.createElement('li');
            
            const currentStatus = book.status || 'W planach'; 
            const statusClass = currentStatus.replace(' ', '-'); 

            const ratingNumber = book.rating || 5; // если оценки нет, пусть будет 5
            const stars = '⭐'.repeat(ratingNumber);

            li.innerHTML = `
                <div class="book-info">
                    <span class="book-title">${book.title}</span>
                    <span class="book-author">✍️ ${book.author}</span>
                    <span class="book-rating">${stars}</span>
                    <span class="badge status-${statusClass}">${currentStatus}</span>
                </div>
                <button class="btn-delete" onclick="deleteBook(${book.id})">Usuń</button>
            `;
            list.appendChild(li);
        });
    } else if (books && books.length === 0) {
        list.innerHTML = '<li style="border-left: 4px solid var(--border-line); color: var(--text-muted); display: block;">Brak książek w bazie. Dodaj pierwszą!</li>';
    } else if (error) {
        console.error("Błąd pobierania:", error);
    }
}

async function addBook() {
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const status = document.getElementById('status').value; 
    const rating = document.getElementById('rating').value; 
    
    if (!title || !author) {
        alert('Proszę wypełnić oba pola!');
        return;
    }

    const btn = document.querySelector('.btn-add');
    const originalText = btn.innerText;
    btn.innerText = 'Zapisywanie...';

    const { error } = await supabaseClient.from('books').insert([{ title: title, author: author, status: status, rating: parseInt(rating) }]);
    
    btn.innerText = originalText;

    if (error) {
        alert('Błąd dodawania. Sprawdź konsolę (F12).');
        console.error(error);
    } else {
        document.getElementById('title').value = '';
        document.getElementById('author').value = '';
        fetchBooks(); 
    }
}

async function deleteBook(id) {
    if(confirm('Na pewno chcesz usunąć tę książkę?')) {
        const { error } = await supabaseClient
            .from('books')
            .delete()
            .eq('id', id);
            
        if (error) {
            alert('Błąd usuwania.');
            console.error(error);
        } else {
            fetchBooks();
        }
    }
}


fetchBooks();