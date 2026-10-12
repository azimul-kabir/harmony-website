const REPOSITORY = 'azimul-kabir/harmony';
const API_ROOT = `https://api.github.com/repos/${REPOSITORY}`;
const pageStatus = document.querySelector('#source-status, [data-source-status]');
const sourceUrl = (path, branch) =>
  `https://github.com/${REPOSITORY}/blob/${encodeURIComponent(branch)}/${path}`;

function escapeHTML(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function safeRawGitHubUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'raw.githubusercontent.com' &&
      url.pathname.startsWith(`/${REPOSITORY}/`) ? url.href : null;
  } catch {
    return null;
  }
}

function safeLink(label, target, documentUrl) {
  try {
    const url = new URL(target, documentUrl);
    if (url.protocol !== 'https:' || !['github.com', 'raw.githubusercontent.com'].includes(url.hostname)) {
      return label;
    }
    return `<a href="${escapeHTML(url.href)}" target="_blank" rel="noreferrer">${label}</a>`;
  } catch {
    return label;
  }
}

function renderInline(markdown, documentUrl) {
  return escapeHTML(markdown)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+[^)]*)?\)/g, (_, label, target) =>
      safeLink(label, target, documentUrl))
    .replace(/\[([^\]]+)\]\[([^\]]*)\]/g, '$1');
}

function renderMarkdown(markdown, documentUrl, maxBlocks = Infinity, maxChars = Infinity) {
  const output = [];
  let paragraph = [];
  let list = [];
  let listType = '';
  let code = [];
  let codeLanguage = '';
  let inCode = false;
  let renderedChars = 0;
  const lines = markdown.split(/\r?\n/);

  const limitText = (value) => {
    const remaining = maxChars - renderedChars;
    if (remaining <= 0) return '';
    if (value.length <= remaining) {
      renderedChars += value.length;
      return value;
    }
    const visible = value.slice(0, remaining).replace(/\s+\S*$/, '').trimEnd();
    renderedChars = maxChars;
    return visible ? `${visible}…` : '…';
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = limitText(paragraph.join(' '));
    if (text) output.push(`<p>${renderInline(text, documentUrl)}</p>`);
    paragraph = [];
  };

  const flushList = () => {
    if (!list.length) return;
    const tag = listType === 'ordered' ? 'ol' : 'ul';
    const items = [];
    for (const item of list) {
      const text = limitText(item);
      if (text) items.push(`<li>${renderInline(text, documentUrl)}</li>`);
      if (renderedChars >= maxChars) break;
    }
    if (items.length) output.push(`<${tag}>${items.join('')}</${tag}>`);
    list = [];
    listType = '';
  };

  const flushCode = () => {
    const language = codeLanguage ? ` data-language="${escapeHTML(codeLanguage)}"` : '';
    const text = limitText(code.join('\n'));
    if (text) output.push(`<pre${language}><code>${escapeHTML(text)}</code></pre>`);
    code = [];
    codeLanguage = '';
  };

  for (const line of lines) {
    const fence = line.match(/^\s*```([\w.+-]*)\s*$/);
    if (fence && !inCode) {
      flushParagraph();
      flushList();
      inCode = true;
      codeLanguage = fence[1];
      continue;
    }
    if (fence && inCode) {
      flushCode();
      inCode = false;
      if (output.length >= maxBlocks) break;
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length + 1, 6);
      const text = limitText(heading[2]);
      if (text) output.push(`<h${level}>${renderInline(text, documentUrl)}</h${level}>`);
      if (output.length >= maxBlocks) break;
      continue;
    }

    const item = line.match(/^\s*(?:(\d+)\.|[-*+])\s+(.+)$/);
    if (item) {
      flushParagraph();
      const nextListType = item[1] ? 'ordered' : 'unordered';
      if (listType && listType !== nextListType) flushList();
      listType = nextListType;
      list.push(item[2]);
      continue;
    }

    if (!line.trim() || /^---+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^\s*<[^>]+>/.test(line) || /^\s*!\[[^\]]*\]\([^)]+\)\s*$/.test(line)) {
      flushParagraph();
      flushList();
      continue;
    }

    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  if (inCode) flushCode();
  return output.slice(0, maxBlocks).join('\n');
}

function plainText(markdown, documentUrl, limit = 480) {
  const holder = document.createElement('div');
  holder.innerHTML = renderMarkdown(markdown, documentUrl);
  return holder.textContent.replace(/\s+/g, ' ').trim().slice(0, limit);
}

function summarizeMarkdown(markdown, maxChars = 185) {
  const blocks = markdown
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n\s*\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (!lines.length || lines.every((line) =>
        /^(?:#{1,6}\s|---+$|<[^>]+>|!\[)/.test(line))) return '';
      const bullets = lines.filter((line) => /^(?:[-*+]|\d+\.)\s+/.test(line));
      const content = (bullets.length ? bullets.slice(0, 2).map((line) => line.replace(/^(?:[-*+]|\d+\.)\s+/, '')).join('; ') : lines.join(' '))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
        .replace(/[*`_~]/g, '')
        .replace(/!\[[^\]]*\]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return /^(?:features include|search instantly across|sort your library by)\s*:?\s*$/i.test(content) ? '' : content;
    })
    .filter(Boolean);

  const summary = blocks.find((block) => block.length > 38) || blocks[0] || '';
  const firstSentence = summary.match(/^.{32,}?[.!?](?:\s|$)/)?.[0].trim() || summary;
  if (firstSentence.length <= maxChars) return firstSentence;
  const truncated = firstSentence.slice(0, maxChars).replace(/\s+\S*$/, '').trimEnd();
  return truncated ? `${truncated}…` : '';
}

