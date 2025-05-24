// --- THEME MANAGEMENT ---
let currentTheme = localStorage.getItem('rlLevelingThemeV3') || 'minimalist';
let bodyElement;
let themeFontLink;
const ALL_THEMES = ['minimalist', 'cyberpunk', 'matrix', '8bit', 'crt-glow', 'early-web', 'text-terminal'];

function applyTheme(theme) {
    const normalizedTheme = theme.toLowerCase();

    if (!bodyElement || !themeFontLink) {
        console.warn("applyTheme called before essential DOM elements (body, themeFontLink) were initialized.");
        return;
    }

    ALL_THEMES.forEach(t => bodyElement.classList.remove(`theme-${t}`));
    bodyElement.classList.add(`theme-${normalizedTheme}`);

    let fontUrl = '';
    let crtTextColorRgb = '76,175,80'; // Default green for CRT
    switch (normalizedTheme) {
        case 'cyberpunk': fontUrl = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap'; break;
        case 'matrix': fontUrl = 'https://fonts.googleapis.com/css2?family=VT323&display=swap'; break;
        case '8bit': fontUrl = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'; break;
        case 'crt-glow':
            fontUrl = 'https://fonts.googleapis.com/css2?family=Cutive+Mono&display=swap';
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
        if (normalizedTheme === 'text-terminal') {
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

    localStorage.setItem('rlLevelingThemeV3', normalizedTheme);
    currentTheme = normalizedTheme;
    playThemeActivationSound(normalizedTheme);
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
            const bufferSize = localAudioCtx.sampleRate * duration;
            const buffer = localAudioCtx.createBuffer(1, bufferSize, localAudioCtx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
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
            playSound('sine', 60, 0.8, 0.01, 0.3, 0.45);
            playSound(null, 0, 0.6, 0.003, 0.01, 0.55, true);
            setTimeout(() => playSound('sine', 15750, 0.15, 0.004, 0.02, 0.12), 70);
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
let skillRadarChartInstance = null; // For Chart.js instance

let consecutiveSkips = 0;
const MAX_CONSECUTIVE_SKIPS_BEFORE_WARNING = 25;
const MAX_CONSECUTIVE_SKIPS_BEFORE_PENALTY_ACTIVE = 35;
const SKIP_PENALTY_XP = 5;
let skipPenaltyActive = false;

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
let simpleThemeToggleModal, simpleThemeToggleText, simpleThemeToggleYesButton, simpleThemeToggleNoButton;
let dashboardModal; // dashboardContent is no longer a single div
let modalCloseButtons;
let skipWarningModal, skipWarningOkButton;

let supportCreatorButton, supportPromptModal, supportPromptYes, supportPromptNo;
let supportRedirectConfirmModal, supportRedirectConfirmYes, supportRedirectConfirmNo;
let supportNoInternetModal, supportNoInternetOk;

let superSecretThemesModal, superSecretThemeOptionsView, superSecretConfirmationView, superSecretConfirmationText, superSecretConfirmYesButton, superSecretConfirmNoButton;
let longPressTimer = null;
const LONG_PRESS_DURATION = 15000;
let isLongPressActive = false;
let pendingSuperSecretTheme = null;

// --- INTRO SEQUENCE ---
let introSequenceModal, introSequenceTitle, introSequenceBody, introSequenceActions;
const introSequenceState = {
    currentStep: 0,
    steps: [], // Will be populated in initIntroSequence
    isActive: false
};
// --- END INTRO SEQUENCE ---


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
        // 31 books
        "Meditations", "Sapiens", "Thinking, Fast and Slow", "The Power of Habit", "Man's Search for Meaning",
        "Atomic Habits", "Deep Work", "Grit", "Mindset", "How to Win Friends",
        "1984", "Brave New World", "The Art of War", "The Prince", "Cosmos",
        "The Selfish Gene", "Guns, Germs, and Steel", "A Short History of Nearly Everything",
        "Influence: The Psychology of Persuasion", "The 7 Habits of Highly Effective People",
        "To Kill a Mockingbird", "The Great Gatsby", "The Lord of the Rings", "Dune", "Foundation",
        "Fahrenheit 451", "The Hitchhiker's Guide to the Galaxy", "Surely You're Joking, Mr. Feynman!",
        "A Brief History of Time", "The Code Book", "Gödel, Escher, Bach",

        // Philosophy & Wisdom
        "The Republic", "Nicomachean Ethics", "Tao Te Ching", "Walden", "Thus Spoke Zarathustra",
        "The Bhagavad Gita", "Zen and the Art of Motorcycle Maintenance", "Letters from a Stoic", "Candide", "The Alchemist",
        // Psychology & Self-Improvement
        "Flow: The Psychology of Optimal Experience", "Emotional Intelligence", "The Gifts of Imperfection", "Daring Greatly",
        "Quiet: The Power of Introverts in a World That Can't Stop Talking", "The Body Keeps the Score", "Thinking in Bets",
        "Start with Why", "Range: Why Generalists Triumph in a Specialized World", "The Subtle Art of Not Giving a F*ck",
        "Ultralearning", "Nonviolent Communication", "The Happiness Hypothesis", "Attached: The New Science of Adult Attachment",
        "Crucial Conversations",
        // Science & Nature
        "On the Origin of Species", "Silent Spring", "The Double Helix", "The Emperor of All Maladies: A Biography of Cancer",
        "The Sixth Extinction: An Unnatural History", "Astrophysics for People in a Hurry", "The Immortal Life of Henrietta Lacks",
        "The Man Who Mistook His Wife for a Hat", "Why We Sleep", "Entangled Life",
        // History & Biography
        "The Diary of a Young Girl", "The Autobiography of Malcolm X", "Team of Rivals: The Political Genius of Abraham Lincoln",
        "Alexander Hamilton", "Unbroken: A World War II Story of Survival, Resilience, and Redemption", "SPQR: A History of Ancient Rome",
        "Genghis Khan and the Making of the Modern World", "The Gulag Archipelago", "A People's History of the United States", "The Warmth of Other Suns",
        // Business, Finance & Economics
        "The Intelligent Investor", "Rich Dad Poor Dad", "Freakonomics", "The Lean Startup", "Good to Great",
        "Zero to One", "Thinking Strategically", "The Black Swan: The Impact of the Highly Improbable", "Fooled by Randomness",
        "I Will Teach You to Be Rich", "The Millionaire Next Door", "Principles: Life and Work",
        // Classic Fiction & Literature
        "Pride and Prejudice", "Moby Dick", "War and Peace", "Anna Karenina", "The Brothers Karamazov",
        "Crime and Punishment", "Jane Eyre", "Wuthering Heights", "Great Expectations", "Don Quixote",
        "The Count of Monte Cristo", "Frankenstein", "Dracula", "One Hundred Years of Solitude", "Beloved",
        "The Catcher in the Rye", "Slaughterhouse-Five", "Things Fall Apart",
        // Modern Fiction & Thought-Provoking Narratives
        "The Handmaid's Tale", "Klara and the Sun", "The Road", "Life of Pi", "The Kite Runner",
        "Educated", "Where the Crawdads Sing", "Project Hail Mary", "Circe", "The Vanishing Half",
        // Creativity & Innovation
        "Steal Like an Artist", "Big Magic: Creative Living Beyond Fear", "Creativity, Inc.",
        "Originals: How Non-Conformists Move the World", "The War of Art",
        // Communication & Relationships
        "How to Talk So Kids Will Listen & Listen So Kids Will Talk", "The Five Love Languages",
        "Difficult Conversations", "Thanks for the Feedback",
        // Health & Well-being
        "The Omnivore's Dilemma", "How Not to Die", "Spark: The Revolutionary New Science of Exercise and the Brain",
        "Breath: The New Science of a Lost Art", "Grain Brain", "The Blue Zones"
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
        { // AGILITY
            skill: "Agility", prefix: "AGL", itemsArrayName: "AGILITY_X_ITEMS", baseXP: 8, diffStep: 2,
            timeVars: { A: { min: 5, max: 15, scale: 0.3 }, B: { min: 10, max: 25, scale: 0.5 }, C: { min: 20, max: 40, scale: 0.7 } },
            templates: [
                "Train your agility for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Practice agility drills for <strong>[DURATION_M]</strong> minutes involving <strong>[ITEM_X]</strong>.",
                "Improve footwork and coordination for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Complete <strong>[DURATION_M]</strong> minutes of agility-focused exercises with <strong>[ITEM_X]</strong>.",
                "Perform <strong>[SETS]</strong> sets of agility exercises using <strong>[ITEM_X]</strong> for approx. <strong>[DURATION_M]</strong> min total.",
                "Warm up agility muscles for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Work on reaction time and balance for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Utilize <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes in your agility practice.",
                "Challenge your agility with an activity involving <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Cool down after an agility session with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // STRENGTH
            skill: "Strength", prefix: "STR", itemsArrayName: "STRENGTH_X_ITEMS", baseXP: 10, diffStep: 2,
            timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 25, max: 45, scale: 0.8 } },
            templates: [
                "Engage in strength training for <strong>[DURATION_M]</strong> minutes involving <strong>[ITEM_X]</strong>.",
                "Complete strength sets for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Train your muscles for <strong>[DURATION_M]</strong> minutes with exercises using <strong>[ITEM_X]</strong>.",
                "Perform reps using <strong>[ITEM_X]</strong> for a <strong>[DURATION_M]</strong> minute strength workout.",
                "Warm up muscles for strength work for <strong>[DURATION_M]</strong> minutes, using <strong>[ITEM_X]</strong>.",
                "Incorporate <strong>[ITEM_X]</strong> into your strength training for <strong>[DURATION_M]</strong> minutes.",
                "Cool down after strength work involving <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Build muscular endurance using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Do strength circuits involving <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Focus on core strength for <strong>[DURATION_M]</strong> minutes with exercises using <strong>[ITEM_X]</strong>."
            ]
        },
        { // ENDURANCE
            skill: "Endurance", prefix: "END", itemsArrayName: "ENDURANCE_X_ITEMS", baseXP: 9, diffStep: 2,
            timeVars: { A: { min: 15, max: 25, scale: 0.5 }, B: { min: 20, max: 40, scale: 0.7 }, C: { min: 30, max: 60, scale: 0.9 } },
            templates: [
                "Perform endurance training for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Engage in a cardio activity for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Perform a cycling endurance activity for <strong>[DURATION_M]</strong> minutes, involving <strong>[ITEM_X]</strong>.",
                "Perform a swimming endurance activity for <strong>[DURATION_M]</strong> minutes at <strong>[ITEM_X]</strong>.",
                "Use <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes in an endurance workout.",
                "Warm up for an endurance session for <strong>[DURATION_M]</strong> minutes, using <strong>[ITEM_X]</strong>.",
                "Cool down after endurance training involving <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Perform endurance intervals for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Complete a steady-state endurance workout using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Challenge your stamina with an activity related to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // PROBLEMSOLVING
            skill: "ProblemSolving", prefix: "PRS", itemsArrayName: "PROBLEMSOLVING_X_ITEMS", baseXP: 12, diffStep: 3,
            timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 20, max: 40, scale: 0.8 } },
            templates: [
                "Work on <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes to solve problems.",
                "Practice problem-solving for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Engage with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes to sharpen your mind.",
                "Challenge yourself with a problem from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Complete <strong>[SETS]</strong> sets of problems from <strong>[ITEM_X]</strong> for approx. <strong>[DURATION_M]</strong> min total.",
                "Improve critical thinking by engaging with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Use <strong>[ITEM_X]</strong> to enhance focus and problem-solving for <strong>[DURATION_M]</strong> minutes.",
                "Attempt to solve <strong>[COUNT_X]</strong> problems from <strong>[ITEM_X]</strong> for approx. <strong>[DURATION_M]</strong> min total.",
                "Engage in strategic thinking with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Dedicate <strong>[DURATION_M]</strong> minutes to analyzing and solving aspects of <strong>[ITEM_X]</strong>."
            ]
        },
        { // LEARNING
            skill: "Learning", prefix: "LRN", itemsArrayName: "LEARNING_X_ITEMS", baseXP: 10, diffStep: 2,
            timeVars: { A: { min: 15, max: 25, scale: 0.5 }, B: { min: 20, max: 35, scale: 0.6 }, C: { min: 30, max: 50, scale: 0.7 } },
            templates: [
                "Learn from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Study <strong>[COUNT_X]</strong> sections using <strong>[ITEM_X]</strong> for approx. <strong>[DURATION_M]</strong> min total.",
                "Study educational content from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Review material from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Engage with learning material from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Dedicate <strong>[DURATION_M]</strong> minutes to active learning with <strong>[ITEM_X]</strong>.",
                "Practice skills learned from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Collaborate or discuss topics from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Follow a tutorial from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Review and consolidate knowledge from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // CREATIVITY
            skill: "Creativity", prefix: "CRT", itemsArrayName: "CREATIVITY_X_ITEMS", baseXP: 8, diffStep: 2,
            timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 25, max: 45, scale: 0.8 } },
            templates: [
                "Engage in a creative activity for <strong>[DURATION_M]</strong> minutes involving <strong>[ITEM_X]</strong>.",
                "Work on a creative piece for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Express your creativity for <strong>[DURATION_M]</strong> minutes through an activity related to <strong>[ITEM_X]</strong>.",
                "Practice or develop a creative skill related to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Engage in a crafting or making session for <strong>[DURATION_M]</strong> minutes, using <strong>[ITEM_X]</strong>.",
                "Create or capture something for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Perform or rehearse a creative piece for <strong>[DURATION_M]</strong> minutes involving <strong>[ITEM_X]</strong>.",
                "Develop a creative concept for <strong>[DURATION_M]</strong> minutes, using <strong>[ITEM_X]</strong>.",
                "Design or plan a creative project for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Brainstorm creative ideas for <strong>[DURATION_M]</strong> minutes, using <strong>[ITEM_X]</strong>."
            ]
        },
        { // FINANCIAL LITERACY
            skill: "FinancialLiteracy", prefix: "FNL", itemsArrayName: "FINLIT_X_ITEMS", baseXP: 10, diffStep: 3,
            timeVars: { A: { min: 10, max: 20, scale: 0.3 }, B: { min: 15, max: 25, scale: 0.5 }, C: { min: 20, max: 35, scale: 0.6 } },
            templates: [
                "Learn about finance for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Use <strong>[ITEM_X]</strong> to understand your finances for <strong>[DURATION_M]</strong> minutes.",
                "Engage with financial education material from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Study financial information from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Practice financial planning using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Learn about a financial topic via <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Explore financial tools like <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Study a financial learning activity from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Consult or review advice from <strong>[ITEM_X]</strong> regarding finances for <strong>[DURATION_M]</strong> minutes.",
                "Review your personal finances using insights from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // BUDGETING
            skill: "Budgeting", prefix: "BDG", itemsArrayName: "BUDGETING_X_ITEMS", baseXP: 9, diffStep: 2,
            timeVars: { A: { min: 5, max: 15, scale: 0.2 }, B: { min: 10, max: 20, scale: 0.4 }, C: { min: 15, max: 30, scale: 0.5 } },
            templates: [
                "Work on your budget for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Plan or review your budget using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Track or categorize your expenses for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Analyze your spending or financial data with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Set or review your savings goals using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Check your bills and payments for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Use <strong>[ITEM_X]</strong> to forecast expenses or income for <strong>[DURATION_M]</strong> minutes.",
                "Adjust your budget categories using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Organize your financial documents for <strong>[DURATION_M]</strong> minutes, with <strong>[ITEM_X]</strong>.",
                "Monitor your cash flow or budget with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // INVESTING
            skill: "Investing", prefix: "INV", itemsArrayName: "INVESTING_X_ITEMS", baseXP: 12, diffStep: 3,
            timeVars: { A: { min: 10, max: 20, scale: 0.4 }, B: { min: 15, max: 30, scale: 0.6 }, C: { min: 25, max: 45, scale: 0.8 } },
            templates: [
                "Research investments for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Track your portfolio for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Engage with investment education from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Practice investment strategies with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Read financial news from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Participate in an investment group involving <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Analyze investments or market trends using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Use simulators like <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes to practice investing.",
                "Consult or review information from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Review investment info using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // DISCIPLINE
            skill: "Discipline", prefix: "DIS", itemsArrayName: "DISCIPLINE_X_ITEMS", baseXP: 11, diffStep: 2,
            timeVars: { A: { min: 10, max: 20, scale: 0.3 }, B: { min: 15, max: 25, scale: 0.5 }, C: { min: 20, max: 40, scale: 0.7 } },
            templates: [
                "Practice discipline for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Track your habits or plan adherence for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Engage in a focused activity for <strong>[DURATION_M]</strong> minutes, supported by <strong>[ITEM_X]</strong>.",
                "Stick to an exercise plan for <strong>[DURATION_M]</strong> minutes, outlined by <strong>[ITEM_X]</strong>.",
                "Study or work to a schedule for <strong>[DURATION_M]</strong> minutes, managed by <strong>[ITEM_X]</strong>.",
                "Use a time-management tool like <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes to maintain focus.",
                "Follow your routine diligently, planned with <strong>[ITEM_X]</strong>, for <strong>[DURATION_M]</strong> minutes.",
                "Journal or reflect on your productivity for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Practice cognitive focus techniques with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Check in with your accountability system <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // COMMUNITY
            skill: "Community", prefix: "CMY", itemsArrayName: "COMMUNITY_X_ITEMS", baseXP: 7, diffStep: 2,
            timeVars: { A: { min: 20, max: 40, scale: 0.4 }, B: { min: 30, max: 60, scale: 0.6 }, C: { min: 45, max: 90, scale: 0.8 } },
            templates: [
                "Volunteer or contribute to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Help organize activities for <strong>[DURATION_M]</strong> minutes with <strong>[ITEM_X]</strong>.",
                "Attend a meeting or event for <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Actively participate in an initiative by <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Assist with fundraising for <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Support members of your community via <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Help improve a public space connected to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Provide assistance through <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Engage with community project <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Participate in youth activities via <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
        },
        { // RELATIONSHIP
            skill: "Relationship", prefix: "RLT", itemsArrayName: "RELATIONSHIP_X_ITEMS", baseXP: 6, diffStep: 1,
            timeVars: { A: { min: 10, max: 20, scale: 0.3 }, B: { min: 15, max: 30, scale: 0.4 }, C: { min: 20, max: 45, scale: 0.5 } },
            templates: [
                "Connect with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Have a meaningful conversation with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Catch up or spend quality time with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Plan or engage in a shared activity with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Share a meal or a moment with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Actively listen and offer support to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Offer help or support to <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Reconnect or strengthen your bond with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Engage in a social activity with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Show appreciation or offer help to <strong>[ITEM_X]</strong> in a <strong>[DURATION_M]</strong> minute interaction."
            ]
        },
        { // SELF AWARENESS
            skill: "SelfAwareness", prefix: "SLA", itemsArrayName: "SELFAWARENESS_X_ITEMS", baseXP: 9, diffStep: 2,
            timeVars: { A: { min: 5, max: 15, scale: 0.2 }, B: { min: 10, max: 20, scale: 0.4 }, C: { min: 15, max: 30, scale: 0.6 } },
            templates: [
                "Engage in self-reflection for <strong>[DURATION_M]</strong> minutes using <strong>[ITEM_X]</strong>.",
                "Practice mindfulness for <strong>[DURATION_M]</strong> minutes, with <strong>[ITEM_X]</strong>.",
                "Reflect on your thoughts for <strong>[DURATION_M]</strong> minutes, aided by <strong>[ITEM_X]</strong>.",
                "Engage with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes to gain insights.",
                "Participate in a self-awareness exercise with <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Use a self-help tool like <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Complete a self-assessment from <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes.",
                "Practice mindful breathing for <strong>[DURATION_M]</strong> minutes, with <strong>[ITEM_X]</strong>.",
                "Seek or reflect on feedback for <strong>[DURATION_M]</strong> minutes, using <strong>[ITEM_X]</strong>.",
                "Perform an emotional intelligence check-in using <strong>[ITEM_X]</strong> for <strong>[DURATION_M]</strong> minutes."
            ]
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
    applyTheme(currentTheme);
    populateConfigData();
    initializeDOMElements();
    initIntroSequence(); // Initialize intro sequence steps

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

            const introShown = localStorage.getItem('hasSeenIntro_v1') === 'true';
            if (!introShown) {
                startIntroSequence(); // This will show the intro modal
            } else {
                displaySystemMessage(`Welcome back, ${characterData.name}!`, 'info');
                generateAndDisplayTask();
            }
        }
        updateControlButtonsState();
    }, 4600);
});

function initializeDOMElements() {
    bodyElement = document.body;
    themeFontLink = document.getElementById('themeFontLink');
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
    dashboardModal = document.getElementById('dashboardModal');
    // dashboardContent is no longer a single div, elements will be targeted directly
    timerCompleteModal = document.getElementById('timerCompleteModal');
    resetConfirmationModal = document.getElementById('resetConfirmationModal'); resetConfirmationMessageDiv = document.getElementById('resetConfirmationMessageDiv'); resetConfirmYesButton = document.getElementById('resetConfirmYesButton'); resetConfirmNoButton = document.getElementById('resetConfirmNoButton');
    emergencyQuestModal = document.getElementById('emergencyQuestModal'); emergencyQuestTimerDiv = document.getElementById('emergencyQuestTimer');
    cheatModal = document.getElementById('cheatModal'); cheatMessageText = document.getElementById('cheatMessageText'); cheatSorryButton = document.getElementById('cheatSorryButton');
    modalCloseButtons = document.querySelectorAll('.modal-close-button');
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
    skipWarningModal = document.getElementById('skipWarningModal');
    skipWarningOkButton = document.getElementById('skipWarningOkButton');

    // Intro Sequence Modal Elements
    introSequenceModal = document.getElementById('introSequenceModal');
    introSequenceTitle = document.getElementById('introSequenceModalTitle');
    introSequenceBody = document.getElementById('introSequenceModalBody');
    introSequenceActions = document.getElementById('introSequenceModalActions');


    // Event listeners for dashboard toggle buttons
    const switchToAdvancedDashboardButton = document.getElementById('switchToAdvancedDashboardButton');
    const switchToNormalDashboardButton = document.getElementById('switchToNormalDashboardButton');

    if (switchToAdvancedDashboardButton) {
        switchToAdvancedDashboardButton.addEventListener('click', () => {
            playButtonClickSound();
            const normalView = document.getElementById('normalDashboardView');
            const advancedView = document.getElementById('advancedDashboardView');
            if (normalView) normalView.classList.add('hidden');
            if (advancedView) advancedView.classList.remove('hidden');
            renderRadarChart();
        });
    }

    if (switchToNormalDashboardButton) {
        switchToNormalDashboardButton.addEventListener('click', () => {
            playButtonClickSound();
            const normalView = document.getElementById('normalDashboardView');
            const advancedView = document.getElementById('advancedDashboardView');
            if (advancedView) advancedView.classList.add('hidden');
            if (normalView) normalView.classList.remove('hidden');
        });
    }

    const buttonsWithSound = [
        setupForm?.querySelector('button'), characterProfileButton, dashboardButton,
        generateTaskButton, resetProgressButton, resetConfirmYesButton, resetConfirmNoButton,
        cheatSorryButton, simpleThemeToggleYesButton, simpleThemeToggleNoButton,
        supportCreatorButton, supportPromptYes, supportPromptNo, supportRedirectConfirmYes, supportRedirectConfirmNo, supportNoInternetOk,
        superSecretConfirmYesButton, superSecretConfirmNoButton,
        skipWarningOkButton,
        switchToAdvancedDashboardButton,
        switchToNormalDashboardButton,
        ...document.querySelectorAll('#timerCompleteModal .modal-actions button'),
        ...document.querySelectorAll('#superSecretThemesModal .theme-options-grid button'),
        ...modalCloseButtons
    ].filter(Boolean);

    buttonsWithSound.forEach(btn => {
        if (btn) btn.addEventListener('click', playButtonClickSound);
    });

    if (setupForm) setupForm.addEventListener('submit', handleSetupSubmit);
    if (characterProfileButton) characterProfileButton.addEventListener('click', displayCharacterProfile);
    if (dashboardButton) dashboardButton.addEventListener('click', displayDashboard);

    if (easterEggTrigger64) {
        easterEggTrigger64.addEventListener('click', handle64Click);
        easterEggTrigger64.addEventListener('mousedown', handle64PressStart);
        easterEggTrigger64.addEventListener('mouseup', handle64PressEnd);
        easterEggTrigger64.addEventListener('mouseleave', handle64PressEnd);
        easterEggTrigger64.addEventListener('touchstart', handle64PressStart, { passive: false });
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
                if (modalToCloseId === 'simpleThemeToggleModal') { }
                if (modalToCloseId === 'superSecretThemesModal') resetSuperSecretModal();
            }
        });
    });

    [characterProfileModal, dashboardModal, timerCompleteModal, resetConfirmationModal,
        emergencyQuestModal, cheatModal, simpleThemeToggleModal, superSecretThemesModal,
        supportPromptModal, supportRedirectConfirmModal, supportNoInternetModal,
        skipWarningModal, introSequenceModal // Added intro modal
    ].forEach(modal => {
        if (modal) modal.addEventListener('click', function (e) {
            if (e.target === this) {
                playButtonClickSound();
                if (this.id === 'emergencyQuestModal' || this.id === 'cheatModal' ||
                    this.id === 'supportPromptModal' || this.id === 'supportRedirectConfirmModal' ||
                    this.id === 'introSequenceModal' /* Intro modal cannot be closed by clicking backdrop */) return;

                if (this.id === 'supportNoInternetModal' || this.id === 'skipWarningModal') {
                    this.classList.add('hidden'); return;
                }
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
            if (introSequenceState.isActive) return; // Do not allow escape from intro sequence

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
            else if (skipWarningModal && !skipWarningModal.classList.contains('hidden')) {
                skipWarningModal.classList.add('hidden'); modalClosed = true;
            }
            else if (simpleThemeToggleModal && !simpleThemeToggleModal.classList.contains('hidden')) {
                simpleThemeToggleModal.classList.add('hidden'); modalClosed = true;
            }
            else if (superSecretThemesModal && !superSecretThemesModal.classList.contains('hidden')) {
                superSecretThemesModal.classList.add('hidden'); resetSuperSecretModal(); modalClosed = true;
            }
            else if (characterProfileModal && !characterProfileModal.classList.contains('hidden')) { characterProfileModal.classList.add('hidden'); modalClosed = true; }
            else if (dashboardModal && !dashboardModal.classList.contains('hidden')) { dashboardModal.classList.add('hidden'); modalClosed = true; }
            else if (resetConfirmationModal && !resetConfirmationModal.classList.contains('hidden')) { cancelResetProcess(); modalClosed = true; }
            else if (timerCompleteModal && !timerCompleteModal.classList.contains('hidden') && currentTimerModalCleanup) { currentTimerModalCleanup(true); modalClosed = true; }

            if (modalClosed) playButtonClickSound();
        }
    });
    if (resetConfirmYesButton) resetConfirmYesButton.addEventListener('click', handleResetConfirmationYes);
    if (resetConfirmNoButton) resetConfirmNoButton.addEventListener('click', handleResetConfirmationNo);
    if (cheatSorryButton) cheatSorryButton.addEventListener('click', handleCheatSorry);

    if (skipWarningOkButton) {
        skipWarningOkButton.addEventListener('click', () => {
            if (skipWarningModal) skipWarningModal.classList.add('hidden');
            playButtonClickSound();
        });
    }

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

// --- INTRO SEQUENCE FUNCTIONS ---
function initIntroSequence() {
    introSequenceState.steps = [
        {
            title: "WELCOME TO SYSTEM 64",
            body: () => `
  <style>
    .dot-loader::before {
      display: inline-block;
      font-family: monospace;
      white-space: pre;
      content: '•--------';
      animation: dotMove 2s steps(8) infinite alternate;
    }

    @keyframes dotMove {
      0%   { content: '•--------'; }
      12.5%{ content: '-•-------'; }
      25%  { content: '--•------'; }
      37.5%{ content: '---•-----'; }
      50%  { content: '----•----'; }
      62.5%{ content: '-----•---'; }
      75%  { content: '------•--'; }
      87.5%{ content: '-------•-'; }
      100% { content: '--------•'; }
    }
  </style>

  <p><strong>Booting Up SYSTEM 64</strong> <span class="dot-loader"></span></p>
  <p>Hey <strong>${characterData.name || 'Operator'}</strong>! you are booting up the system. This system helps you build real-life skills like a game.</p>
`,
            buttonText: "OK",
            centered: false

        },
        {
            title: "Instructions - Part 1",
            body: () => `<p>You’ll get tasks (“Scenarios”) tied to skills like strength, learning, or budgeting. Each task shows XP, difficulty, and a timer if needed.</p>
                                 <p>Hit Accept to start</p>
                                 <p>Decline to skip</p>
                                 <p>Complete or Fail based on how it went</p>`,
            buttonText: "OK",
            centered: true
        },
        {
            title: "Instructions - Part 2",
            body: () => `<ul>
                                    <li>New Task gives you another challenge</li>
                                    <li>Reset Progress wipes everything (careful!)</li>
                                    <li><span class="red-text">Don't cheat, the system watches</span></li>
                                    <li>Take breaks when needed</li>
                                    <li>Tap or hold the "64" for theme surprises</li>
                                 </ul>`,
            buttonText: "OK",
            centered: true
        },
        {
            title: "System Online",
            body: () => `<p>Level up your real-life self. SYSTEM 64 is online.</p>`,
            buttonText: "Let's Go!",
            centered: false // Or true, for consistency
        }
    ];
}

function startIntroSequence() {
    if (!introSequenceModal || !characterData.name) return; // Ensure character exists
    introSequenceState.isActive = true;
    introSequenceState.currentStep = 0;
    renderIntroStep();
    introSequenceModal.classList.remove('hidden');
    updateControlButtonsState(); // Disable main controls during intro
}

function renderIntroStep() {
    if (!introSequenceModal || !introSequenceTitle || !introSequenceBody || !introSequenceActions) return;

    const stepConfig = introSequenceState.steps[introSequenceState.currentStep];
    if (!stepConfig) return; // Should not happen

    introSequenceTitle.textContent = stepConfig.title;
    introSequenceBody.innerHTML = stepConfig.body();

    const modalContent = introSequenceModal.querySelector('.modal-content');
    if (modalContent) {
        if (stepConfig.centered) {
            modalContent.classList.add('intro-centered-content');
        } else {
            modalContent.classList.remove('intro-centered-content');
        }
    }


    introSequenceActions.innerHTML = ''; // Clear previous buttons
    const actionButton = document.createElement('button');
    actionButton.textContent = stepConfig.buttonText;
    actionButton.classList.add('modal-button-confirm'); // Use existing class for styling
    if (stepConfig.centered) { // Ensure small-bottom-center look
        actionButton.classList.add('small-bottom-center');
    }
    actionButton.addEventListener('click', () => {
        playButtonClickSound();
        advanceIntroSequence();
    });
    introSequenceActions.appendChild(actionButton);
}

function advanceIntroSequence() {
    introSequenceState.currentStep++;
    if (introSequenceState.currentStep < introSequenceState.steps.length) {
        renderIntroStep();
    } else {
        // Sequence finished
        introSequenceModal.classList.add('hidden');
        localStorage.setItem('hasSeenIntro_v1', 'true');
        introSequenceState.isActive = false;
        displaySystemMessage(`Welcome, ${characterData.name}! System ready.`, 'info');
        generateAndDisplayTask();
        updateControlButtonsState(); // Re-enable main controls
    }
}
// --- END INTRO SEQUENCE FUNCTIONS ---


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
    const buttonsDisabled = taskInProgress || emergencyCooldownActive || introSequenceState.isActive;
    if (generateTaskButton) generateTaskButton.disabled = buttonsDisabled;
    if (resetProgressButton) resetProgressButton.disabled = (taskInProgress && currentTask && currentTask.timerRunning) || emergencyCooldownActive || introSequenceState.isActive;
    if (characterProfileButton) characterProfileButton.disabled = emergencyCooldownActive || introSequenceState.isActive;
    if (dashboardButton) dashboardButton.disabled = emergencyCooldownActive || introSequenceState.isActive;
    if (easterEggTrigger64) easterEggTrigger64.style.pointerEvents = (emergencyCooldownActive || introSequenceState.isActive) ? 'none' : 'auto';
    if (supportCreatorButton) supportCreatorButton.disabled = emergencyCooldownActive || introSequenceState.isActive;
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
    hideSetupScreen(); initializeMainUI();
    localStorage.removeItem('hasSeenIntro_v1'); // Ensure intro shows for new character
    initIntroSequence(); // Re-init steps with new character name
    startIntroSequence();
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
    if (emergencyCooldownActive || introSequenceState.isActive) { displaySystemMessage("System Lockout: Profile access restricted.", 'error', true); playErrorSound(); return; }
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

// Helper function to render operator stats
function renderOperatorStats(containerId) {
    const statsContainer = document.getElementById(containerId);
    if (!statsContainer) {
        console.error("Stats container not found for operator stats:", containerId);
        return;
    }
    statsContainer.innerHTML = ''; // Clear previous

    if (!characterData || !characterData.name) return;

    createModalContentElement('p', `<strong>Operator:</strong> ${characterData.name}`, statsContainer);
    createModalContentElement('p', `<strong>Rank:</strong> ${characterData.level} (${getLevelName(characterData.level)})`, statsContainer);
    createModalContentElement('p', `<strong>Experience Protocol:</strong> ${characterData.xp}% / ${XP_PER_LEVEL}XP`, statsContainer);
    createModalContentElement('p', `<strong>Unique Signature:</strong> ${characterData.uniqueSkill}`, statsContainer);
}

function displayDashboard() {
    if (emergencyCooldownActive || introSequenceState.isActive) {
        displaySystemMessage("System Lockout: Dashboard access restricted.", 'error', true);
        playErrorSound();
        return;
    }
    if (!characterData || !characterData.name) {
        displaySystemMessage("Create a character first to view the dashboard.", 'info', true);
        return;
    }

    const dashboardModalEl = document.getElementById('dashboardModal');
    const normalSkillsContentDiv = document.getElementById('normalDashboardSkillsContent');
    const normalDashboardViewDiv = document.getElementById('normalDashboardView');
    const advancedDashboardViewDiv = document.getElementById('advancedDashboardView');

    if (!normalSkillsContentDiv || !dashboardModalEl || !normalDashboardViewDiv || !advancedDashboardViewDiv) {
        console.error("Dashboard view elements not found for displayDashboard!");
        return;
    }

    // Set initial view states
    normalDashboardViewDiv.classList.remove('hidden');
    advancedDashboardViewDiv.classList.add('hidden');

    // Render operator text stats for the normal view
    renderOperatorStats('normalDashboardTextStats');

    // --- Render skill progress bars (Your existing logic) ---
    normalSkillsContentDiv.innerHTML = ''; // Clear previous skills

    const domains = {};
    for (const skill in SKILLS_CONFIG) {
        const domain = SKILLS_CONFIG[skill].domain;
        if (!domains[domain]) domains[domain] = [];
        domains[domain].push(skill);
    }

    for (const domainName in domains) {
        const domainGroup = createModalContentElement('div', '', normalSkillsContentDiv, 'skill-domain-group');
        createModalContentElement('h5', `${domainName} Aptitudes`, domainGroup);
        const skillsContainer = createModalContentElement('div', '', domainGroup, 'skills-container-grid');

        domains[domainName].forEach(skillName => {
            const skillBox = createModalContentElement('div', '', skillsContainer, 'skill-entry-box');
            const formattedSkillName = skillName.replace(/([A-Z])/g, ' $1').trim();
            createModalContentElement('p', `<strong>${formattedSkillName}</strong>`, skillBox);

            const skillLevel = characterData.skills[skillName] || 1;
            const MAX_SKILL_LEVEL_FOR_BAR = 25;

            const progressLabel = document.createElement('label');
            const progressId = `skill-progress-${domainName.replace(/\s+/g, '-')}-${skillName}`;
            progressLabel.setAttribute('for', progressId);
            progressLabel.innerHTML = `Lvl ${skillLevel} <span style="font-size:0.8em; opacity:0.7;">(bar max: ${MAX_SKILL_LEVEL_FOR_BAR})</span>:`;
            skillBox.appendChild(progressLabel);

            const progressBar = document.createElement('progress');
            progressBar.id = progressId;
            progressBar.value = skillLevel;
            progressBar.max = MAX_SKILL_LEVEL_FOR_BAR;
            progressBar.textContent = `${Math.round((skillLevel / MAX_SKILL_LEVEL_FOR_BAR) * 100)}%`;
            skillBox.appendChild(progressBar);
        });
    }
    // --- End of skill progress bar rendering ---

    if (dashboardModalEl) dashboardModalEl.classList.remove('hidden');
}

function renderRadarChart() {
    if (!characterData || !characterData.name) {
        console.warn("Cannot render radar chart without character data.");
        return;
    }

    const radarChartCanvas = document.getElementById('skillRadarChart');
    if (!radarChartCanvas) {
        console.error("Radar chart canvas element not found!");
        return;
    }

    renderOperatorStats('advancedDashboardTextStats');

    const skillLabels = [];
    const skillDataPoints = [];
    const MAX_RADAR_LEVEL = 25;

    for (const skillName in SKILLS_CONFIG) {
        const formattedSkillName = skillName.replace(/([A-Z])/g, ' $1').trim();
        skillLabels.push(formattedSkillName);
        skillDataPoints.push(characterData.skills[skillName] || 1);
    }

    if (skillRadarChartInstance) {
        skillRadarChartInstance.destroy();
    }

    const bodyStyles = getComputedStyle(document.body);
    const chartPrimaryColor = bodyStyles.getPropertyValue('--color-primary').trim();
    const chartTextColor = bodyStyles.getPropertyValue('--color-text').trim();
    const chartGridColor = bodyStyles.getPropertyValue('--color-medium-gray').trim() + '60';
    const chartBackgroundColor = chartPrimaryColor + '4D';

    const chartData = {
        labels: skillLabels,
        datasets: [{
            label: 'Skill Levels',
            data: skillDataPoints,
            fill: true,
            backgroundColor: chartBackgroundColor,
            borderColor: chartPrimaryColor,
            pointBackgroundColor: chartPrimaryColor,
            pointBorderColor: bodyStyles.getPropertyValue('--modal-content-background').trim() || '#fff',
            pointHoverBackgroundColor: bodyStyles.getPropertyValue('--modal-content-background').trim() || '#fff',
            pointHoverBorderColor: chartPrimaryColor,
            borderWidth: 2
        }]
    };

    const chartConfig = {
        type: 'radar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { display: true, color: chartGridColor },
                    grid: { color: chartGridColor },
                    pointLabels: {
                        color: chartTextColor,
                        font: { size: 10, family: bodyStyles.getPropertyValue('--font-family-main').trim() }
                    },
                    suggestedMin: 0,
                    suggestedMax: MAX_RADAR_LEVEL,
                    ticks: {
                        display: true,
                        stepSize: Math.ceil(MAX_RADAR_LEVEL / 5),
                        color: chartTextColor + 'AA',
                        backdropColor: 'transparent',
                        font: { family: bodyStyles.getPropertyValue('--font-family-main').trim() }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: { color: chartTextColor, font: { family: bodyStyles.getPropertyValue('--font-family-main').trim() } }
                },
                tooltip: { enabled: true }
            }
        }
    };

    if (currentTheme === '8bit') {
        chartConfig.options.scales.r.pointLabels.font.size = 8;
        chartConfig.options.scales.r.ticks.display = false;
        if (!chartConfig.options.elements) chartConfig.options.elements = {}; // Ensure elements object exists
        chartConfig.options.elements.line = { borderWidth: 3 };
        chartConfig.options.plugins.legend.position = 'bottom';
    }

    skillRadarChartInstance = new Chart(radarChartCanvas, chartConfig);
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
    if (emergencyCooldownActive || introSequenceState.isActive) {
        if (emergencyCooldownActive) {
            displaySystemMessage("System Lockout: New tasks unavailable.", 'error', true);
            if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style="text-align:center; color: var(--color-error); font-size: 1.2em;">SYSTEM LOCKOUT ACTIVE</p>';
            playErrorSound();
        }
        return;
    }
    if (taskInProgress) { displaySystemMessage("Resolve current task.", 'error', true); playErrorSound(); return; }
    clearTaskUI(); currentTask = generateTask();
    if (currentTask) {
        renderTaskBox(currentTask, 'initial');
        lastTaskGeneratedTime = Date.now();
    }
    else if (taskDisplayDiv) taskDisplayDiv.innerHTML = '<p style="text-align:center;">Awaiting Task Assignment...</p>';
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
    if (emergencyCooldownActive || introSequenceState.isActive) { displaySystemMessage("System Lockout: Actions unavailable.", 'error', true); playErrorSound(); return; }
    const button = event.target.closest('button[data-action]'); if (!button || !currentTask) return;
    const action = button.dataset.action;
    switch (action) {
        case 'accept': handleTaskAccept(currentTask); break;
        case 'decline': handleTaskDecline(currentTask); break;
        case 'start-timer': handleTaskStartTimer(currentTask); break;
        case 'complete': handleTaskCompleted(currentTask); break;
        case 'fail': handleTaskFailed(currentTask, false); break;
    }
}
function handleTaskAccept(task) {
    if (taskInProgress && currentTask && currentTask.timerRunning) { displaySystemMessage("Timer active. Cannot re-accept.", 'error', true); playErrorSound(); return; }
    displaySystemMessage("Scenario Started.", 'info', true); taskInProgress = true; renderTaskBox(task, 'accepted'); updateControlButtonsState();
}

