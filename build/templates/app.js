
let KB = [];

const STRINGS = {
  en: {
    brandLine1: 'AI Delivery',
    brandLine2: 'Knowledge Base',
    eyebrow: 'A field manual',
    welcomeTitle: 'A practical reference for <em>AI delivery</em> work',
    welcomeDesc: 'Each item follows a consistent template: a working definition, why it matters in delivery, how it actually works, the decision points a product manager owns, common watch outs, a one line takeaway, and a story drawn from aviation operations. Read it linearly, or jump to a topic. Switch between English and \u4e2d\u6587 at any time.',
    browseTopics: 'Browse topics',
    items: 'items',
    qantasMark: 'A story from aviation',
    prev: 'Previous',
    next: 'Next',
    home: 'Home',
    langLabel: 'Lang',
    themeLabel: 'Style'
  },
  zh: {
    brandLine1: 'AI \u4ea4\u4ed8',
    brandLine2: '\u77e5\u8bc6\u5e93',
    eyebrow: '\u4e00\u672c\u73b0\u573a\u624b\u518c',
    welcomeTitle: '\u4e00\u4efd\u5173\u4e8e <em>AI \u4ea4\u4ed8</em> \u5de5\u4f5c\u7684\u5b9e\u7528\u53c2\u8003',
    welcomeDesc: '\u6bcf\u4e2a\u6761\u76ee\u9075\u5faa\u4e00\u81f4\u7684\u7ed3\u6784: \u5b9a\u4e49\u3001\u4e3a\u4f55\u5728\u4ea4\u4ed8\u4e2d\u91cd\u8981\u3001\u8fd0\u4f5c\u539f\u7406\u3001PM \u51b3\u7b56\u70b9\u3001\u6ce8\u610f\u4e8b\u9879\u3001\u8981\u70b9\u603b\u7ed3,\u4ee5\u53ca\u4e00\u4e2a\u6765\u81ea\u822a\u7a7a\u8fd0\u8425\u7684\u6848\u4f8b\u3002\u53ef\u4ee5\u6309\u987a\u5e8f\u9605\u8bfb,\u4e5f\u53ef\u4ee5\u76f4\u63a5\u8df3\u8f6c\u5230\u611f\u5174\u8da3\u7684\u4e3b\u9898\u3002\u968f\u65f6\u5728\u82f1\u6587\u548c\u4e2d\u6587\u4e4b\u95f4\u5207\u6362\u3002',
    browseTopics: '\u6d4f\u89c8\u4e3b\u9898',
    items: '\u4e2a\u6761\u76ee',
    qantasMark: '\u822a\u7a7a\u6848\u4f8b',
    prev: '\u4e0a\u4e00\u6761',
    next: '\u4e0b\u4e00\u6761',
    home: '\u9996\u9875',
    langLabel: '\u8bed\u8a00',
    themeLabel: '\u98ce\u683c'
  }
};

// Numbers in the brand strip and welcome subtitle are derived from KB, not hardcoded.
function getNavMeta() {
  const topicCount = KB.length;
  const itemCount = KB.reduce((acc, t) => acc + t.items.length, 0);
  if (currentLang === 'en') {
    return `${topicCount} topics &middot; ${itemCount} items`;
  }
  return `${topicCount} \u4e2a\u4e3b\u9898 &middot; ${itemCount} \u4e2a\u6761\u76ee`;
}

function getWelcomeSubtitle() {
  const topicCount = KB.length;
  const itemCount = KB.reduce((acc, t) => acc + t.items.length, 0);
  if (currentLang === 'en') {
    return `Definitions, decision points, watch outs, and stories from the field. ${itemCount} items across ${topicCount} topics.`;
  }
  return `\u5b9a\u4e49\u3001\u51b3\u7b56\u70b9\u3001\u6ce8\u610f\u4e8b\u9879,\u4ee5\u53ca\u6765\u81ea\u73b0\u573a\u7684\u6848\u4f8b\u3002${topicCount} \u4e2a\u4e3b\u9898,${itemCount} \u4e2a\u6761\u76ee\u3002`;
}

const THEMES = {
  editorial: { en: 'Editorial', zh: '\u6742\u5fd7' },
  atelier: { en: 'Atelier', zh: '\u5de5\u574a' },
  terminal: { en: 'Terminal', zh: '\u7ec8\u7aef' }
};

let currentLang = 'en';
let currentTheme = 'editorial';
let currentItem = null;

