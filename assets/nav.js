/*
 * The site menu, shared by every page: a quiet three-line button at the top right that opens a short
 * list of links (Home, Strategy, Contact). Contact opens the shared contact form (contact.js).
 */
(() => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'assets/nav.css?v=101';
    document.head.appendChild(css);

    const onStrategy = /strategy(\.html)?\/?$/.test(location.pathname);
    const nav = document.createElement('nav');
    nav.className = 'site-nav reveal' + (onStrategy ? ' on-strategy' : '');
    nav.style.setProperty('--delay', '2.6s');
    nav.setAttribute('aria-label', 'Site');
    nav.innerHTML = `
        <button class="menu-button" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Menu">
            <span></span><span></span><span></span>
        </button>
        <ul class="menu" id="site-menu">
            <li><a href="./"${onStrategy ? '' : ' aria-current="page"'}>Home</a></li>
            <li><a href="strategy.html"${onStrategy ? ' aria-current="page"' : ''}>Strategy</a></li>
            <li><button type="button" aria-haspopup="dialog" data-contact>Contact</button></li>
        </ul>`;
    document.body.appendChild(nav);

    const button = nav.querySelector('.menu-button');
    const setOpen = open => {
        nav.classList.toggle('open', open);
        button.setAttribute('aria-expanded', open);
        button.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    };
    button.addEventListener('click', e => { e.stopPropagation(); setOpen(!nav.classList.contains('open')); });
    // choosing an item, tapping elsewhere or pressing Escape closes it
    nav.querySelector('.menu').addEventListener('click', () => setOpen(false));
    document.addEventListener('pointerdown', e => { if (!nav.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); button.focus(); }
    });
    // keep the picture's swipe and hover handlers from reacting to the menu
    nav.addEventListener('pointerdown', e => e.stopPropagation());
})();
