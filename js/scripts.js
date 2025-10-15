'use strict';

const USER_PROFILE = Object.freeze({
    name: 'Ahmad Herzalla',
    title: 'Computer Systems Engineering student',
    university: 'Palestine Technical University - Kadoorie (PTUK)',
    location: 'Jenin, West Bank',
    email: 'ahmadherzalla31@gmail.com',
    phone: '+970568789593',
    projectLink: 'https://github.com/Ahmed-Herzalla0'
});

const ASSET_PATHS = Object.freeze({
    headshotFallback: './images/profile-placeholder.jpg',
    cardPlaceholder: './images/card_placeholder_bg.webp',
    spotlightPlaceholder: './images/spotlight_placeholder_bg.webp'
});

const CUSTOM_PROJECTS = Object.freeze([
    {
        project_id: 'project_ahmad_portfolio_scss',
        project_name: 'Portfolio SCSS',
        short_description: 'Responsive personal site themed with modular SCSS.',
        long_description: 'Showcases my design system experiments using SCSS partials, mixins, and reusable components to keep styles scalable while presenting my work cleanly.',
        card_image: './images/personal_site_card.webp',
        spotlight_image: './images/personal_site_spotlight.webp',
        url: 'https://github.com/Ahmed-Herzalla0/Portfolio-scss'
    },
    {
        project_id: 'project_ahmad_bizgrow',
        project_name: 'BizGrow Landing',
        short_description: 'Marketing landing page with polished animations.',
        long_description: 'Landing experience for a fictional SaaS brand featuring scroll-triggered reveals, reusable layout utilities, and performance-conscious asset loading.',
        card_image: './images/commerce_card.webp',
        spotlight_image: './images/commerce_spotlight.webp',
        url: 'https://github.com/Ahmed-Herzalla0/BizGrow-Landing-Website'
    },
    {
        project_id: 'project_ahmad_kasper',
        project_name: 'Kasper Template',
        short_description: 'PSD-to-HTML conversion targeting pixel precision.',
        long_description: 'Translated the Kasper PSD into semantic HTML and CSS, focusing on component structure, typography scales, and responsive behaviour without frameworks.',
        card_image: './images/social_media_card.webp',
        spotlight_image: './images/social_media_spotlight.webp',
        url: 'https://github.com/Ahmed-Herzalla0/Kasper'
    },
    {
        project_id: 'project_ahmad_logic_circuit',
        project_name: 'Logic Circuit Basics',
        short_description: 'Digital logic exercises with simulation files.',
        long_description: 'Collection of combinational and sequential circuit designs that explore timers, multiplexers, and counters while documenting implementation trade-offs.',
        card_image: './images/calculator_card.webp',
        spotlight_image: './images/calculator_spotlight.webp',
        url: 'https://github.com/Ahmed-Herzalla0/Basic-Logic-circut-main'
    },
    {
        project_id: 'project_ahmad_elzero_playground',
        project_name: 'Elzero Challenges',
        short_description: 'Front-end practice solutions from Elzero Web School.',
        long_description: 'A living archive of UI exercises, layout drills, and DOM manipulations completed while following Elzero Web School training content.',
        card_image: './images/blog_card.webp',
        spotlight_image: './images/blog_spotlight.webp',
        url: 'https://github.com/Ahmed-Herzalla0/Elzero'
    },
    {
        project_id: 'project_ahmad_leon_agency',
        project_name: 'Leon Agency Template',
        short_description: 'Creative agency landing built from a PSD brief.',
        long_description: 'Implements a clean agency experience emphasising grid alignment, scroll rhythm, and reusable hero sections derived from the Leon PSD design.',
        card_image: './images/music_app_card.webp',
        spotlight_image: './images/music_app_spotlight.webp',
        url: 'https://github.com/Ahmed-Herzalla0/Leon-PSD-Agency-Template'
    }
]);

const ILLEGAL_CHAR_PATTERN = /[^a-zA-Z0-9@._-\s]/;
const EMAIL_VALIDATION_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 300;
const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

const projectStore = new Map();
let activeProjectCard = null;
let spotlightElements = null;

document.addEventListener('DOMContentLoaded', () => {
    ensureErrorClassStyle();
    updateHeaderName(USER_PROFILE.name);

    initializePortfolio().catch((error) => {
        console.error('Portfolio initialization failed:', error);
    });
});