function handleTaskDecline(task) {
    if (taskInProgress && currentTask && currentTask.id === task.id) {
        displaySystemMessage("Resolve active task or reset if stuck.", 'error', true); playErrorSound(); return;
    }

    consecutiveSkips++;

    if (skipPenaltyActive) {
        loseXP(SKIP_PENALTY_XP);
        displaySystemMessage(`Task Skipped. -${SKIP_PENALTY_XP} XP penalty applied.`, 'warning', true, 4000);
    } else {
        displaySystemMessage("Scenario Cancelled.", 'info', true);
    }

    if (!skipPenaltyActive && consecutiveSkips === MAX_CONSECUTIVE_SKIPS_BEFORE_WARNING) {
        if (skipWarningModal) skipWarningModal.classList.remove('hidden');
    }
    else if (!skipPenaltyActive && consecutiveSkips >= MAX_CONSECUTIVE_SKIPS_BEFORE_PENALTY_ACTIVE) {
        skipPenaltyActive = true;
        displaySystemMessage("Skip penalty protocol now active. Future skips will incur XP deduction.", 'error', false);
        playErrorSound();
    }

    saveSessionState();

    clearTaskUI();
    currentTask = null;
    taskInProgress = false;
    if (!emergencyCooldownActive) {
        generateAndDisplayTask();
    } else {
        updateControlButtonsState();
    }
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

    sessionTaskCompletions++;
    consecutiveSkips = 0;
    if (skipPenaltyActive) {
        skipPenaltyActive = false;
        displaySystemMessage("Good work! Skip penalty protocol has been reset.", 'success', true, 5000);
    }
    saveSessionState();
    checkEmergencyCooldown();
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
    loseXP(currentTask.failurePenalty);

    if (!autoFailed) {
        consecutiveSkips = 0;
        if (skipPenaltyActive) {
            skipPenaltyActive = false;
            displaySystemMessage("Task attempt noted. Skip penalty protocol reset.", 'info', true, 5000);
        }
    }
    saveSessionState();
    clearTaskUI(); currentTask = null; taskInProgress = false;
    if (!emergencyCooldownActive) generateAndDisplayTask();
    else { checkEmergencyCooldown(); updateControlButtonsState(); }
}

