
function initPage() {
    setUpWebShopPrices();
    setUpButtonListeners();
    registerNavigationEvents();
	initEpisodeSlider(); // to initialize slider of Episodes

}

function setupLangToggle() {
    const toggle = document.querySelector('.lang-toggle');
    if (!toggle) return;

    const buttons = toggle.querySelectorAll('button');
    const saved = localStorage.getItem('bm-lang') || 'it';
    setLang(saved);

    function setLang(lang) {
        document.documentElement.setAttribute('data-lang', lang);
        buttons.forEach(b => b.classList.toggle('on', b.dataset.set === lang));
    }

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.dataset.set;
            localStorage.setItem('bm-lang', lang);
            setLang(lang);
        });
    });
}

/* ============================================================
   Episode carousel — horizontal peek rail
   ------------------------------------------------------------
   The markup puts .episode-number and .controls inside .episodes.
   .episodes is now a scroll-snap flex rail, so those two would be
   laid out as rail items; on init we lift them out into a wrapper
   that sits around the rail instead. No HTML changes needed.
   ============================================================ */
function railOf(el) {
    const wrap = el.closest(".episodes-wrap");
    if (wrap) return wrap.querySelector(".episodes");
    return el.closest(".episodes");
}

function railItems(rail) {
    return rail ? rail.querySelectorAll(".episode") : [];
}

function railDots(rail) {
    const wrap = rail.closest(".episodes-wrap");
    return wrap ? wrap.querySelector(".rail-dots") : null;
}

// Position along the rail, mapped evenly onto the dots. Nearest-to-centre
// reads wrong on the wider rails: at rest the rail is at scrollLeft 0 but the
// card nearest the centre can be the second one, so the indicator would open
// on dot 2.
function railIndex(rail) {
    const n = railItems(rail).length;
    const max = rail.scrollWidth - rail.clientWidth;
    if (n < 2 || max <= 0) return 0;
    return Math.min(n - 1, Math.max(0, Math.round(rail.scrollLeft / max * (n - 1))));
}

function updateRailCounter(rail) {
    const wrap = rail.closest(".episodes-wrap");
    if (!wrap) return;
    const items = railItems(rail);
    if (!items.length) return;

    const dots = railDots(rail);
    if (dots) paintRailDots(dots, railIndex(rail));

    const prev = wrap.querySelector(".controls .prev");
    const next = wrap.querySelector(".controls .next");
    if (prev) prev.disabled = rail.scrollLeft <= 2;
    if (next) next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
}

/* Instagram's sliding dot window: the active dot stays centred, the ones
   either side of it shrink, and anything past the window is off the strip.
   Some of these rails carry a dozen photos, which as a flat row of dots reads
   as a centipede rather than a position indicator. */
const DOT_WINDOW = 7;

function paintRailDots(dots, at) {
    const track = dots.firstElementChild;
    const kids = track.children;
    const n = kids.length;
    for (let i = 0; i < n; i++) {
        const off = Math.abs(i - at);
        kids[i].className = i === at ? "on" : off === 2 ? "near" : off > 2 ? "far" : "";
        kids[i].setAttribute("aria-selected", i === at ? "true" : "false");
        kids[i].tabIndex = i === at ? 0 : -1;
    }
    if (n <= DOT_WINDOW) { track.style.transform = ""; return; }
    const slot = parseFloat(getComputedStyle(dots).getPropertyValue("--dot-slot")) || 14;
    // clamp so the strip never scrolls past either end
    const shift = Math.min(Math.max(at - (DOT_WINDOW - 1) / 2, 0), n - DOT_WINDOW);
    track.style.transform = `translateX(${-shift * slot}px)`;
}

function buildRailDots(rail, controls) {
    const items = railItems(rail);
    if (!controls || items.length < 2) return;

    const dots = document.createElement("div");
    dots.className = "rail-dots";
    dots.setAttribute("role", "tablist");
    dots.setAttribute("aria-label", "Slides");
    const track = document.createElement("div");
    track.className = "dots-track";
    dots.appendChild(track);

    items.forEach((item, i) => {
        const d = document.createElement("button");
        d.type = "button";
        d.setAttribute("role", "tab");
        d.setAttribute("aria-label", "Slide " + (i + 1));
        d.addEventListener("click", () => {
            rail.scrollTo({
                left: item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2,
                behavior: "smooth"
            });
        });
        track.appendChild(d);
    });

    controls.appendChild(dots);   // CSS order puts it between the two arrows
}

function scrollRail(rail, dir) {
    const items = railItems(rail);
    if (!rail || !items.length) return;
    const step = items[0].offsetWidth + 20; // item + gap
    rail.scrollBy({ left: dir * step, behavior: "smooth" });
}