// === Markdown parser ===
function parseMarkdown(text) {
  text = text.replace(/\r\n/g, '\n');
  let html = '';
  const lines = text.split('\n');
  let i = 0;
  let inList = false;
  let listType = null;
  let inCode = false;
  let codeBuffer = [];

  function flushList() {
    if (inList) {
      html += '</' + listType + '>\n';
      inList = false;
      listType = null;
    }
  }

  function inline(s) {
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
    return s;
  }

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCode) {
        html += '<pre><code>' + codeBuffer.join('\n').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>\n';
        codeBuffer = [];
        inCode = false;
      } else {
        flushList();
        inCode = true;
      }
      i++;
      continue;
    }
    if (inCode) { codeBuffer.push(line); i++; continue; }

    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|\s*[-:]+/.test(lines[i + 1])) {
      flushList();
      const headerCells = line.split('|').slice(1, -1).map(c => c.trim());
      i += 2;
      let t = '<table><thead><tr>';
      headerCells.forEach(c => t += '<th>' + inline(c) + '</th>');
      t += '</tr></thead><tbody>';
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1).map(c => c.trim());
        t += '<tr>';
        cells.forEach(c => t += '<td>' + inline(c) + '</td>');
        t += '</tr>';
        i++;
      }
      t += '</tbody></table>\n';
      html += t;
      continue;
    }

    if (/^[\s]*[-*]\s+/.test(line)) {
      if (!inList || listType !== 'ul') { flushList(); html += '<ul>\n'; inList = true; listType = 'ul'; }
      html += '<li>' + inline(line.replace(/^[\s]*[-*]\s+/, '')) + '</li>\n';
      i++; continue;
    }
    if (/^[\s]*\d+\.\s+/.test(line)) {
      if (!inList || listType !== 'ol') { flushList(); html += '<ol>\n'; inList = true; listType = 'ol'; }
      html += '<li>' + inline(line.replace(/^[\s]*\d+\.\s+/, '')) + '</li>\n';
      i++; continue;
    }

    if (/^---+\s*$/.test(line)) { flushList(); i++; continue; }
    if (line.trim() === '') { flushList(); i++; continue; }
    if (line.startsWith('### ')) { flushList(); html += '<h3>' + inline(line.slice(4)) + '</h3>\n'; i++; continue; }

    // Raw HTML block: a line that starts with a block-level tag at column 0.
    // We pass it through unchanged until we hit a blank line. This is how
    // chart transclusions ({{chart: name}} -> inline SVG wrapper) survive.
    if (/^<(div|svg|figure|section|aside|table|nav|details|p|blockquote|pre)\b/.test(line)) {
      flushList();
      let buf = line;
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        buf += '\n' + lines[i];
        i++;
      }
      html += buf + '\n';
      continue;
    }

    flushList();
    let para = line;
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#')
           && !lines[i].trim().startsWith('|') && !lines[i].startsWith('```')
           && !/^[\s]*[-*]\s+/.test(lines[i]) && !/^[\s]*\d+\.\s+/.test(lines[i])
           && !/^---+\s*$/.test(lines[i])) {
      para += ' ' + lines[i];
      i++;
    }
    html += '<p>' + inline(para) + '</p>\n';
  }
  flushList();
  return html;
}

function getStr(key) { return STRINGS[currentLang][key]; }
function getTitle(t) { return t['title_' + currentLang]; }
function getAltTitle(t) { return t['title_' + (currentLang === 'en' ? 'zh' : 'en')]; }
function getBody(it) { return it['body_' + currentLang]; }
function getSubtitle(t) { return t['subtitle_' + currentLang]; }

function renderBreadcrumb() {
  const bc = document.getElementById('breadcrumb');
  if (!currentItem) {
    // Welcome page: hide breadcrumb
    bc.style.display = 'none';
    return;
  }
  bc.style.display = 'flex';
  const topic = KB.find(t => t.num === currentItem.topic);
  const item = topic.items.find(it => it.num === currentItem.item);
  bc.innerHTML = `
    <a onclick="showWelcome()">
      <svg class="home-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M2 7L8 2L14 7V14H10V10H6V14H2V7Z"/>
      </svg>
      <span>${getStr('home')}</span>
    </a>
    <span class="sep">/</span>
    <a onclick="showItem(${topic.num}, '${topic.items[0].num}')">${getTitle(topic)}</a>
    <span class="sep">/</span>
    <span class="current">${item.num}&nbsp;&middot;&nbsp;${getTitle(item)}</span>
  `;
}

