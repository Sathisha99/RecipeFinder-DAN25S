// ====== Config ======
const API = 'https://www.themealdb.com/api/json/v1/1/';

// ====== DOM refs ======
const el = {
    q: document.getElementById('q'),
    category: document.getElementById('category'),
    sort: document.getElementById('sort'),
    perPage: document.getElementById('perPage'),
    results: document.getElementById('results'),
    status: document.getElementById('status'),
    pager: document.getElementById('pager'),
    prev: document.getElementById('prev'),
    next: document.getElementById('next'),
    pageInfo: document.getElementById('pageInfo'),
    modal: document.getElementById('mealModal'),
    closeModal: document.getElementById('closeModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalBody: document.getElementById('modalBody'),
    favsToggle: document.getElementById('favsToggle'),
    meta: document.getElementById('meta'),           // ✅ add this
};

// ====== App state ======
const state = {
    meals: [],
    page: 1,
    perPage: 12,
    sortDir: 'asc',
    query: '',
    category: '',
    favs: new Set(),
    showFavsOnly: false,
};

// ====== Utilities ======
function showStatus(msg) { el.status.textContent = msg; el.status.hidden = !msg; }
function clearStatus() { showStatus(''); }

async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

// ===== Cards =====
function isFav(id) { return state.favs.has(String(id)); }

function mealCard(meal) {
    const fav = isFav(meal.idMeal);
    return `
    <article class="card" data-id="${meal.idMeal}">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <div class="body">
        <h3>${meal.strMeal}</h3>
        <span class="badge">${meal.strCategory || 'Unknown'}</span>
        <div class="actions">
          <button class="btn" data-action="fav" data-id="${meal.idMeal}">
            ${fav ? '❤️ Favorite' : '🤍 Add to favorites'}
          </button>
          <button class="btn primary" data-action="details" data-id="${meal.idMeal}">Details</button>
        </div>
      </div>
    </article>
  `;
}

function renderMeals(list = []) {
    if (!Array.isArray(list) || list.length === 0) {
        el.results.innerHTML = '';
        showStatus('No results.');
        el.pager.hidden = true;
        return;
    }
    clearStatus();
    el.results.innerHTML = list.map(mealCard).join('');
}

// ===== Helpers (debounce, sort, paginate, pager) =====
function debounce(fn, delay = 350) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
function applySort(list, dir = 'asc') {
    const mul = dir === 'desc' ? -1 : 1;
    return [...list].sort((a, b) => mul * a.strMeal.localeCompare(b.strMeal));
}
function paginate(list, page, perPage) {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const p = Math.min(Math.max(1, page), totalPages);
    const start = (p - 1) * perPage, end = start + perPage;
    return { slice: list.slice(start, end), page: p, totalPages };
}
function renderPager(page, totalPages) {
    el.pager.hidden = totalPages <= 1;
    el.prev.disabled = page <= 1;
    el.next.disabled = page >= totalPages;
    el.pageInfo.textContent = `Page ${page} / ${totalPages}`;
}

// ===== Ingredient helpers & modal =====
function extractIngredients(meal) {
    const items = [];
    for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`];
        const qty = meal[`strMeasure${i}`];
        if (ing && ing.trim()) items.push({ name: ing.trim(), measure: (qty || '').trim() });
    }
    return items;
}
async function lookupMealById(id) {
    const data = await fetchJSON(`${API}lookup.php?i=${encodeURIComponent(id)}`);
    return (data.meals && data.meals[0]) || null;
}
function renderModal(meal) {
    if (!meal) return;
    const ingredients = extractIngredients(meal)
        .map(i => `<li><strong>${i.name}</strong>${i.measure ? ` – ${i.measure}` : ''}</li>`).join('');
    el.modalTitle.textContent = meal.strMeal;
    el.modalBody.innerHTML = `
    <figure style="margin:0 0 1rem">
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;background:#f3f4f6">
      <figcaption style="color:#666;margin-top:.4rem">${meal.strArea || 'Unknown area'} • ${meal.strCategory || 'Unknown category'}</figcaption>
    </figure>
    <section style="margin:0 0 1rem">
      <h3 style="margin:.2rem 0 .4rem">Ingredients</h3>
      <ul style="margin:0;padding-left:1.2rem">${ingredients || '<li>No ingredients listed.</li>'}</ul>
    </section>
    <section>
      <h3 style="margin:.8rem 0 .4rem">Instructions</h3>
      <p style="white-space:pre-wrap;margin:0">${meal.strInstructions || 'No instructions provided.'}</p>
    </section>`;
    if (typeof el.modal.showModal === 'function') el.modal.showModal();
    else el.modal.setAttribute('open', '');
}

// ===== Frequency panel (VG) =====
function ingredientFrequency(meals) {
    return meals
        .flatMap(m => extractIngredients(m).map(i => i.name))
        .reduce((acc, name) => { acc[name] = (acc[name] || 0) + 1; return acc; }, {});
}
function renderFrequencyPanel(freqObj) {
    if (!el.meta) return;
    const entries = Object.entries(freqObj).sort((a,b)=>b[1]-a[1]).slice(0,10);
    if (!entries.length) { el.meta.innerHTML=''; return; }
    const list = entries.map(([name,count]) =>
        `<li style="display:flex;justify-content:space-between;gap:.75rem"><span>${name}</span><strong>${count}</strong></li>`
    ).join('');
    el.meta.innerHTML = `
    <section class="card" style="padding:.85rem 1rem">
      <h3 style="margin:.2rem 0 .6rem">Top Ingredients (current view)</h3>
      <ul style="list-style:none;padding:0;margin:0">${list}</ul>
    </section>`;
}

// ===== Categories & storage =====
async function loadCategories() {
    try {
        showStatus('Loading categories…');
        const data = await fetchJSON(`${API}list.php?c=list`);
        const cats = (data.meals || []).map(m => m.strCategory).sort((a,b)=>a.localeCompare(b));
        el.category.innerHTML = `<option value="">All categories</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
        clearStatus();
    } catch (err) {
        console.error(err);
        showStatus('Could not load categories. Try reloading.');
    }
}
const LS_FAVS = 'rf:favorites';
function loadFavorites() {
    try {
        const raw = localStorage.getItem(LS_FAVS);
        const arr = raw ? JSON.parse(raw) : [];
        state.favs = new Set(arr);
    } catch { state.favs = new Set(); }
}
function saveFavorites() { localStorage.setItem(LS_FAVS, JSON.stringify([...state.favs])); }
function toggleFavorite(id) {
    id = String(id);
    if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
    saveFavorites();
}

