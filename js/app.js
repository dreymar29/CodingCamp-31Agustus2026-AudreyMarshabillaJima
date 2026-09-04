/* ═══════════════════════════════════════════
   PERSONAL DASHBOARD — app.js
   Features:
     1. Greeting (time-based) + live clock
     2. Focus Timer (25-min) + Rest Timer (5-min)
     3. To-Do List  (add / edit / done / delete / sort by deadline)
        └─ Edit modal includes: text, deadline, done toggle
     4. Quick Links (add / delete, localStorage)
     5. Light / Dark mode toggle
═══════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   STORAGE HELPERS
───────────────────────────────────────── */
const Storage = {
  get(key, fallback = []) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
  },
};

const KEYS = {
  todos: 'dashboard_todos',
  links: 'dashboard_links',
  theme: 'dashboard_theme',
  sort:  'dashboard_sort',
};

/* ═══════════════════════════════════════════
   5. LIGHT / DARK MODE
═══════════════════════════════════════════ */
const htmlEl      = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
const themeLabel  = document.getElementById('theme-label');

function applyTheme(theme) {
  htmlEl.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    themeIcon.textContent  = '☀️';
    themeLabel.textContent = 'Light Mode';
    themeToggle.setAttribute('aria-label', 'Switch to light mode');
  } else {
    themeIcon.textContent  = '🌙';
    themeLabel.textContent = 'Dark Mode';
    themeToggle.setAttribute('aria-label', 'Switch to dark mode');
  }
  Storage.set(KEYS.theme, theme);
}

// Load saved theme or default to dark
applyTheme(Storage.get(KEYS.theme, 'dark'));

themeToggle.addEventListener('click', () => {
  const current = htmlEl.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});


/* ═══════════════════════════════════════════
   1. GREETING & LIVE CLOCK
═══════════════════════════════════════════ */
const greetingEl = document.getElementById('greeting');
const datetimeEl = document.getElementById('datetime');

function getGreeting(hour) {
  if (hour >= 5  && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

function updateClock() {
  const now  = new Date();
  const hour = now.getHours();

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });

  datetimeEl.textContent = `${dateStr} · ${timeStr}`;
  greetingEl.innerHTML   = `${getGreeting(hour)}, <span>have a great day!</span>`;
}

updateClock();
setInterval(updateClock, 1000);


/* ═══════════════════════════════════════════
   2. FOCUS TIMER + REST TIMER
═══════════════════════════════════════════ */
const FOCUS_SECONDS = 25 * 60;
const REST_SECONDS  =  5 * 60;

const timerCard    = document.getElementById('timer-card');
const timerDisplay = document.getElementById('timer-display');
const timerStatus  = document.getElementById('timer-status');
const btnStart     = document.getElementById('timer-start');
const btnStop      = document.getElementById('timer-stop');
const btnReset     = document.getElementById('timer-reset');
const modeFocusBtn = document.getElementById('mode-focus');
const modeRestBtn  = document.getElementById('mode-rest');

let timerInterval = null;
let timerRunning  = false;
let timerMode     = 'focus';   // 'focus' | 'rest'
let timeRemaining = FOCUS_SECONDS;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeRemaining);
  timerDisplay.classList.toggle('running',  timerRunning);
  timerDisplay.classList.toggle('finished', timeRemaining === 0 && !timerRunning);
}

function setMode(mode) {
  if (timerRunning) return;   // don't switch while running
  timerMode = mode;

  if (mode === 'focus') {
    timeRemaining = FOCUS_SECONDS;
    modeFocusBtn.classList.add('active');
    modeRestBtn.classList.remove('active');
    timerCard.classList.remove('rest-mode');
    timerStatus.textContent = 'Ready to focus';
  } else {
    timeRemaining = REST_SECONDS;
    modeRestBtn.classList.add('active');
    modeFocusBtn.classList.remove('active');
    timerCard.classList.add('rest-mode');
    timerStatus.textContent = 'Ready for a break';
  }

  timerDisplay.classList.remove('running', 'finished');
  renderTimer();
}

function startTimer() {
  if (timerRunning || timeRemaining === 0) return;
  timerRunning = true;
  timerStatus.textContent = timerMode === 'focus'
    ? 'Stay focused!'
    : 'Enjoy your break ☕';
  renderTimer();

  timerInterval = setInterval(() => {
    timeRemaining--;
    renderTimer();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerRunning  = false;
      timerDisplay.classList.remove('running');
      timerDisplay.classList.add('finished');
      timerStatus.textContent = timerMode === 'focus'
        ? '🎉 Focus session complete! Time to rest.'
        : '✅ Break over! Ready to focus again?';
    }
  }, 1000);
}

