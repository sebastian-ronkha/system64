// --- THEME MANAGEMENT ---
let currentTheme = localStorage.getItem('rlLevelingThemeV3') || 'minimalist';
let bodyElement;
let themeFontLink;
const ALL_THEMES = ['minimalist', 'cyberpunk', 'matrix', '8bit', 'crt-glow', 'early-web', 'text-terminal'];

function applyTheme(theme) {
    if (!bodyElement || !themeFontLink) {
        console.warn("applyTheme called before essential DOM elements (body, themeFontLink) were initialized.");
        return;
    }

    ALL_THEMES.forEach(t => bodyElement.classList.remove(`theme-${t}`));
    bodyElement.classList.add(`theme-${theme}`);

    let fontUrl = '';
    let crtTextColorRgb = '76,175,80'; // Default green for CRT
    switch (theme) {
        case 'cyberpunk': fontUrl = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap'; break;
        case 'matrix': fontUrl = 'https://fonts.googleapis.com/css2?family=VT323&display=swap'; break;
        case '8bit': fontUrl = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'; break;
        case 'crt-glow':
            fontUrl = 'https://fonts.googleapis.com/css2?family=Cutive+Mono&display=swap';
            // Example: to switch to amber for CRT Glow, uncomment next line and comment out the green one
            // document.documentElement.style.setProperty('--crt-text-main-color', '#FFC107'); // Amber
            // crtTextColorRgb = '255,193,7'; // Amber RGB
            document.documentElement.style.setProperty('--crt-text-main-color', '#4CAF50'); // Green
            crtTextColorRgb = '76,175,80'; // Green RGB
            break;
        case 'text-terminal': fontUrl = 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;700&display=swap'; break;
        case 'minimalist':
        case 'early-web':
        default: fontUrl = ''; break;
    }
    themeFontLink.href = fontUrl;
    document.documentElement.style.setProperty('--crt-text-main-color-rgb', crtTextColorRgb);


    const messageDivElement = document.getElementById('messageDiv');
    if (messageDivElement) {
        if (theme === 'text-terminal') {
            messageDivElement.classList.add('blinking-cursor');
        } else {
            messageDivElement.classList.remove('blinking-cursor');
        }
    }

    const supportLink = document.getElementById('supportNoInternetLink');
    if (supportLink) {
        setTimeout(() => {
            supportLink.style.color = getComputedStyle(document.documentElement).getPropertyValue('--color-link').trim();
        }, 0);
    }

    localStorage.setItem('rlLevelingThemeV3', theme);
    currentTheme = theme;
    playThemeActivationSound(theme);
}


// --- AUDIO CONTEXT & SOUNDS ---
let audioCtx = null;
function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playSound(type = 'sine', frequency = 440, duration = 0.05, volume = 0.03, attack = 0.005, decay = 0.04, forNoise = false) {
    const localAudioCtx = getAudioContext();
    if (!localAudioCtx || localAudioCtx.state === 'suspended') {
        localAudioCtx?.resume().catch(e => console.warn("AudioContext resume failed", e));
    }
    if (!localAudioCtx || localAudioCtx.state !== 'running') {
        console.warn("AudioContext not available or not running. Sound not played.");
        return;
    }

    try {
        if (forNoise) {
            const bufferSize = localAudioCtx.sampleRate * duration; // duration in seconds
            const buffer = localAudioCtx.createBuffer(1, bufferSize, localAudioCtx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1; // White noise
            }
            const noiseSource = localAudioCtx.createBufferSource();
            noiseSource.buffer = buffer;
            const gainNode = localAudioCtx.createGain();
            gainNode.gain.setValueAtTime(0, localAudioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, localAudioCtx.currentTime + attack);
            gainNode.gain.linearRampToValueAtTime(0, localAudioCtx.currentTime + attack + decay);
            noiseSource.connect(gainNode);
            gainNode.connect(localAudioCtx.destination);
            noiseSource.start(localAudioCtx.currentTime);
            noiseSource.stop(localAudioCtx.currentTime + duration);

        } else {
            const oscillator = localAudioCtx.createOscillator();
            const gainNode = localAudioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(localAudioCtx.destination);
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, localAudioCtx.currentTime);
            gainNode.gain.setValueAtTime(0, localAudioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, localAudioCtx.currentTime + attack);
            gainNode.gain.linearRampToValueAtTime(0, localAudioCtx.currentTime + attack + decay);
            oscillator.start(localAudioCtx.currentTime);
            oscillator.stop(localAudioCtx.currentTime + duration);
        }
    } catch (e) {
        console.error("Error playing sound:", e);
    }
}


function playThemeActivationSound(theme) {
    switch (theme) {
        case 'cyberpunk':
            playSound('sawtooth', 110, 0.3, 0.02, 0.01, 0.25);
            setTimeout(() => playSound('sine', 1000, 0.2, 0.015, 0.05, 0.15), 100);
            break;
        case 'matrix':
            playSound('sawtooth', 50, 0.5, 0.02, 0.01, 0.4);
            setTimeout(() => playSound('sine', 1500, 0.1, 0.01, 0.08, 0.02), 80);
            setTimeout(() => playSound('sine', 1200, 0.1, 0.01, 0.08, 0.02), 180);
            break;
        case '8bit':
            playSound('square', 660, 0.07, 0.03, 0.001, 0.06);
            setTimeout(() => playSound('square', 770, 0.07, 0.03, 0.001, 0.06), 80);
            setTimeout(() => playSound('square', 880, 0.1, 0.03, 0.001, 0.09), 160);
            break;
        case 'crt-glow':
            playSound('sine', 60, 0.8, 0.01, 0.3, 0.45); // Deeper, longer hum
            playSound(null, 0, 0.6, 0.003, 0.01, 0.55, true); // White noise for static/grain
            setTimeout(() => playSound('sine', 15750, 0.15, 0.004, 0.02, 0.12), 70); // High-pitch whine
            break;
        case 'early-web':
            playSound('triangle', 1000, 0.04, 0.02);
            setTimeout(() => playSound('triangle', 1200, 0.04, 0.02), 50);
            setTimeout(() => playSound('triangle', 900, 0.04, 0.02), 100);
            break;
        case 'text-terminal':
            playSound('square', 2000, 0.03, 0.025, 0.001, 0.02);
            setTimeout(() => playSound('sine', 800, 0.1, 0.015, 0.01, 0.09), 50);
            break;
        case 'minimalist':
        default: break;
    }
}

function playButtonClickSound() {
    switch (currentTheme) {
        case 'cyberpunk': playSound('square', 660, 0.06, 0.02, 0.005, 0.05); break;
        case 'matrix': playSound('sine', 1200, 0.03, 0.015, 0.002, 0.025); break;
        case '8bit': playSound('square', 440, 0.05, 0.03, 0.001, 0.04); break;
        case 'crt-glow': playSound('triangle', 700, 0.04, 0.01, 0.005, 0.03); break;
        case 'early-web': playSound('triangle', 1000, 0.03, 0.02, 0.001, 0.02); break;
        case 'text-terminal': playSound('square', 1500, 0.02, 0.03, 0.001, 0.015); break;
        case 'minimalist': default: break;
    }
}
function playTimerBeep(isFinal = false) {
    if (currentTheme === 'cyberpunk' || currentTheme === 'matrix' || currentTheme === 'crt-glow' || currentTheme === 'text-terminal') {
        if (isFinal) {
            playSound('sawtooth', 1200, 0.25, 0.04, 0.01, 0.2);
            setTimeout(() => playSound('sawtooth', 1200, 0.25, 0.04, 0.01, 0.2), 300);
        } else {
            playSound('triangle', 1000, 0.1, 0.02, 0.005, 0.09);
        }
    } else if (currentTheme === '8bit') {
        if (isFinal) {
            playSound('square', 800, 0.15, 0.03); setTimeout(() => playSound('square', 800, 0.15, 0.03), 200);
        } else {
            playSound('square', 1000, 0.08, 0.025);
        }
    }
}
function playErrorSound() {
    if (currentTheme === 'cyberpunk' || currentTheme === 'matrix' || currentTheme === 'text-terminal') {
        playSound('sawtooth', 220, 0.15, 0.03, 0.01, 0.14);
    } else if (currentTheme === '8bit') {
        playSound('square', 200, 0.1, 0.03); setTimeout(() => playSound('square', 150, 0.1, 0.03), 120);
    } else if (currentTheme === 'crt-glow') {
        playSound('sawtooth', 150, 0.2, 0.02, 0.01, 0.18);
    }
}
function playSuccessSound() {
    if (currentTheme === 'cyberpunk' || currentTheme === 'matrix' || currentTheme === 'text-terminal') {
        playSound('sine', 880, 0.1, 0.03, 0.005, 0.09);
        setTimeout(() => playSound('sine', 1046.50, 0.08, 0.02, 0.005, 0.07), 100);
    } else if (currentTheme === '8bit') {
        playSound('square', 523.25, 0.08, 0.03);
        setTimeout(() => playSound('square', 659.25, 0.08, 0.03), 90);
        setTimeout(() => playSound('square', 783.99, 0.12, 0.03), 180);
    } else if (currentTheme === 'crt-glow') {
        playSound('sine', 700, 0.15, 0.02, 0.01, 0.13);
        setTimeout(() => playSound('sine', 900, 0.1, 0.015, 0.01, 0.08), 120);
    }
}


// --- CORE DATA & STATE ---
let characterData = {};
let currentTask = null;
let taskInProgress = false;
let timerInterval = null;
let timeLeftInSeconds = 0;
let scenarioCounter = 0;
const XP_PER_LEVEL = 100;
let currentTimerModalCleanup = null;

let resetConfirmationStep = 0;
const resetConfirmationMessages = [
    "Are you sure you want to reset all your progress? This action cannot be undone.",
    "Seriously, this will wipe everything. Are you absolutely certain?",
    "This is your final chance. Resetting will delete your character and all task history. Proceed?",
    "Okay, if you insist! Clicking 'Yes' will erase all data. Still want to do this?",
    "FINAL WARNING! Clicking 'Yes' means total data annihilation. No going back!"
];

let sessionTaskCompletions = 0;
let emergencyCooldownActive = false;
let emergencyCooldownEndTime = 0;
const EMERGENCY_COOLDOWN_DURATION = 1 * 60 * 60 * 1000;
const TASKS_BEFORE_COOLDOWN = 20;
let emergencyTimerIntervalId = null;

let lastTaskGeneratedTime = 0;
let cheatAttempts = 0;
const MIN_TASK_TIME_MS = 7000;
const MAX_CHEAT_ATTEMPTS = 5;
const cheatMessages = [
    "Liar. The task was just given.", "Seriously? You think I wouldn't notice?", "Try actually doing the task, pal.",
    "My grandma could click faster... if she was trying to cheat.", "Alert! Suspiciously fast completion detected.",
    "Were you even trying or just mashing buttons?", "That's not how this works. That's not how any of this works.",
    "Okay, Flash. Slow down a bit.", "Whoa there, speedy! Give it a moment.", "Error 402: Payment (of effort) Required."
];
let cheaterTaskToRestore = null;

const SKILLS_CONFIG = {};
const LEVEL_TIERS = [];
const DIFFICULTY_CODES_MAP = {};
const DIFFICULTY_FULL_NAMES = {};
const BOOK_LIST_SAMPLE = [];
const TASK_TEMPLATES = [];