function initEpisodeRails() {
    document.querySelectorAll(".episodes").forEach(rail => {
        if (rail.parentElement && rail.parentElement.classList.contains("episodes-wrap")) return;

        const wrap = document.createElement("div");
        wrap.className = "episodes-wrap";
        rail.parentNode.insertBefore(wrap, rail);
        wrap.appendChild(rail);

        // lift the counter and the arrows out of the scrolling rail
        const counter = rail.querySelector(".episode-number");
        const controls = rail.querySelector(".controls");
        if (controls) wrap.appendChild(controls);
        if (counter && controls) controls.appendChild(counter);
        else if (counter) wrap.appendChild(counter);
        buildRailDots(rail, controls);

        // clear any inline opacity left over from the old cross-fade
        railItems(rail).forEach(ep => {
            ep.style.opacity = "";
            ep.style.zIndex = "";
            ep.classList.remove("active");
        });

        // a single-image rail doesn't need arrows, and centres instead
        if (railItems(rail).length < 2) {
            rail.classList.add("is-single");
            if (controls) controls.style.display = "none";
        }

        rail.addEventListener("scroll", () => updateRailCounter(rail), { passive: true });
        updateRailCounter(rail);
    });
}

document.addEventListener("DOMContentLoaded", initEpisodeRails);

/* Some of the score matrices are wider than the page. Unwrapped they pushed
   the document itself sideways, which threw every other element off centre.
   Each table gets a scrolling box of its own: narrow ones still centre inside
   it, wide ones scroll within it and the page stays put. */
function initTableScroll() {
    document.querySelectorAll("table").forEach(table => {
        softenRunTogetherLists(table);

        const parent = table.parentElement;
        if (parent && parent.classList.contains("table-scroll")) return;
        const wrap = document.createElement("div");
        wrap.className = "table-scroll";
        table.parentNode.insertBefore(wrap, table);
        wrap.appendChild(table);
    });
}

/* Some cells hold a roster written without spaces —
   "Karmic,Baudo,Colt,Clavuss,Glimpse,Skate,Spartan,Tigrozzo" — which the
   browser reads as one unbreakable 500px word. On a phone that single cell
   held its whole table 200px wider than the screen for what is really two
   lines of text. A zero-width space after each comma gives the line breaker
   somewhere to break; nothing is added to the text itself, and names stay
   whole (letting the cell break anywhere would snap them mid-syllable and
   crush every other column with them). */
function softenRunTogetherLists(table) {
    const LONGEST_UNBREAKABLE = 18;
    const walker = document.createTreeWalker(table, NodeFilter.SHOW_TEXT);
    const targets = [];

    while (walker.nextNode()) {
        const text = walker.currentNode.nodeValue;
        if (text.indexOf(",") === -1 || text.indexOf("\u200B") !== -1) continue;
        const longest = text.split(/\s+/).reduce((a, w) => Math.max(a, w.length), 0);
        if (longest > LONGEST_UNBREAKABLE) targets.push(walker.currentNode);
    }

    targets.forEach(node => {
        node.nodeValue = node.nodeValue.replace(/,(?=\S)/g, ",\u200B");
    });
}

document.addEventListener("DOMContentLoaded", initTableScroll);


/* ============================================================
   Lightbox
   ------------------------------------------------------------
   Tap any photo in a rail or a character card to see it full size
   without leaving the page. Built at runtime rather than added to
   24 legacy pages by hand.
   ============================================================ */
const LIGHTBOX_SELECTOR = ".episode > img, .episodes img, .character-profile figure img, .slider figure img";

function initLightbox() {
    const shots = document.querySelectorAll(LIGHTBOX_SELECTOR);
    if (!shots.length) return;

    const box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.hidden = true;
    box.innerHTML =
        '<button class="lightbox-close" type="button" aria-label="Close">&#10005;</button>' +
        '<img alt="">' +
        '<p class="lightbox-cap"></p>';
    document.body.appendChild(box);

    const full = box.querySelector("img");
    const cap = box.querySelector(".lightbox-cap");
    const closeBtn = box.querySelector(".lightbox-close");
    let lastFocus = null;

    function open(img) {
        lastFocus = document.activeElement;
        full.src = img.currentSrc || img.src;
        full.alt = img.alt || "";
        // the rails caption their photos in a sibling <figcaption>
        const fig = img.closest("figure");
        const text = fig && fig.querySelector("figcaption");
        cap.textContent = text ? text.textContent.trim() : "";
        cap.hidden = !cap.textContent;
        box.hidden = false;
        document.body.classList.add("lightbox-open");
        closeBtn.focus();
    }

    function close() {
        box.hidden = true;
        full.removeAttribute("src");
        document.body.classList.remove("lightbox-open");
        if (lastFocus) lastFocus.focus();
    }

    shots.forEach(img => {
        img.classList.add("zoomable");
        img.tabIndex = 0;
        img.setAttribute("role", "button");
        img.addEventListener("click", () => open(img));
        img.addEventListener("keydown", e => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); }
        });
    });

    closeBtn.addEventListener("click", close);
    // clicking the backdrop closes; clicking the photo itself does not
    box.addEventListener("click", e => { if (e.target === box) close(); });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !box.hidden) close();
    });
}