function renderSidebar() {
  const list = document.getElementById('topicList');
  list.innerHTML = '';
  KB.forEach(topic => {
    const li = document.createElement('li');
    li.className = 'topic';
    li.dataset.topic = topic.num;
    if (currentItem && currentItem.topic === topic.num) li.classList.add('open');

    const header = document.createElement('div');
    header.className = 'topic-header';
    header.innerHTML = `
      <span class="topic-num">T${String(topic.num).padStart(2, '0')}</span>
      <span class="topic-name">${getTitle(topic)}</span>
      <span class="topic-chevron">\u25b8</span>
    `;
    header.onclick = () => li.classList.toggle('open');

    const subtitle = document.createElement('div');
    subtitle.className = 'topic-subtitle';
    subtitle.textContent = getSubtitle(topic);

    const items = document.createElement('ul');
    items.className = 'item-list';
    topic.items.forEach(item => {
      const a = document.createElement('a');
      a.className = 'item-link';
      if (currentItem && currentItem.item === item.num) a.classList.add('active');
      a.innerHTML = `<span class="item-num">${item.num}</span><span>${getTitle(item)}</span>`;
      a.onclick = (e) => { e.preventDefault(); showItem(topic.num, item.num); };
      items.appendChild(a);
    });

    li.appendChild(header);
    li.appendChild(subtitle);
    li.appendChild(items);
    list.appendChild(li);
  });

  document.querySelectorAll('.brand-title')[0].textContent = getStr('brandLine1');
  document.querySelectorAll('.brand-title')[1].textContent = getStr('brandLine2');
  document.getElementById('navMeta').innerHTML = getNavMeta();
  const bm = document.getElementById('brandMark');
  if (bm) bm.textContent = getStr('eyebrow');
  document.getElementById('langLabel').textContent = getStr('langLabel');
  document.getElementById('themeLabel').textContent = getStr('themeLabel');
  // Update theme button labels
  Object.keys(THEMES).forEach(k => {
    const btn = document.querySelector(`.theme-toggle button[data-theme="${k}"]`);
    if (btn) btn.textContent = THEMES[k][currentLang];
  });
}

function renderWelcome() {
  const w = document.getElementById('welcome');
  let grid = '';
  KB.forEach(topic => {
    const count = topic.items.length;
    grid += `
      <div class="topic-card" onclick="showItem(${topic.num}, '${topic.items[0].num}')">
        <div class="topic-card-num">Topic ${String(topic.num).padStart(2, '0')}</div>
        <div class="topic-card-title">${getTitle(topic)}</div>
        <div class="topic-card-sub">${getSubtitle(topic)}</div>
        <div class="topic-card-count">${count} ${getStr('items')}</div>
      </div>
    `;
  });

  w.innerHTML = `
    <div class="welcome-eyebrow">${getStr('eyebrow')}</div>
    <h1 class="welcome-title">${getStr('welcomeTitle')}</h1>
    <p class="welcome-subtitle">${getWelcomeSubtitle()}</p>
    <div class="welcome-rule"></div>
    <p class="welcome-desc">${getStr('welcomeDesc')}</p>
    <div class="nav-meta" style="margin-bottom: 14px;">${getStr('browseTopics')}</div>
    <div class="topic-grid">${grid}</div>
  `;
  w.setAttribute('data-lang', currentLang);
}

