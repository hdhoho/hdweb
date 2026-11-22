const grid = document.querySelector('#card-grid');
const status = document.querySelector('#status');
const categoryNav = document.querySelector('#category-nav');
const dataSource = document.body.dataset.source || 'data.json';

function createCard(item) {
  const article = document.createElement('article');
  article.className = 'card';

  const link = document.createElement('a');
  link.className = 'image-link';
  link.href = item.link;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `在新分頁開啟：${item.title}`);

  const image = document.createElement('img');
  image.className = 'card-image';
  image.src = item.image;
  image.alt = item.imageName || item.title;
  image.loading = 'lazy';
  link.append(image);

  const content = document.createElement('div');
  content.className = 'card-content';
  const title = document.createElement('h2');
  title.className = 'card-title';
  title.textContent = item.title;
  const description = document.createElement('p');
  description.className = 'card-description';
  description.textContent = item.description;
  content.append(title, description);
  article.append(link, content);
  return article;
}

async function renderCards() {
  if (window.location.protocol === 'file:') {
    status.textContent = '瀏覽器無法直接從本機 HTML 讀取 data.json。請在專案根目錄執行 start-preview.bat 後，再開啟 http://127.0.0.1:4173/。';
    return;
  }

  try {
    const response = await fetch(dataSource);
    if (!response.ok) throw new Error('資料讀取失敗');
    const items = await response.json();
    if (!Array.isArray(items)) throw new Error('資料格式必須為陣列');
    const groupedItems = items.reduce((groups, item) => {
      const category = item.category || '未分類';
      (groups[category] ||= []).push(item);
      return groups;
    }, {});

    const categories = Object.entries(groupedItems);
    const sections = categories.map(([category, categoryItems], index) => {
      const section = document.createElement('section');
      section.className = 'category-section';
      section.id = `category-${index + 1}`;
      const heading = document.createElement('h2');
      heading.className = 'category-heading';
      heading.textContent = category;
      const cards = document.createElement('div');
      cards.className = 'card-grid';
      cards.append(...categoryItems.map(createCard));
      section.append(heading, cards);
      return section;
    });

    grid.replaceChildren(...sections);
    categoryNav.replaceChildren(...categories.map(([category], index) => {
      const link = document.createElement('a');
      link.href = `#category-${index + 1}`;
      link.textContent = category;
      link.addEventListener('click', event => {
        event.preventDefault();
        document.querySelector(link.hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', link.hash);
        softwareMenu.classList.remove('is-open');
        softwareTrigger.setAttribute('aria-expanded', 'false');
      });
      return link;
    }));
    status.textContent = items.length ? '' : '目前沒有可顯示的內容。';
  } catch (error) {
    console.error(error);
    status.textContent = `無法載入內容，請確認 ${dataSource} 是否存在且格式正確。`;
  }
}

renderCards();
