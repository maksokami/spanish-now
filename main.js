import { marked } from 'marked';

// Get all topics from the topics directory, including subdirectories
const topicModules = import.meta.glob('./topics/**/*.json', { eager: true });
const mdModules = import.meta.glob('./topics/**/*.md', { eager: true, query: '?raw', import: 'default' });

const topics = [];

Object.keys(topicModules).forEach(key => {
  const t = topicModules[key].default || topicModules[key];
  if (!t.group) {
    const parts = key.split('/');
    t.group = parts.length > 3 ? parts[2] : 'Uncategorized';
  }
  topics.push(t);
});

Object.keys(mdModules).forEach(key => {
  const rawContent = mdModules[key];
  const match = rawContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  let title = "Untitled";
  let group = "Uncategorized";
  let id = key.split('/').pop().replace('.md', '');
  let content = rawContent;
  
  if (match) {
    const frontmatter = match[1];
    content = match[2];
    
    const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/);
    if (titleMatch) title = titleMatch[1].trim();
    
    const groupMatch = frontmatter.match(/group:\s*"?([^"\n]+)"?/);
    if (groupMatch) group = groupMatch[1].trim();

    const idMatch = frontmatter.match(/id:\s*"?([^"\n]+)"?/);
    if (idMatch) id = idMatch[1].trim();
  } else {
    // Basic fallback if no frontmatter
    title = id;
    const parts = key.split('/');
    if (parts.length > 3) group = parts[2];
  }

  topics.push({
    id,
    title,
    group,
    type: 'markdown',
    content
  });
});

// State
let activeTopicId = null;

// DOM Elements
const topicList = document.getElementById('topic-list');
const topicContent = document.getElementById('topic-content');
const searchInput = document.getElementById('topic-search');
const clearSearchBtn = document.getElementById('clear-search');

// Debounce helper
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Helper for cookies
const Cookies = {
  get(name, defaultVal) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; espanol_ya_${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return defaultVal;
  },
  set(name, val) {
    document.cookie = `espanol_ya_${name}=${val}; path=/; max-age=31536000`; // 1 year expiry
  }
};

function getCollapsedGroups() {
  try {
    const data = Cookies.get('collapsed_groups', null);
    if (!data) return new Set();
    const parsed = JSON.parse(decodeURIComponent(data));
    return Array.isArray(parsed) ? new Set(parsed) : new Set();
  } catch (e) {
    return new Set();
  }
}

function saveCollapsedGroups(collapsedSet) {
  const arr = Array.from(collapsedSet);
  Cookies.set('collapsed_groups', encodeURIComponent(JSON.stringify(arr)));
}

// Icon map
const TYPE_ICONS = {
  flashcards: '🗍',
  story: '📖',
  sentences: '📝',
  'srs-flashcards': '🔶',
  markdown: '📑',
};

function initSidebar(searchQuery = '') {
  topicList.innerHTML = '';

  let filteredTopics = topics;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredTopics = topics.filter(t => t.title.toLowerCase().includes(q));
  }

  // Group topics
  const grouped = {};
  filteredTopics.forEach(t => {
    if (!grouped[t.group]) grouped[t.group] = [];
    grouped[t.group].push(t);
  });

  // Sort groups alphabetically (Uncategorized last)
  const groupNames = Object.keys(grouped).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });

  const collapsedGroups = getCollapsedGroups();
  const fragment = document.createDocumentFragment();

  groupNames.forEach(groupName => {
    const groupTopics = grouped[groupName].sort((a, b) => a.title.localeCompare(b.title));
    if (groupTopics.length === 0) return;

    const isCollapsed = !searchQuery && collapsedGroups.has(groupName);

    const groupLi = document.createElement('li');
    groupLi.className = `sidebar-group${isCollapsed ? ' collapsed' : ''}`;
    groupLi.dataset.group = groupName;

    const groupHeader = document.createElement('div');
    groupHeader.className = 'sidebar-group-title';
    groupHeader.title = 'Click to toggle group';
    groupHeader.innerHTML = `
      <span class="group-name">${groupName} <span class="group-count">${groupTopics.length}</span></span>
      <span class="group-chevron">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    `;

    groupHeader.addEventListener('click', () => {
      const isNowCollapsed = groupLi.classList.toggle('collapsed');
      const currentCollapsed = getCollapsedGroups();
      if (isNowCollapsed) currentCollapsed.add(groupName);
      else currentCollapsed.delete(groupName);
      saveCollapsedGroups(currentCollapsed);
    });

    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'sidebar-group-content';

    const itemsUl = document.createElement('ul');
    itemsUl.className = 'sidebar-group-items';

    groupTopics.forEach(topic => {
      const li = document.createElement('li');
      li.className = `topic-item${topic.id === activeTopicId ? ' active' : ''}`;
      li.dataset.id = topic.id;

      const icon = TYPE_ICONS[topic.type] || '📄';
      li.innerHTML = `<span>${icon}</span><span>${topic.title}</span>`;

      li.addEventListener('click', () => {
        topicList.querySelector('.topic-item.active')?.classList.remove('active');
        li.classList.add('active');
        renderTopic(topic);
      });

      itemsUl.appendChild(li);
    });

    contentWrapper.appendChild(itemsUl);
    groupLi.appendChild(groupHeader);
    groupLi.appendChild(contentWrapper);
    fragment.appendChild(groupLi);
  });

  topicList.appendChild(fragment);
}