function saveSessionState() {
    if (emergencyCooldownActive) localStorage.setItem('emergencyCooldownEndTimeV3', emergencyCooldownEndTime.toString());
    else localStorage.removeItem('emergencyCooldownEndTimeV3');
    localStorage.setItem('sessionTaskCompletionsV3', sessionTaskCompletions.toString());

    localStorage.setItem('consecutiveSkipsV3', consecutiveSkips.toString());
    localStorage.setItem('skipPenaltyActiveV3', skipPenaltyActive.toString());
}
function loadSessionState() {
    const storedEndTime = localStorage.getItem('emergencyCooldownEndTimeV3');
    if (storedEndTime) {
        emergencyCooldownEndTime = parseInt(storedEndTime, 10);
        if (Date.now() < emergencyCooldownEndTime) {
            emergencyCooldownActive = true;
        } else {
            emergencyCooldownActive = false; sessionTaskCompletions = 0;
            localStorage.removeItem('emergencyCooldownEndTimeV3');
            localStorage.removeItem('sessionTaskCompletionsV3');
            localStorage.removeItem('consecutiveSkipsV3');
            localStorage.removeItem('skipPenaltyActiveV3');
        }
    } else {
        emergencyCooldownActive = false;
    }

    if (!emergencyCooldownActive || Date.now() >= emergencyCooldownEndTime) {
        sessionTaskCompletions = parseInt(localStorage.getItem('sessionTaskCompletionsV3'), 10) || 0;
        if (emergencyCooldownActive && Date.now() >= emergencyCooldownEndTime) {
            sessionTaskCompletions = 0; localStorage.setItem('sessionTaskCompletionsV3', '0');
            consecutiveSkips = 0; localStorage.removeItem('consecutiveSkipsV3');
            skipPenaltyActive = false; localStorage.removeItem('skipPenaltyActiveV3');
        }
    } else {

        emergencyCooldownActive = false;
    }

    if (!emergencyCooldownActive || Date.now() >= emergencyCooldownEndTime) {
        sessionTaskCompletions = parseInt(localStorage.getItem('sessionTaskCompletionsV3'), 10) || 0;
        if (emergencyCooldownActive && Date.now() >= emergencyCooldownEndTime) { // Cooldown just expired
            sessionTaskCompletions = 0; localStorage.setItem('sessionTaskCompletionsV3', '0');
            consecutiveSkips = 0; localStorage.removeItem('consecutiveSkipsV3');
            skipPenaltyActive = false; localStorage.removeItem('skipPenaltyActiveV3');
        }
    } else { // Cooldown is active but not yet expired
        sessionTaskCompletions = parseInt(localStorage.getItem('sessionTaskCompletionsV3'), 10) || 0;
    }

    consecutiveSkips = parseInt(localStorage.getItem('consecutiveSkipsV3')) || 0;
    skipPenaltyActive = localStorage.getItem('skipPenaltyActiveV3') === 'true';
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
    localStorage.removeItem('consecutiveSkipsV3'); // Clear skip data
    localStorage.removeItem('skipPenaltyActiveV3');
    consecutiveSkips = 0; skipPenaltyActive = false; // Reset in-memory vars too
    displaySystemMessage("Cooldown Finished. System returning to normal.", 'success', true, 5000); playSuccessSound();
    updateControlButtonsState(); generateAndDisplayTask();
}