function renderArticle(topicNum, itemNum) {
  const topic = KB.find(t => t.num === topicNum);
  const item = topic.items.find(it => it.num === itemNum);
  if (!item) return;

  let body = getBody(item);
  const qantasRe = /\*\*(Qantas story|Qantas \u6848\u4f8b)\*\*/;
  const qantasMatch = body.match(qantasRe);
  let mainPart = body;
  let qantasPart = null;
  if (qantasMatch) {
    const idx = body.indexOf(qantasMatch[0]);
    mainPart = body.substring(0, idx).trim();
    qantasPart = body.substring(idx + qantasMatch[0].length).trim();
  }

  const takeawayRegex = /\*\*(Takeaway|\u8981\u70b9\u603b\u7ed3)[:\uff1a]\s*([^*]+)\*\*/;
  const takeawayMatch = mainPart.match(takeawayRegex);
  if (takeawayMatch) {
    const takeawayHtml = `<div class="takeaway"><div class="takeaway-label">${takeawayMatch[1]}</div><div class="takeaway-body">${takeawayMatch[2].trim()}</div></div>`;
    mainPart = mainPart.replace(takeawayRegex, takeawayHtml);
  }

  const allItems = [];
  KB.forEach(t => t.items.forEach(it => allItems.push({topic: t.num, item: it.num, title: getTitle(it)})));
  const idx = allItems.findIndex(x => x.item === itemNum);
  const prev = idx > 0 ? allItems[idx - 1] : null;
  const next = idx < allItems.length - 1 ? allItems[idx + 1] : null;

  const article = document.getElementById('article');
  article.setAttribute('data-lang', currentLang);
  article.innerHTML = `
    <div class="article-eyebrow">
      <span class="num">${item.num}</span>
      <span class="sep">\u2014</span>
      <span>${getTitle(topic)}</span>
    </div>
    <h1 class="article-title">${getTitle(item)}</h1>
    <p class="article-alt-title">${getAltTitle(item)}</p>
    <div class="article-body">${parseMarkdown(mainPart)}</div>
    ${qantasPart ? `
      <div class="qantas-section">
        <div class="qantas-mark">${getStr('qantasMark')}</div>
        <div class="article-body">${parseMarkdown(qantasPart)}</div>
      </div>
    ` : ''}
    <div class="item-nav">
      ${prev ? `
        <a class="prev" onclick="showItem(${prev.topic}, '${prev.item}')">
          <span class="nav-label">\u2190 ${getStr('prev')}</span>
          <span class="nav-num">${prev.item}</span> \u00b7 ${prev.title}
        </a>` : '<span></span>'}
      ${next ? `
        <a class="next" onclick="showItem(${next.topic}, '${next.item}')">
          <span class="nav-label">${getStr('next')} \u2192</span>
          <span class="nav-num">${next.item}</span> \u00b7 ${next.title}
        </a>` : '<span></span>'}
    </div>
  `;
}

function showItem(topicNum, itemNum) {
  currentItem = {topic: topicNum, item: itemNum};
  document.getElementById('welcome').style.display = 'none';
  document.getElementById('article').classList.add('active');
  renderArticle(topicNum, itemNum);
  renderBreadcrumb();
  renderSidebar();
  window.scrollTo({top: 0, behavior: 'smooth'});
  history.replaceState(null, '', '#' + itemNum);
}

function showWelcome() {
  currentItem = null;
  document.getElementById('article').classList.remove('active');
  document.getElementById('welcome').style.display = 'block';
  renderWelcome();
  renderBreadcrumb();
  renderSidebar();
  window.scrollTo({top: 0, behavior: 'smooth'});
  history.replaceState(null, '', '#');
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === theme);
  });
  try { localStorage.setItem('kb-theme', theme); } catch(e) {}
}

function applyLang(lang) {
  currentLang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.querySelectorAll('#langToggle button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  if (currentItem) {
    renderArticle(currentItem.topic, currentItem.item);
  } else {
    renderWelcome();
  }
  renderBreadcrumb();
  renderSidebar();
  try { localStorage.setItem('kb-lang', lang); } catch(e) {}
}

document.getElementById('langToggle').addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  if (e.target.dataset.lang === currentLang) return;
  applyLang(e.target.dataset.lang);
});

document.getElementById('themeToggle').addEventListener('click', (e) => {
  if (e.target.tagName !== 'BUTTON') return;
  if (e.target.dataset.theme === currentTheme) return;
  applyTheme(e.target.dataset.theme);
});

document.querySelector('.brand').addEventListener('click', () => showWelcome());

function init() {
  // Restore saved preferences
  try {
    const savedTheme = localStorage.getItem('kb-theme');
    if (savedTheme && THEMES[savedTheme]) currentTheme = savedTheme;
    const savedLang = localStorage.getItem('kb-lang');
    if (savedLang && (savedLang === 'en' || savedLang === 'zh')) currentLang = savedLang;
  } catch(e) {}
  
  applyTheme(currentTheme);
  applyLang(currentLang);
  
  const hash = window.location.hash.slice(1);
  if (hash && /^\d+\.\d+$/.test(hash)) {
    const topicNum = parseInt(hash.split('.')[0]);
    showItem(topicNum, hash);
  } else {
    showWelcome();
  }
}

// Bootstrap: load data.json then run init()
async function bootstrap() {
  try {
    const res = await fetch('./data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    KB = await res.json();
  } catch (err) {
    document.body.innerHTML = '<div style="padding: 60px; font-family: system-ui; color: #a83232;"><h1>Could not load data.json</h1><p>Make sure index.html and data.json are served from the same folder.</p><pre>' + err + '</pre><p style="margin-top: 24px; font-size: 14px; color: #666;">Tip: open this folder with a local web server, e.g. <code>python3 -m http.server</code>, then visit http://localhost:8000</p></div>';
    return;
  }
  init();
}
bootstrap();
