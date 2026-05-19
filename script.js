// ==========================================
// 1. ЛОГИКА ТЕМНОЙ ТЕМЫ (PREMIUM)
// ==========================================
const toggleBtn = document.getElementById('theme-toggle');
// По умолчанию ставим Темную
const currentTheme = localStorage.getItem('theme') || 'dark'; 

// Устанавливаем тему при загрузке
document.body.setAttribute('data-theme', currentTheme);
updateToggleButtonText(currentTheme);

function toggleTheme() {
    let theme = document.body.getAttribute('data-theme');
    
    if (theme === 'dark') {
        document.body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateToggleButtonText('light');
    } else {
        document.body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateToggleButtonText('dark');
    }
}

function updateToggleButtonText(theme) {
    if (!toggleBtn) return;
    toggleBtn.innerText = theme === 'dark' ? '☀️ Jasny tryb' : '🌙 Ciemny tryb';
}

// ==========================================
// 2. ЛОГИКА БАЗЫ ДАННЫХ (SUPABASE)
// ==========================================
// ТВОИ КЛЮЧИ Supabase - НЕ МЕНЯЙ ИХ
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
                <div class="book-info-top">
                    <div class="book-title">${book.title}</div>
                    <div class="book-author">✍️ ${book.author}</div>
                </div>
                <div class="book-info-bottom">
                    <div class="book-rating">${stars}</div>
                    <span class="badge status-${statusClass}">${currentStatus}</span>
                </div>
                <button class="btn-delete" onclick="deleteBook(${book.id})">Usuń</button>
            `;
            list.appendChild(li);
        });
    } else if (books && books.length === 0) {
        list.innerHTML = '<li style="grid-column: 1/-1; text-align: center; border: none; color: var(--text-muted);">Brak książek в базе. Добавь первую!</li>';
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

    const btn = document.querySelector('.btn-primary');
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