function findSection(markdown, headingPattern, maxLevel = 1) {
  const lines = markdown.split(/\r?\n/);
  const start = lines.findIndex((line) => {
    const match = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    return match && match[1].length <= maxLevel && headingPattern.test(match[2].trim());
  });
  if (start < 0) return null;

  const startHeading = lines[start].match(/^(#{1,6})\s+/);
  const startLevel = startHeading[1].length;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const heading = lines[index].match(/^(#{1,6})\s+/);
    if (heading && heading[1].length <= startLevel) {
      end = index;
      break;
    }
  }
  return { heading: lines[start].replace(/^#{1,6}\s+/, '').replace(/\s*#+\s*$/, '').trim(), markdown: lines.slice(start + 1, end).join('\n').trim() };
}

function findSubsections(markdown, headingLevel = 2) {
  const lines = markdown.split(/\r?\n/);
  const matches = [];
  const pattern = new RegExp(`^#{${headingLevel}}\\s+(.+?)\\s*#*\\s*$`);
  for (let index = 0; index < lines.length; index += 1) {
    const heading = lines[index].match(pattern);
    if (heading) matches.push({ index, heading: heading[1].trim() });
  }
  return matches.map((item, index) => {
    const next = matches[index + 1];
    return { heading: item.heading, markdown: lines.slice(item.index + 1, next ? next.index : lines.length).join('\n').trim() };
  });
}

function addSourceError(target, label, error, url) {
  if (!target) return;
  const message = error instanceof Error ? error.message : String(error);
  target.replaceChildren();
  const card = document.createElement('div');
  card.className = 'source-error';
  card.setAttribute('role', 'alert');
  const text = document.createElement('p');
  text.textContent = `${label} could not be loaded from the Harmony repository: ${message}`;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = 'Open the source on GitHub';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.className = 'source-retry';
  retry.dataset.retrySources = '';
  retry.textContent = 'Retry live sync';
  card.append(text, link, retry);
  target.append(card);
}

function renderLiveFeatures(readme, readmeUrl, targetSelector = '#live-features', limit = Infinity) {
  const featureSection = findSection(readme, /^features$/i);
  if (!featureSection) throw new Error('The current project README has no Features section.');
  const items = findSubsections(featureSection.markdown, 2);
  if (!items.length) throw new Error('The current project README contains no feature subsections.');

  const fragment = document.createDocumentFragment();
  for (const item of items.slice(0, limit)) {
    const card = document.createElement('article');
    card.className = 'feature-card';
    const copy = document.createElement('div');
    copy.className = 'feature-copy markdown-content';
    const number = document.createElement('span');
    number.className = 'feature-number';
    number.textContent = item.heading;
    const description = document.createElement('p');
    description.textContent = summarizeMarkdown(item.markdown);
    const link = document.createElement('a');
    link.className = 'source-project-link';
    link.href = readmeUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'Read the project README ↗';
    copy.append(number, description, link);
    card.append(copy);
    fragment.append(card);
  }
  document.querySelector(targetSelector).replaceChildren(fragment);
}

function renderGuide(guide, guideUrl) {
  const section = findSection(guide, /^installation$/i, 3);
  if (!section) throw new Error('The current project guide has no Installation section.');
  const target = document.querySelector('#live-install-guide');
  target.innerHTML = renderMarkdown(section.markdown, guideUrl);
  document.querySelector('#guide-source-label').textContent = `CURRENT INSTALLATION GUIDE · ${section.heading.toUpperCase()}`;
  document.querySelector('#install-source-link').href = guideUrl;
}

function renderInstallationNotes(readme, readmeUrl) {
  const section = findSection(readme, /^installation$/i);
  if (!section) throw new Error('The current project README has no Installation section.');
  const target = document.querySelector('#live-install-notes');
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'More installation and configuration details';
  const content = document.createElement('div');
  content.className = 'markdown-content';
  content.innerHTML = renderMarkdown(section.markdown, readmeUrl);
  details.append(summary, content);
  target.replaceChildren(details);
}

function renderGallery(files, limit = Infinity) {
  const images = files
    .filter((file) => file.type === 'file' && /\.(?:jpe?g|png|webp|gif)$/i.test(file.name))
    .sort((first, second) => first.name.localeCompare(second.name));
  if (!images.length) throw new Error('The project screenshot directory contains no images.');

  const gallery = document.querySelector('#live-gallery');
  const fragment = document.createDocumentFragment();
  for (const image of images.slice(0, limit)) {
    const imageUrl = safeRawGitHubUrl(image.download_url);
    const imagePage = safeGitHubUrl(image.html_url);
    if (!imageUrl || !imagePage) continue;
    const figure = document.createElement('figure');
    figure.className = 'screenshot-card';
    const imageLink = document.createElement('a');
    imageLink.href = imagePage;
    imageLink.target = '_blank';
    imageLink.rel = 'noreferrer';
    const preview = document.createElement('img');
    preview.src = imageUrl;
    preview.alt = `Harmony project screenshot: ${image.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ')}`;
    preview.loading = 'lazy';
    preview.addEventListener('error', () => {
      console.error(`The Harmony screenshot ${image.name} could not be loaded.`, imageUrl);
      const unavailable = document.createElement('span');
      unavailable.className = 'image-unavailable';
      unavailable.textContent = `The project image "${image.name}" is temporarily unavailable.`;
      imageLink.replaceChildren(unavailable);
    }, { once: true });
    imageLink.append(preview);
    const caption = document.createElement('figcaption');
    const title = document.createElement('span');
    title.textContent = image.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    const arrow = document.createElement('span');
    arrow.className = 'image-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    caption.append(title, arrow);
    figure.append(imageLink, caption);
    fragment.append(figure);
  }
  if (!fragment.childElementCount) throw new Error('The project screenshots do not have downloadable images.');
  gallery.replaceChildren(fragment);
}

function findGuideSection(guide, headingPattern) {
  return findSubsections(guide, 3).find((section) => headingPattern.test(section.heading)) ||
    findSubsections(guide, 2).find((section) => headingPattern.test(section.heading)) ||
    findSection(guide, headingPattern);
}

function questionForHeading(heading) {
  const normalized = heading.replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}]/gu, '').replace(/\s+/g, ' ').trim();
  const questions = [
    [/^what\s+harmony\s+does$/i, 'What can Harmony do?'],
    [/^harmony\s*\+\s*navidrome$/i, 'How does Harmony work with Navidrome?'],
    [/^recommended\s+music\s+apps$/i, 'Which music apps can play my library?'],
    [/^installation$/i, 'How do I install Harmony?'],
    [/^correcting\s+library\s+metadata\s+and\s+artwork$/i, 'How can I edit metadata and artwork?'],
    [/^current\s+status$/i, 'Which Harmony release is current?'],
    [/^local\s+music\s+uploads?$/i, 'Can I import music I downloaded elsewhere?'],
    [/^operations$/i, 'Can I back up and restore Harmony?'],
    [/^download\s+bulk\s+actions$/i, 'Can I safely clear download history?'],
  ];
  return questions.find(([pattern]) => pattern.test(normalized))?.[1] ||
    `What should I know about ${normalized.toLocaleLowerCase()}?`;
}

function renderFaq(guide, releaseNotes, readme, urls) {
  const faqSource = findSection(readme, /^(?:faq|frequently asked questions)$/i, 2);
  const target = document.querySelector('#live-faq');
  const faqItems = [];

  if (faqSource) {
    for (const item of findSubsections(faqSource.markdown, 3)) {
      faqItems.push({ question: item.heading.replace(/[?!.]+$/, '') + '?', markdown: item.markdown, url: urls.readme });
    }
    if (!faqItems.length && faqSource.markdown) {
      faqItems.push({ question: 'Frequently asked questions', markdown: faqSource.markdown, url: urls.readme });
    }
  } else {
    const sources = [
      { document: guide, url: urls.guide, heading: /^what harmony does$/i },
      { document: guide, url: urls.guide, heading: /^harmony\s*\+\s*navidrome$/i },
      { document: guide, url: urls.guide, heading: /^recommended music apps$/i },
      { document: guide, url: urls.guide, heading: /^correcting library metadata and artwork$/i },
      { document: guide, url: urls.guide, heading: /^download bulk actions$/i },
      { document: releaseNotes, url: urls.releaseNotes, heading: /^local music uploads?$/i },
      { document: releaseNotes, url: urls.releaseNotes, heading: /^operations$/i },
    ];
    for (const source of sources) {
      const section = findGuideSection(source.document, source.heading);
      if (section && section.markdown) {
        faqItems.push({ question: questionForHeading(section.heading), markdown: section.markdown, url: source.url });
      }
    }
  }

  if (!faqItems.length) throw new Error('No FAQ or user-guide sections were found in the project documentation.');
  const fragment = document.createDocumentFragment();
  for (const item of faqItems) {
    const details = document.createElement('details');
    details.className = 'faq-item';
    const question = document.createElement('summary');
    question.textContent = item.question;
    const answer = document.createElement('div');
    answer.className = 'faq-answer markdown-content';
    answer.innerHTML = renderMarkdown(item.markdown, item.url, 4, 500);
    const link = document.createElement('a');
    link.className = 'faq-source';
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = 'Open the source documentation ↗';
    answer.append(link);
    details.append(question, answer);
    fragment.append(details);
  }
  target.replaceChildren(fragment);
}

function renderTechStack(readme, readmeUrl) {
  const section = findSection(readme, /^technology stack$/i);
  if (!section) throw new Error('The current README has no Technology Stack section.');
  const subsections = findSubsections(section.markdown, 3);
  const target = document.querySelector('#live-tech-stack');
  if (subsections.length) {
    target.innerHTML = subsections.map((item) =>
      `<section class="tech-card"><h4>${renderInline(item.heading, readmeUrl)}</h4>${renderMarkdown(item.markdown, readmeUrl, 3)}</section>`
    ).join('');
  } else {
    target.innerHTML = renderMarkdown(section.markdown, readmeUrl, 12);
  }
}

function safeGitHubUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' ? url.href : null;
  } catch {
    return null;
  }
}