window.AGILITY_X_ITEMS = ["Agility ladder", "Obstacle course", "Jump rope", "Cone drills", "Balance board", "Speed hurdles", "Reaction ball", "Plyometric box", "Track field", "Agility cones"];
window.STRENGTH_X_ITEMS = ["Free weights", "Resistance bands", "Weight machines", "Bodyweight exercises", "Dumbbells", "Kettlebells", "Barbell", "Medicine ball", "Power rack", "Pull-up bar"];
window.ENDURANCE_X_ITEMS = ["Running track", "Cycling route", "Swimming pool", "Rowing machine", "Treadmill", "Elliptical", "Stair climber", "Jump rope", "Hiking trail", "Trail running"];
window.PROBLEMSOLVING_X_ITEMS = ["Puzzle games", "Brain teasers", "Strategy games", "Logic problems", "Escape rooms", "Coding challenges", "Riddles", "Math problems", "Sudoku", "Board games"];
window.LEARNING_X_ITEMS = ["Online courses", "Books", "Podcasts", "Tutorials", "Documentaries", "Webinars", "Workshops", "Educational videos", "Study groups", "Language apps"];
window.CREATIVITY_X_ITEMS = ["Drawing canvas", "Painting easel", "Writing software", "Musical instrument", "Crafting station", "Digital camera", "Dance studio floor", "Acting script", "Design software", "Brainstorming whiteboard"];
window.FINLIT_X_ITEMS = ["Budgeting apps", "Financial books", "Fin-tech online courses", "Investment webinars", "Economic podcasts", "Stock simulators", "Wealth workshops", "Personal finance blogs", "Money management tools", "Certified financial advisors"];
window.BUDGETING_X_ITEMS = ["Expense tracker app", "Digital budget planner", "Financial spreadsheet", "Mobile finance app", "Zero-based budget system", "Financial goal journal", "Bank transaction log", "Automated bill organizer", "Cash flow projection worksheet", "Savings target visualizer"];
window.INVESTING_X_ITEMS = ["Stock market simulators", "Robo-advisor apps", "Financial news aggregators", "Algorithmic trading courses", "Crypto exchange webinars", "Portfolio analysis trackers", "Mutual fund prospectuses", "Decentralized finance platforms", "Investment strategy clubs", "Brokerage API consultations"];
window.DISCIPLINE_X_ITEMS = ["Digital daily schedule", "Habit formation tracker", "Guided meditation routine", "AI personal trainer plan", "Adaptive study timetable", "Smart wake-up system", "Time-blocking software", "Productivity metrics journal", "Cognitive focus techniques", "Peer accountability network"];
window.COMMUNITY_X_ITEMS = ["Local charity organization", "Community tech hub", "Online volunteer collective", "Urban eco-restoration drive", "Crowdsourced fundraising platform", "Digital food bank network", "Cyber-neighborhood watch program", "Elderly tech support initiative", "Virtual animal rescue shelter", "Youth mentorship program"];
window.RELATIONSHIP_X_ITEMS = ["Family member", "Significant other", "Close confidant", "Old acquaintance", "Academic peer", "Forgotten contact", "Trusted friend", "Sibling unit", "Professional mentor", "Online community member"];
window.SELFAWARENESS_X_ITEMS = ["Encrypted digital journal", "Biofeedback meditation device", "AI therapy chatbot sessions", "Mindfulness training apps", "Cognitive bias reflection exercises", "Psychometric personality assessments", "360-degree peer feedback", "Gamified self-assessment quizzes", "Somatic breathing exercises", "Emotional intelligence check-ins"];

let containerDiv, introOverlay, setupScreen, mainAppScreen, messageDiv, setupForm, nameInput, ageInput, statusInput, weightInput, heightInput;
let characterProfileButton, dashboardButton, generateTaskButton, resetProgressButton, easterEggTrigger64;
let taskDisplayDiv;
let characterProfileModal, profileContent, timerCompleteModal, resetConfirmationModal, resetConfirmationMessageDiv, resetConfirmYesButton, resetConfirmNoButton;
let emergencyQuestModal, emergencyQuestTimerDiv, cheatModal, cheatMessageText, cheatSorryButton;
let simpleThemeToggleModal, simpleThemeToggleText, simpleThemeToggleYesButton, simpleThemeToggleNoButton; // New modal elements
let dashboardModal, dashboardContent;
let modalCloseButtons;

let supportCreatorButton, supportPromptModal, supportPromptYes, supportPromptNo;
let supportRedirectConfirmModal, supportRedirectConfirmYes, supportRedirectConfirmNo;
let supportNoInternetModal, supportNoInternetOk;

let superSecretThemesModal, superSecretThemeOptionsView, superSecretConfirmationView, superSecretConfirmationText, superSecretConfirmYesButton, superSecretConfirmNoButton;
let longPressTimer = null;
const LONG_PRESS_DURATION = 15000;
let isLongPressActive = false; // To distinguish from single click
let pendingSuperSecretTheme = null;