async function initializePortfolio() {
    await populateAboutSection();
    const projectListElement = await populateProjectsSection();
    if (projectListElement) {
        initProjectNavigation(projectListElement);
    }
    initFormValidation();
}

async function populateAboutSection() {
    const aboutContainer = document.getElementById('aboutMe');
    if (!aboutContainer) {
        return;
    }

    let aboutData = {};
    try {
        aboutData = await fetchJson('./data/aboutMeData.json');
    } catch (error) {
        console.warn('Unable to fetch about me data; falling back to defaults.', error);
    }

    const aboutFragment = document.createDocumentFragment();
    const aboutParagraph = document.createElement('p');
    aboutParagraph.textContent = createAboutText(aboutData?.aboutMe);
    aboutFragment.appendChild(aboutParagraph);

    const headshotWrapper = document.createElement('div');
    headshotWrapper.classList.add('headshotContainer');

    const headshotImage = document.createElement('img');
    headshotImage.alt = `${USER_PROFILE.name} headshot`;
    headshotImage.decoding = 'async';
    headshotImage.loading = 'lazy';
    headshotImage.src = resolveAssetPath(aboutData?.headshot, ASSET_PATHS.headshotFallback);
    headshotWrapper.appendChild(headshotImage);

    aboutFragment.appendChild(headshotWrapper);
    aboutContainer.appendChild(aboutFragment);
}

async function populateProjectsSection() {
    const projectList = document.getElementById('projectList');
    const projectSpotlight = document.getElementById('projectSpotlight');
    if (!projectList || !projectSpotlight) {
        return null;
    }

    spotlightElements = buildSpotlightStructure();

    let rawProjects = [];
    try {
        rawProjects = await fetchJson('./data/projectsData.json');
    } catch (error) {
        console.warn('Unable to fetch projects data; using fallback projects.', error);
    }

    if (!Array.isArray(rawProjects)) {
        rawProjects = [];
    }

    const customProjects = getCustomProjects();
    const existingIds = new Set(
        rawProjects
            .map((project) => project?.project_id)
            .filter((projectId) => typeof projectId === 'string' && projectId)
    );

    customProjects.forEach((project) => {
        if (!existingIds.has(project.project_id)) {
            rawProjects.push(project);
            existingIds.add(project.project_id);
        }
    });

    if (rawProjects.length === 0 && customProjects.length > 0) {
        rawProjects.push(customProjects[0]);
    }

    const cardsFragment = document.createDocumentFragment();

    rawProjects.forEach((rawProject, index) => {
        const normalizedProject = normalizeProject(rawProject, index);
        projectStore.set(normalizedProject.project_id, normalizedProject);

        const projectCard = buildProjectCard(normalizedProject);
        cardsFragment.appendChild(projectCard);

        if (index === 0) {
            setActiveProjectCard(projectCard);
            setSpotlight(normalizedProject);
        } else {
            projectCard.classList.add('inactive');
        }
    });

    projectList.appendChild(cardsFragment);
    return projectList;
}