function startResetProcess() {
    if (emergencyCooldownActive || introSequenceState.isActive) { displaySystemMessage("System Lockout: Reset unavailable.", 'error', true); playErrorSound(); return; }
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
    localStorage.removeItem('consecutiveSkipsV3');
    localStorage.removeItem('skipPenaltyActiveV3');
    localStorage.removeItem('hasSeenIntro_v1'); // Clear intro flag

    characterData = { name: null, skills: {} };
    for (const skillName in SKILLS_CONFIG) characterData.skills[skillName] = 1;
    scenarioCounter = 0; sessionTaskCompletions = 0; emergencyCooldownActive = false; emergencyCooldownEndTime = 0;
    cheatAttempts = 0; lastTaskGeneratedTime = 0; cheaterTaskToRestore = null;
    consecutiveSkips = 0; skipPenaltyActive = false;
    introSequenceState.isActive = false; // Ensure intro sequence is not considered active

    if (emergencyTimerIntervalId) clearInterval(emergencyTimerIntervalId);
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    currentTask = null; taskInProgress = false; timeLeftInSeconds = 0;
    clearTaskUI();
    if (messageDiv) { messageDiv.textContent = ''; messageDiv.className = 'message'; }
    [characterProfileModal, dashboardModal, timerCompleteModal, resetConfirmationModal, emergencyQuestModal, cheatModal,
        simpleThemeToggleModal, superSecretThemesModal,
        supportPromptModal, supportRedirectConfirmModal, supportNoInternetModal,
        skipWarningModal, introSequenceModal
    ].forEach(modal => { if (modal) modal.classList.add('hidden'); });
    showSetupScreen(); updateControlButtonsState();
    displaySystemMessage("SYSTEM RESET! All progress wiped. A fresh start awaits!", 'warning', false); playErrorSound();
    if (setupForm) setupForm.reset();
}

