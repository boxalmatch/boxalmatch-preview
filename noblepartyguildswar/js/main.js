
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

function updateRailCounter(rail) {
    const wrap = rail.closest(".episodes-wrap");
    if (!wrap) return;
    const counter = wrap.querySelector(".episode-number");
    const items = railItems(rail);
    if (!counter || !items.length) return;

    // the item whose centre is nearest the rail's centre is the current one
    const mid = rail.scrollLeft + rail.clientWidth / 2;
    let best = 0, bestDist = Infinity;
    items.forEach((item, i) => {
        const c = item.offsetLeft + item.offsetWidth / 2;
        const d = Math.abs(c - mid);
        if (d < bestDist) { bestDist = d; best = i; }
    });
    counter.innerHTML = "No. #" + (best + 1);

    const prev = wrap.querySelector(".controls .prev");
    const next = wrap.querySelector(".controls .next");
    if (prev) prev.disabled = rail.scrollLeft <= 2;
    if (next) next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 2;
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
        ev.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);

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
    const nav = document.querySelectorAll('nav ul li a');

    const openButtonNav = document.querySelector('header .mobile-nav .toggle-nav');

    nav.forEach(function(elm) {
        elm.addEventListener("click", toggleActiveClass);
    });


    openButtonNav.addEventListener('click', (e) => {
       toggleMobileNav()
    });

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

setupLangToggle();
initPage();