function renderRepositoryDocs(root, docs, branch) {
  const entries = [
    ...docs.filter((entry) => entry.type === 'file' && /\.md$/i.test(entry.name)),
    ...root.filter((entry) => entry.type === 'file' && /\.(?:md|toml|yml|yaml)$/i.test(entry.name)),
  ];
  const byPath = new Map(entries.map((entry) => [entry.path, entry]));
  const ordered = [...byPath.values()].sort((first, second) => first.path.localeCompare(second.path));
  if (!ordered.length) throw new Error('The project did not return any developer documentation.');

  const target = document.querySelector('#live-developer-docs');
  const fragment = document.createDocumentFragment();
  for (const entry of ordered) {
    const url = safeGitHubUrl(entry.html_url) || sourceUrl(entry.path, branch);
    const link = document.createElement('a');
    link.className = 'doc-link';
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    const title = document.createElement('strong');
    title.textContent = entry.name.replace(/\.(?:md|toml|yml|yaml)$/i, '').replace(/[-_]/g, ' ');
    const path = document.createElement('small');
    path.textContent = entry.path;
    const arrow = document.createElement('span');
    arrow.className = 'image-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    link.append(title, path, arrow);
    fragment.append(link);
  }
  target.replaceChildren(fragment);
}

function updateRelease(release, readme) {
  const target = document.querySelector('#release-status');
  const fallbackVersion = readme.match(/Current stable version:\s*\*\*([^*]+)\*\*/i)?.[1];
  const fallbackUrl = `https://github.com/${REPOSITORY}/releases`;

  if (release) {
    const link = document.createElement('a');
    link.href = safeGitHubUrl(release.html_url) || fallbackUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = release.tag_name || release.name || 'Latest release';
    target.replaceChildren(document.createTextNode('Latest release: '), link);
    if (release.published_at) {
      const date = document.createElement('small');
      date.className = 'release-date';
      date.textContent = ` · ${new Date(release.published_at).toLocaleDateString()}`;
      target.append(date);
    }
    return;
  }

  if (fallbackVersion) {
    const link = document.createElement('a');
    link.href = fallbackUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = fallbackVersion;
    target.replaceChildren(document.createTextNode('README stable version: '), link);
    return;
  }

  target.textContent = `Release information is unavailable. Check the repository's release page.`;
}

