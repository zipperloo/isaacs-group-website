/*
 * Shared by every page: the menu (Home, Strategy, Contact) and the contact form.
 * Styles are in site.css. The form also opens when a page is visited with #contact in the address.
 */
(() => {
    /* ---------- Menu ---------- */
    const onStrategy = /strategy(\.html)?\/?$/.test(location.pathname);
    const nav = document.createElement('nav');
    nav.className = 'site-nav reveal';
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

    const menuButton = nav.querySelector('.menu-button');
    const setMenu = open => {
        nav.classList.toggle('open', open);
        menuButton.setAttribute('aria-expanded', open);
        menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    };
    menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
    // choosing an item, tapping elsewhere or pressing Escape closes it
    nav.querySelector('.menu').addEventListener('click', () => setMenu(false));
    document.addEventListener('pointerdown', e => { if (!nav.contains(e.target)) setMenu(false); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuButton.focus(); }
    });
    // keep the picture's swipe and hover handlers from reacting to the menu
    nav.addEventListener('pointerdown', e => e.stopPropagation());

    /* ---------- Contact form ---------- */
    const dialog = document.createElement('dialog');
    dialog.className = 'contact';
    dialog.setAttribute('aria-labelledby', 'contact-title');
    dialog.innerHTML = `
        <div class="inner">
            <button class="close" type="button" aria-label="Close">&times;</button>
            <img class="panel-logo" src="assets/typography/isaacs-wordmark-ivory.png?v=103" alt="ISAACS Family Office">
            <p class="recipient">
                <span class="recipient-name" id="contact-title">Write to Helen Molyneux</span>
                <span class="recipient-role">Executive Assistant to the Principal</span>
            </p>
            <form action="https://formspree.io/f/xnpjrnja" method="POST">
                <input type="hidden" name="_subject" value="Website enquiry for Helen">
                <label class="field">
                    <span>Your name</span>
                    <input type="text" name="name" autocomplete="name" required>
                </label>
                <label class="field">
                    <span>Your email</span>
                    <input type="email" name="email" autocomplete="email" required>
                </label>
                <label class="field">
                    <span>Your message</span>
                    <textarea name="message" required></textarea>
                </label>
                <button class="submit" type="submit">Send</button>
                <p class="status" role="status"></p>
            </form>
        </div>`;
    document.body.appendChild(dialog);

    const form = dialog.querySelector('form');
    const status = dialog.querySelector('.status');
    const submit = dialog.querySelector('.submit');

    function openContact() {
        if (dialog.open) return;
        dialog.classList.remove('closing');
        dialog.showModal();
        // put the cursor in the first field on desktop; on phones wait for a tap, so the keyboard doesn't jump up
        if (matchMedia('(pointer: fine)').matches) form.querySelector('input:not([type=hidden])').focus();
        else dialog.querySelector('.close').blur();
    }
    function closeContact() {
        if (!dialog.open || dialog.classList.contains('closing')) return;
        dialog.classList.add('closing');
        setTimeout(() => { dialog.classList.remove('closing'); dialog.close(); }, 280);
    }

    document.addEventListener('click', e => {
        if (e.target.closest('[data-contact]')) { e.preventDefault(); openContact(); }
    });
    dialog.querySelector('.close').addEventListener('click', closeContact);
    dialog.addEventListener('click', e => { if (e.target === dialog) closeContact(); });   // the backdrop
    dialog.addEventListener('cancel', e => { e.preventDefault(); closeContact(); });          // Escape, with the fade
    if (location.hash === '#contact') setTimeout(openContact, 2200);   // once the entrance has played

    // Sending via Formspree, without leaving the page
    form.addEventListener('submit', e => {
        e.preventDefault();
        submit.disabled = true;
        status.textContent = 'Sending…';
        fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
            .then(r => {
                if (!r.ok) throw new Error(r.status);
                form.reset();
                status.textContent = 'Thank you. Helen will respond where there is a mutual interest.';
            })
            .catch(() => { status.textContent = 'There was an issue sending your message. Please try again.'; })
            .finally(() => { submit.disabled = false; });
    });
})();