// Search Event Listeners
if (searchInput && clearSearchBtn) {
  const debouncedSearch = debounce((val) => initSidebar(val), 180);

  searchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearSearchBtn.style.display = val.length > 0 ? 'block' : 'none';
    debouncedSearch(val);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    initSidebar();
  });
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
  const currentTheme = Cookies.get('theme', 'dark');
  if (currentTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');

  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      Cookies.set('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      Cookies.set('theme', 'light');
    }
  });
}

const imageToggle = document.getElementById('image-toggle');
if (imageToggle) {
  const showImages = Cookies.get('show_images', 'true');
  if (showImages === 'false') {
    document.body.classList.add('images-hidden');
    imageToggle.classList.add('disabled');
  }

  imageToggle.addEventListener('click', () => {
    const isHidden = document.body.classList.contains('images-hidden');
    if (isHidden) {
      document.body.classList.remove('images-hidden');
      imageToggle.classList.remove('disabled');
      Cookies.set('show_images', 'true');
    } else {
      document.body.classList.add('images-hidden');
      imageToggle.classList.add('disabled');
      Cookies.set('show_images', 'false');
    }
  });
}

function renderTopic(topic) {
  activeTopicId = topic.id;
  
  let headerHtml = `
    <div class="topic-header">
      <h2 class="topic-title">${topic.title}</h2>
      <span class="topic-type-badge">${topic.type}</span>
    </div>
  `;

  let contentHtml = '';

  if (topic.type === 'flashcards') {
    contentHtml = renderFlashcards(topic);
  } else if (topic.type === 'story') {
    contentHtml = renderStory(topic);
  } else if (topic.type === 'sentences') {
    contentHtml = renderSentences(topic);
  } else if (topic.type === 'srs-flashcards') {
    contentHtml = renderSrsFlashcards(topic);
  } else if (topic.type === 'markdown') {
    contentHtml = renderMarkdown(topic);
  } else {
    contentHtml = `<p>Unknown topic type: ${topic.type}</p>`;
  }

  topicContent.innerHTML = headerHtml + contentHtml;

  // Post-render attachments
  if (topic.type === 'flashcards') attachFlashcardEvents(topic);
  if (topic.type === 'sentences') attachSentencesEvents(topic);
  if (topic.type === 'srs-flashcards') attachSrsFlashcardsEvents(topic);
  if (topic.type === 'story') attachStoryEvents();
}

// --- Topic Renderers ---

function renderMarkdown(topic) {
  const html = marked.parse(topic.content);
  return `<div class="markdown-container">${html}</div>`;
}