async function fetchText(path, branch) {
  const url = `https://raw.githubusercontent.com/${REPOSITORY}/${encodeURIComponent(branch)}/${path}`;
  const response = await fetchWithTimeout(`${url}?_=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
  return { text: await response.text(), url };
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}.`);
  return response.json();
}

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`The GitHub request timed out after 15 seconds (${new URL(url).hostname}).`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

function resultValue(result, label, target, url, failures) {
  if (result.status === 'fulfilled') return result.value;
  console.error(`Harmony repository sync failed for ${label}:`, result.reason);
  failures.push(label);
  addSourceError(target, label, result.reason, url);
  return null;
}

function retryFailedSources() {
  pageStatus.textContent = 'Refreshing current documentation and project artwork…';
  window.location.reload();
}

function showHeroUnavailable(message) {
  const hero = document.querySelector('#project-hero');
  if (!hero) return;
  const fallback = document.createElement('span');
  fallback.className = 'image-unavailable';
  fallback.textContent = message;
  hero.replaceWith(fallback);
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-retry-sources]')) retryFailedSources();
});

async function syncProject() {
  const page = document.body.dataset.page;
  const failures = [];
  pageStatus.textContent = `Fetching live documentation from ${REPOSITORY}…`;
  try {
    const repository = await fetchJson(API_ROOT);
    const branch = repository.default_branch;
    if (!branch || typeof branch !== 'string') throw new Error('GitHub did not provide the repository default branch.');

    const rawBase = `https://raw.githubusercontent.com/${REPOSITORY}/${encodeURIComponent(branch)}/`;
    const apiRef = encodeURIComponent(branch);
    const repositoryUrl = `https://github.com/${REPOSITORY}`;
    const filesUrl = `https://github.com/${REPOSITORY}/tree/${encodeURIComponent(branch)}`;
    const imageDirectory = `${API_ROOT}/contents/docs/images?ref=${apiRef}`;
    const requests = {
      readme: fetchText('README.md', branch),
      root: fetchJson(`${API_ROOT}/contents?ref=${apiRef}`),
      images: fetchJson(imageDirectory),
    };
    if (page === 'setup' || page === 'faq') requests.guide = fetchText('GUIDE.md', branch);
    if (page === 'home' || page === 'faq') requests.release = fetchJson(`${API_ROOT}/releases/latest`);
    if (page === 'home') requests.screenshots = fetchJson(`${API_ROOT}/contents/docs/images/screenshots?ref=${apiRef}`);
    if (page === 'developers') requests.docs = fetchJson(`${API_ROOT}/contents/docs?ref=${apiRef}`);

    const names = Object.keys(requests);
    const results = await Promise.allSettled(Object.values(requests));
    const loaded = {};
    for (let index = 0; index < names.length; index += 1) {
      loaded[names[index]] = results[index];
    }

    const readmeTarget = page === 'home' ? document.querySelector('#home-highlights') :
      page === 'features' ? document.querySelector('#live-features') :
        page === 'setup' ? document.querySelector('#live-install-notes') :
          page === 'developers' ? document.querySelector('#live-tech-stack') :
            document.querySelector('#live-faq');
    const readmeSource = resultValue(
      loaded.readme, 'Project README', readmeTarget, `${rawBase}README.md`, failures,
    );
    const root = resultValue(
      loaded.root, 'Project file listing',
      page === 'developers' ? document.querySelector('#live-developer-docs') : null,
      `${filesUrl}`, failures,
    );
    const images = resultValue(
      loaded.images, 'Project image directory',
      page === 'home' ? document.querySelector('#live-gallery') : null,
      `${filesUrl}/docs/images`, failures,
    );
    const guideSource = loaded.guide
      ? resultValue(loaded.guide, 'Harmony user guide', document.querySelector('#live-install-guide') || document.querySelector('#live-faq'), `${rawBase}GUIDE.md`, failures)
      : null;
    const release = loaded.release?.status === 'fulfilled' ? loaded.release.value : null;
    if (loaded.release?.status === 'rejected') {
      console.error('Harmony repository sync failed for latest release:', loaded.release.reason);
      failures.push('latest release');
    }
    const screenshots = loaded.screenshots
      ? resultValue(loaded.screenshots, 'Project screenshot listing', document.querySelector('#live-gallery'), `${filesUrl}/docs/images/screenshots`, failures)
      : null;
    const docs = loaded.docs
      ? resultValue(loaded.docs, 'Project documentation listing', document.querySelector('#live-developer-docs'), `${filesUrl}/docs`, failures)
      : null;

    const licenseFile = root?.find((entry) =>
      entry.type === 'file' && /^(?:licen[cs]e|copying)(?:\.md|\.txt)?$/i.test(entry.name));
    if (licenseFile) {
      const licenseUrl = safeGitHubUrl(licenseFile.html_url) || repositoryUrl;
      for (const link of document.querySelectorAll('#project-license-link, #hero-license-link')) {
        link.href = licenseUrl;
        link.textContent = repository.license?.spdx_id || repository.license?.name || 'View license';
      }
    }

    if (images) {
      const hasHeroArtwork = images.some((image) =>
        image.type === 'file' && image.name === 'hero.jpg' && safeRawGitHubUrl(image.download_url));
      for (const image of images) {
        const imageUrl = safeRawGitHubUrl(image.download_url);
        if (image.type === 'file' && image.name === 'logo.png' && imageUrl) {
          document.querySelectorAll('[data-repository-image]').forEach((node) => { node.src = imageUrl; });
          document.querySelector('#site-icon').href = imageUrl;
        }
        if (image.type === 'file' && image.name === 'hero.jpg' && imageUrl) {
          const hero = document.querySelector('#project-hero');
          if (!hero) continue;
          hero.src = imageUrl;
          hero.addEventListener('error', () => {
            console.error('The current Harmony hero image could not be loaded:', imageUrl);
            failures.push('project hero artwork');
            pageStatus.setAttribute('role', 'alert');
            pageStatus.textContent = `The project hero artwork could not be loaded. `;
            const link = document.createElement('a');
            link.href = `${filesUrl}/docs/images`;
            link.target = '_blank';
            link.rel = 'noreferrer';
            link.textContent = 'Open the artwork source on GitHub.';
            pageStatus.append(link);
            hero.remove();
          }, { once: true });
        }
      }
      if (!hasHeroArtwork) {
        failures.push('project hero artwork');
        showHeroUnavailable('Current project artwork is not available in the repository image directory.');
      }
    } else if (page === 'home') {
      showHeroUnavailable('Project artwork is unavailable. Open the artwork directory on GitHub.');
    }

    if (readmeSource) {
      const overview = findSection(readmeSource.text, /^overview$/i, 2);
      const overviewParagraph = overview?.markdown.split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .find((paragraph) => paragraph && !paragraph.startsWith('See ') && !paragraph.startsWith('Current stable version:'));
      if (overviewParagraph && document.querySelector('#project-overview')) {
        document.querySelector('#project-overview').textContent =
          plainText(overviewParagraph, readmeSource.url, 300);
      } else if (page === 'home' && document.querySelector('#project-overview')) {
        document.querySelector('#project-overview').textContent =
          'The project overview is not available in the current README.';
      }
      const featureTarget = page === 'home' ? '#home-highlights' : '#live-features';
      if (page === 'home' || page === 'features') {
        try {
          renderLiveFeatures(readmeSource.text, readmeSource.url, featureTarget, page === 'home' ? 3 : Infinity);
        } catch (error) {
          console.error('Unable to render Harmony README features:', error);
          failures.push('README features');
          addSourceError(document.querySelector(featureTarget), 'Project features', error, readmeSource.url);
        }
      } else if (page === 'developers') {
        try {
          renderTechStack(readmeSource.text, readmeSource.url);
        } catch (error) {
          console.error('Unable to render the Harmony technology stack:', error);
          failures.push('README technology stack');
          addSourceError(document.querySelector('#live-tech-stack'), 'Project technology stack', error, readmeSource.url);
        }
      } else if (page === 'setup') {
        try {
          renderInstallationNotes(readmeSource.text, readmeSource.url);
        } catch (error) {
          console.error('Unable to render the detailed Harmony installation notes:', error);
          failures.push('README installation guide');
          addSourceError(document.querySelector('#live-install-notes'), 'Detailed installation guide', error, readmeSource.url);
        }
      }
      if (page === 'home' && release) updateRelease(release, readmeSource.text);
      if (page === 'home' && !release) updateRelease(null, readmeSource.text);
    } else {
      failures.push('Project README');
      if (page === 'home') {
        document.querySelector('#project-overview').textContent =
          'The project overview could not be loaded. Open the current README on GitHub.';
        updateRelease(null, '');
      }
    }

    if (guideSource && page === 'setup') {
      try {
        renderGuide(guideSource.text, guideSource.url);
      } catch (error) {
        console.error('Unable to render the Harmony installation guide:', error);
        failures.push('installation guide');
        addSourceError(document.querySelector('#live-install-guide'), 'Installation guide', error, guideSource.url);
      }
    } else if (guideSource && page === 'faq' && readmeSource) {
      let releaseNotes = null;
      try {
        releaseNotes = release?.tag_name
          ? await fetchText(`docs/releases/${encodeURIComponent(release.tag_name)}.md`, branch)
          : null;
      } catch (error) {
        console.error('Unable to load the latest Harmony release notes:', error);
        failures.push('latest release notes');
      }
      try {
        renderFaq(guideSource.text, releaseNotes?.text || '', readmeSource.text, {
          readme: readmeSource.url,
          guide: guideSource.url,
          releaseNotes: releaseNotes?.url || `https://github.com/${REPOSITORY}/releases`,
        });
      } catch (error) {
        console.error('Unable to assemble answers from Harmony documentation:', error);
        failures.push('FAQ');
        addSourceError(document.querySelector('#live-faq'), 'Frequently asked questions', error, guideSource.url);
      }
    } else if (page === 'faq' && guideSource && !readmeSource) {
      addSourceError(document.querySelector('#live-faq'), 'Frequently asked questions', new Error('The project README is needed to find the current answers.'), `${rawBase}README.md`);
    } else if ((page === 'setup' || page === 'faq') && !guideSource) {
      failures.push('Harmony user guide');
    }

    if (root && docs) {
      try {
        renderRepositoryDocs(root, docs, branch);
      } catch (error) {
        console.error('Unable to render Harmony developer resources:', error);
        failures.push('developer documentation');
        addSourceError(document.querySelector('#live-developer-docs'), 'Developer resources', error, `https://github.com/${REPOSITORY}/tree/${encodeURIComponent(branch)}/docs`);
      }
    }

    if (screenshots) {
      try {
        renderGallery(screenshots, 3);
      } catch (error) {
        console.error('Unable to render Harmony screenshots:', error);
        failures.push('screenshot gallery');
        addSourceError(document.querySelector('#live-gallery'), 'Project screenshots', error, `https://github.com/${REPOSITORY}/tree/${encodeURIComponent(branch)}/docs/images/screenshots`);
      }
    }

    const synchronizedAt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
    pageStatus.textContent = failures.length
      ? `Some live project information could not be loaded (${[...new Set(failures)].join(', ')}). Source links remain available. Last checked ${synchronizedAt}.`
      : `Live from ${REPOSITORY} · ${branch} · Checked ${synchronizedAt}.`;
  } catch (error) {
    console.error('Unable to synchronize Harmony repository content:', error);
    const targetSelector = {
      home: '#home-highlights',
      features: '#live-features',
      setup: '#live-install-guide',
      faq: '#live-faq',
      developers: '#live-tech-stack',
    }[page];
    addSourceError(document.querySelector(targetSelector), 'Current project content', error, `https://github.com/${REPOSITORY}`);
    if (page === 'home') {
      document.querySelector('#project-overview').textContent =
        'The project overview could not be loaded. Open the current README on GitHub.';
      updateRelease(null, '');
      showHeroUnavailable('Project artwork is unavailable. Open the Harmony repository on GitHub.');
      addSourceError(document.querySelector('#live-gallery'), 'Project screenshots', error, `https://github.com/${REPOSITORY}/tree`);
    } else if (page === 'setup') {
      addSourceError(document.querySelector('#live-install-notes'), 'Detailed installation guide', error, `https://github.com/${REPOSITORY}`);
    } else if (page === 'developers') {
      addSourceError(document.querySelector('#live-developer-docs'), 'Developer documentation', error, `https://github.com/${REPOSITORY}`);
    }
    pageStatus.textContent = `Could not synchronize with ${REPOSITORY}: ${error.message || String(error)} Source links remain available.`;
  }
}

syncProject();
