const menuButton = document.querySelector('.nav-toggle');
const menuLinks = document.getElementById('navlinks');

if (menuButton && menuLinks) {
  const setOpen = (open) => {
    menuLinks.classList.toggle('open', open);
    menuButton.setAttribute('aria-expanded', String(open));
  };
  menuButton.addEventListener('click', () => {
    setOpen(menuButton.getAttribute('aria-expanded') !== 'true');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav')) setOpen(false);
  });
  menuLinks.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });
  window.matchMedia('(max-width: 760px)').addEventListener('change', () => setOpen(false));
}