function stopTimer() {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  timerStatus.textContent = 'Paused';
  renderTimer();
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timerRunning  = false;
  timeRemaining = timerMode === 'focus' ? FOCUS_SECONDS : REST_SECONDS;
  timerDisplay.classList.remove('running', 'finished');
  timerStatus.textContent = timerMode === 'focus'
    ? 'Ready to focus'
    : 'Ready for a break';
  renderTimer();
}

modeFocusBtn.addEventListener('click', () => setMode('focus'));
modeRestBtn.addEventListener('click',  () => setMode('rest'));
btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click',  stopTimer);
btnReset.addEventListener('click', resetTimer);

renderTimer();


/* ═══════════════════════════════════════════
   3. TO-DO LIST
═══════════════════════════════════════════ */
let todos    = Storage.get(KEYS.todos, []);
let sortMode = Storage.get(KEYS.sort, 'deadline'); // 'deadline' | 'added' | 'status'

const todoForm          = document.getElementById('todo-form');
const todoInput         = document.getElementById('todo-input');
const todoDeadlineInput = document.getElementById('todo-deadline');
const todoListEl        = document.getElementById('todo-list');
const todoEmpty         = document.getElementById('todo-empty');

// Edit modal elements
const editModal    = document.getElementById('edit-modal');
const editInput    = document.getElementById('edit-input');
const editDeadline = document.getElementById('edit-deadline');
const editDone     = document.getElementById('edit-done');      // ← new done checkbox
const editSave     = document.getElementById('edit-save');
const editCancel   = document.getElementById('edit-cancel');
let   editingId    = null;

// Sort buttons
const sortBtns = document.querySelectorAll('.sort-btn');

function saveTodos() {
  Storage.set(KEYS.todos, todos);
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* ── Sorting / filtering ── */
function getSortedTodos() {
  let result = [...todos];

  if (sortMode === 'deadline') {
    // Hide completed tasks — they live in the Completed tab instead.
    result = result.filter(t => !t.done);
    // Soonest deadline first; overdue items also come first (they're most urgent).
    // Tasks with no deadline go to the end.
    result.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });

  } else if (sortMode === 'added') {
    // Most recently added first — reverse of insertion order.
    // The todos array preserves insertion order, so we reverse the index comparison.
    result.sort((a, b) => todos.indexOf(b) - todos.indexOf(a));

  } else if (sortMode === 'status') {
    // Show ONLY completed tasks (done === true).
    result = result.filter(t => t.done);
  }

  return result;
}

/* ── Deadline badge helpers ── */
function getDeadlineInfo(deadline) {
  if (!deadline) return null;

  const today   = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(deadline + 'T00:00:00'); // local midnight
  const diffMs  = dueDate - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)   return { label: `Overdue by ${-diffDays}d`, state: 'overdue'  };
  if (diffDays === 0) return { label: 'Due today',                 state: 'due-soon' };
  if (diffDays === 1) return { label: 'Due tomorrow',              state: 'due-soon' };
  if (diffDays <= 3)  return { label: `Due in ${diffDays} days`,   state: 'due-soon' };

  const formatted = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { label: `Due ${formatted}`, state: '' };
}

/* ── Render list ── */
function renderTodos() {
  todoListEl.innerHTML = '';
  const sorted = getSortedTodos();

  // Context-aware empty message
  if (sorted.length === 0) {
    todoEmpty.style.display = 'block';
    if (sortMode === 'status') {
      todoEmpty.textContent = 'No completed tasks yet. Check off a task to see it here!';
    } else if (sortMode === 'deadline' && todos.filter(t => !t.done).length === 0 && todos.length > 0) {
      todoEmpty.textContent = 'All tasks are done! Check the Completed tab.';
    } else {
      todoEmpty.textContent = 'No tasks yet. Add one above!';
    }
  } else {
    todoEmpty.style.display = 'none';
  }

  sorted.forEach((todo) => {
    const info = getDeadlineInfo(todo.deadline);

    let itemClass = 'todo-item';
    if (todo.done) {
      itemClass += ' done';
    } else if (info && info.state) {
      itemClass += ` ${info.state}`;
    }

    const li = document.createElement('li');
    li.className  = itemClass;
    li.dataset.id = todo.id;

    const deadlineBadge = info
      ? `<span class="todo-deadline-badge">📅 ${escapeHtml(info.label)}</span>`
      : '';

    li.innerHTML = `
      <input
        type="checkbox"
        class="todo-checkbox"
        aria-label="Mark as done"
        ${todo.done ? 'checked' : ''}
      />
      <div class="todo-body">
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        ${deadlineBadge}
      </div>
      <div class="todo-actions">
        <button class="btn btn-ghost  btn-icon edit-btn"   title="Edit task">✏️</button>
        <button class="btn btn-danger btn-icon delete-btn" title="Delete task">🗑</button>
      </div>
    `;

    li.querySelector('.todo-checkbox').addEventListener('change', () => toggleDone(todo.id));
    li.querySelector('.edit-btn').addEventListener('click',       () => openEditModal(todo.id));
    li.querySelector('.delete-btn').addEventListener('click',     () => deleteTodo(todo.id));

    todoListEl.appendChild(li);
  });
}

