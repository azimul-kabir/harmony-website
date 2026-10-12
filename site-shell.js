const harmonyRepository = 'https://github.com/azimul-kabir/harmony';

const navigationItems = [
  ['features.html', 'Features', 'features'],
  ['get-started.html', 'Get started', 'setup'],
  ['faq.html', 'FAQ', 'faq'],
  ['developers.html', 'Developers', 'developers'],
];

const currentPage = document.body.dataset.page;

document.querySelectorAll('[data-site-header]').forEach((placeholder) => {
  const header = document.createElement('header');
  header.className = 'site-header';
  header.innerHTML = `
    <nav class="nav container" aria-label="Main navigation">
      <a class="brand" href="index.html" aria-label="Harmony home">
        <img data-repository-image="logo.png" alt="" width="36" height="36">
        <span>harmony</span>
      </a>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Open navigation">
        <span></span><span></span>
      </button>
      <div class="nav-links" id="nav-links">
        ${navigationItems.map(([path, label, page]) =>
    `<a href="${path}"${currentPage === page ? ' aria-current="page"' : ''}>${label}</a>`
  ).join('')}
        <a class="nav-github" href="${harmonyRepository}" target="_blank" rel="noreferrer">
          Source <span aria-hidden="true">↗</span>
        </a>
      </div>
    </nav>`;
  placeholder.replaceWith(header);
});

document.querySelectorAll('[data-site-footer]').forEach((placeholder) => {
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div class="container footer-inner">
      <a class="brand footer-brand" href="index.html">
        <img data-repository-image="logo.png" alt="" width="30" height="30">
        <span>harmony</span>
      </a>
      <p>Your music. Your way.</p>
      <div class="footer-links">
        <a href="${harmonyRepository}" target="_blank" rel="noreferrer">GitHub ↗</a>
        <a id="project-license-link" href="${harmonyRepository}" target="_blank" rel="noreferrer">Project license</a>
        <span>© <span id="year">${new Date().getFullYear()}</span> Harmony</span>
      </div>
    </div>`;
  placeholder.replaceWith(footer);
});

const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  navLinks.classList.toggle('is-open', open);
});

navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    navLinks.classList.remove('is-open');
  }
});