document.addEventListener("DOMContentLoaded", initLightbox);


function initEpisodeSlider() {
    // kept for the inline callers; the rail setup is idempotent
    initEpisodeRails();
}

function setUpWebShopPrices() {
    const webShopPriceElementList = getWebShopPricesElement();
    webShopPriceElementList.forEach((value) => {
        value.innerHTML = '$ ' + getRandomPriceBetween(13, 25);
    })
}

function getRandomPriceBetween(minPrice, maxPrice) {
    const dollar = getRndInteger(minPrice, maxPrice);
    let penny = getRndInteger(0, 99);

    if (penny < 9)
        penny = `0${penny}`;

    return `${dollar}.${penny}`;
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function getWebShopPricesElement() {
    return document.querySelectorAll('.price-tag .amount');
}


function getWebShopItemElements() {
    return document.querySelectorAll('.shop-item');
}

function displaySelectedItemView() {
    getSelectedItemView().classList.remove('hidden');
}

function getSelectedItemView() {
    return document.getElementById('selected-shop-item');
}

function setupSelectedItemView(value) {
    getElementById('selected-item-name').innerHTML = value.dataset.name;
    getElementById('selected-item-img').src = value.dataset.img;
    getElementById('selected-item-description').innerHTML = value.dataset.description;
}

function displayShopItemDetails(value) {

    displaySelectedItemView();
    setupSelectedItemView(value);
}

function setupWebshopClickListener() {
    const webshopItems = getWebShopItemElements();
    webshopItems.forEach(value => {
        value.addEventListener('click', (e) => {
            e.stopPropagation();
            displayShopItemDetails(value)
        })
    });

    //stop propagation input
    // Pages without a webshop have no .selected-shop-item, and the unguarded
    // lookup used to throw here - which aborted initPage() before
    // registerNavigationEvents(), losing the nav scroll handling on every
    // subpage. Guard it instead.
    const shopContent = document.querySelector('.shop .selected-shop-item .content');
    if (shopContent) {
        shopContent.addEventListener('click', (e) => {
            e.stopPropagation();
        })
    }
}


function setUpButtonListeners() {
    setupCloseButtonListener();
    setupWebshopClickListener();
    setupOrderButtonListener();
}

function setupCloseButtonListener() {
    const closeButtonSelectors = getCloseButtonElements();
    closeButtonSelectors.forEach(value => {
        value.addEventListener('click', (evt => onCloseButtonClick(value)))
    });
}

function getCloseButtonElements() {
    return document.querySelectorAll('.exit-button');
}


function onCloseButtonClick(value) {
    const targetSelector = value.dataset.exitTarget;
    hideElement(targetSelector);
}

function hideElement(targetSelector) {
    getElementById(targetSelector).classList.add('hidden');
}

function getElementById(elementId) {
    return document.getElementById(elementId);
}

function setupOrderButtonListener() {
    const orderButtonElementList = getOrderButtonElements()
    orderButtonElementList.forEach( button =>  {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            location.href = "#order-form";

        })
    })
}

function getOrderButtonElements() {
    return document.querySelectorAll('button.order-button');
}


const header = document.getElementById('main-header');
const toggleBtn = header.querySelector('.mobile-nav .toggle-nav');
const mobileNav = header.querySelector('nav');
const navLinks = mobileNav.querySelectorAll('ul li a');

let isMobileNav = false;

function openMobileNav() {
    isMobileNav = true;
    header.classList.add('focus-nav');
}

function closeMobileNav() {
    isMobileNav = false;
    header.classList.remove('focus-nav');
}

function toggleMobileNav() {
    isMobileNav ? closeMobileNav() : openMobileNav();
}

// Toggle button
toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent document listener
    toggleMobileNav();
});

// Close nav when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', (ev) => {
        const href = link.getAttribute('href') || '';
        const target = href.charAt(0) === '#' ? document.getElementById(href.slice(1)) : null;
        // Not an in-page anchor, or the section is gone: leave it to the
        // browser rather than swallowing the click.
        if (!target) return;
        ev.preventDefault();

        // Scroll
        const headingOffset = 80;
        window.scrollTo({
            top: target.offsetTop - headingOffset,
            behavior: 'smooth'
        });

        closeMobileNav();
        mobileNav.querySelectorAll('.active').forEach(el => el.classList.remove('active'));
        link.parentElement.classList.add('active');
    });
});

// Close nav if clicking outside
document.addEventListener('click', (e) => {
    if(isMobileNav && !header.contains(e.target)) {
        closeMobileNav();
    }
});