function renderFlashcards(topic) {
  let html = `
    <div>
      <button id="shuffle-btn" class="btn-shuffle">🔀 Shuffle</button>
    </div>
    <div class="flashcards-container">`;

  topic.data.forEach((card, index) => {
    const imageHtml = card.imageUrl ? `<img src="${card.imageUrl}" class="flashcard-img" alt="Illustration" loading="lazy" />` : '';
    const hintHtml = card.hintText ? `<div class="flashcard-hint">${card.hintText}</div>` : '';

    html += `
      <div class="flashcard" data-index="${index}">
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <div class="flashcard-text">${card.es}</div>
            ${hintHtml}
          </div>
          <div class="flashcard-back">
            ${imageHtml}
            <div class="flashcard-text">${card.en}</div>
          </div>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function attachFlashcardEvents(topic) {
  const container = document.querySelector('.flashcards-container');
  if (!container) return;

  let flippedCard = null;

  container.addEventListener('click', (e) => {
    const card = e.target.closest('.flashcard');
    if (!card) return;

    if (flippedCard && flippedCard !== card) {
      flippedCard.classList.remove('flipped');
    }

    const isFlipped = card.classList.toggle('flipped');
    flippedCard = isFlipped ? card : null;
  });

  const shuffleBtn = document.getElementById('shuffle-btn');
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      topic.data = [...topic.data].sort(() => Math.random() - 0.5);
      renderTopic(topic);
    });
  }
}
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Annotates plain text with vocabulary tooltip spans.
 */
function annotateStoryText(text, vocabulary) {
  if (!vocabulary) return text;
  const words = Object.keys(vocabulary).sort((a, b) => b.length - a.length);
  words.forEach(word => {
    const translation = vocabulary[word];
    const escapedWord = escapeRegExp(word);
    const regex = new RegExp(`<[^>]*>|(?<!\\p{L})(${escapedWord})(?!\\p{L})`, 'giu');
    let replaced = false;
    text = text.replace(regex, (match, p1) => {
      if (p1 !== undefined && !replaced) {
        replaced = true;
        return `<span class="story-word" data-translation="${translation}">${p1}</span>`;
      }
      return match;
    });
  });
  return text;
}

/**
 * Renders a single story entry (one block of text + optional image/audio).
 * @param {object} entry  – story data: { text, vocabulary?, title?, audioUrl?, imageUrl? }
 * @param {number} index  – index in the stories array (used for unique ids)
 */
function renderStoryEntry(entry, index) {
  const annotatedText = annotateStoryText(
    (entry.text || '').replace(/\n/g, '<br>'),
    entry.vocabulary
  );

  // Speaker button (only when audioUrl is provided)
  const speakerBtn = entry.audioUrl
    ? `<button class="story-audio-btn" data-audio-url="${entry.audioUrl}" data-story-idx="${index}" title="Listen to this story" aria-label="Play audio">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
           <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
           <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
           <path d="M19.07 4.93a10 10 0 0 1 0 14.14" class="story-audio-wave-outer"></path>
         </svg>
       </button>`
    : '';

  // Optional per-entry subtitle
  const subtitleHtml = entry.title
    ? `<h3 class="story-entry-title">${entry.title}</h3>`
    : '';

  // Right-side illustration
  const imageHtml = entry.imageUrl
    ? `<div class="story-image-wrap">
         <img src="${entry.imageUrl}" alt="Story illustration" class="story-illustration" loading="lazy" />
       </div>`
    : '';

  return `
    <div class="story-entry">
      <div class="story-entry-header">
        ${subtitleHtml}
        ${speakerBtn}
      </div>
      <div class="story-entry-body">
        <div class="story-text-col">${annotatedText}</div>
        ${imageHtml}
      </div>
    </div>
  `;
}

function renderStory(topic) {
  // Normalize: support both legacy flat format and new `stories` array
  const stories = topic.stories
    ? topic.stories
    : [{ text: topic.text, vocabulary: topic.vocabulary, audioUrl: topic.audioUrl, imageUrl: topic.imageUrl }];

  const entriesHtml = stories
    .map((entry, i) => renderStoryEntry(entry, i))
    .join('');

  return `<div class="story-container">${entriesHtml}</div>`;
}

/** Active audio element shared across all story entries */
let _storyAudio = null;
let _activeAudioBtn = null;

function attachStoryEvents() {
  const container = document.querySelector('.story-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.story-audio-btn');
    if (!btn) return;

    const url = btn.dataset.audioUrl;

    // Clicking the same button again toggles pause/play
    if (_storyAudio && _activeAudioBtn === btn) {
      if (_storyAudio.paused) {
        _storyAudio.play();
        btn.classList.add('playing');
      } else {
        _storyAudio.pause();
        btn.classList.remove('playing');
      }
      return;
    }

    // Stop any previously playing audio
    if (_storyAudio) {
      _storyAudio.pause();
      _storyAudio.currentTime = 0;
      if (_activeAudioBtn) _activeAudioBtn.classList.remove('playing');
    }

    _storyAudio = new Audio(url);
    _activeAudioBtn = btn;
    btn.classList.add('playing');

    _storyAudio.addEventListener('ended', () => {
      btn.classList.remove('playing');
      _activeAudioBtn = null;
    });
    _storyAudio.addEventListener('error', () => {
      btn.classList.remove('playing');
      btn.classList.add('audio-error');
      _activeAudioBtn = null;
    });

    _storyAudio.play();
  });
}

function renderSentences(topic) {
  const autoHideId = `autohide_${topic.id}`;
  const isAutoHide = topic.autoHide !== undefined ? topic.autoHide : true;
  
  let html = `
    <div class="sentences-controls">
      <label class="toggle-label">
        <input type="checkbox" id="${autoHideId}" class="toggle-checkbox" ${isAutoHide ? 'checked' : ''}>
        Auto-hide translations (hover to reveal)
      </label>
    </div>
    <div class="sentences-list ${isAutoHide ? 'auto-hide' : ''}" id="list_${topic.id}">
  `;

  topic.data.forEach(item => {
    html += `
      <div class="sentence-row">
        <div class="sentence-es">${item.es}</div>
        <div class="sentence-en">${item.en}</div>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}

function attachSentencesEvents(topic) {
  const toggle = document.getElementById(`autohide_${topic.id}`);
  const list = document.getElementById(`list_${topic.id}`);
  
  if (toggle && list) {
    toggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        list.classList.add('auto-hide');
      } else {
        list.classList.remove('auto-hide');
      }
    });
  }
}