function buildProjectCard(project) {
    const card = document.createElement('div');
    card.classList.add('projectCard');
    card.dataset.projectId = project.project_id;
    if (project.project_id) {
        card.id = project.project_id;
    }
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${project.project_name} project spotlight`);

    applyCardBackground(card, project.card_image);

    const title = document.createElement('h4');
    title.textContent = project.project_name;

    const teaser = document.createElement('p');
    teaser.textContent = project.short_description;

    card.append(title, teaser);

    card.addEventListener('click', () => handleProjectSelection(project.project_id, card));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleProjectSelection(project.project_id, card);
        }
    });

    return card;
}

function handleProjectSelection(projectId, card) {
    const project = projectStore.get(projectId);
    if (!project) {
        return;
    }

    setActiveProjectCard(card);
    setSpotlight(project);
}

function applyCardBackground(cardElement, imagePath) {
    const resolvedPath = resolveAssetPath(imagePath, ASSET_PATHS.cardPlaceholder);
    cardElement.style.backgroundImage = `url('${resolvedPath}')`;
    cardElement.style.backgroundSize = 'cover';
    cardElement.style.backgroundPosition = 'center';
    cardElement.style.backgroundRepeat = 'no-repeat';
}

function setSpotlight(project) {
    const spotlight = document.getElementById('projectSpotlight');
    if (!spotlight || !spotlightElements) {
        return;
    }

    const spotlightPath = resolveAssetPath(project.spotlight_image, ASSET_PATHS.spotlightPlaceholder);
    spotlight.style.backgroundImage = `url('${spotlightPath}')`;
    spotlight.style.backgroundSize = 'cover';
    spotlight.style.backgroundPosition = 'center';
    spotlight.style.backgroundRepeat = 'no-repeat';

    spotlightElements.title.textContent = project.project_name;
    spotlightElements.description.textContent = project.long_description;

    if (project.url) {
        spotlightElements.link.textContent = 'Click here to see more...';
        spotlightElements.link.href = project.url;
        spotlightElements.link.target = '_blank';
        spotlightElements.link.rel = 'noopener noreferrer';
        spotlightElements.link.classList.remove('inactive');
        spotlightElements.link.removeAttribute('aria-disabled');
        spotlightElements.link.tabIndex = 0;
        spotlightElements.link.style.pointerEvents = 'auto';
    } else {
        spotlightElements.link.textContent = 'Project link coming soon...';
        spotlightElements.link.removeAttribute('href');
        spotlightElements.link.setAttribute('aria-disabled', 'true');
        spotlightElements.link.classList.add('inactive');
        spotlightElements.link.tabIndex = -1;
        spotlightElements.link.style.pointerEvents = 'none';
    }
}

function setActiveProjectCard(card) {
    if (activeProjectCard && activeProjectCard !== card) {
        activeProjectCard.classList.remove('active');
        activeProjectCard.classList.add('inactive');
        activeProjectCard.removeAttribute('aria-current');
    }

    card.classList.add('active');
    card.classList.remove('inactive');
    card.setAttribute('aria-current', 'true');
    activeProjectCard = card;
}

function initProjectNavigation(projectList) {
    const leftArrow = document.querySelector('.arrow-left');
    const rightArrow = document.querySelector('.arrow-right');
    if (!leftArrow || !rightArrow) {
        return;
    }

    leftArrow.setAttribute('role', 'button');
    rightArrow.setAttribute('role', 'button');
    leftArrow.tabIndex = 0;
    rightArrow.tabIndex = 0;

    const mediaQueryList = window.matchMedia(DESKTOP_MEDIA_QUERY);

    const scrollList = (direction) => {
        const scrollDistance = calculateScrollDistance(projectList, mediaQueryList.matches) * direction;
        const scrollOptions = { behavior: 'smooth' };

        if (mediaQueryList.matches) {
            scrollOptions.top = scrollDistance;
            scrollOptions.left = 0;
        } else {
            scrollOptions.left = scrollDistance;
            scrollOptions.top = 0;
        }

        projectList.scrollBy(scrollOptions);
    };

    leftArrow.addEventListener('click', () => scrollList(-1));
    rightArrow.addEventListener('click', () => scrollList(1));

    leftArrow.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            scrollList(-1);
        }
    });

    rightArrow.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            scrollList(1);
        }
    });

    const resetScrollPosition = () => {
        projectList.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    };

    if (typeof mediaQueryList.addEventListener === 'function') {
        mediaQueryList.addEventListener('change', resetScrollPosition);
    } else if (typeof mediaQueryList.addListener === 'function') {
        mediaQueryList.addListener(resetScrollPosition);
    }
}

function calculateScrollDistance(listElement, isDesktop) {
    const firstCard = listElement.querySelector('.projectCard');
    if (!firstCard) {
        return 220;
    }

    const listStyles = window.getComputedStyle(listElement);
    const gapValue = parseInt(listStyles.gap || listStyles.columnGap || listStyles.rowGap || '20', 10);
    const gap = Number.isNaN(gapValue) ? 20 : gapValue;

    if (isDesktop) {
        return firstCard.offsetHeight + gap;
    }

    return firstCard.offsetWidth + gap;
}

function initFormValidation() {
    const form = document.getElementById('formSection');
    const emailInput = document.getElementById('contactEmail');
    const messageInput = document.getElementById('contactMessage');
    const emailError = document.getElementById('emailError');
    const messageError = document.getElementById('messageError');
    const charCounter = document.getElementById('charactersLeft');

    if (!form || !emailInput || !messageInput || !emailError || !messageError || !charCounter) {
        return;
    }

    const updateCharacterCount = () => {
        const charactersUsed = messageInput.value.length;
        charCounter.textContent = `Characters: ${charactersUsed}/${MAX_MESSAGE_LENGTH}`;
        const overLimit = charactersUsed > MAX_MESSAGE_LENGTH;
        charCounter.classList.toggle('error', overLimit);
        charCounter.style.color = overLimit ? 'var(--error)' : '';
    };

    updateCharacterCount();

    messageInput.addEventListener('input', () => {
        updateCharacterCount();
        messageError.textContent = '';
    });

    emailInput.addEventListener('input', () => {
        emailError.textContent = '';
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const emailValue = emailInput.value.trim();
        const messageValue = messageInput.value;

        const validationResults = validateFormFields(emailValue, messageValue);
        emailError.textContent = validationResults.email;
        messageError.textContent = validationResults.message;

        if (!validationResults.email && !validationResults.message) {
            window.alert('Thanks for reaching out! Your message passed validation.');
            form.reset();
            emailError.textContent = '';
            messageError.textContent = '';
            updateCharacterCount();
        }
    });
}

function validateFormFields(email, message) {
    const validation = { email: '', message: '' };

    if (!email) {
        validation.email = 'Please enter your email address.';
    } else if (ILLEGAL_CHAR_PATTERN.test(email)) {
        validation.email = 'Remove special characters from your email address.';
    } else if (!EMAIL_VALIDATION_PATTERN.test(email)) {
        validation.email = 'Please enter a valid email address.';
    }

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
        validation.message = 'Please enter a message before submitting.';
    } else if (ILLEGAL_CHAR_PATTERN.test(message)) {
        validation.message = 'Please remove special characters from your message.';
    } else if (message.length > MAX_MESSAGE_LENGTH) {
        validation.message = `Please keep your message within ${MAX_MESSAGE_LENGTH} characters.`;
    }

    return validation;
}

async function fetchJson(resourcePath) {
    const response = await fetch(resourcePath);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${resourcePath}: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

function normalizeProject(project, index) {
    const fallbackId = `project_${index + 1}`;

    return {
        project_id: project?.project_id || fallbackId,
        project_name: project?.project_name?.trim() || 'Untitled Project',
        short_description: project?.short_description?.trim() || 'Details coming soon.',
        long_description: project?.long_description?.trim() || 'Check back soon for a full project description.',
        card_image: resolveAssetPath(project?.card_image, ASSET_PATHS.cardPlaceholder),
        spotlight_image: resolveAssetPath(project?.spotlight_image, ASSET_PATHS.spotlightPlaceholder),
        url: project?.url?.trim() || ''
    };
}

function getCustomProjects() {
    return CUSTOM_PROJECTS.map((project) => ({ ...project }));
}

function resolveAssetPath(candidatePath, fallback) {
    if (typeof candidatePath !== 'string' || !candidatePath.trim()) {
        return fallback;
    }

    const trimmed = candidatePath.trim();

    if (/^(https?:)?\/\//.test(trimmed)) {
        return trimmed;
    }

    if (trimmed.startsWith('../')) {
        return `.${trimmed.slice(2)}`;
    }

    if (trimmed.startsWith('./') || trimmed.startsWith('/')) {
        return trimmed;
    }

    return `./${trimmed.replace(/^\./, '')}`;
}

function buildSpotlightStructure() {
    const container = document.getElementById('spotlightTitles');
    if (!container) {
        return null;
    }

    container.textContent = '';

    const title = document.createElement('h3');
    const description = document.createElement('p');
    const link = document.createElement('a');
    link.textContent = 'Click here to see more...';

    container.append(title, description, link);

    return { container, title, description, link };
}

function ensureErrorClassStyle() {
    if (document.getElementById('js-inline-error-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'js-inline-error-style';
    style.textContent = '.error { color: var(--error); }';
    document.head.appendChild(style);
}

function createAboutText(fallbackText) {
    const intro = `Hi, I'm ${USER_PROFILE.name}, a ${USER_PROFILE.title} at ${USER_PROFILE.university}.`;
    const focus = `Based in ${USER_PROFILE.location}, I enjoy building accessible, data-driven interfaces and continually sharpening my problem-solving skills.`;
    const outreach = `Reach me at ${USER_PROFILE.email} or ${USER_PROFILE.phone}, and explore my projects on GitHub: ${USER_PROFILE.projectLink}.`;
    const courseText = typeof fallbackText === 'string' ? fallbackText.trim() : '';

    return [intro, focus, outreach, courseText].filter(Boolean).join(' ');
}

function updateHeaderName(name) {
    const headerTitle = document.querySelector('header h1');
    if (headerTitle) {
        headerTitle.textContent = name;
    }
}