function registerNavigationEvents(){
    // toggleActiveClass used to be bound here, to every nav link. It was both
    // redundant and broken: the handler above already scrolls, closes the
    // mobile menu and sets .active on the right <li>, while this one read
    // ev.target.getAttribute('href') — and ev.target is the inner
    // <span lang="it">, not the <a>, so every nav click threw
    // "Cannot read properties of null (reading 'substr')" and left the
    // active state unchanged. It also scrolled a second time, instantly,
    // fighting the smooth scroll of the first handler.

    // The burger is already bound at the top of this file. Binding it a second
    // time here toggled the menu twice per tap, so it opened and shut again
    // and never appeared. (It only surfaced once initPage() stopped throwing
    // before this function ran.)

    window.addEventListener('scroll', (e) => {
        const scroll = document.documentElement.scrollTop;
        const nav = getElementById('main-header');

        if(scroll > nav.scrollHeight){
            nav.classList.add('scrolled');
        }else {
            nav.classList.remove('scrolled');
        }


    });
}

document.addEventListener('click', (e) => {
    const header = document.getElementById('main-header');
    if(isMobileNav && !header.contains(e.target)){
        closeMobileNav();
    }
});

function toggleActiveClass(ev){
    ev.preventDefault();

    const item = ev.target.parentNode; // li
    const target = getElementById(ev.target.getAttribute("href").substr(1));

    // remove current
    Classie.remove(document.querySelector('.active'), 'active');
    Classie.add(item, 'active');

    if(isMobileNav){
        closeMobileNav(); // drops menu down
        setTimeout(() => {
            const headingOffset = 80;
            window.scrollTo(0, target.offsetTop - headingOffset);
        }, 300); // match CSS transition duration
    } else {
        const headingOffset = 80;
        window.scrollTo(0, target.offsetTop - headingOffset);
    }
}


class Classie {
    static has(elm, classString) {
        if(elm == null)
            return
        return elm.classList.contains(classString);
    }

    static add(elm, classString) {
        if(elm == null)
            return
        return elm.classList.add(classString);
    }

    static remove(elm, classString) {
        if(elm == null)
            return
        return elm.classList.remove(classString);
    }
}


let EpSlider = 1;
let prevEpSlider = 1;
let MAX_EPISODES = document.querySelectorAll('div.episode').length;


function nextEp(button) {
    scrollRail(railOf(button), 1);
}

function prevEp(button) {
    scrollRail(railOf(button), -1);
}

MIN_SlIDES = 1;
MAX_SLIDES = 2;

function next(){
    clearInterval(autoSlider);
    slideCounter += 1;
    prevSlide = slideCounter - 1;
    moveSlide();
}

function moveSlide(int){
    if(prevSlide < MIN_SlIDES )
        prevSlide = MAX_SLIDES;

    if(slideCounter > MAX_SLIDES)
        slideCounter = MIN_SlIDES;

    if(slideCounter < MIN_SlIDES)
        slideCounter = MAX_SLIDES;

    getElementById("slide" + prevSlide).style.opacity = 0;
    getElementById("p" + prevSlide).classList.remove("pActive");
    getElementById("slide" + slideCounter).style.opacity = 1;
    getElementById("p" + slideCounter).classList.add("pActive");

    console.log(prevSlide, slideCounter);
    autoSlider = setInterval(next, 4000)
}

/* ============================================================
   Mobile header bar
   ------------------------------------------------------------
   On phones the bar carries the IT/EN pill next to the burger,
   exactly like the home page. The markup keeps the toggle inside
   nav > ul, where it belongs on desktop, so the node is relocated
   at the mobile breakpoint. CSS alone cannot do it: header > nav
   becomes a fixed drop-down panel, so the pill would be trapped
   inside the menu instead of sitting in the bar.
   ============================================================ */
function setupMobileNavBar() {
    const bar = document.querySelector('#main-header .mobile-nav');
    const list = document.querySelector('#main-header > nav > ul');
    if (!bar || !list) return;

    const burger = bar.querySelector('.toggle-nav');
    const lang = document.querySelector('#main-header .lang-toggle');
    if (!burger || !lang) return;

    let right = bar.querySelector('.mobile-nav-right');
    if (!right) {
        right = document.createElement('div');
        right.className = 'mobile-nav-right';
        bar.appendChild(right);
        right.appendChild(burger);
    }

    const mq = window.matchMedia('(max-width: 820px)');

    function place() {
        if (mq.matches) {
            if (lang.parentElement !== right) right.insertBefore(lang, burger);
        } else if (lang.parentElement !== list) {
            list.appendChild(lang);
        }
    }

    place();
    if (mq.addEventListener) mq.addEventListener('change', place);
    else if (mq.addListener) mq.addListener(place);
}

setupLangToggle();
setupMobileNavBar();
initPage();