// ===== Filtering + rendering pipeline =====
function getFilteredSortedMeals() {
    let list = state.category
        ? state.meals.filter(m => (m.strCategory || '').toLowerCase() === state.category.toLowerCase())
        : state.meals;
    if (state.showFavsOnly) list = list.filter(m => isFav(m.idMeal));
    return applySort(list, state.sortDir);
}
function renderAll() {
    const list = getFilteredSortedMeals();
    const { slice, page, totalPages } = paginate(list, state.page, state.perPage);
    renderMeals(slice);
    renderPager(page, totalPages);
    const freq = ingredientFrequency(slice);          // or use `list` for all results
    renderFrequencyPanel(freq);
}

// ===== Search =====
async function searchByName(query) {
    try {
        showStatus('Searching…');
        const data = await fetchJSON(`${API}search.php?s=${encodeURIComponent(query)}`);
        state.query = query;
        state.page = 1;
        state.meals = data.meals || [];
        clearStatus();
        renderAll();
    } catch (err) {
        console.error(err);
        showStatus('Search failed. Please try again.');
    }
}

// ===== Init (runs on page load) =====
async function init() {
    loadFavorites();
    await loadCategories();

    // Search (debounced)
    const debouncedSearch = debounce((val) => { if (!val) searchByName('a'); else searchByName(val); }, 400);
    el.q.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

    // Category filter
    el.category.addEventListener('change', () => { state.category = el.category.value; state.page = 1; renderAll(); });

    // Sort toggle
    el.sort.addEventListener('click', () => {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
        el.sort.textContent = state.sortDir === 'asc' ? 'Sort A → Z' : 'Sort Z → A';
        renderAll();
    });

    // Per page
    el.perPage.addEventListener('change', () => { state.perPage = Number(el.perPage.value) || 12; state.page = 1; renderAll(); });

    // Pager
    el.prev.addEventListener('click', () => { state.page = Math.max(1, state.page - 1); renderAll(); });
    el.next.addEventListener('click', () => { state.page = state.page + 1; renderAll(); });

    // Favorites-only toggle
    el.favsToggle.addEventListener('click', () => {
        state.showFavsOnly = !state.showFavsOnly;
        el.favsToggle.classList.toggle('active', state.showFavsOnly);
        el.favsToggle.textContent = state.showFavsOnly ? 'Favorites only' : 'All recipes';
        state.page = 1; renderAll();
    });

    // Results click: fav or details
    el.results.addEventListener('click', async (e) => {
        const favBtn = e.target.closest('[data-action="fav"]');
        if (favBtn) { toggleFavorite(favBtn.getAttribute('data-id')); renderAll(); return; }
        const detailsBtn = e.target.closest('[data-action="details"]');
        if (detailsBtn) {
            try { showStatus('Loading meal…'); const meal = await lookupMealById(detailsBtn.getAttribute('data-id')); clearStatus(); renderModal(meal); }
            catch (err) { console.error(err); showStatus('Could not load meal details.'); }
        }
    });

    // Close modal
    el.closeModal.addEventListener('click', () => el.modal.close());
    el.modal.addEventListener('cancel', () => el.modal.close());

    // Initial data load
    await searchByName('a');
}

// Start the app (no top-level await)
init();
