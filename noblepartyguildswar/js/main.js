
function initPage() {
    setUpWebShopPrices();
    setUpButtonListeners();
    registerNavigationEvents();
	initEpisodeSlider(); // to initialize slider of Episodes

}

document.addEventListener("DOMContentLoaded", function() {
    const seasons = document.querySelectorAll(".episodes");

    seasons.forEach(season => {
        const episodes = season.querySelectorAll(".episode");
        let current = 0;

        // show first episode
        episodes[current].classList.add("active");

        const updateEpisodeNumber = () => {
            const episodeNumber = season.querySelector(".episode-number");
            if (episodeNumber) episodeNumber.innerHTML = "No. #" + (current + 1);
        };
        updateEpisodeNumber();

        // next button
        season.querySelector(".next").addEventListener("click", () => {
            episodes[current].classList.remove("active");
            current = (current + 1) % episodes.length;
            episodes[current].classList.add("active");
            updateEpisodeNumber();
        });

        // prev button
        season.querySelector(".prev").addEventListener("click", () => {
            episodes[current].classList.remove("active");
            current = (current - 1 + episodes.length) % episodes.length;
            episodes[current].classList.add("active");
            updateEpisodeNumber();
        });
    });
});


function initEpisodeSlider() {
    document.querySelectorAll("div.episodes").forEach(season => {
        const episodes = season.querySelectorAll("figure.episode");
        episodes.forEach(ep => {
            ep.style.opacity = 0;
            ep.classList.remove("active");
            ep.style.zIndex = 1;
        });

        if (episodes.length > 0) {
            episodes[0].style.opacity = 1;
            episodes[0].classList.add("active");
            episodes[0].style.zIndex = 2;
            season.dataset.current = 1;

            const episodeNumber = season.querySelector(".episode-number");
            if (episodeNumber) episodeNumber.innerHTML = "No. #1";
        }
    });
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
    document.querySelector('.shop .selected-shop-item .content').addEventListener('click', (e) => {
        e.stopPropagation();
    })
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
    const season = button.closest("div.episodes"); 
    const episodes = season.querySelectorAll("figure.episode");
    let current = parseInt(season.dataset.current);

    let next = current + 1;
    if (next > episodes.length) next = 1;

    episodes[current - 1].style.opacity = 0;
    episodes[current - 1].classList.remove("active");
    episodes[current - 1].style.zIndex = 1;

    episodes[next - 1].style.opacity = 1;
    episodes[next - 1].classList.add("active");
    episodes[next - 1].style.zIndex = 2;

    const episodeNumber = season.querySelector(".episode-number");
    if (episodeNumber) episodeNumber.innerHTML = "No. #" + next;
    season.dataset.current = next;
}

function prevEp(button) {
    const season = button.closest("div.episodes"); 
    const episodes = season.querySelectorAll("figure.episode");
    let current = parseInt(season.dataset.current);

    let prev = current - 1;
    if (prev <= 0) prev = episodes.length;

    episodes[current - 1].style.opacity = 0;
    episodes[current - 1].classList.remove("active");
    episodes[current - 1].style.zIndex = 1;

    episodes[prev - 1].style.opacity = 1;
    episodes[prev - 1].classList.add("active");
    episodes[prev - 1].style.zIndex = 2;

    const episodeNumber = season.querySelector(".episode-number");
    if (episodeNumber) episodeNumber.innerHTML = "No. #" + prev;
    season.dataset.current = prev;
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

initPage();
