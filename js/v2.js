(function () {
    'use strict';

    /* ---- nav scroll state ---- */
    var nav = document.getElementById('v2Nav');
    function syncNav() {
        if (!nav) return;
        nav.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    syncNav();
    window.addEventListener('scroll', syncNav, { passive: true });

    /* ---- mobile nav toggle ---- */
    var toggle = document.getElementById('v2NavToggle');
    var links = document.getElementById('v2NavLinks');
    if (toggle && links) {
        toggle.addEventListener('click', function () {
            links.classList.toggle('is-open');
        });
        links.querySelectorAll('.nav-close-link').forEach(function (a) {
            a.addEventListener('click', function () { links.classList.remove('is-open'); });
        });
    }

    /* ---- scroll reveal ----
       Only hide content once we're sure we can reveal it again: arm the
       CSS hidden state via body.js-reveal, then observe. Belt-and-braces
       timeout forces everything visible if anything goes wrong. */
    if ('IntersectionObserver' in window) {
        document.body.classList.add('js-reveal');
        var revealEls = document.querySelectorAll('.v2 .reveal:not(.is-visible)');
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        revealEls.forEach(function (el) { io.observe(el); });
        setTimeout(function () {
            revealEls.forEach(function (el) { el.classList.add('is-visible'); });
        }, 4000);
    }

    /* ---- only one native audio/video plays at a time ---- */
    var mediaEls = Array.from(document.querySelectorAll('.v2 audio, .v2 video'));
    mediaEls.forEach(function (el) {
        el.addEventListener('play', function () {
            mediaEls.forEach(function (other) {
                if (other !== el) other.pause();
            });
        });
    });
})();