function populateConfigData() {
    Object.assign(SKILLS_CONFIG, {
        "Strength": { domain: "Physical" }, "Endurance": { domain: "Physical" }, "Agility": { domain: "Physical" },
        "Focus": { domain: "Mental" }, "ProblemSolving": { domain: "Mental" }, "Learning": { domain: "Mental" }, "Creativity": { domain: "Mental" },
        "FinancialLiteracy": { domain: "Financial" }, "Budgeting": { domain: "Financial" }, "Investing": { domain: "Financial" },
        "Discipline": { domain: "Philosophical" }, "SelfAwareness": { domain: "Philosophical" }, "GoalSetting": { domain: "Philosophical" }, "Mindfulness": { domain: "Philosophical" },
        "Community": { domain: "Social" }, "Relationship": { domain: "Social" }
    });
    LEVEL_TIERS.push(
        { maxLevel: 4, name: "⚔️ Novice" }, { maxLevel: 9, name: "⚔️ Apprentice" }, { maxLevel: 14, name: "⚔️ Journeyman" },
        { maxLevel: 19, name: "⚔️ Expert" }, { maxLevel: 24, name: "⚔️ Master" }, { maxLevel: 29, name: "⚔️ Grandmaster" },
        { maxLevel: 34, name: "⚔️ Elder" }, { maxLevel: 39, name: "⚔️ Demigod" }, { maxLevel: 44, name: "⚔️ Legendary" },
        { maxLevel: 49, name: "⚔️ Archmage" }, { maxLevel: 59, name: "⚔️ Celestial" }, { maxLevel: 69, name: "⚔️ Immortal" },
        { maxLevel: 79, name: "⚔️ Overlord" }, { maxLevel: 89, name: "⚔️ Eternal" }, { maxLevel: 99, name: "⚔️ Ascended" },
        { maxLevel: 149, name: "⚔️ Primordial" }, { maxLevel: 150, name: "⚔️ Mythical" }
    );
    Object.assign(DIFFICULTY_CODES_MAP, {
        1: "A", 2: "A", 3: "A", 4: "A", 5: "A", 6: "B", 7: "B", 8: "B", 9: "B", 10: "B",
        11: "C", 12: "C", 13: "C", 14: "C", 15: "C", 16: "C", 17: "D", 18: "D", 19: "D", 20: "D", 21: "D"
    });
    Object.assign(DIFFICULTY_FULL_NAMES, {
        "A": "Very Easy", "B": "Easy", "C": "Medium", "D": "Hard", "E": "Impossible", "F": "Futile", "G": "Hopeless",
        "G+": "Impassable", "G++": "Impractical", "H": "Inaccessible", "H+": "Inconceivable", "H++": "Insurmountable"
    });

    BOOK_LIST_SAMPLE.push(
        "Meditations", "Sapiens", "Thinking, Fast and Slow", "The Power of Habit", "Man's Search for Meaning", "Atomic Habits", "Deep Work", "Grit", "Mindset", "How to Win Friends", "1984", "Brave New World", "The Art of War", "The Prince", "Cosmos", "The Selfish Gene", "Guns, Germs, and Steel", "A Short History of Nearly Everything", "Influence: The Psychology of Persuasion", "The 7 Habits of Highly Effective People", "To Kill a Mockingbird", "The Great Gatsby", "The Lord of the Rings", "Dune", "Foundation", "Fahrenheit 451", "The Hitchhiker's Guide to the Galaxy", "Surely You're Joking, Mr. Feynman!", "A Brief History of Time", "The Code Book", "Gödel, Escher, Bach"
    );

    const existingTasks = [
        { id: "P001", difficultyCode: "A", skill: "Strength", descriptionTemplate: "Do <strong>[AMOUNT_X]</strong> push-ups.", variables: { AMOUNT_X: { min: 5, max: 15, levelScaleFactor: 0.5 } }, baseXPGain: 10, baseXPFailurePenalty: 5, timeLimitMinutes: null },
        { id: "P002", difficultyCode: "A", skill: "Endurance", descriptionTemplate: "Go for a <strong>[DURATION_Y]</strong> minute brisk walk.", variables: { DURATION_Y: { min: 10, max: 20, levelScaleFactor: 0.5 } }, baseXPGain: 10, baseXPFailurePenalty: 5, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "P003", difficultyCode: "A", skill: "Agility", descriptionTemplate: "Practice <strong>[AMOUNT_X]</strong> jumping jacks.", variables: { AMOUNT_X: { min: 20, max: 40, levelScaleFactor: 1 } }, baseXPGain: 8, baseXPFailurePenalty: 4, timeLimitMinutes: null },
        { id: "P004", difficultyCode: "B", skill: "Strength", descriptionTemplate: "Complete <strong>[SETS]</strong> sets of <strong>[REPS]</strong> bodyweight squats.", variables: { SETS: { min: 2, max: 3, levelScaleFactor: 0.1 }, REPS: { min: 10, max: 15, levelScaleFactor: 0.5 } }, baseXPGain: 15, baseXPFailurePenalty: 7, timeLimitMinutes: null },
        { id: "P005", difficultyCode: "B", skill: "Endurance", descriptionTemplate: "Jog for <strong>[DURATION_Y]</strong> minutes.", variables: { DURATION_Y: { min: 10, max: 20, levelScaleFactor: 0.3 } }, baseXPGain: 15, baseXPFailurePenalty: 7, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "P006", difficultyCode: "B", skill: "Agility", descriptionTemplate: "Hold a balancing pose (e.g., tree pose) for <strong>[DURATION_S]</strong> seconds on each leg. Allocate <strong>[TOTAL_MINUTES]</strong> minutes for this task.", variables: { DURATION_S: { min: 20, max: 40, levelScaleFactor: 1 }, TOTAL_MINUTES: { min: 2, max: 5, levelScaleFactor: 0.1 } }, baseXPGain: 12, baseXPFailurePenalty: 6, timeLimitMinutes: "DYNAMIC", durationVariable: "TOTAL_MINUTES" },
        { id: "P007", difficultyCode: "C", skill: "Strength", descriptionTemplate: "Hold a plank for a total of <strong>[DURATION_M]</strong> minutes (can be broken into sets).", variables: { DURATION_M: { min: 1, max: 3, levelScaleFactor: 0.1 } }, baseXPGain: 20, baseXPFailurePenalty: 10, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "P008", difficultyCode: "C", skill: "Endurance", descriptionTemplate: "Cycle for <strong>[DISTANCE_Z]</strong> km or <strong>[DURATION_Y]</strong> minutes.", variables: { DISTANCE_Z: { min: 3, max: 7, levelScaleFactor: 0.2 }, DURATION_Y: { min: 20, max: 35, levelScaleFactor: 1 } }, baseXPGain: 25, baseXPFailurePenalty: 12, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "P009", difficultyCode: "C", skill: "Strength", descriptionTemplate: "Perform <strong>[AMOUNT_X]</strong> lunges per leg.", variables: { AMOUNT_X: { min: 10, max: 15, levelScaleFactor: 0.5 } }, baseXPGain: 18, baseXPFailurePenalty: 9, timeLimitMinutes: null },
        { id: "P010", difficultyCode: "A", skill: "Endurance", descriptionTemplate: "Do a <strong>[DURATION_Y]</strong> minute stretching routine.", variables: { DURATION_Y: { min: 5, max: 10, levelScaleFactor: 0.2 } }, baseXPGain: 7, baseXPFailurePenalty: 3, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "M001", difficultyCode: "A", skill: "Learning", descriptionTemplate: "Read <strong>[PAGE_X]</strong> pages from '<strong>[BOOK_TITLE]</strong>'.", variables: { PAGE_X: { min: 5, max: 15, levelScaleFactor: 0.5 }, BOOK_TITLE: true }, baseXPGain: 10, baseXPFailurePenalty: 5, timeLimitMinutes: null },
        { id: "M002", difficultyCode: "A", skill: "Focus", descriptionTemplate: "Meditate for <strong>[DURATION_Y]</strong> minutes without distraction.", variables: { DURATION_Y: { min: 3, max: 7, levelScaleFactor: 0.2 } }, baseXPGain: 10, baseXPFailurePenalty: 5, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "M003", difficultyCode: "A", skill: "Creativity", descriptionTemplate: "Sketch something for <strong>[DURATION_Y]</strong> minutes.", variables: { DURATION_Y: { min: 10, max: 20, levelScaleFactor: 0.5 } }, baseXPGain: 8, baseXPFailurePenalty: 4, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "M004", difficultyCode: "B", skill: "ProblemSolving", descriptionTemplate: "Solve a Sudoku puzzle (easy/medium difficulty).", variables: {}, baseXPGain: 15, baseXPFailurePenalty: 7, timeLimitMinutes: 25 },
        { id: "M005", difficultyCode: "B", skill: "Learning", descriptionTemplate: "Watch an educational video on a new topic for <strong>[DURATION_Y]</strong> minutes and write <strong>[POINTS]</strong> key takeaways.", variables: { DURATION_Y: { min: 15, max: 25, levelScaleFactor: 0.5 }, POINTS: { min: 3, max: 5, levelScaleFactor: 0.1 } }, baseXPGain: 15, baseXPFailurePenalty: 7, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "M006", difficultyCode: "B", skill: "Focus", descriptionTemplate: "Work on a single task for <strong>[DURATION_Y]</strong> minutes using the Pomodoro Technique.", variables: { DURATION_Y: { min: 20, max: 40, levelScaleFactor: 1 } }, baseXPGain: 18, baseXPFailurePenalty: 9, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "M007", difficultyCode: "C", skill: "ProblemSolving", descriptionTemplate: "Complete a medium-difficulty logic puzzle or brain teaser.", variables: {}, baseXPGain: 20, baseXPFailurePenalty: 10, timeLimitMinutes: 30 },
        { id: "M008", difficultyCode: "C", skill: "Learning", descriptionTemplate: "Research and write a short summary (<strong>[WORDS]</strong> words) on a complex topic over <strong>[DURATION_M]</strong> minutes.", variables: { WORDS: { min: 100, max: 250, levelScaleFactor: 10 }, DURATION_M: { min: 45, max: 75, levelScaleFactor: 1.5 } }, baseXPGain: 25, baseXPFailurePenalty: 12, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "M009", difficultyCode: "C", skill: "Creativity", descriptionTemplate: "Write a short story or poem of at least <strong>[LINES_WORDS]</strong> lines/words. Spend <strong>[DURATION_M]</strong> minutes.", variables: { LINES_WORDS: { min: 10, max: 150, levelScaleFactor: 5 }, DURATION_M: { min: 20, max: 40, levelScaleFactor: 1 } }, baseXPGain: 22, baseXPFailurePenalty: 11, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "M010", difficultyCode: "A", skill: "ProblemSolving", descriptionTemplate: "Organize your digital files or desktop for <strong>[DURATION_Y]</strong> minutes.", variables: { DURATION_Y: { min: 10, max: 20, levelScaleFactor: 0.5 } }, baseXPGain: 9, baseXPFailurePenalty: 4, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "F001", difficultyCode: "A", skill: "Budgeting", descriptionTemplate: "Track all your expenses for one day meticulously.", variables: {}, baseXPGain: 10, baseXPFailurePenalty: 5, timeLimitMinutes: null },
        { id: "F002", difficultyCode: "A", skill: "FinancialLiteracy", descriptionTemplate: "Read one article about basic personal finance (e.g., saving, debt) for <strong>[DURATION_Y]</strong> minutes.", variables: { DURATION_Y: { min: 10, max: 20, levelScaleFactor: 0.3 } }, baseXPGain: 8, baseXPFailurePenalty: 4, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "F003", difficultyCode: "A", skill: "Investing", descriptionTemplate: "Learn the definition of <strong>[TERM_COUNT]</strong> new investing terms.", variables: { TERM_COUNT: { min: 1, max: 3, levelScaleFactor: 0.1 } }, baseXPGain: 7, baseXPFailurePenalty: 3, timeLimitMinutes: null },
        { id: "F004", difficultyCode: "B", skill: "Budgeting", descriptionTemplate: "Create or review your weekly/monthly budget plan. Spend <strong>[DURATION_M]</strong> minutes.", variables: { DURATION_M: { min: 20, max: 40, levelScaleFactor: 1 } }, baseXPGain: 15, baseXPFailurePenalty: 7, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "F005", difficultyCode: "B", skill: "FinancialLiteracy", descriptionTemplate: "Research and compare <strong>[PRODUCT_COUNT]</strong> financial products (e.g., savings accounts, credit cards) for <strong>[DURATION_M]</strong> minutes.", variables: { PRODUCT_COUNT: { min: 2, max: 3 }, DURATION_M: { min: 15, max: 30, levelScaleFactor: 0.5 } }, baseXPGain: 18, baseXPFailurePenalty: 9, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "F006", difficultyCode: "B", skill: "Investing", descriptionTemplate: "Watch a <strong>[DURATION_Y]</strong> minute video explaining a basic investment strategy.", variables: { DURATION_Y: { min: 10, max: 20, levelScaleFactor: 0.5 } }, baseXPGain: 16, baseXPFailurePenalty: 8, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "F007", difficultyCode: "C", skill: "Budgeting", descriptionTemplate: "Identify <strong>[SAVING_IDEAS]</strong> ways to reduce your monthly expenses. Spend <strong>[DURATION_M]</strong> minutes brainstorming.", variables: { SAVING_IDEAS: { min: 2, max: 5, levelScaleFactor: 0.2 }, DURATION_M: { min: 15, max: 25, levelScaleFactor: 0.5 } }, baseXPGain: 20, baseXPFailurePenalty: 10, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "F008", difficultyCode: "C", skill: "FinancialLiteracy", descriptionTemplate: "Read a chapter from a book on personal finance or investing. Allocate <strong>[DURATION_M]</strong> minutes.", variables: { DURATION_M: { min: 30, max: 60, levelScaleFactor: 1 } }, baseXPGain: 22, baseXPFailurePenalty: 11, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "F009", difficultyCode: "C", skill: "Investing", descriptionTemplate: "Simulate making a paper trade and track its hypothetical performance for a day. Spend <strong>[DURATION_M]</strong> minutes on setup and initial analysis.", variables: { DURATION_M: { min: 20, max: 40, levelScaleFactor: 1 } }, baseXPGain: 25, baseXPFailurePenalty: 12, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "F010", difficultyCode: "A", skill: "Budgeting", descriptionTemplate: "Check your bank account balance and recent transactions.", variables: {}, baseXPGain: 5, baseXPFailurePenalty: 2, timeLimitMinutes: null },
        { id: "PH001", difficultyCode: "A", skill: "SelfAwareness", descriptionTemplate: "Write down <strong>[AMOUNT_X]</strong> things you are grateful for today.", variables: { AMOUNT_X: { min: 3, max: 5, levelScaleFactor: 0.2 } }, baseXPGain: 10, baseXPFailurePenalty: 5, timeLimitMinutes: null },
        { id: "PH002", difficultyCode: "A", skill: "Mindfulness", descriptionTemplate: "Practice <strong>[DURATION_Y]</strong> minutes of mindful breathing.", variables: { DURATION_Y: { min: 3, max: 7, levelScaleFactor: 0.1 } }, baseXPGain: 8, baseXPFailurePenalty: 4, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "PH003", difficultyCode: "A", skill: "GoalSetting", descriptionTemplate: "Review your main goal for the week.", variables: {}, baseXPGain: 7, baseXPFailurePenalty: 3, timeLimitMinutes: null },
        { id: "PH004", difficultyCode: "B", skill: "Discipline", descriptionTemplate: "Identify one time-wasting habit and consciously avoid it for <strong>[DURATION_H]</strong> hours.", variables: { DURATION_H: { min: 2, max: 4, levelScaleFactor: 0.1 } }, baseXPGain: 15, baseXPFailurePenalty: 7, timeLimitMinutes: null },
        { id: "PH005", difficultyCode: "B", skill: "SelfAwareness", descriptionTemplate: "Journal for <strong>[DURATION_Y]</strong> minutes about your thoughts and feelings today.", variables: { DURATION_Y: { min: 10, max: 15, levelScaleFactor: 0.3 } }, baseXPGain: 16, baseXPFailurePenalty: 8, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "PH006", difficultyCode: "B", skill: "GoalSetting", descriptionTemplate: "Define one small, achievable goal for this week and write <strong>[STEPS]</strong> steps to achieve it. Spend <strong>[DURATION_M]</strong> minutes.", variables: { STEPS: { min: 2, max: 4, levelScaleFactor: 0.1 }, DURATION_M: { min: 10, max: 20, levelScaleFactor: 0.5 } }, baseXPGain: 18, baseXPFailurePenalty: 9, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "PH007", difficultyCode: "C", skill: "Mindfulness", descriptionTemplate: "Engage in a mindful activity (e.g., mindful walking, eating) for <strong>[DURATION_Y]</strong> minutes.", variables: { DURATION_Y: { min: 15, max: 25, levelScaleFactor: 0.5 } }, baseXPGain: 20, baseXPFailurePenalty: 10, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "PH008", difficultyCode: "C", skill: "SelfAwareness", descriptionTemplate: "Reflect on a recent challenge and identify <strong>[LESSONS]</strong> lessons learned. Journal for <strong>[DURATION_M]</strong> minutes.", variables: { LESSONS: { min: 1, max: 3, levelScaleFactor: 0.1 }, DURATION_M: { min: 15, max: 25, levelScaleFactor: 0.5 } }, baseXPGain: 22, baseXPFailurePenalty: 11, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" },
        { id: "PH009", difficultyCode: "C", skill: "Discipline", descriptionTemplate: "Complete a task you've been procrastinating on for at least <strong>[DURATION_Y]</strong> minutes.", variables: { DURATION_Y: { min: 20, max: 45, levelScaleFactor: 1 } }, baseXPGain: 25, baseXPFailurePenalty: 12, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_Y" },
        { id: "PH010", difficultyCode: "A", skill: "Mindfulness", descriptionTemplate: "Take <strong>[COUNT]</strong> deep, slow breaths, focusing only on your breath over <strong>[DURATION_M]</strong> minutes.", variables: { COUNT: { min: 5, max: 10, levelScaleFactor: 0.5 }, DURATION_M: { min: 1, max: 3, levelScaleFactor: 0.1 } }, baseXPGain: 6, baseXPFailurePenalty: 3, timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M" }
    ];
    TASK_TEMPLATES.push(...existingTasks);

    const newCategories = [
        {
            skill: "Agility", prefix: "AGL", itemsArrayName: "AGILITY_X_ITEMS", baseXP: 8, diffStep: 2, timeVars: { A: { min: 5, max: 15, scale: 0.3 }, B: { min: 10, max: 25, scale: 0.5 }, C: { min: 20, max: 40, scale: 0.7 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes training with <strong>[ITEM_X]</strong>.", "Practice drills for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Improve footwork for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Complete <strong>[DURATION_M]</strong> minutes of <strong>[ITEM_X]</strong>.", "Perform <strong>[SETS]</strong> sets of agility drills at <strong>[ITEM_X]</strong> (approx. <strong>[DURATION_M]</strong> min total).", "Warm up agility muscles for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Work on reaction time for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Use <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes in practice.", "Challenge yourself with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Cool down after <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."]
        },
        {
            skill: "Strength", prefix: "STR", itemsArrayName: "STRENGTH_X_ITEMS", baseXP: 10, diffStep: 2, timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 25, max: 45, scale: 0.8 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes lifting with <strong>[ITEM_X]</strong>.", "Complete strength sets for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Train muscles for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Perform reps with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Warm up strength muscles for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Use <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes in strength training.", "Cool down after strength work for <strong>[DURATION_M]</strong> minutes.", "Build endurance with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Do circuits with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Focus on core strength for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>."]
        },
        {
            skill: "Endurance", prefix: "END", itemsArrayName: "ENDURANCE_X_ITEMS", baseXP: 9, diffStep: 2, timeVars: { A: { min: 15, max: 25, scale: 0.5 }, B: { min: 20, max: 40, scale: 0.7 }, C: { min: 30, max: 60, scale: 0.9 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes endurance training at <strong>[ITEM_X]</strong>.", "Run for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Cycle for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Swim laps for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Use <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes in endurance workout.", "Warm up for endurance session for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Cool down after endurance training for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Perform intervals for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Complete long steady-state workout on <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Challenge your stamina with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."]
        },
        {
            skill: "ProblemSolving", prefix: "PRS", itemsArrayName: "PROBLEMSOLVING_X_ITEMS", baseXP: 12, diffStep: 3, timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 20, max: 40, scale: 0.8 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes solving <strong>[ITEM_X]</strong>.", "Practice <strong>[DURATION_M]</strong> minutes of problem-solving with <strong>[ITEM_X]</strong>.", "Work through <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes daily.", "Challenge yourself with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Complete <strong>[SETS]</strong> sets of puzzles with <strong>[ITEM_X]</strong> (approx. <strong>[DURATION_M]</strong> min total).", "Improve critical thinking with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Use <strong>[ITEM_X]</strong> to enhance focus for <strong>[DURATION_M]</strong> minutes.", "Solve <strong>[COUNT_X]</strong> riddles with <strong>[ITEM_X]</strong> (approx. <strong>[DURATION_M]</strong> min total).", "Engage in strategy games with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Take breaks after <strong>[DURATION_M]</strong> minutes solving <strong>[ITEM_X]</strong>."]
        },
        {
            skill: "Learning", prefix: "LRN", itemsArrayName: "LEARNING_X_ITEMS", baseXP: 10, diffStep: 2, timeVars: { A: { min: 15, max: 25, scale: 0.5 }, B: { min: 20, max: 35, scale: 0.6 }, C: { min: 30, max: 50, scale: 0.7 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes learning with <strong>[ITEM_X]</strong>.", "Complete <strong>[COUNT_X]</strong> chapters using <strong>[ITEM_X]</strong> (approx. <strong>[DURATION_M]</strong> min total).", "Watch educational videos for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Attend workshops for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Listen to podcasts for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Study with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes daily.", "Practice skills learned from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Join study groups for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Use tutorials for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Review material with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."]
        },
        {
            skill: "Creativity", prefix: "CRT", itemsArrayName: "CREATIVITY_X_ITEMS", baseXP: 8, diffStep: 2, timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 25, max: 45, scale: 0.8 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes practicing <strong>[ITEM_X]</strong>.", "Create artwork for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Write creatively for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Practice music for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Engage in crafting for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Take photos for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Dance for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Act in rehearsals for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Design projects for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Join brainstorming sessions for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>."]
        },
        {
            skill: "FinancialLiteracy", prefix: "FNL", itemsArrayName: "FINLIT_X_ITEMS", baseXP: 10, diffStep: 3, timeVars: { A: { min: 10, max: 20, scale: 0.3 }, B: { min: 15, max: 25, scale: 0.5 }, C: { min: 20, max: 35, scale: 0.6 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes learning with <strong>[ITEM_X]</strong>.", "Use <strong>[ITEM_X]</strong> to track spending for <strong>[DURATION_M]</strong> minutes.", "Attend webinars for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Read financial books for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Practice budgeting with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Listen to finance podcasts for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Use simulators for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Join workshops for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Consult financial advisors for <strong>[DURATION_M]</strong> minutes.", "Review personal finances for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>."]
        },
        {
            skill: "Budgeting", prefix: "BDG", itemsArrayName: "BUDGETING_X_ITEMS", baseXP: 9, diffStep: 2, timeVars: { A: { min: 5, max: 15, scale: 0.2 }, B: { min: 10, max: 20, scale: 0.4 }, C: { min: 15, max: 30, scale: 0.5 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes updating <strong>[ITEM_X]</strong>.", "Plan monthly budget with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Track expenses for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Analyze spending habits with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Set savings goals with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Review bills and payments for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Use <strong>[ITEM_X]</strong> to forecast expenses for <strong>[DURATION_M]</strong> minutes.", "Adjust budget categories with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Organize financial documents for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Monitor cash flow with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."]
        },
        {
            skill: "Investing", prefix: "INV", itemsArrayName: "INVESTING_X_ITEMS", baseXP: 12, diffStep: 3, timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 25, max: 45, scale: 0.8 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes researching with <strong>[ITEM_X]</strong>.", "Track portfolio for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Attend investment webinars for <strong>[DURATION_M]</strong> minutes.", "Practice trading with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Read financial news for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Join investment clubs for <strong>[DURATION_M]</strong> minutes.", "Analyze stocks for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Use simulators for <strong>[DURATION_M]</strong> minutes practicing investments.", "Consult brokers for <strong>[DURATION_M]</strong> minutes on <strong>[ITEM_X]</strong>.", "Review mutual fund info for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>."]
        },
        {
            skill: "Discipline", prefix: "DIS", itemsArrayName: "DISCIPLINE_X_ITEMS", baseXP: 11, diffStep: 2, timeVars: { A: { min: 10, max: 20, scale: 0.3 }, B: { min: 15, max: 25, scale: 0.5 }, C: { min: 20, max: 40, scale: 0.7 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes following <strong>[ITEM_X]</strong>.", "Track habits for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Meditate for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Stick to exercise plan for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Study according to timetable for <strong>[DURATION_M]</strong> minutes.", "Use time-blocking app for <strong>[DURATION_M]</strong> minutes daily.", "Wake up on time using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Journal productivity for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Practice focus techniques for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Check in with accountability partner for <strong>[DURATION_M]</strong> minutes."]
        },
        {
            skill: "Community", prefix: "CMY", itemsArrayName: "COMMUNITY_X_ITEMS", baseXP: 7, diffStep: 2, timeVars: { A: { min: 20, max: 40, scale: 0.4 }, B: { min: 30, max: 60, scale: 0.6 }, C: { min: 45, max: 90, scale: 0.8 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes volunteering at <strong>[ITEM_X]</strong>.", "Organize activities for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Attend meetings at <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Participate in events at <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Help with fundraisers for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Support neighbors for <strong>[DURATION_M]</strong> minutes through <strong>[ITEM_X]</strong>.", "Clean public spaces for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Assist elderly at <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Work with animals for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.", "Join youth activities for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>."]
        },
        {
            skill: "Relationship", prefix: "RLT", itemsArrayName: "RELATIONSHIP_X_ITEMS", baseXP: 6, diffStep: 1, timeVars: { A: { min: 10, max: 20, scale: 0.3 }, B: { min: 15, max: 30, scale: 0.4 }, C: { min: 20, max: 45, scale: 0.5 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Talk with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Catch up with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Plan activities with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Share meals with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Listen to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Support <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Reconnect with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Go out with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.", "Help <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."]
        },
        {
            skill: "SelfAwareness", prefix: "SLA", itemsArrayName: "SELFAWARENESS_X_ITEMS", baseXP: 9, diffStep: 2, timeVars: { A: { min: 5, max: 15, scale: 0.2 }, B: { min: 10, max: 20, scale: 0.4 }, C: { min: 15, max: 30, scale: 0.6 } },
            templates: ["Spend <strong>[DURATION_M]</strong> minutes journaling with <strong>[ITEM_X]</strong>.", "Meditate for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.", "Reflect on thoughts for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.", "Take personality tests for <strong>[DURATION_M]</strong> minutes.", "Attend therapy sessions for <strong>[DURATION_M]</strong> minutes.", "Use mindfulness apps for <strong>[DURATION_M]</strong> minutes daily.", "Complete self-assessment quizzes for <strong>[DURATION_M]</strong> minutes.", "Practice breathing exercises for <strong>[DURATION_M]</strong> minutes.", "Ask for feedback from peers for <strong>[DURATION_M]</strong> minutes.", "Check in emotionally for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>."]
        },
    ];

    newCategories.forEach(cat => {
        cat.templates.forEach((tmpl, index) => {
            let difficultyCode; let durationConfig;
            if (index < 3) { difficultyCode = "A"; durationConfig = cat.timeVars.A; }
            else if (index < 7) { difficultyCode = "B"; durationConfig = cat.timeVars.B; }
            else { difficultyCode = "C"; durationConfig = cat.timeVars.C; }

            const variables = {
                DURATION_M: { min: durationConfig.min, max: durationConfig.max, levelScaleFactor: durationConfig.scale },
                ITEM_X: cat.itemsArrayName
            };
            if (tmpl.includes("[SETS]")) variables.SETS = { min: 2, max: 4, levelScaleFactor: 0.1 };
            if (tmpl.includes("[COUNT_X]")) variables.COUNT_X = { min: 1, max: 5, levelScaleFactor: 0.2 };

            TASK_TEMPLATES.push({
                id: `${cat.prefix}${String(index + 1).padStart(3, '0')}`, skill: cat.skill, difficultyCode: difficultyCode,
                descriptionTemplate: tmpl, variables: variables,
                baseXPGain: cat.baseXP + (difficultyCode.charCodeAt(0) - 'A'.charCodeAt(0)) * cat.diffStep,
                baseXPFailurePenalty: Math.floor((cat.baseXP + (difficultyCode.charCodeAt(0) - 'A'.charCodeAt(0)) * cat.diffStep) / 2),
                timeLimitMinutes: "DYNAMIC", durationVariable: "DURATION_M"
            });
        });
    });
}

// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    bodyElement = document.body;
    themeFontLink = document.getElementById('themeFontLink');

    applyTheme(currentTheme); // Apply initial theme

    populateConfigData();
    initializeDOMElements();

    if (containerDiv) containerDiv.classList.add('hidden-for-intro');
    if (setupScreen) setupScreen.classList.add('hidden');
    if (mainAppScreen) mainAppScreen.classList.add('hidden');

    setTimeout(() => { if (introOverlay) introOverlay.classList.add('visible'); }, 100);
    setTimeout(() => { if (introOverlay) introOverlay.classList.remove('visible'); }, 3000);
    setTimeout(() => {
        if (introOverlay) introOverlay.style.display = 'none';
        if (containerDiv) containerDiv.classList.remove('hidden-for-intro');

        loadCharacterData();
        loadSessionState();

        if (emergencyCooldownActive) {
            checkEmergencyCooldown();
        } else if (!characterData.name) {
            showSetupScreen();
        } else {
            hideSetupScreen();
            initializeMainUI();
            displaySystemMessage(`Welcome back, ${characterData.name}!`, 'info');
            generateAndDisplayTask();
        }
        updateControlButtonsState();
    }, 4600);
});

function initializeDOMElements() {
    containerDiv = document.querySelector('.container');
    introOverlay = document.getElementById('introOverlay');
    setupScreen = document.getElementById('setupScreen');
    mainAppScreen = document.getElementById('mainAppScreen');
    messageDiv = document.getElementById('messageDiv');
    setupForm = document.getElementById('setupForm');
    nameInput = document.getElementById('nameInput'); ageInput = document.getElementById('ageInput'); statusInput = document.getElementById('statusInput'); weightInput = document.getElementById('weightInput'); heightInput = document.getElementById('heightInput');
    characterProfileButton = document.getElementById('characterProfileButton');
    dashboardButton = document.getElementById('dashboardButton');
    generateTaskButton = document.getElementById('generateTaskButton');
    resetProgressButton = document.getElementById('resetProgressButton');
    easterEggTrigger64 = document.getElementById('easterEggTrigger64');
    taskDisplayDiv = document.getElementById('taskDisplayDiv');
    characterProfileModal = document.getElementById('characterProfileModal'); profileContent = document.getElementById('profileContent');
    dashboardModal = document.getElementById('dashboardModal'); dashboardContent = document.getElementById('dashboardContent');
    timerCompleteModal = document.getElementById('timerCompleteModal');
    resetConfirmationModal = document.getElementById('resetConfirmationModal'); resetConfirmationMessageDiv = document.getElementById('resetConfirmationMessageDiv'); resetConfirmYesButton = document.getElementById('resetConfirmYesButton'); resetConfirmNoButton = document.getElementById('resetConfirmNoButton');
    emergencyQuestModal = document.getElementById('emergencyQuestModal'); emergencyQuestTimerDiv = document.getElementById('emergencyQuestTimer');
    cheatModal = document.getElementById('cheatModal'); cheatMessageText = document.getElementById('cheatMessageText'); cheatSorryButton = document.getElementById('cheatSorryButton');
    modalCloseButtons = document.querySelectorAll('.modal-close-button');

    // Simple Theme Toggle Modal Elements
    simpleThemeToggleModal = document.getElementById('simpleThemeToggleModal');
    simpleThemeToggleText = document.getElementById('simpleThemeToggleText');
    simpleThemeToggleYesButton = document.getElementById('simpleThemeToggleYesButton');
    simpleThemeToggleNoButton = document.getElementById('simpleThemeToggleNoButton');


    supportCreatorButton = document.getElementById('supportCreatorButton');
    supportPromptModal = document.getElementById('supportPromptModal');
    supportPromptYes = document.getElementById('supportPromptYes');
    supportPromptNo = document.getElementById('supportPromptNo');
    supportRedirectConfirmModal = document.getElementById('supportRedirectConfirmModal');
    supportRedirectConfirmYes = document.getElementById('supportRedirectConfirmYes');
    supportRedirectConfirmNo = document.getElementById('supportRedirectConfirmNo');
    supportNoInternetModal = document.getElementById('supportNoInternetModal');
    supportNoInternetOk = document.getElementById('supportNoInternetOk');

    superSecretThemesModal = document.getElementById('superSecretThemesModal');
    superSecretThemeOptionsView = document.getElementById('superSecretThemeOptionsView');
    superSecretConfirmationView = document.getElementById('superSecretConfirmationView');
    superSecretConfirmationText = document.getElementById('superSecretConfirmationText');
    superSecretConfirmYesButton = document.getElementById('superSecretConfirmYesButton');
    superSecretConfirmNoButton = document.getElementById('superSecretConfirmNoButton');


    const buttonsWithSound = [
        setupForm?.querySelector('button'), characterProfileButton, dashboardButton,
        generateTaskButton, resetProgressButton, resetConfirmYesButton, resetConfirmNoButton,
        cheatSorryButton,
        simpleThemeToggleYesButton, simpleThemeToggleNoButton, // Added for new modal
        supportCreatorButton, // Make sure this is included
        supportPromptYes, supportPromptNo, supportRedirectConfirmYes, supportRedirectConfirmNo, supportNoInternetOk,
        superSecretConfirmYesButton, superSecretConfirmNoButton,
        ...document.querySelectorAll('#timerCompleteModal .scenario-actions button'),
        ...document.querySelectorAll('#superSecretThemesModal .theme-options-grid button'),
        ...modalCloseButtons
    ];
    buttonsWithSound.forEach(btn => {
        if (btn) btn.addEventListener('click', playButtonClickSound);
        else console.warn("A button targeted for sound was not found in DOM.");
    });

    if (setupForm) setupForm.addEventListener('submit', handleSetupSubmit);
    if (characterProfileButton) characterProfileButton.addEventListener('click', displayCharacterProfile);
    if (dashboardButton) dashboardButton.addEventListener('click', displayDashboard);

    if (easterEggTrigger64) {
        easterEggTrigger64.addEventListener('click', handle64Click); // For single click
        easterEggTrigger64.addEventListener('mousedown', handle64PressStart);
        easterEggTrigger64.addEventListener('mouseup', handle64PressEnd);
        easterEggTrigger64.addEventListener('mouseleave', handle64PressEnd);
        easterEggTrigger64.addEventListener('touchstart', handle64PressStart, { passive: false }); // passive: false to allow preventDefault
        easterEggTrigger64.addEventListener('touchend', handle64PressEnd);
        easterEggTrigger64.addEventListener('touchcancel', handle64PressEnd);
    }


    if (generateTaskButton) generateTaskButton.addEventListener('click', () => {
        if (emergencyCooldownActive) { displaySystemMessage("System Lockout: Cooldown in progress.", 'error', true); playErrorSound(); return; }
        if (!taskInProgress) generateAndDisplayTask();
        else { displaySystemMessage("Please resolve the current task first.", 'error', true); playErrorSound(); }
    });
    if (resetProgressButton) resetProgressButton.addEventListener('click', startResetProcess);
    if (taskDisplayDiv) taskDisplayDiv.addEventListener('click', handleTaskAction);

    modalCloseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modalToCloseId = button.getAttribute('data-modal-close');
            if (!modalToCloseId) return;
            const modalToClose = document.getElementById(modalToCloseId);
            if (modalToClose) {
                if (modalToClose.id === 'emergencyQuestModal' || modalToClose.id === 'cheatModal') return;
                modalToClose.classList.add('hidden');
                if (modalToCloseId === 'simpleThemeToggleModal') { /* No specific reset needed */ }
                if (modalToCloseId === 'superSecretThemesModal') resetSuperSecretModal();
            }
        });
    });
    [characterProfileModal, dashboardModal, timerCompleteModal, resetConfirmationModal,
        emergencyQuestModal, cheatModal, simpleThemeToggleModal, superSecretThemesModal,
        supportPromptModal, supportRedirectConfirmModal, supportNoInternetModal
    ].forEach(modal => {
        if (modal) modal.addEventListener('click', function (e) {
            if (e.target === this) {
                playButtonClickSound();
                if (this.id === 'emergencyQuestModal' || this.id === 'cheatModal') return;
                if (this.id === 'supportPromptModal' || this.id === 'supportRedirectConfirmModal') return;
                if (this.id === 'supportNoInternetModal') { this.classList.add('hidden'); return; }


                if (this.id === 'resetConfirmationModal') cancelResetProcess();
                else if (this.id === 'timerCompleteModal' && currentTimerModalCleanup) currentTimerModalCleanup(true);
                else if (this.id === 'simpleThemeToggleModal') { this.classList.add('hidden'); }
                else if (this.id === 'superSecretThemesModal') {
                    this.classList.add('hidden');
                    resetSuperSecretModal();
                }
                else this.classList.add('hidden');
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            let modalToEscape = null;
            if (emergencyQuestModal && !emergencyQuestModal.classList.contains('hidden')) modalToEscape = emergencyQuestModal;
            else if (cheatModal && !cheatModal.classList.contains('hidden')) modalToEscape = cheatModal;
            else if (supportPromptModal && !supportPromptModal.classList.contains('hidden')) modalToEscape = supportPromptModal;
            else if (supportRedirectConfirmModal && !supportRedirectConfirmModal.classList.contains('hidden')) modalToEscape = supportRedirectConfirmModal;

            if (modalToEscape && (modalToEscape.id === 'emergencyQuestModal' || modalToEscape.id === 'cheatModal' || modalToEscape.id === 'supportPromptModal' || modalToEscape.id === 'supportRedirectConfirmModal')) return;


            let modalClosed = false;
            if (supportNoInternetModal && !supportNoInternetModal.classList.contains('hidden')) {
                supportNoInternetModal.classList.add('hidden'); modalClosed = true;
            }
            if (simpleThemeToggleModal && !simpleThemeToggleModal.classList.contains('hidden')) {
                simpleThemeToggleModal.classList.add('hidden'); modalClosed = true;
            }
            if (superSecretThemesModal && !superSecretThemesModal.classList.contains('hidden')) {
                superSecretThemesModal.classList.add('hidden'); resetSuperSecretModal(); modalClosed = true;
            }
            if (characterProfileModal && !characterProfileModal.classList.contains('hidden')) { characterProfileModal.classList.add('hidden'); modalClosed = true; }
            if (dashboardModal && !dashboardModal.classList.contains('hidden')) { dashboardModal.classList.add('hidden'); modalClosed = true; }
            if (resetConfirmationModal && !resetConfirmationModal.classList.contains('hidden')) { cancelResetProcess(); modalClosed = true; }
            if (timerCompleteModal && !timerCompleteModal.classList.contains('hidden') && currentTimerModalCleanup) { currentTimerModalCleanup(true); modalClosed = true; }

            if (modalClosed) playButtonClickSound();
        }
    });
    if (resetConfirmYesButton) resetConfirmYesButton.addEventListener('click', handleResetConfirmationYes);
    if (resetConfirmNoButton) resetConfirmNoButton.addEventListener('click', handleResetConfirmationNo);
    if (cheatSorryButton) cheatSorryButton.addEventListener('click', handleCheatSorry);

    // Simple Theme Toggle Modal Listeners
    if (simpleThemeToggleYesButton) simpleThemeToggleYesButton.addEventListener('click', () => {
        const newTheme = currentTheme === 'cyberpunk' ? 'minimalist' : 'cyberpunk';
        applyTheme(newTheme);
        displaySystemMessage(`Switched to ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} theme!`, 'info', true);
        if (simpleThemeToggleModal) simpleThemeToggleModal.classList.add('hidden');
    });
    if (simpleThemeToggleNoButton) simpleThemeToggleNoButton.addEventListener('click', () => {
        if (simpleThemeToggleModal) simpleThemeToggleModal.classList.add('hidden');
    });


    if (superSecretThemesModal) {
        document.querySelectorAll('#superSecretThemesModal .theme-options-grid button').forEach(button => {
            button.addEventListener('click', (event) => {
                pendingSuperSecretTheme = event.target.dataset.themeName;
                const themeNameDisplay = pendingSuperSecretTheme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                if (superSecretConfirmationText) superSecretConfirmationText.textContent = `Do you want to change to ${themeNameDisplay} theme?`;
                if (superSecretThemeOptionsView) superSecretThemeOptionsView.classList.add('hidden');
                if (superSecretConfirmationView) superSecretConfirmationView.classList.remove('hidden');
            });
        });
    }
    if (superSecretConfirmYesButton) superSecretConfirmYesButton.addEventListener('click', () => {
        if (pendingSuperSecretTheme) {
            applyTheme(pendingSuperSecretTheme);
            const themeNameDisplay = pendingSuperSecretTheme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            displaySystemMessage(`Theme changed to ${themeNameDisplay}.`, 'success', true);
        }
        if (superSecretThemesModal) superSecretThemesModal.classList.add('hidden');
        resetSuperSecretModal();
    });
    if (superSecretConfirmNoButton) superSecretConfirmNoButton.addEventListener('click', () => {
        if (superSecretThemesModal) superSecretThemesModal.classList.add('hidden');
        resetSuperSecretModal();
        displaySystemMessage("Theme change cancelled.", 'info', true);
    });

    // Corrected Support Creator Button Listener
    if (supportCreatorButton) supportCreatorButton.addEventListener('click', () => {
        if (supportPromptModal) supportPromptModal.classList.remove('hidden');
    });
    if (supportPromptYes) supportPromptYes.addEventListener('click', () => {
        if (supportPromptModal) supportPromptModal.classList.add('hidden');
        if (supportRedirectConfirmModal) supportRedirectConfirmModal.classList.remove('hidden');
    });
    if (supportPromptNo) supportPromptNo.addEventListener('click', () => {
        if (supportPromptModal) supportPromptModal.classList.add('hidden');
    });
    if (supportRedirectConfirmYes) supportRedirectConfirmYes.addEventListener('click', () => {
        if (supportRedirectConfirmModal) supportRedirectConfirmModal.classList.add('hidden');
        if (navigator.onLine) {
            window.open('https://yiguyfguygtyig.my.canva.site/support-system-64', '_blank');
        } else {
            if (supportNoInternetModal) supportNoInternetModal.classList.remove('hidden');
        }
    });
    if (supportRedirectConfirmNo) supportRedirectConfirmNo.addEventListener('click', () => {
        if (supportRedirectConfirmModal) supportRedirectConfirmModal.classList.add('hidden');
    });
    if (supportNoInternetOk) supportNoInternetOk.addEventListener('click', () => {
        if (supportNoInternetModal) supportNoInternetModal.classList.add('hidden');
    });
}

function initializeCharacterData(name, age, status, weight, height) {
    characterData = {
        name, age: parseInt(age), status, weight: parseFloat(weight), height: parseFloat(height),
        level: 1, xp: 0, uniqueSkill: "None", skills: {}
    };
    for (const skillName in SKILLS_CONFIG) characterData.skills[skillName] = 1;
    scenarioCounter = 0; cheatAttempts = 0;
    saveCharacterData();
}
function saveCharacterData() {
    localStorage.setItem('rlLevelingCharV3', JSON.stringify(characterData));
    localStorage.setItem('rlLevelingScenarioV3', scenarioCounter.toString());
    localStorage.setItem('rlLevelingCheatAttemptsV3', cheatAttempts.toString());
}
function loadCharacterData() {
    const savedChar = localStorage.getItem('rlLevelingCharV3');
    if (savedChar) {
        characterData = JSON.parse(savedChar);
        if (!characterData.skills) characterData.skills = {};
        for (const skillName in SKILLS_CONFIG) {
            if (!(skillName in characterData.skills)) characterData.skills[skillName] = 1;
        }
    } else {
        characterData = { name: null, skills: {} };
        for (const skillName in SKILLS_CONFIG) characterData.skills[skillName] = 1;
    }
    scenarioCounter = parseInt(localStorage.getItem('rlLevelingScenarioV3')) || 0;
    cheatAttempts = parseInt(localStorage.getItem('rlLevelingCheatAttemptsV3')) || 0;
}

function showSetupScreen() {
    if (setupScreen) setupScreen.classList.remove('hidden');
    if (mainAppScreen) mainAppScreen.classList.add('hidden');
    if (messageDiv) messageDiv.textContent = "Welcome! Please create your character.";
    if (currentTheme === 'text-terminal' && messageDiv) messageDiv.classList.add('blinking-cursor');
}
function hideSetupScreen() {
    if (setupScreen) setupScreen.classList.add('hidden');
    if (mainAppScreen) mainAppScreen.classList.remove('hidden');
}
function initializeMainUI() { if (mainAppScreen) mainAppScreen.classList.remove('hidden'); }

function displaySystemMessage(msg, type = 'info', temporary = false, duration = 3500) {
    if (!messageDiv) return;
    messageDiv.textContent = msg; messageDiv.className = 'message'; messageDiv.classList.add(type);
    if (currentTheme === 'text-terminal') messageDiv.classList.add('blinking-cursor'); else messageDiv.classList.remove('blinking-cursor');
    if (temporary) setTimeout(() => { if (messageDiv.textContent === msg) { messageDiv.textContent = 'Awaiting task...'; messageDiv.className = 'message'; if (currentTheme === 'text-terminal') messageDiv.classList.add('blinking-cursor'); } }, duration);
}

function updateControlButtonsState() {
    const buttonsDisabled = taskInProgress || emergencyCooldownActive;
    if (generateTaskButton) generateTaskButton.disabled = buttonsDisabled;
    if (resetProgressButton) resetProgressButton.disabled = (taskInProgress && currentTask && currentTask.timerRunning) || emergencyCooldownActive;
    if (characterProfileButton) characterProfileButton.disabled = emergencyCooldownActive;
    if (dashboardButton) dashboardButton.disabled = emergencyCooldownActive;
    if (easterEggTrigger64) easterEggTrigger64.style.pointerEvents = emergencyCooldownActive ? 'none' : 'auto';
    if (supportCreatorButton) supportCreatorButton.disabled = emergencyCooldownActive;
}

function handleSetupSubmit(event) {
    event.preventDefault();
    if (emergencyCooldownActive) { displaySystemMessage("System Lockout: Profile creation unavailable.", 'error', true); playErrorSound(); return; }
    const V = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const N = (id) => { const el = document.getElementById(id); return el ? parseFloat(el.value) : NaN; };
    let errors = [];
    if (!V('nameInput')) errors.push("Name missing."); if (isNaN(N('ageInput')) || N('ageInput') < 1) errors.push("Valid age missing.");
    if (!V('statusInput')) errors.push("Status missing."); if (isNaN(N('weightInput')) || N('weightInput') < 1) errors.push("Valid weight missing.");
    if (isNaN(N('heightInput')) || N('heightInput') < 1) errors.push("Valid height missing.");
    if (errors.length > 0) { displaySystemMessage("Error: " + errors.join(" "), 'error', true, 4000); playErrorSound(); return; }
    initializeCharacterData(V('nameInput'), N('ageInput'), V('statusInput'), N('weightInput'), N('heightInput'));
    hideSetupScreen(); initializeMainUI(); displaySystemMessage("Character created! Welcome, " + characterData.name + ".", 'success', true); playSuccessSound(); generateAndDisplayTask();
}

function getLevelName(level) {
    for (const tier of LEVEL_TIERS) if (level <= tier.maxLevel) return tier.name;
    return "⚔️ ???";
}
function createModalContentElement(tag, textOrHtml, parent, className = '') {
    const el = document.createElement(tag); el.innerHTML = textOrHtml;
    if (className) el.className = className; if (parent) parent.appendChild(el); return el;
}
function displayCharacterProfile() {
    if (emergencyCooldownActive) { displaySystemMessage("System Lockout: Profile access restricted.", 'error', true); playErrorSound(); return; }
    if (!profileContent) return;
    profileContent.innerHTML = '';
    createModalContentElement('p', `<strong>Name:</strong> ${characterData.name}`, profileContent);
    createModalContentElement('p', `<strong>Age:</strong> ${characterData.age}`, profileContent);
    createModalContentElement('p', `<strong>Status:</strong> ${characterData.status}`, profileContent);
    createModalContentElement('p', `<strong>Weight/Height:</strong> ${characterData.weight}kg / ${characterData.height}cm`, profileContent);
    createModalContentElement('p', `<strong>Level:</strong> ${characterData.level} (${getLevelName(characterData.level)}) [XP: ${characterData.xp}%]`, profileContent);
    createModalContentElement('h4', 'Skills:', profileContent);
    const skillsHtml = Object.entries(characterData.skills).map(([s, l]) => `<li>${s.replace(/([A-Z])/g, ' $1').trim()}: Lvl ${l}</li>`).join('');
    createModalContentElement('ul', skillsHtml, profileContent);
    createModalContentElement('p', `<strong>Unique Skill:</strong> ${characterData.uniqueSkill}`, profileContent);
    if (characterProfileModal) characterProfileModal.classList.remove('hidden');
}

function displayDashboard() {
    if (emergencyCooldownActive) { displaySystemMessage("System Lockout: Dashboard access restricted.", 'error', true); playErrorSound(); return; }
    if (!characterData || !characterData.name) {
        displaySystemMessage("Create a character first to view the dashboard.", 'info', true);
        return;
    }
    if (!dashboardContent) return;
    dashboardContent.innerHTML = '';

    createModalContentElement('p', `<strong>Operator:</strong> ${characterData.name}`, dashboardContent);
    createModalContentElement('p', `<strong>Rank:</strong> ${characterData.level} (${getLevelName(characterData.level)})`, dashboardContent);
    createModalContentElement('p', `<strong>Experience Protocol:</strong> ${characterData.xp}% / ${XP_PER_LEVEL}XP`, dashboardContent);
    createModalContentElement('p', `<strong>Unique Signature:</strong> ${characterData.uniqueSkill}`, dashboardContent);

    createModalContentElement('hr', '', dashboardContent, 'margin-top:15px; margin-bottom:15px;');

    const domains = {};
    for (const skill in SKILLS_CONFIG) {
        const domain = SKILLS_CONFIG[skill].domain;
        if (!domains[domain]) domains[domain] = [];
        domains[domain].push(skill);
    }

    for (const domainName in domains) {
        const domainGroup = createModalContentElement('div', '', dashboardContent, 'skill-domain-group');
        createModalContentElement('h5', `${domainName} Aptitudes`, domainGroup);
        const skillsContainer = createModalContentElement('div', '', domainGroup, 'skills-container-grid');

        domains[domainName].forEach(skillName => {
            const skillBox = createModalContentElement('div', '', skillsContainer, 'skill-entry-box');
            const formattedSkillName = skillName.replace(/([A-Z])/g, ' $1').trim();
            createModalContentElement('p', `<strong>${formattedSkillName}</strong>`, skillBox);
            createModalContentElement('p', `Level: ${characterData.skills[skillName] || 1}`, skillBox);
        });
    }
    if (dashboardModal) dashboardModal.classList.remove('hidden');
}


function addXP(amount) {
    characterData.xp += Math.floor(amount); displaySystemMessage(`+${Math.floor(amount)} XP!`, 'success', true, 2000);
    checkForLevelUp(); saveCharacterData();
}
function loseXP(amount) {
    characterData.xp = Math.max(0, characterData.xp - Math.floor(amount));
    displaySystemMessage(`-${Math.floor(amount)} XP.`, 'error', true, 2000); saveCharacterData();
}
function checkForLevelUp() {
    let leveledUp = false;
    while (characterData.xp >= XP_PER_LEVEL) {
        characterData.level++; characterData.xp -= XP_PER_LEVEL; leveledUp = true;
        displaySystemMessage(`Level Up! Reached Rank: ${getLevelName(characterData.level)}`, 'success', false);
        playSuccessSound();
        if (characterData.level === 20 && characterData.uniqueSkill === "None") generateUniqueSkill();
    }
    if (leveledUp) saveCharacterData();
}
function increaseSkillLevel(skillName) {
    if (characterData.skills[skillName] === undefined) characterData.skills[skillName] = 0;
    characterData.skills[skillName]++;
    displaySystemMessage(`${skillName.replace(/([A-Z])/g, ' $1').trim()} improved to Level ${characterData.skills[skillName]}.`, 'success', true, 3000);
    checkForOverallLevelJumpFromSkill(skillName); saveCharacterData();
}
function checkForOverallLevelJumpFromSkill(skillName) {
    if (characterData.skills[skillName] > 0 && characterData.skills[skillName] % 5 === 0) {
        characterData.level++; characterData.xp = 0;
        displaySystemMessage(`Skill Milestone! Overall Rank Upgraded to: ${getLevelName(characterData.level)}`, 'success', false);
        playSuccessSound();
        if (characterData.level === 20 && characterData.uniqueSkill === "None") generateUniqueSkill();
        saveCharacterData();
    }
}
function generateUniqueSkill() {
    if (!characterData || characterData.level < 20 || characterData.uniqueSkill !== "None") return;
    let highestLvl = 0, highestSkills = [];
    for (const s in characterData.skills) {
        if (characterData.skills[s] > highestLvl) { highestLvl = characterData.skills[s]; highestSkills = [s]; }
        else if (characterData.skills[s] === highestLvl) highestSkills.push(s);
    }
    if (highestLvl === 0) characterData.uniqueSkill = "Latent Potential";
    else if (highestSkills.length >= 3 && highestLvl >= (characterData.level / 2)) characterData.uniqueSkill = "Polymath";
    else if (highestSkills.some(s => ["Strength", "Endurance", "Agility"].includes(s))) characterData.uniqueSkill = "Peak Physique";
    else if (highestSkills.some(s => ["Focus", "Learning", "ProblemSolving", "Creativity"].includes(s))) characterData.uniqueSkill = "Sharp Mind";
    else if (highestSkills.some(s => ["FinancialLiteracy", "Budgeting", "Investing"].includes(s))) characterData.uniqueSkill = "Wealth Weaver";
    else if (highestSkills.some(s => ["Discipline", "SelfAwareness", "GoalSetting", "Mindfulness"].includes(s))) characterData.uniqueSkill = "Stoic Heart";
    else if (highestSkills.some(s => ["Community", "Relationship"].includes(s))) characterData.uniqueSkill = "Social Butterfly";
    else characterData.uniqueSkill = "Prodigy of " + highestSkills[0].replace(/([A-Z])/g, ' $1').trim();
    displaySystemMessage(`Unique Skill Unlocked: ${characterData.uniqueSkill}!`, 'success', true, 5000); playSuccessSound(); saveCharacterData();
}

const randomFromArray = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function generateTask() {
    const diffCode = DIFFICULTY_CODES_MAP[characterData.level] || "D";
    let T_CANDIDATES = TASK_TEMPLATES.filter(t => t.difficultyCode === diffCode);
    if (T_CANDIDATES.length === 0) T_CANDIDATES = TASK_TEMPLATES.filter(t => t.difficultyCode === "C");
    if (T_CANDIDATES.length === 0) T_CANDIDATES = TASK_TEMPLATES.filter(t => t.difficultyCode === "B");
    if (T_CANDIDATES.length === 0) T_CANDIDATES = [...TASK_TEMPLATES];
    if (T_CANDIDATES.length === 0) { displaySystemMessage("No tasks available!", 'error', false); if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style="text-align:center; color: var(--color-error);">Task Database Empty.</p>'; playErrorSound(); return null; }

    const T = randomFromArray(T_CANDIDATES);
    let desc = T.descriptionTemplate;
    let taskSpecificTimeLimit = T.timeLimitMinutes;
    const currentTaskVars = {};

    if (T.variables) {
        for (const k in T.variables) {
            const cfg = T.variables[k];
            let baseValue, displayValue;

            if (k === "BOOK_TITLE") {
                baseValue = displayValue = randomFromArray(BOOK_LIST_SAMPLE);
            } else if (typeof cfg === 'string' && cfg.endsWith("_X_ITEMS")) {
                const itemsArray = window[cfg];
                if (itemsArray && Array.isArray(itemsArray)) {
                    baseValue = displayValue = randomFromArray(itemsArray);
                } else {
                    console.warn(`Item source array "${cfg}" not found or not an array for task ${T.id}. Defaulting.`);
                    baseValue = displayValue = `[Data for ${cfg.replace('_X_ITEMS', '')} N/A]`;
                }
            } else if (typeof cfg === 'object' && cfg.min !== undefined) {
                baseValue = randomInt(cfg.min, cfg.max); displayValue = baseValue;
                if (cfg.levelScaleFactor) {
                    let scaledVal = baseValue + (characterData.level * cfg.levelScaleFactor);
                    scaledVal = Math.max((T.durationVariable === k ? 1 : cfg.min), Math.round(scaledVal));
                    displayValue = scaledVal; baseValue = scaledVal;
                }
            } else {
                console.warn(`Unknown variable config for key "${k}" in task ${T.id}, config:`, cfg);
                baseValue = displayValue = `[VAR_ERR:${k}]`;
            }
            currentTaskVars[k] = displayValue;
            desc = desc.replace(new RegExp(`\\[${k.replace('_X_ITEMS', '_X')}\\]`, 'g'), `<strong>${displayValue}</strong>`);
            if (T.timeLimitMinutes === "DYNAMIC" && T.durationVariable === k) taskSpecificTimeLimit = baseValue;
        }
    }

    const xpScale = 0.1;
    const gain = T.baseXPGain + Math.floor(T.baseXPGain * characterData.level * xpScale);
    const penalty = T.baseXPFailurePenalty + Math.floor(T.baseXPFailurePenalty * characterData.level * xpScale);
    scenarioCounter++; saveCharacterData();

    return {
        id: T.id, scenarioNumber: scenarioCounter, description: desc, skill: T.skill,
        difficultyName: DIFFICULTY_FULL_NAMES[T.difficultyCode] || "Unknown",
        difficultyCode: T.difficultyCode,
        timeLimitMinutes: (typeof taskSpecificTimeLimit === 'number' && taskSpecificTimeLimit > 0) ? taskSpecificTimeLimit : null,
        xpGain: gain, failurePenalty: penalty, template: T, resolvedVariables: currentTaskVars
    };
}


function generateAndDisplayTask() {
    if (emergencyCooldownActive) {
        displaySystemMessage("System Lockout: New tasks unavailable.", 'error', true);
        if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style="text-align:center; color: var(--color-error); font-size: 1.2em;">SYSTEM LOCKOUT ACTIVE</p>';
        playErrorSound(); return;
    }
    if (taskInProgress) { displaySystemMessage("Resolve current task.", 'error', true); playErrorSound(); return; }
    clearTaskUI(); currentTask = generateTask();
    if (currentTask) {
        renderTaskBox(currentTask, 'initial');
        lastTaskGeneratedTime = Date.now();
    }
    else if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style-align:center;>Awaiting Task Assignment...</p>';
    updateControlButtonsState();
}
function clearTaskUI() {
    if (taskDisplayDiv) taskDisplayDiv.innerHTML = '';
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timeLeftInSeconds = 0;
}
function renderTaskBox(task, mode = 'initial') {
    if (!taskDisplayDiv) return;
    taskDisplayDiv.innerHTML = ''; const box = document.createElement('div'); box.className = 'scenario-box';
    const p = (h, c = '') => { const e = document.createElement('p'); e.innerHTML = h; if (c) e.className = c; box.appendChild(e); return e; };
    const btn = (txt, act, cls = '') => { const b = document.createElement('button'); b.textContent = txt; b.classList.add(`task-button-${act}`); if (cls) b.classList.add(cls); b.dataset.action = act; return b; };

    let title = `Scenario ${String(task.scenarioNumber).padStart(2, '0')}`;
    if (mode === 'accepted') title += ' (In Progress)'; if (mode === 'timerActive') title += ' (Timer Active)';
    p(title, 'scenario-number'); p(task.description, 'scenario-description');

    const actions = document.createElement('div'); actions.className = 'scenario-actions';
    if (mode === 'initial') {
        actions.appendChild(btn('Accept', 'accept')); actions.appendChild(btn('Decline', 'decline'));
        if (task.timeLimitMinutes) actions.appendChild(btn('Start Timed Task', 'start-timer'));
    } else if (mode === 'accepted') {
        if (task.timeLimitMinutes && !(currentTask && currentTask.timerRunning)) {
            p(`This task has a suggested time limit of ${task.timeLimitMinutes} minute(s). Press 'Start Timer' to begin countdown.`, 'scenario-details');
            actions.appendChild(btn('Start Timer', 'start-timer'));
        }
        actions.appendChild(btn('Completed', 'complete'));
        if (!(currentTask && currentTask.timerRunning)) actions.appendChild(btn('Failed', 'fail'));
    } else if (mode === 'timerActive') {
        const timerEl = p('', 'timer-display'); updateTimerDisplay(timerEl);
        p('Focus! Complete the task before the timer runs out.', 'scenario-details');
    }
    box.appendChild(actions);

    if (mode === 'initial') {
        p(`Difficulty: ${task.difficultyName} [${task.difficultyCode}]`, 'scenario-details');
        if (task.timeLimitMinutes) p(`Suggested Time: ${task.timeLimitMinutes}m`, 'scenario-details');
        p(`Fail: -${task.failurePenalty}XP`, 'scenario-details');
        p(`Win: +${task.xpGain}XP, +1 ${task.skill.replace(/([A-Z])/g, ' $1').trim()} Lvl`, 'scenario-details');
    }
    taskDisplayDiv.appendChild(box);
}
function handleTaskAction(event) {
    if (emergencyCooldownActive) { displaySystemMessage("System Lockout: Actions unavailable.", 'error', true); playErrorSound(); return; }
    const button = event.target.closest('button[data-action]'); if (!button || !currentTask) return;
    const action = button.dataset.action;
    switch (action) {
        case 'accept': handleTaskAccept(currentTask); break; case 'decline': handleTaskDecline(currentTask); break;
        case 'start-timer': handleTaskStartTimer(currentTask); break; case 'complete': handleTaskCompleted(currentTask); break;
        case 'fail': handleTaskFailed(currentTask, false); break;
    }
}
function handleTaskAccept(task) {
    if (taskInProgress && currentTask && currentTask.timerRunning) { displaySystemMessage("Timer active. Cannot re-accept.", 'error', true); playErrorSound(); return; }
    displaySystemMessage("Scenario Started.", 'info', true); taskInProgress = true; renderTaskBox(task, 'accepted'); updateControlButtonsState();
}
function handleTaskDecline(task) {
    if (taskInProgress) { displaySystemMessage("Cannot decline active task.", 'error', true); playErrorSound(); return; }
    displaySystemMessage("Scenario Cancelled.", 'info', true); clearTaskUI(); currentTask = null; taskInProgress = false; generateAndDisplayTask();
}

function handleTaskStartTimer(task) {
    if (!task.timeLimitMinutes || task.timeLimitMinutes <= 0) { displaySystemMessage("This task does not have a valid time limit.", 'error', true); playErrorSound(); return; }
    if (currentTask && currentTask.timerRunning) { displaySystemMessage("Timer already active.", 'error', true); playErrorSound(); return; }
    displaySystemMessage("Timed Scenario Started!", 'info', true);
    taskInProgress = true; if (currentTask) currentTask.timerRunning = true;
    timeLeftInSeconds = task.timeLimitMinutes * 60;
    renderTaskBox(task, 'timerActive');
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeftInSeconds--;
        const timerEl = taskDisplayDiv ? taskDisplayDiv.querySelector('.timer-display') : null;
        if (timerEl) updateTimerDisplay(timerEl);
        if (timeLeftInSeconds <= 0) {
            clearInterval(timerInterval); timerInterval = null;
            playTimerBeep(true);
            if (currentTask) {
                currentTask.timerRunning = false; displaySystemMessage("Time's up! Assess your completion.", 'info', false);
                showTimerCompleteModal();
            }
        } else if (timeLeftInSeconds <= 10 && timeLeftInSeconds > 0) { if (timeLeftInSeconds % 2 === 0) playTimerBeep(); }
    }, 1000);
    updateControlButtonsState();
}

function showTimerCompleteModal() {
    if (!currentTask || !timerCompleteModal) return;
    timerCompleteModal.classList.remove('hidden');
    const completedButton = document.getElementById('timerTaskCompletedButton');
    const unfinishedButton = document.getElementById('timerTaskUnfinishedButton');

    const handleChoice = (isCompleted) => {
        performCleanup();
        if (isCompleted) handleTaskCompleted(currentTask);
        else handleTaskFailed(currentTask, true);
    };

    const newCompletedButton = completedButton.cloneNode(true);
    completedButton.parentNode.replaceChild(newCompletedButton, completedButton);
    newCompletedButton.addEventListener('click', () => { playButtonClickSound(); handleChoice(true); });

    const newUnfinishedButton = unfinishedButton.cloneNode(true);
    unfinishedButton.parentNode.replaceChild(newUnfinishedButton, unfinishedButton);
    newUnfinishedButton.addEventListener('click', () => { playButtonClickSound(); handleChoice(false); });

    const performCleanup = (autoFail = false) => {
        if (timerCompleteModal) timerCompleteModal.classList.add('hidden');
        document.removeEventListener('keydown', handleDismissOnEscapeForTimerModal);
        currentTimerModalCleanup = null;
        if (autoFail && currentTask) {
            displaySystemMessage("Task marked as unfinished due to dismissal.", 'warning', true);
            handleTaskFailed(currentTask, true);
        }
    };
    const handleDismissOnEscapeForTimerModal = (event) => { if (event.key === 'Escape' && timerCompleteModal && !timerCompleteModal.classList.contains('hidden')) { playButtonClickSound(); performCleanup(true); } }
    currentTimerModalCleanup = performCleanup;
    document.addEventListener('keydown', handleDismissOnEscapeForTimerModal);
}

function updateTimerDisplay(el) {
    if (!el) return;
    if (currentTask && currentTask.timerRunning && timeLeftInSeconds > 0) {
        const m = Math.floor(timeLeftInSeconds / 60), s = timeLeftInSeconds % 60;
        el.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    } else if (timeLeftInSeconds <= 0 && taskDisplayDiv && taskDisplayDiv.querySelector('.timer-display')) {
        el.textContent = "00:00";
    }
}

function handleCheatDetection() {
    cheatAttempts++;
    saveCharacterData();
    playErrorSound();

    if (cheatAttempts >= MAX_CHEAT_ATTEMPTS) {
        performFullReset();
        displaySystemMessage("Cheaters get what they deserve. System reset.", 'error', false);
        return true;
    }

    cheaterTaskToRestore = JSON.parse(JSON.stringify(currentTask));

    if (cheatMessageText) cheatMessageText.textContent = randomFromArray(cheatMessages);
    if (cheatModal) cheatModal.classList.remove('hidden');
    return true;
}

function handleCheatSorry() {
    if (cheatModal) cheatModal.classList.add('hidden');
    if (cheaterTaskToRestore) {
        currentTask = cheaterTaskToRestore;
        let renderMode = 'initial';
        if (taskInProgress && currentTask.id === cheaterTaskToRestore.id) {
            renderMode = 'accepted';
        }
        renderTaskBox(currentTask, renderMode);
        displaySystemMessage("Task reloaded. Please complete it fairly.", 'warning', true);
    } else {
        generateAndDisplayTask();
    }
    cheaterTaskToRestore = null;
    updateControlButtonsState();
}

function handleTaskCompleted(taskToComplete) {
    if (!currentTask || currentTask.id !== taskToComplete.id) { displaySystemMessage("Task mismatch.", 'error', true); playErrorSound(); return; }

    if (lastTaskGeneratedTime && (Date.now() - lastTaskGeneratedTime < MIN_TASK_TIME_MS)) {
        if (handleCheatDetection()) {
            return;
        }
    }

    if (currentTask.timerRunning) { clearInterval(timerInterval); timerInterval = null; currentTask.timerRunning = false; }
    const desc = currentTask.description.replace(/<[^>]+>/g, '').substring(0, 30);
    displaySystemMessage(`"${desc}..." completed successfully!`, 'success', true, 4000); playSuccessSound();
    addXP(currentTask.xpGain); increaseSkillLevel(currentTask.skill);
    sessionTaskCompletions++; saveSessionState(); checkEmergencyCooldown();
    clearTaskUI(); currentTask = null; taskInProgress = false;
    if (!emergencyCooldownActive) generateAndDisplayTask();
    else updateControlButtonsState();
}

function handleTaskFailed(taskToFail, autoFailed = false) {
    if (!currentTask || currentTask.id !== taskToFail.id) { displaySystemMessage("Task mismatch.", 'error', true); playErrorSound(); return; }
    if (currentTask.timerRunning && !autoFailed) { clearInterval(timerInterval); timerInterval = null; currentTask.timerRunning = false; }
    const reason = autoFailed ? " (time expired or dismissed)" : "";
    const d = currentTask.description.replace(/<[^>]+>/g, '').substring(0, 30);
    displaySystemMessage(`"${d}..." failed${reason}.`, 'error', true, 4000); playErrorSound();
    loseXP(currentTask.failurePenalty); saveSessionState();
    clearTaskUI(); currentTask = null; taskInProgress = false;
    if (!emergencyCooldownActive) generateAndDisplayTask();
    else { checkEmergencyCooldown(); updateControlButtonsState(); }
}

function saveSessionState() {
    if (emergencyCooldownActive) localStorage.setItem('emergencyCooldownEndTimeV3', emergencyCooldownEndTime.toString());
    else localStorage.removeItem('emergencyCooldownEndTimeV3');
    localStorage.setItem('sessionTaskCompletionsV3', sessionTaskCompletions.toString());
}
function loadSessionState() {
    const storedEndTime = localStorage.getItem('emergencyCooldownEndTimeV3');
    if (storedEndTime) {
        emergencyCooldownEndTime = parseInt(storedEndTime, 10);
        if (Date.now() < emergencyCooldownEndTime) emergencyCooldownActive = true;
        else {
            emergencyCooldownActive = false; sessionTaskCompletions = 0;
            localStorage.removeItem('emergencyCooldownEndTimeV3');
            localStorage.removeItem('sessionTaskCompletionsV3');
        }
    } else emergencyCooldownActive = false;
    if (!emergencyCooldownActive || Date.now() >= emergencyCooldownEndTime) {
        sessionTaskCompletions = parseInt(localStorage.getItem('sessionTaskCompletionsV3'), 10) || 0;
        if (emergencyCooldownActive && Date.now() >= emergencyCooldownEndTime) {
            sessionTaskCompletions = 0; localStorage.setItem('sessionTaskCompletionsV3', '0');
        }
    } else sessionTaskCompletions = parseInt(localStorage.getItem('sessionTaskCompletionsV3'), 10) || 0;
}
function checkEmergencyCooldown() {
    if (emergencyCooldownActive) {
        const now = Date.now();
        if (now < emergencyCooldownEndTime) {
            showEmergencyQuestModal(emergencyCooldownEndTime - now);
            if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style="text-align:center; color: var(--color-error); font-size: 1.2em;">SYSTEM LOCKOUT ACTIVE</p>';
        } else hideEmergencyQuestModalAndEndCooldown();
    } else if (sessionTaskCompletions >= TASKS_BEFORE_COOLDOWN) {
        emergencyCooldownActive = true; emergencyCooldownEndTime = Date.now() + EMERGENCY_COOLDOWN_DURATION;
        saveSessionState(); showEmergencyQuestModal(EMERGENCY_COOLDOWN_DURATION);
        if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style="text-align:center; color: var(--color-error); font-size: 1.2em;">SYSTEM LOCKOUT INITIATED</p>';
        displaySystemMessage("Excessive system engagement! Emergency Cooldown initiated.", 'warning', false); playErrorSound();
    }
    updateControlButtonsState();
}
function showEmergencyQuestModal(durationMs) {
    if (emergencyQuestModal) emergencyQuestModal.classList.remove('hidden');
    updateControlButtonsState();
    let timeLeft = Math.ceil(durationMs / 1000);
    if (emergencyTimerIntervalId) clearInterval(emergencyTimerIntervalId);
    function updateDisplay() {
        if (timeLeft <= 0) { hideEmergencyQuestModalAndEndCooldown(); return; }
        const h = Math.floor(timeLeft / 3600), m = Math.floor((timeLeft % 3600) / 60), s = timeLeft % 60;
        if (emergencyQuestTimerDiv) emergencyQuestTimerDiv.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        timeLeft--;
    }
    updateDisplay(); emergencyTimerIntervalId = setInterval(updateDisplay, 1000);
}
function hideEmergencyQuestModalAndEndCooldown() {
    if (emergencyTimerIntervalId) clearInterval(emergencyTimerIntervalId); emergencyTimerIntervalId = null;
    if (emergencyQuestModal) emergencyQuestModal.classList.add('hidden');
    emergencyCooldownActive = false; sessionTaskCompletions = 0;
    localStorage.removeItem('emergencyCooldownEndTimeV3'); localStorage.setItem('sessionTaskCompletionsV3', '0');
    displaySystemMessage("Cooldown Finished. System returning to normal.", 'success', true, 5000); playSuccessSound();
    updateControlButtonsState(); generateAndDisplayTask();
}

function startResetProcess() {
    if (emergencyCooldownActive) { displaySystemMessage("System Lockout: Reset unavailable.", 'error', true); playErrorSound(); return; }
    if (taskInProgress && currentTask && currentTask.timerRunning) { displaySystemMessage("Cannot reset while a timed task is active.", "error", true); playErrorSound(); return; }
    resetConfirmationStep = 0;
    if (resetConfirmationMessageDiv) resetConfirmationMessageDiv.textContent = resetConfirmationMessages[resetConfirmationStep];
    if (resetConfirmationModal) resetConfirmationModal.classList.remove('hidden');
}
function handleResetConfirmationYes() {
    resetConfirmationStep++;
    if (resetConfirmationStep < resetConfirmationMessages.length) {
        if (resetConfirmationMessageDiv) resetConfirmationMessageDiv.textContent = resetConfirmationMessages[resetConfirmationStep];
        if (currentTheme === 'cyberpunk' || currentTheme === 'matrix' || currentTheme === 'text-terminal') playSound('triangle', 600 - resetConfirmationStep * 50, 0.1);
        else if (currentTheme === '8bit') playSound('square', 400 - resetConfirmationStep * 40, 0.1);
    } else {
        if (resetConfirmationModal) resetConfirmationModal.classList.add('hidden');
        performFullReset();
    }
}
function handleResetConfirmationNo() { cancelResetProcess(); }
function cancelResetProcess() {
    if (resetConfirmationModal) resetConfirmationModal.classList.add('hidden');
    resetConfirmationStep = 0;
    displaySystemMessage("Phew! Reset cancelled. Your progress is safe.", 'info', true, 4000);
}
function performFullReset() {
    localStorage.removeItem('rlLevelingCharV3'); localStorage.removeItem('rlLevelingScenarioV3');
    localStorage.removeItem('emergencyCooldownEndTimeV3'); localStorage.removeItem('sessionTaskCompletionsV3');
    localStorage.removeItem('rlLevelingCheatAttemptsV3');

    characterData = { name: null, skills: {} };
    for (const skillName in SKILLS_CONFIG) characterData.skills[skillName] = 1;
    scenarioCounter = 0; sessionTaskCompletions = 0; emergencyCooldownActive = false; emergencyCooldownEndTime = 0;
    cheatAttempts = 0; lastTaskGeneratedTime = 0; cheaterTaskToRestore = null;

    if (emergencyTimerIntervalId) clearInterval(emergencyTimerIntervalId);
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    currentTask = null; taskInProgress = false; timeLeftInSeconds = 0;
    clearTaskUI();
    if (messageDiv) { messageDiv.textContent = ''; messageDiv.className = 'message'; }
    [characterProfileModal, dashboardModal, timerCompleteModal, resetConfirmationModal, emergencyQuestModal, cheatModal,
        simpleThemeToggleModal, superSecretThemesModal, // Added new modals
        supportPromptModal, supportRedirectConfirmModal, supportNoInternetModal
    ].forEach(modal => { if (modal) modal.classList.add('hidden'); });
    showSetupScreen(); updateControlButtonsState();
    displaySystemMessage("SYSTEM RESET! All progress wiped. A fresh start awaits!", 'warning', false); playErrorSound();
    if (setupForm) setupForm.reset();
}

// --- "64" Click and Long Press Logic ---
function handle64Click(event) {
    if (isLongPressActive) { // If long press was activated, don't process as click
        isLongPressActive = false; // Reset flag
        return;
    }
    if (emergencyCooldownActive) return;
    playButtonClickSound();

    const targetTheme = currentTheme === 'cyberpunk' ? 'Minimalist' : 'Cyberpunk';
    if (simpleThemeToggleText) simpleThemeToggleText.textContent = `Switch to ${targetTheme} mode?`;
    if (simpleThemeToggleModal) simpleThemeToggleModal.classList.remove('hidden');
}

function handle64PressStart(event) {
    event.preventDefault();
    if (emergencyCooldownActive || longPressTimer) return;
    // No sound here, wait for actual activation or click
    isLongPressActive = false; // Reset flag at start of potential long press
    longPressTimer = setTimeout(() => {
        isLongPressActive = true; // Set flag indicating long press has occurred
        activateSuperSecretSystem();
    }, LONG_PRESS_DURATION);
}

function handle64PressEnd() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
    // isLongPressActive flag will determine if click handler should proceed or not
}


function activateSuperSecretSystem() {
    longPressTimer = null;
    if (emergencyCooldownActive) {
        displaySystemMessage("Super Secret System access denied during cooldown.", "error", true);
        playErrorSound();
        return;
    }
    displaySystemMessage("SUPER SECRET SYSTEM ACTIVATED!", "success", true, 2500);
    playSound('sawtooth', 80, 0.4, 0.03, 0.02, 0.35); // Deep activation sound
    setTimeout(() => playSound('sine', 1200, 0.2, 0.02, 0.05, 0.15), 150);


    setTimeout(() => {
        resetSuperSecretModal();
        if (superSecretThemesModal) superSecretThemesModal.classList.remove('hidden');
    }, 1500);
}

function resetSuperSecretModal() {
    pendingSuperSecretTheme = null;
    if (superSecretThemeOptionsView) superSecretThemeOptionsView.classList.remove('hidden');
    if (superSecretConfirmationView) superSecretConfirmationView.classList.add('hidden');
}

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js') // Make sure this path is correct
            .then(registration => {
                console.log('ServiceWorker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}