// Bootstrap
initSidebar();

// --- SRS Flashcards Logic ---

function getSrsState(topicId) {
  try {
    const data = Cookies.get(`srs_${topicId}`, null);
    return data ? JSON.parse(decodeURIComponent(data)) : {};
  } catch (e) {
    return {};
  }
}

function saveSrsState(topicId, state) {
  Cookies.set(`srs_${topicId}`, encodeURIComponent(JSON.stringify(state)));
}

function renderSrsFlashcards(topic) {
  const state = getSrsState(topic.id);
  const now = Date.now();
  
  // Find due cards
  const dueCards = topic.data.filter(card => {
    const cardState = state[card.id] || { dueDate: 0 };
    return cardState.dueDate <= now;
  });

  if (dueCards.length === 0) {
    return `
      <div class="srs-done-screen">
        <h3>🎉 All caught up!</h3>
        <p>You have reviewed all due cards for this topic.</p>
        <button id="srs-reset-btn" class="btn-shuffle" style="margin-top: 1.5rem;">Review Again Now (Reset Progress)</button>
      </div>
    `;
  }

  // Pick the first due card
  const currentCard = dueCards[0];
  const totalDue = dueCards.length;

  const imageHtml = currentCard.imageUrl ? `<img src="${currentCard.imageUrl}" class="flashcard-img" alt="Illustration" />` : '';
  const hintHtml = currentCard.hintText ? `<div class="flashcard-hint">${currentCard.hintText}</div>` : '';

  return `
    <div class="srs-container">
      <div class="srs-header">
        <span class="srs-count">Cards due: <strong>${totalDue}</strong></span>
      </div>
      <div class="flashcard srs-card" id="srs-current-card" data-id="${currentCard.id}">
        <div class="flashcard-inner">
          <div class="flashcard-front srs-front">
            <div class="flashcard-text">${currentCard.es}</div>
            ${hintHtml}
            <div class="srs-hint">Click to reveal</div>
          </div>
          <div class="flashcard-back srs-back">
            ${imageHtml}
            <div class="flashcard-text">${currentCard.en}</div>
          </div>
        </div>
      </div>
      <div class="srs-controls" id="srs-controls" style="display: none; animation: slideUp 0.4s ease;">
        <p class="srs-question">How well did you know this?</p>
        <div class="srs-buttons">
          <button class="srs-btn srs-again" data-grade="1">Again <span>(< 2m)</span></button>
          <button class="srs-btn srs-hard" data-grade="3">Hard</button>
          <button class="srs-btn srs-good" data-grade="4">Good</button>
          <button class="srs-btn srs-easy" data-grade="5">Easy</button>
        </div>
      </div>
    </div>
  `;
}

function attachSrsFlashcardsEvents(topic) {
  const resetBtn = document.getElementById('srs-reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      Cookies.set(`srs_${topic.id}`, encodeURIComponent('{}'));
      renderTopic(topic);
    });
    return;
  }

  const card = document.getElementById('srs-current-card');
  const controls = document.getElementById('srs-controls');
  if (!card || !controls) return;

  const cardId = card.dataset.id;
  
  card.addEventListener('click', () => {
    if (!card.classList.contains('flipped')) {
      card.classList.add('flipped');
      requestAnimationFrame(() => {
        controls.style.display = 'block';
      });
    }
  });

  const buttons = document.querySelectorAll('.srs-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const grade = parseInt(btn.dataset.grade, 10);
      processSrsGrade(topic, cardId, grade);
    });
  });
}

function processSrsGrade(topic, cardId, grade) {
  const state = getSrsState(topic.id);
  let cardState = state[cardId] || { interval: 0, repetition: 0, easeFactor: 2.5 };
  
  if (grade >= 3) {
    if (cardState.repetition === 0) {
      cardState.interval = 1;
    } else if (cardState.repetition === 1) {
      cardState.interval = 6;
    } else {
      cardState.interval = Math.round(cardState.interval * cardState.easeFactor);
    }
    cardState.repetition++;
  } else {
    cardState.repetition = 0;
    cardState.interval = 0.001; // 1.4 minutes approx
  }

  cardState.easeFactor = cardState.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  if (cardState.easeFactor < 1.3) cardState.easeFactor = 1.3;

  // Next due date = now + interval in days
  cardState.dueDate = Date.now() + cardState.interval * 86400000;
  
  state[cardId] = cardState;
  saveSrsState(topic.id, state);

  // Re-render to show next card
  renderTopic(topic);
}