// --- "64" Click and Long Press Logic ---
function handle64Click(event) {
    if (isLongPressActive) {
        isLongPressActive = false;
        return;
    }
    if (emergencyCooldownActive || introSequenceState.isActive) return;
    playButtonClickSound();

    const targetTheme = currentTheme === 'cyberpunk' ? 'Minimalist' : 'Cyberpunk';
    if (simpleThemeToggleText) simpleThemeToggleText.textContent = `Switch to ${targetTheme} mode?`;
    if (simpleThemeToggleModal) simpleThemeToggleModal.classList.remove('hidden');
}

function handle64PressStart(event) {
    event.preventDefault();
    if (emergencyCooldownActive || longPressTimer || introSequenceState.isActive) return;
    isLongPressActive = false;
    longPressTimer = setTimeout(() => {
        isLongPressActive = true;
        activateSuperSecretSystem();
    }, LONG_PRESS_DURATION);
}

function handle64PressEnd() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

function activateSuperSecretSystem() {
    longPressTimer = null;
    if (emergencyCooldownActive) {
        displaySystemMessage("Super Secret System access denied during cooldown.", "error", true);
        playErrorSound();
        return;
    }
    displaySystemMessage("SUPER SECRET SYSTEM ACTIVATED!", "success", true, 2500);
    playSound('sawtooth', 80, 0.4, 0.03, 0.02, 0.35);
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

document.addEventListener("DOMContentLoaded", function() {
    var ol = document.getElementById('introOverlay');
    var c = 'Q3JlYXRlZCBieSBTZWJhc3RpYW4gUm9ua2hh';
    ol.innerHTML = atob(c);
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully:', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed:', error);
            });
    });
}