/*
 * The contact form, shared by every page: it adds its own markup and styles, and opens from any
 * element with a data-contact attribute (or when a page is opened with #contact in the address).
 */
(() => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'assets/contact.css?v=100';
    document.head.appendChild(css);

    const holder = document.createElement('div');
    holder.innerHTML = `    <div class="dialog" id="contact-dialog" role="dialog" aria-modal="true" aria-labelledby="contact-title">
        <div class="panel">
            <button class="close" id="contact-close" type="button" aria-label="Close">&times;</button>
            <img class="panel-logo" src="assets/typography/isaacs-wordmark-ivory.png" alt="ISAACS">
            <img class="panel-sub" src="assets/typography/family-office-ivory.png" alt="Family Office">
            <p class="recipient">
                <span class="recipient-name" id="contact-title">Write to Helen Molyneux</span>
                <span class="recipient-role">Executive Assistant to the Principal</span>
            </p>
            <form id="contact-form" action="https://formspree.io/f/xnpjrnja" method="POST">
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
                <p class="status" id="contact-status" role="status"></p>
            </form>
        </div>
    </div>
`;
    const dialog = holder.firstElementChild;
    document.body.appendChild(dialog);

    const closeButton = dialog.querySelector('#contact-close');
    const contactForm = dialog.querySelector('#contact-form');
    const status = dialog.querySelector('#contact-status');
    const submitButton = contactForm.querySelector('.submit');
    let opener = null;

    function openDialog(from) {
        opener = from || null;
        dialog.classList.add('open');
        contactForm.querySelector('input').focus();
    }
    function closeDialog() {
        dialog.classList.remove('open');
        if (opener) opener.focus();
    }

    document.addEventListener('click', e => {
        const trigger = e.target.closest('[data-contact]');
        if (!trigger) return;
        e.preventDefault();
        openDialog(trigger);
    });
    closeButton.addEventListener('click', closeDialog);
    dialog.addEventListener('click', e => { if (e.target === dialog) closeDialog(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && dialog.classList.contains('open')) closeDialog(); });
    // A link to any page with #contact opens the form once the entrance has played
    if (location.hash === '#contact') setTimeout(openDialog, 2200);

    // Sending via Formspree
    contactForm.addEventListener('submit', e => {
        e.preventDefault();
        submitButton.disabled = true;
        status.textContent = 'Sending…';
        fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm), headers: { 'Accept': 'application/json' } })
            .then(r => {
                if (r.ok) { contactForm.reset(); status.textContent = 'Thank you. Helen will respond where there is a mutual interest.'; }
                else status.textContent = 'There was an issue sending your message. Please try again.';
            })
            .catch(() => { status.textContent = 'There was an issue sending your message. Please try again.'; })
            .finally(() => { submitButton.disabled = false; });
    });
})();