function addTodo(text, deadline) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({ id: generateId(), text: trimmed, deadline: deadline || '', done: false });
  saveTodos();
  renderTodos();
}

function toggleDone(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  todo.done = !todo.done;
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  saveTodos();
  renderTodos();
}

/* ── Edit modal ── */
function openEditModal(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;
  editingId          = id;
  editInput.value    = todo.text;
  editDeadline.value = todo.deadline || '';
  editDone.checked   = todo.done;           // ← pre-fill done state
  editModal.hidden   = false;
  editInput.focus();
}

function closeEditModal() {
  editingId        = null;
  editModal.hidden = true;
}

function saveEdit() {
  const trimmed = editInput.value.trim();
  if (!trimmed) return;
  const todo = todos.find(t => t.id === editingId);
  if (todo) {
    todo.text     = trimmed;
    todo.deadline = editDeadline.value || '';
    todo.done     = editDone.checked;       // ← save done state from modal
    saveTodos();
    renderTodos();
  }
  closeEditModal();
}

/* ── Sort controls ── */
function setSortMode(mode) {
  sortMode = mode;
  Storage.set(KEYS.sort, mode);
  sortBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === mode);
  });
  renderTodos();
}

sortBtns.forEach(btn => {
  btn.addEventListener('click', () => setSortMode(btn.dataset.sort));
  btn.classList.toggle('active', btn.dataset.sort === sortMode);
});

/* ── Event listeners ── */
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addTodo(todoInput.value, todoDeadlineInput.value);
  todoInput.value         = '';
  todoDeadlineInput.value = '';
});

editSave.addEventListener('click', saveEdit);
editCancel.addEventListener('click', closeEditModal);

editInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter')  saveEdit();
  if (e.key === 'Escape') closeEditModal();
});

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) closeEditModal();
});

renderTodos();


/* ═══════════════════════════════════════════
   4. QUICK LINKS
═══════════════════════════════════════════ */
let links = Storage.get(KEYS.links, [
  { id: generateId(), name: 'Google',  url: 'https://www.google.com' },
  { id: generateId(), name: 'GitHub',  url: 'https://github.com' },
  { id: generateId(), name: 'YouTube', url: 'https://www.youtube.com' },
]);

const linkForm   = document.getElementById('link-form');
const linkNameIn = document.getElementById('link-name');
const linkUrlIn  = document.getElementById('link-url');
const linksGrid  = document.getElementById('links-grid');
const linksEmpty = document.getElementById('links-empty');

function saveLinks() {
  Storage.set(KEYS.links, links);
}

function getFaviconUrl(url) {
  try {
    const origin = new URL(url).origin;
    return `https://www.google.com/s2/favicons?domain=${origin}&sz=32`;
  } catch {
    return null;
  }
}

function renderLinks() {
  linksGrid.innerHTML = '';
  linksEmpty.style.display = links.length === 0 ? 'block' : 'none';

  links.forEach((link) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display  = 'inline-flex';

    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href      = link.url;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';

    const favicon = getFaviconUrl(link.url);
    if (favicon) {
      const img     = document.createElement('img');
      img.src       = favicon;
      img.alt       = '';
      img.className = 'link-favicon';
      img.onerror   = () => img.remove();
      a.appendChild(img);
    }

    const label = document.createElement('span');
    label.textContent = link.name;
    a.appendChild(label);

    const del = document.createElement('button');
    del.className   = 'link-delete';
    del.textContent = '×';
    del.title       = 'Remove link';
    del.setAttribute('aria-label', `Remove ${link.name}`);
    del.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    a.appendChild(del);
    wrapper.appendChild(a);
    linksGrid.appendChild(wrapper);
  });
}

function addLink(name, url) {
  const trimName = name.trim();
  let   trimUrl  = url.trim();
  if (!trimName || !trimUrl) return;

  if (!/^https?:\/\//i.test(trimUrl)) trimUrl = 'https://' + trimUrl;

  try { new URL(trimUrl); }
  catch { alert('Please enter a valid URL.'); return; }

  links.push({ id: generateId(), name: trimName, url: trimUrl });
  saveLinks();
  renderLinks();
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

linkForm.addEventListener('submit', (e) => {
  e.preventDefault();
  addLink(linkNameIn.value, linkUrlIn.value);
  linkNameIn.value = '';
  linkUrlIn.value  = '';
});

// Seed defaults only on first visit
if (!localStorage.getItem(KEYS.links)) saveLinks();

renderLinks();


/* ═══════════════════════════════════════════
   UTILITY
═══════════════════════════════════════════ */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
