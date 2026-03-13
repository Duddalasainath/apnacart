/* DevJodi — main.js */

(function () {
  'use strict';

  /* ── Nav scroll state ─────────────────────────────────── */
  const nav = document.getElementById('nav');

  function updateNav() {
    nav.classList.toggle('scrolled', window.scrollY > 10);
  }

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Mobile menu toggle ───────────────────────────────── */
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');

  toggle.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    links.classList.toggle('open', !expanded);
  });

  /* Close menu when a link is clicked */
  links.querySelectorAll('.nav__link').forEach(function (link) {
    link.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    });
  });

  /* Close menu on outside click */
  document.addEventListener('click', function (e) {
    if (!nav.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      links.classList.remove('open');
    }
  });

  /* ── Active nav link on scroll ────────────────────────── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link[href^="#"]');

  function setActiveLink() {
    const scrollY = window.scrollY + 80;
    let current = '';

    sections.forEach(function (section) {
      if (scrollY >= section.offsetTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  /* ── Intersection observer — fade-in sections ─────────── */
  var style = document.createElement('style');
  style.textContent = [
    '.reveal { opacity: 0; transform: translateY(24px); transition: opacity 500ms ease, transform 500ms ease; }',
    '.reveal.visible { opacity: 1; transform: none; }'
  ].join('');
  document.head.appendChild(style);

  var revealEls = document.querySelectorAll(
    '.card, .project-card, .blog-item, .contact-card, .section__header'
  );

  revealEls.forEach(function (el) { el.classList.add('reveal'); });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    /* Fallback: show everything immediately */
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

})();
