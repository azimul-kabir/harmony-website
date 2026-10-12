const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
  const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isExpanded));
  menuToggle.setAttribute('aria-label', isExpanded ? 'Open navigation' : 'Close navigation');
  navLinks.classList.toggle('is-open', !isExpanded);
});

navLinks.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    navLinks.classList.remove('is-open');
  }
});

document.querySelector('.copy-button').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const label = button.querySelector('.copy-label');

  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    label.textContent = 'Copied!';
    window.setTimeout(() => {
      label.textContent = 'Copy commands';
    }, 1800);
  } catch {
    label.textContent = 'Clipboard unavailable';
    window.setTimeout(() => {
      label.textContent = 'Copy commands';
    }, 3000);
  }
});

document.querySelector('#year').textContent = String(new Date().getFullYear());
