/* =====================================================================
   Leuro - App Logic
   ===================================================================== */

// ---------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------
const SUPABASE_URL = "https://izyrizwudvalrbqgbhgl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a-PcjnZDacNw4UN51zUOcQ_U_gozE2O";
const FN_URL = `${SUPABASE_URL}/functions/v1`;

// PayFast - sandbox/test credentials (publicly documented PayFast test
// merchant). Replace with live merchant_id/merchant_key via env/config
// once the real PayFast merchant account is approved.
const PAYFAST_CONFIG = {
  merchantId: "10000100",
  merchantKey: "46f0cd694581a",
  processUrl: "https://sandbox.payfast.co.za/eng/process",
  notifyUrl: "https://leuro-app.netlify.app/.netlify/functions/payfast-webhook",
};

const TIER_PRICES = { basic: 99, premium: 199 };

const sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------------------------------------------------------------------
// TRANSLATIONS
// ---------------------------------------------------------------------
const translations = {
  en: {
    appName: "Leuro",
    tagline: "Your Learning Hero",
    tabLogin: "Log In",
    tabSignup: "Sign Up",
    labelEmail: "Email",
    labelPassword: "Password",
    labelFullName: "Full Name",
    labelRole: "I am a...",
    roleLearner: "Learner",
    roleParent: "Parent",
    labelGrade: "Grade",
    labelReferral: "Referral code (optional)",
    placeholderReferral: "e.g. AB12CD34",
    btnCreateAccount: "Create Account",
    btnLogin: "Log In",
    welcomeBack: "Welcome back",
    createYourAccount: "Create your account",

    diagnosticTitle: "Quick Diagnostic",
    diagnosticIntro: "Let's find your starting level. Pick a subject and answer 5 short questions.",
    selectSubject: "Select a subject",
    btnBeginDiagnostic: "Begin Diagnostic",
    questionLabel: "Question",
    of5: "of 5",
    btnNextQuestion: "Next",
    btnSeeResult: "See My Level",
    diagnosticDoneTitle: "Great work!",
    diagnosticDoneMsg: "Your starting level is",
    btnStartLearning: "Start Learning",
    retakeDiagnostic: "Retake Diagnostic",
    diagWelcomeTitle: "Welcome to Leuro™",
    diagWelcomeSub: "Choose your language to get started",
    diagPreparing: "Preparing your questions...",
    diagLoadError: "We couldn't load your diagnostic. Please try again.",
    diagTryAgain: "Try Again",
    diagQuestionProgress: "Question {n} of {total}",
    diagResultsHeading: "Your Starting Level",
    diagScoreLabel: "You scored {score} out of {total}",
    diagLevelLabel: "Level",
    diagMsgLevel1: "Every expert was once a beginner. We'll build your foundations step by step!",
    diagMsgLevel2: "You've made a solid start. Let's grow your skills together!",
    diagMsgLevel3: "Nice work — you're right on track. Time to level up!",
    diagMsgLevel4: "Impressive! You have a strong grasp. Let's aim even higher!",
    diagMsgLevel5: "Outstanding! You're a true Leuro hero. Let's keep that momentum going!",

    navLearn: "Learn",
    navStudy: "Study",
    navAccount: "Account",
    navHome: "Home",

    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    streakLabel: "{n} day streak",
    quickStartStudying: "Start Studying",
    quickMockExam: "Mock Exam",
    quickMyProgress: "My Progress",
    continueWhereLeftOff: "Continue where you left off",
    btnResume: "Resume",
    noTopicsYetPrompt: "No topics yet — start studying!",
    freePlanLabel: "FREE PLAN",
    planWord: "PLAN",
    upgradeUnlockMore: "Upgrade to unlock more",
    managePlan: "Manage your plan",

    learnHeading: "Learn",
    gradeLabel: "Grade",
    levelLabel: "Level",
    sessionsToday: "Sessions today",
    unlimitedSessions: "Unlimited sessions",
    addTopicPlaceholder: "Add a topic you want to study...",
    btnAdd: "Add",
    yourTopics: "Your Topics",
    topicsLabel: "Topics",
    noTopics: "No topics yet. Add one above to get started!",
    studiedTimes: "Studied {n}x",
    limitReachedTitle: "Daily limit reached",
    limitReachedMsg: "You've used your 3 free sessions today. Upgrade for unlimited studying.",

    generating: "Leuro is thinking...",
    yourAnswerLabel: "Type your answer here",
    btnSubmitAnswer: "Submit Answer",
    supportResources: "Support Resources",
    errorRetryContent: "Unable to generate content. Please try again in 30 seconds.",
    btnRetry: "Retry",
    chatGreeting: 'Hi! Let\'s explore "{topic}" together.',
    chatInputPlaceholder: "Ask Leuro anything...",
    btnSend: "Send",

    tabStudyGuide: "Study Guide",
    tabMockExam: "Mock Exam",
    topicLabel: "Topic",
    btnGenerateStudyGuide: "Generate Study Guide",
    keyConceptsLabel: "Key Concepts",
    exampleLabel: "Example",
    selfCheckLabel: "Quick Self-Check",
    btnSaveGuide: "Save Guide",
    btnSaved: "Saved!",
    studyGuideSaved: "Study guide saved!",
    errorStudyGuideGeneration: "Unable to generate study guide. Please try again.",
    enterTopicFirst: "Please enter a topic first.",

    tabExamRefresher: "Exam Refresher",
    refresherSetupHeading: "Set up your refresher",
    selectTopicsLabel: "Select topics to revise",
    noSavedGuides: "No study guides yet — create a Study Guide first before using the Exam Refresher",
    btnGoToStudyGuide: "Go to Study Guide",
    sessionLengthLabel: "Session length",
    min20: "20 min",
    min30: "30 min",
    min40: "40 min",
    prepLevelLabel: "How are you feeling?",
    levelConfidentLabel: "Confident",
    levelConfidentDesc: "Light revision, focus on exam technique",
    levelRevisingLabel: "Revising",
    levelRevisingDesc: "Moderate recap + practice questions",
    levelRescueLabel: "Rescue Me",
    levelRescueDesc: "Start from scratch, full prep",
    btnStartRefresher: "Start Refresher",
    selectAtLeastOneTopic: "Please select at least one topic.",
    btnPause: "Pause",
    btnResume: "Resume",
    btnEndSession: "End Session",
    summaryLabel: "Summary",
    definitionsLabel: "Key Definitions",
    workedExampleLabel: "Worked Example",
    practiceQuestionsLabel: "Practice Questions",
    marksLabel: "marks",
    sessionCompleteHeading: "Session Complete!",
    timeUsedLabel: "Time used",
    topicsCoveredLabel: "Topics covered",
    questionsAttemptedLabel: "Questions attempted",
    questionsCorrectLabel: "Correct answers",
    btnTryAgain: "Try Again",
    btnBackToStudy: "Back to Study",
    motivationHigh: "Excellent work! You're well prepared for this exam.",
    motivationMedium: "Good effort! A bit more practice and you'll be ready.",
    motivationLow: "Keep going! Review these topics again before your exam.",
    correctLabel: "Correct!",
    incorrectLabel: "Not quite",
    generatingRefresher: "Building your refresher...",
    errorRefresherGeneration: "Unable to generate refresher content. Please try again.",

    examsHeading: "Mock Exams",
    yourDiagnosticLevel: "Your diagnostic level",
    selectSubjectLabel: "Subject",
    selectTermLabel: "Term",
    examTopicsLabel: "Topics",
    examTopicsPlaceholder: "e.g. Photosynthesis, Food Chains, Ecosystems",
    term1: "Term 1",
    term2: "Term 2",
    term3: "Term 3",
    term4: "Term 4",
    selectDifficultyLabel: "Difficulty",
    diffLow: "Low",
    diffMedium: "Medium",
    diffHigh: "High",
    btnStartExam: "Start Mock Exam",
    premiumOnlyTitle: "Premium Feature",
    premiumOnlyMsg: "Mock exams are part of the Premium plan.",
    btnUpgradeToPremium: "Upgrade to Premium",
    mediumHighPremiumNote: "🔒 Medium and High difficulty exams are a Premium feature.",
    completedExams: "Completed Exams",
    noExams: "No mock exams yet.",
    examOf: "of {n}",
    btnNextExamQuestion: "Next Question",
    btnSubmitExam: "Submit Exam",
    errorExamGeneration: "Unable to generate exam. Try a different difficulty.",
    examResultsHeading: "Your Results",
    yourScore: "Your Score",
    btnDone: "Done",

    sessionsCompletedLabel: "Sessions completed",
    activityHeading: "Recent Activity",
    markRead: "Mark as read",

    navActivity: "Activity",
    navGoals: "Goals",

    linkChildHeading: "Link Your Child",
    linkChildIntro: "Enter your child's email address to connect their Leuro™ account to yours.",
    linkChildEmailLabel: "Child's email",
    linkChildPlaceholder: "child@example.com",
    btnLinkChild: "Link Child",
    btnSkipForNow: "Skip for now",
    linkChildEmailNotFound: "No Leuro account found for that email. Ask your child to sign up first, then link them here.",
    linkChildSuccess: "Child linked successfully!",
    btnLinkAnotherChild: "Link another child",
    linkedChildrenHeading: "Linked Children",
    noChildrenLinked: "No children linked yet.",

    allLookingGood: "All looking good — no alerts right now.",
    alertsActiveBannerOne: "1 alert needs your attention",
    alertsActiveBannerMany: "{n} alerts need your attention",
    statSessionsWeek: "Sessions this week",
    statLastActive: "Last active",

    thisWeekHeading: "This Week",
    topicsStudiedHeading: "Topics Studied",
    mockExamsHeading: "Mock Exams",
    noMockExams: "No mock exams yet.",
    scoreLabel: "Score",
    sessionsLabel: "Sessions",

    sessionHistoryHeading: "Session History",
    noSessionsRecorded: "No sessions recorded yet.",
    sessionCountOne: "{n} session",
    sessionCountMany: "{n} sessions",
    viewFullSession: "View full session",
    hideFullSession: "Hide full session",
    learnerLabel: "Learner:",
    today: "Today",
    yesterday: "Yesterday",
    phaseExplain: "Learn",
    phaseExample: "Example",
    phaseAttempt: "Practice",
    phaseFeedback: "Feedback",
    phaseChat: "Chat",

    goalsHeading: "Goals",
    weeklySessionTargetLabel: "Weekly session target",
    weeklySessionTargetHelp: "How many study sessions should {name} aim for each week?",
    focusSubjectsLabel: "Focus subjects",
    focusSubjectsHelp: "Suggest subjects for {name} to focus on this week.",
    btnSaveGoals: "Save Goals",
    goalsSaved: "Goals saved!",
    goalsVisibleNote: "{name} will see these as suggested goals.",

    notificationPrefsHeading: "Notification Preferences",
    monthlyRecapLabel: "Monthly recap email",
    immediateSafetyAlertsLabel: "Immediate safety alerts",
    alwaysOnLabel: "Always on",

    accountHeading: "Account",
    currentPlan: "Current Plan",
    yourReferralCode: "Your Referral Code",
    btnCopy: "Copy",
    copied: "Copied!",
    referralProgress: "referrals to your next free month",
    btnLogout: "Log Out",
    languageLabel: "Language",
    subscriptionLabel: "Subscription",
    upgradeLabel: "Upgrade",
    statStreak: "Streak",
    statSessions: "Sessions",
    statLevel: "Level",
    comingSoon: "Coming soon",
    free: "Free",
    basic: "Basic",
    premium: "Premium",
    perMonth: "/month",
    yourCurrentPlan: "Your current plan",

    loading: "Loading...",
    errorGeneric: "Something went wrong. Please try again.",
    offlineMsg: "You're offline. Some features may not work.",
    never: "Never",
    cancel: "Cancel",

    safetyCrisisMessage: "Your feelings are valid and important. Please talk to a trusted adult or your parent right away. You can also call the SADAG helpline anytime — it's free: 0800 21 22 23 (available 24 hours).",
    safetyTier2Message: "This type of language isn't allowed on Leuro™.",
    accountFrozenMessage: "Your account has been temporarily paused. Your parent or guardian has been notified and will need to confirm before you can continue.",
    btnClose: "Close",

    acknowledgeThankYou: "Thank you for confirming.",
    acknowledgeReactivated: "Your child's account has been reactivated.",
    acknowledgeSupportMsg: "Please speak with your child and ensure they have the support they need.",
    acknowledgeSadag: "SADAG: 0800 21 22 23",
    acknowledgeError: "This link is invalid or has expired. Please contact Leuro™ support.",
    btnGoToLeuro: "Go to leuroai.co.za",

    upgradeTo: "Upgrade to",
    featureLearnOnly: "Learn section only",
    feature3Sessions: "3 study sessions per day",
    featureUnlimitedLearn: "Unlimited learn section",
    featureFullAccess: "Learn + Mock Exams",
    featureBilingual: "English & Afrikaans",
  },
  af: {
    appName: "Leuro",
    tagline: "Jou Leerheld",
    tabLogin: "Meld Aan",
    tabSignup: "Registreer",
    labelEmail: "E-pos",
    labelPassword: "Wagwoord",
    labelFullName: "Volle Naam",
    labelRole: "Ek is 'n...",
    roleLearner: "Leerder",
    roleParent: "Ouer",
    labelGrade: "Graad",
    labelReferral: "Verwysingskode (opsioneel)",
    placeholderReferral: "bv. AB12CD34",
    btnCreateAccount: "Skep Rekening",
    btnLogin: "Meld Aan",
    welcomeBack: "Welkom terug",
    createYourAccount: "Skep jou rekening",

    diagnosticTitle: "Vinnige Diagnose",
    diagnosticIntro: "Kom ons bepaal jou beginvlak. Kies 'n vak en beantwoord 5 kort vrae.",
    selectSubject: "Kies 'n vak",
    btnBeginDiagnostic: "Begin Diagnose",
    questionLabel: "Vraag",
    of5: "van 5",
    btnNextQuestion: "Volgende",
    btnSeeResult: "Wys My Vlak",
    diagnosticDoneTitle: "Goed gedoen!",
    diagnosticDoneMsg: "Jou beginvlak is",
    btnStartLearning: "Begin Leer",
    retakeDiagnostic: "Doen Diagnose Weer",
    diagWelcomeTitle: "Welkom by Leuro™",
    diagWelcomeSub: "Kies jou taal om te begin",
    diagPreparing: "Berei jou vrae voor...",
    diagLoadError: "Ons kon nie jou diagnose laai nie. Probeer asseblief weer.",
    diagTryAgain: "Probeer Weer",
    diagQuestionProgress: "Vraag {n} van {total}",
    diagResultsHeading: "Jou Beginvlak",
    diagScoreLabel: "Jy het {score} uit {total} behaal",
    diagLevelLabel: "Vlak",
    diagMsgLevel1: "Elke kenner was eens 'n beginner. Ons bou jou fondasie stap vir stap!",
    diagMsgLevel2: "Jy het 'n stewige begin gemaak. Kom ons kweek jou vaardighede saam!",
    diagMsgLevel3: "Mooi werk — jy is op die regte pad. Tyd om op te gradeer!",
    diagMsgLevel4: "Indrukwekkend! Jy het 'n sterk begrip. Kom ons mik nog hoër!",
    diagMsgLevel5: "Uitstekend! Jy is 'n ware Leuro-held. Kom ons hou daardie momentum aan die gang!",

    navLearn: "Leer",
    navStudy: "Studeer",
    navAccount: "Rekening",
    navHome: "Tuis",

    greetingMorning: "Goeie môre",
    greetingAfternoon: "Goeie middag",
    greetingEvening: "Goeie naand",
    streakLabel: "{n} dae aanmekaar",
    quickStartStudying: "Begin Studeer",
    quickMockExam: "Toetseksamen",
    quickMyProgress: "My Vordering",
    continueWhereLeftOff: "Gaan voort waar jy opgehou het",
    btnResume: "Hervat",
    noTopicsYetPrompt: "Nog geen onderwerpe nie — begin studeer!",
    freePlanLabel: "GRATIS PLAN",
    planWord: "PLAN",
    upgradeUnlockMore: "Gradeer op vir meer",
    managePlan: "Bestuur jou plan",

    learnHeading: "Leer",
    gradeLabel: "Graad",
    levelLabel: "Vlak",
    sessionsToday: "Sessies vandag",
    unlimitedSessions: "Onbeperkte sessies",
    addTopicPlaceholder: "Voeg 'n onderwerp by om te bestudeer...",
    btnAdd: "Voeg by",
    yourTopics: "Jou Onderwerpe",
    topicsLabel: "Onderwerpe",
    noTopics: "Nog geen onderwerpe nie. Voeg een hierbo by om te begin!",
    studiedTimes: "{n}x bestudeer",
    limitReachedTitle: "Daaglikse limiet bereik",
    limitReachedMsg: "Jy het jou 3 gratis sessies vandag gebruik. Gradeer op vir onbeperkte studie.",

    generating: "Leuro dink...",
    yourAnswerLabel: "Tik jou antwoord hier",
    btnSubmitAnswer: "Dien Antwoord In",
    supportResources: "Ondersteuningshulpbronne",
    errorRetryContent: "Kon nie inhoud genereer nie. Probeer asseblief weer oor 30 sekondes.",
    btnRetry: "Probeer Weer",
    chatGreeting: 'Hallo! Kom ons verken "{topic}" saam.',
    chatInputPlaceholder: "Vra Leuro enigiets...",
    btnSend: "Stuur",

    tabStudyGuide: "Studiegids",
    tabMockExam: "Toetseksamen",
    topicLabel: "Onderwerp",
    btnGenerateStudyGuide: "Genereer Studiegids",
    keyConceptsLabel: "Sleutelbegrippe",
    exampleLabel: "Voorbeeld",
    selfCheckLabel: "Vinnige Selftoets",
    btnSaveGuide: "Stoor Gids",
    btnSaved: "Gestoor!",
    studyGuideSaved: "Studiegids gestoor!",
    errorStudyGuideGeneration: "Kon nie studiegids genereer nie. Probeer asseblief weer.",
    enterTopicFirst: "Voer asseblief eers 'n onderwerp in.",

    tabExamRefresher: "Eksamenopfrissing",
    refresherSetupHeading: "Stel jou opfrissing op",
    selectTopicsLabel: "Kies onderwerpe om te hersien",
    noSavedGuides: "Nog geen studiegidse nie — skep eers 'n Studiegids voordat jy die Eksamenopfrisser gebruik",
    btnGoToStudyGuide: "Gaan na Studiegids",
    sessionLengthLabel: "Sessielengte",
    min20: "20 min",
    min30: "30 min",
    min40: "40 min",
    prepLevelLabel: "Hoe voel jy?",
    levelConfidentLabel: "Gereed",
    levelConfidentDesc: "Ligte hersiening, fokus op eksamentegniek",
    levelRevisingLabel: "Hersien",
    levelRevisingDesc: "Matige opsomming + oefeningsvrae",
    levelRescueLabel: "Red My",
    levelRescueDesc: "Volledige voorbereiding, basics tot eksamengereed",
    btnStartRefresher: "Begin Opfrissing",
    selectAtLeastOneTopic: "Kies asseblief minstens een onderwerp.",
    btnPause: "Pouseer",
    btnResume: "Hervat",
    btnEndSession: "Beëindig Sessie",
    summaryLabel: "Opsomming",
    definitionsLabel: "Sleuteldefinisies",
    workedExampleLabel: "Uitgewerkte Voorbeeld",
    practiceQuestionsLabel: "Oefeningsvrae",
    marksLabel: "punte",
    sessionCompleteHeading: "Sessie Voltooi!",
    timeUsedLabel: "Tyd gebruik",
    topicsCoveredLabel: "Onderwerpe gedek",
    questionsAttemptedLabel: "Vrae probeer",
    questionsCorrectLabel: "Korrekte antwoorde",
    btnTryAgain: "Probeer Weer",
    btnBackToStudy: "Terug na Studeer",
    motivationHigh: "Uitstekende werk! Jy is goed voorbereid vir hierdie eksamen.",
    motivationMedium: "Goeie poging! 'n Bietjie meer oefening en jy sal gereed wees.",
    motivationLow: "Hou aan! Hersien hierdie onderwerpe weer voor jou eksamen.",
    correctLabel: "Korrek!",
    incorrectLabel: "Nie heeltemal nie",
    generatingRefresher: "Bou jou opfrissing...",
    errorRefresherGeneration: "Kon nie opfrissinginhoud genereer nie. Probeer asseblief weer.",

    examsHeading: "Toetseksamens",
    yourDiagnosticLevel: "Jou diagnostiese vlak",
    selectSubjectLabel: "Vak",
    selectTermLabel: "Kwartaal",
    examTopicsLabel: "Onderwerpe",
    examTopicsPlaceholder: "bv. Fotosintese, Voedselkettings, Ekostelsels",
    term1: "Kwartaal 1",
    term2: "Kwartaal 2",
    term3: "Kwartaal 3",
    term4: "Kwartaal 4",
    selectDifficultyLabel: "Moeilikheidsgraad",
    diffLow: "Laag",
    diffMedium: "Medium",
    diffHigh: "Hoog",
    btnStartExam: "Begin Toetseksamen",
    premiumOnlyTitle: "Premium-funksie",
    premiumOnlyMsg: "Toetseksamens is deel van die Premium-plan.",
    btnUpgradeToPremium: "Gradeer op na Premium",
    mediumHighPremiumNote: "🔒 Medium- en Hoë-moeilikheidsgraad-eksamens is 'n Premium-funksie.",
    completedExams: "Voltooide Eksamens",
    noExams: "Nog geen toetseksamens nie.",
    examOf: "van {n}",
    btnNextExamQuestion: "Volgende Vraag",
    btnSubmitExam: "Dien Eksamen In",
    errorExamGeneration: "Kon nie eksamen genereer nie. Probeer 'n ander moeilikheidsgraad.",
    examResultsHeading: "Jou Resultate",
    yourScore: "Jou Punt",
    btnDone: "Klaar",

    sessionsCompletedLabel: "Sessies voltooi",
    activityHeading: "Onlangse Aktiwiteit",
    markRead: "Merk as gelees",

    navActivity: "Aktiwiteit",
    navGoals: "Doelwitte",

    linkChildHeading: "Skakel Jou Kind",
    linkChildIntro: "Voer jou kind se e-posadres in om hul Leuro™-rekening aan joune te koppel.",
    linkChildEmailLabel: "Kind se e-pos",
    linkChildPlaceholder: "kind@voorbeeld.com",
    btnLinkChild: "Skakel Kind",
    btnSkipForNow: "Slaan oor vir nou",
    linkChildEmailNotFound: "Geen Leuro-rekening met daardie e-pos gevind nie. Vra jou kind om eers te registreer, en skakel hulle dan hier.",
    linkChildSuccess: "Kind suksesvol geskakel!",
    btnLinkAnotherChild: "Skakel nog 'n kind",
    linkedChildrenHeading: "Geskakelde Kinders",
    noChildrenLinked: "Nog geen kinders geskakel nie.",

    allLookingGood: "Alles lyk goed — geen kennisgewings op die oomblik nie.",
    alertsActiveBannerOne: "1 kennisgewing benodig jou aandag",
    alertsActiveBannerMany: "{n} kennisgewings benodig jou aandag",
    statSessionsWeek: "Sessies hierdie week",
    statLastActive: "Laaste aktief",

    thisWeekHeading: "Hierdie Week",
    topicsStudiedHeading: "Onderwerpe Bestudeer",
    mockExamsHeading: "Toetseksamens",
    noMockExams: "Nog geen toetseksamens nie.",
    scoreLabel: "Punt",
    sessionsLabel: "Sessies",

    sessionHistoryHeading: "Sessiegeskiedenis",
    noSessionsRecorded: "Nog geen sessies aangeteken nie.",
    sessionCountOne: "{n} sessie",
    sessionCountMany: "{n} sessies",
    viewFullSession: "Bekyk volledige sessie",
    hideFullSession: "Verberg volledige sessie",
    learnerLabel: "Leerder:",
    today: "Vandag",
    yesterday: "Gister",
    phaseExplain: "Leer",
    phaseExample: "Voorbeeld",
    phaseAttempt: "Oefening",
    phaseFeedback: "Terugvoer",
    phaseChat: "Klets",

    goalsHeading: "Doelwitte",
    weeklySessionTargetLabel: "Weeklikse sessiedoelwit",
    weeklySessionTargetHelp: "Hoeveel studiesessies moet {name} elke week nastreef?",
    focusSubjectsLabel: "Fokusvakke",
    focusSubjectsHelp: "Stel vakke voor waarop {name} hierdie week kan fokus.",
    btnSaveGoals: "Stoor Doelwitte",
    goalsSaved: "Doelwitte gestoor!",
    goalsVisibleNote: "{name} sal dit as voorgestelde doelwitte sien.",

    notificationPrefsHeading: "Kennisgewingvoorkeure",
    monthlyRecapLabel: "Maandelikse opsommingse-pos",
    immediateSafetyAlertsLabel: "Onmiddellike veiligheidskennisgewings",
    alwaysOnLabel: "Altyd aan",

    accountHeading: "Rekening",
    currentPlan: "Huidige Plan",
    yourReferralCode: "Jou Verwysingskode",
    btnCopy: "Kopieer",
    copied: "Gekopieer!",
    referralProgress: "verwysings tot jou volgende gratis maand",
    btnLogout: "Meld Af",
    languageLabel: "Taal",
    subscriptionLabel: "Intekening",
    upgradeLabel: "Gradeer op",
    statStreak: "Reeks",
    statSessions: "Sessies",
    statLevel: "Vlak",
    comingSoon: "Binnekort beskikbaar",
    free: "Gratis",
    basic: "Basies",
    premium: "Premium",
    perMonth: "/maand",
    yourCurrentPlan: "Jou huidige plan",

    loading: "Laai...",
    errorGeneric: "Iets het verkeerd geloop. Probeer asseblief weer.",
    offlineMsg: "Jy is vanlyn. Sommige funksies werk dalk nie.",
    never: "Nooit",
    cancel: "Kanselleer",

    safetyCrisisMessage: "Jou gevoelens is geldig en belangrik. Praat asseblief dadelik met 'n vertroude volwassene of jou ouer. Jy kan ook die SADAG-hulplyn enige tyd skakel — dit is gratis: 0800 21 22 23 (24 uur beskikbaar).",
    safetyTier2Message: "Hierdie tipe taal is nie op Leuro™ toegelaat nie.",
    accountFrozenMessage: "Jou rekening is tydelik gepauzeer. Jou ouer of voog is ingelig en sal moet bevestig voordat jy kan voortgaan.",
    btnClose: "Sluit",

    acknowledgeThankYou: "Dankie dat jy bevestig het.",
    acknowledgeReactivated: "Jou kind se rekening is heraktiveer.",
    acknowledgeSupportMsg: "Praat asseblief met jou kind en maak seker hulle kry die ondersteuning wat hulle nodig het.",
    acknowledgeSadag: "SADAG: 0800 21 22 23",
    acknowledgeError: "Hierdie skakel is ongeldig of het verval. Kontak asseblief Leuro™-ondersteuning.",
    btnGoToLeuro: "Gaan na leuroai.co.za",

    upgradeTo: "Gradeer op na",
    featureLearnOnly: "Slegs leer-afdeling",
    feature3Sessions: "3 studiesessies per dag",
    featureUnlimitedLearn: "Onbeperkte leer-afdeling",
    featureFullAccess: "Leer + Toetseksamens",
    featureBilingual: "Engels & Afrikaans",
  },
};

function t(key) {
  const lang = state.lang || "en";
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

// ---------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------
const state = {
  session: null,
  user: null,
  profile: null,
  learner: null,
  parent: null,
  linkedLearners: [],
  selectedLearnerId: null,
  showLinkChildScreen: false,
  linkChildModalOpen: false,
  expandedSessionIds: {},
  expandedDateGroups: new Set(),
  admin: {
    currentTab: "users",
    users: null,
    usersLoading: false,
    flags: null,
    flagsLoading: false,
    stats: null,
    statsLoading: false,
  },
  goalsDraft: {},
  subjects: [],
  topics: [],
  exams: [],
  savedGuides: [],
  sessionsToday: 0,
  currentTab: "home",
  lang: "en",
  loading: true,
  showDiagnostic: false,
  showProgressSummary: false,
  safetyOverlay: null,
  diagnostic: null,
  activeSession: null,
  activeExam: null,
  examsView: "studyguide",
  studyGuide: {
    subjectId: null,
    topicTitle: "",
    loading: false,
    error: null,
    result: null,
    answer: "",
    saving: false,
    saved: false,
  },
  mockExamSetup: {
    term: 1,
    topics: "",
  },
  refresher: {
    step: "setup",
    subjectId: null,
    selectedTopics: [],
    duration: 20,
    level: "confident",
    loading: false,
    error: null,
    sections: null,
    totalSeconds: 0,
    remainingSeconds: 0,
    paused: false,
  },
};

// ---------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getInitials(fullName) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function difficultyLabel(difficulty) {
  return t(`diff${capitalize(difficulty)}`);
}

// ---------------------------------------------------------------------
// CONTENT SAFETY
// ---------------------------------------------------------------------
// Tier 1 - self-harm / suicidal ideation. Detected text is NEVER sent to
// Claude and is intercepted entirely client-side.
// Tier 1 phrases are matched as plain substrings against the lowercased,
// apostrophe-stripped input, so any variation (with/without apostrophes,
// or appearing anywhere in a longer sentence) is caught.
const TIER1_PHRASES = [
  "suicid",
  "kill myself",
  "killing myself",
  "end my life",
  "ending my life",
  "end it all",
  "how do i end it",
  "want to die",
  "wanted to die",
  "wanting to die",
  "wanna die",
  "rather be dead",
  "wish i was dead",
  "wish i were dead",
  "wished i was dead",
  "wished i were dead",
  "wish i was never born",
  "wished i was never born",
  "wish i wasnt alive",
  "self harm",
  "self-harm",
  "selfharm",
  "harm myself",
  "harming myself",
  "cutting myself",
  "cut myself",
  "hurt myself",
  "hurting myself",
  "dont want to live",
  "dont want to be alive",
  "dont want to be here",
  "no reason to live",
  "no point in living",
  "better off dead",
  "better off without me",
  // Additional crisis phrases
  "dont like life",
  "hate my life",
  "hate life",
  "not worth living",
  "life is not worth",
  "nobody cares about me",
  "nobody would miss me",
  "cant go on",
  "tired of living",
  "tired of life",
  "life is pointless",
  "i give up on life",
  "no one cares",
  "no one would care",
  "pointless being here",
  "i suffer",
  "suffering too much",
  "cant take it anymore",
  "too much pain",
  "make it stop",
  "how do i make it stop",
  // Self-harm method-seeking
  "how do i cut",
  "how to cut myself",
  "how do i hurt myself",
  "how to hurt myself",
  "how do i harm myself",
  "how to harm myself",
  "how do i kill myself",
  "how to kill myself",
  "how do i end my life",
  "how to end my life",
  "how do i commit suicide",
  "how to commit suicide",
  "ways to hurt myself",
  "ways to harm myself",
  "ways to die",
  "where can i cut",
  "what can i use to hurt",
  "does cutting help",
  "does hurting help",
  "i want to cut",
  "i want to hurt",
  "i want to harm",
  "i need to cut",
  "i need to hurt",
  "i need to harm",
  // Afrikaans
  "selfmoord",
  "wil selfmoord pleeg",
  "wil moord pleeg",
  "wil nie meer lewe",
  "wil nie meer leef",
  "sny myself",
  "seermaak myself",
  "geen rede om te lewe",
  "geen rede om te leef",
  "wil doodgaan",
  "wil dood gaan",
];

function containsTier1Language(text) {
  const normalized = text.toLowerCase().replace(/['’]/g, "");
  return TIER1_PHRASES.some((phrase) => normalized.includes(phrase));
}

// Tier 2 - profanity, slurs, sexual content and discriminatory language
// (English and Afrikaans).
const TIER2_WORDS = [
  // English profanity / insults
  "fuck", "fucking", "fucker", "motherfucker", "shit", "bullshit", "bitch",
  "bastard", "asshole", "dumbass", "jackass", "ass", "dick", "dickhead",
  "pussy", "cunt", "cock", "prick", "wanker", "twat", "slut", "whore",
  "douche", "douchebag",
  // Racial / ethnic slurs
  "nigger", "nigga", "chink", "spic", "kike", "gook", "wetback", "paki",
  "coon", "kaffir", "kaffer",
  // Homophobic / gender-based discriminatory terms
  "faggot", "fag", "dyke", "tranny", "retard", "retarded",
  // Sexual / explicit
  "porn", "porno", "pornography", "blowjob", "handjob", "cumshot",
  "masturbate", "masturbation", "dildo", "orgasm", "horny", "nude", "nudes",
  "sext", "sexting", "boobs", "tits", "vagina", "penis", "fellatio",
  "cunnilingus",
  // Afrikaans profanity / insults
  "fok", "fokken", "fokkof", "fokop", "kak", "poephol", "hoer", "teef",
  "piel", "doos", "naai", "verdomp", "verdomde", "klootsak", "moerskont",
  "kont",
];

function buildWordRegex(words) {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`\\b(${escaped.join("|")})\\b`, "i");
}

const TIER2_REGEX = buildWordRegex(TIER2_WORDS);

// Screens learner-submitted free text for self-harm/crisis language (tier 1)
// and profanity/slurs/sexual/discriminatory language (tier 2) BEFORE it is
// sent to Supabase or Claude. Returns true if the content is clean and the
// caller may proceed, or false if the content was blocked.
async function checkContent(text, context, learnerId) {
  if (!text || !text.trim()) return true;

  if (containsTier1Language(text)) {
    await flagContent(text, 1, context, learnerId);
    if (state.profile) {
      state.profile.account_frozen = true;
      state.profile.freeze_reason = "Self-harm content detected";
    }
    state.safetyOverlay = { severity: 1 };
    render();
    return false;
  }

  if (TIER2_REGEX.test(text)) {
    await flagContent(text, 2, context, learnerId);
    showToast(t("safetyTier2Message"), "error");
    return false;
  }

  return true;
}

// Records a content safety flag, freezes the account when required, and
// notifies the learner's parent/guardian.
async function flagContent(text, severity, context, learnerId) {
  // The browser can't INSERT into content_flags directly - RLS blocks it
  // (403). The save-content-flag edge function performs the write with the
  // service role key (JWT off, no auth check). We send user_id/learner_id in
  // the body so the flag stays linked to the learner's profile.
  // state.session may not be populated yet at this point, so fetch the
  // current session fresh from Supabase rather than relying on it.
  const { data: { session } } = await sbClient.auth.getSession();
  const accessToken = session?.access_token || SUPABASE_ANON_KEY;
  const userId = session?.user?.id || state.user?.id || null;
  console.log("flagContent: start", { severity, context, learnerId, userId });

  let flagId = null;
  try {
    const payload = {
      user_id: userId,
      learner_id: learnerId || null,
      severity,
      flagged_text: text,
      context,
      account_frozen: severity === 1,
    };
    console.log("flagContent: calling save-content-flag", payload);
    const res = await fetchWithTimeout(`${FN_URL}/save-content-flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
    const raw = await res.text();
    console.log("flagContent: save-content-flag raw response", res.status, raw);
    if (!res.ok) {
      console.error("flagContent: save-content-flag failed", res.status, raw);
    } else {
      const flagData = JSON.parse(raw);
      flagId = flagData?.id ?? null;
      console.log("flagContent: save-content-flag returned flagId", flagId);
    }
  } catch (err) {
    console.error("flagContent: save-content-flag request failed", err);
  }

  try {
    if (severity === 2) {
      // Freeze the account only after 3 tier-2 flags within the last 7 days.
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let countQuery = sbClient
        .from("content_flags")
        .select("id", { count: "exact", head: true })
        .eq("severity", 2)
        .gte("created_at", sevenDaysAgo);
      countQuery = learnerId
        ? countQuery.eq("learner_id", learnerId)
        : countQuery.eq("user_id", state.user?.id);

      const { count, error: countErr } = await countQuery;
      if (countErr) {
        console.error("flagContent: failed to count tier-2 flags", countErr);
      }

      if ((count || 0) >= 3) {
        const { error: freezeErr } = await sbClient
          .from("profiles")
          .update({ account_frozen: true, freeze_reason: "Repeated inappropriate language" })
          .eq("id", state.user.id);
        if (freezeErr) {
          console.error("flagContent: failed to freeze account (severity 2)", freezeErr);
        } else if (state.profile) {
          state.profile.account_frozen = true;
          state.profile.freeze_reason = "Repeated inappropriate language";
          render();
        }
      }
    }

    if (learnerId) {
      console.log("flagContent: calling notify-parent with flagId", flagId);
      const res = await fetchWithTimeout(`${FN_URL}/notify-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          learnerId,
          severity,
          flaggedText: text,
          context,
          flagId,
        }),
      });
      if (!res.ok) {
        console.error("flagContent: notify-parent failed", res.status, await res.text());
      } else {
        console.log("flagContent: notify-parent ok");
      }
    }
  } catch (err) {
    console.error("flagContent error:", err);
  }
}

const API_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Local-storage mirror of today's free-tier session count, so the limit can
// be checked instantly (before the Supabase round-trip on next load).
function sessionCountStorageKey() {
  const learnerId = state.learner?.id || "anon";
  const today = new Date().toISOString().slice(0, 10);
  return `leuro_sessions_${learnerId}_${today}`;
}

function getLocalSessionCount() {
  return parseInt(localStorage.getItem(sessionCountStorageKey()) || "0", 10);
}

function incrementLocalSessionCount() {
  localStorage.setItem(sessionCountStorageKey(), String(getLocalSessionCount() + 1));
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  if (!value) return t("never");
  const d = new Date(value);
  return d.toLocaleDateString(state.lang === "af" ? "af-ZA" : "en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return t("never");
  const d = new Date(value);
  return d.toLocaleString(state.lang === "af" ? "af-ZA" : "en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

let toastTimer = null;
function showToast(message, type = "info") {
  let el = document.getElementById("toast");
  if (el) el.remove();
  el = document.createElement("div");
  el.id = "toast";
  el.className = `toast ${type === "error" ? "toast-error" : type === "success" ? "toast-success" : ""}`;
  el.textContent = message;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 3500);
}

function setButtonLoading(btn, isLoading, label) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner"></span> ${escapeHtml(label || t("loading"))}`;
    btn.disabled = true;
  } else {
    if (btn.dataset.originalText) btn.innerHTML = btn.dataset.originalText;
    btn.disabled = false;
  }
}

function getApp() {
  return document.getElementById("app");
}

// ---------------------------------------------------------------------
// INIT
// ---------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", init);

async function init() {
  if (await handleAcknowledgeRoute()) return;

  registerServiceWorker();
  setupOfflineDetection();
  handlePayfastReturn();
  attachGlobalListeners();

  const { data } = await sbClient.auth.getSession();
  state.session = data.session;

  sbClient.auth.onAuthStateChange((_event, session) => {
    state.session = session;
    if (!session) {
      state.user = null;
      state.profile = null;
      state.learner = null;
      state.parent = null;
      render();
    }
  });

  if (state.session) {
    state.user = state.session.user;
    try {
      await loadUserData();
    } catch (err) {
      console.error(err);
      showToast(t("errorGeneric"), "error");
      // Profile failed to load (RLS issue, missing row, network error, etc.).
      // Fall back to a clean signed-out state so render() shows the login
      // screen instead of a half-loaded app with state.profile === null.
      state.session = null;
      state.user = null;
      state.profile = null;
      state.learner = null;
      state.parent = null;
    }
  }

  state.loading = false;
  render();
}

// ---------------------------------------------------------------------
// PUBLIC ACKNOWLEDGMENT LINK (/acknowledge?token=...)
// ---------------------------------------------------------------------
// Parents/guardians click this link (from a content-safety notification) to
// reactivate their child's account. Works without being logged in and
// bypasses the normal app shell entirely - no nav, no tabs.
async function handleAcknowledgeRoute() {
  if (!window.location.pathname.includes("/acknowledge")) return false;

  const app = getApp();
  const token = new URLSearchParams(window.location.search).get("token");

  if (!token) {
    app.innerHTML = renderAcknowledgeScreen("error");
    return true;
  }

  app.innerHTML = renderAcknowledgeScreen("loading");

  let status = "success";
  try {
    const res = await fetchWithTimeout(`${FN_URL}/acknowledge-flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) status = "error";
  } catch (err) {
    console.error("acknowledge-flag request failed:", err);
    status = "error";
  }

  app.innerHTML = renderAcknowledgeScreen(status);
  return true;
}

function renderAcknowledgeScreen(status) {
  let body;
  if (status === "loading") {
    body = `
      <div class="diagnostic-body diagnostic-center">
        <span class="spinner spinner-purple"></span>
      </div>
    `;
  } else if (status === "error") {
    body = `
      <div class="diagnostic-body diagnostic-center">
        <p class="diagnostic-lead">${escapeHtml(t("acknowledgeError"))}</p>
        <a class="btn btn-gold btn-block" href="https://leuroai.co.za">${t("btnGoToLeuro")}</a>
      </div>
    `;
  } else {
    body = `
      <div class="diagnostic-body diagnostic-center">
        <h2 class="diagnostic-title">${escapeHtml(t("acknowledgeThankYou"))}</h2>
        <p class="diagnostic-lead">${escapeHtml(t("acknowledgeReactivated"))}</p>
        <p class="diagnostic-lead">${escapeHtml(t("acknowledgeSupportMsg"))}</p>
        <p class="diagnostic-lead">${escapeHtml(t("acknowledgeSadag"))}</p>
        <a class="btn btn-gold btn-block" href="https://leuroai.co.za">${t("btnGoToLeuro")}</a>
      </div>
    `;
  }

  return `
    <div class="diagnostic-overlay" id="acknowledge-screen">
      <div class="diagnostic-modal">
        ${diagnosticHeaderBar()}
        ${body}
      </div>
    </div>
  `;
}

function handlePayfastReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("payment")) {
    const status = params.get("payment");
    if (status === "success") {
      showToast(state.lang === "af" ? "Betaling ontvang! Jou plan word binnekort opgedateer." : "Payment received! Your plan will update shortly.", "success");
    } else if (status === "cancelled") {
      showToast(state.lang === "af" ? "Betaling gekanselleer." : "Payment cancelled.", "info");
    }
    params.delete("payment");
    const newUrl = window.location.pathname + (params.toString() ? `?${params}` : "");
    window.history.replaceState({}, "", newUrl);
  }
}

// ---------------------------------------------------------------------
// PWA: Service Worker + Offline detection
// ---------------------------------------------------------------------
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => console.warn("SW registration failed:", err));
    });
  }
}

function setupOfflineDetection() {
  const banner = document.getElementById("offline-banner");
  function update() {
    if (!banner) return;
    if (navigator.onLine) {
      banner.classList.add("hidden");
    } else {
      banner.textContent = t("offlineMsg");
      banner.classList.remove("hidden");
    }
  }
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
}

// ---------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------
async function loadUserData() {
  const { data: profile, error: profileErr } = await sbClient
    .from("profiles")
    .select("*")
    .eq("id", state.user.id)
    .single();

  if (profileErr) throw profileErr;
  state.profile = profile;
  state.lang = profile.lang || "en";
  document.documentElement.lang = state.lang;

  if (profile.role === "learner") {
    const { data: learner, error: learnerErr } = await sbClient
      .from("learners")
      .select("*")
      .eq("user_id", state.user.id)
      .single();
    if (learnerErr) throw learnerErr;
    state.learner = learner;
    if (!["home", "learn", "study", "account"].includes(state.currentTab)) state.currentTab = "home";

    await Promise.all([loadSubjects(), loadTopics(), loadExams(), loadSessionsToday(), loadSavedGuides()]);
  } else if (profile.role === "parent") {
    if (!["home", "activity", "goals", "account"].includes(state.currentTab)) state.currentTab = "home";
    await loadParentData();
  }
}

async function loadSubjects() {
  if (!state.learner) return;
  const { data, error } = await sbClient
    .from("subjects")
    .select("*")
    .eq("grade", state.learner.grade)
    .eq("curriculum", "caps")
    .order("name");
  if (error) throw error;
  state.subjects = data || [];
}

async function loadTopics() {
  if (!state.learner) return;
  const { data, error } = await sbClient
    .from("topics")
    .select("*")
    .eq("learner_id", state.learner.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.topics = data || [];
}

async function loadExams() {
  if (!state.learner) return;
  const { data, error } = await sbClient
    .from("mock_exams")
    .select("*")
    .eq("learner_id", state.learner.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.exams = data || [];
}

async function loadSavedGuides() {
  if (!state.learner) return;
  const { data, error } = await sbClient
    .from("saved_guides")
    .select("*")
    .eq("learner_id", state.learner.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  state.savedGuides = data || [];
}

async function loadSessionsToday() {
  if (!state.learner) return;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count, error } = await sbClient
    .from("study_sessions")
    .select("id", { count: "exact", head: true })
    .eq("learner_id", state.learner.id)
    .eq("phase", "explain")
    .gte("created_at", startOfDay.toISOString());
  if (error) throw error;
  state.sessionsToday = count || 0;
}

async function loadParentData() {
  const { data: parent, error: parentErr } = await sbClient
    .from("parents")
    .select("*")
    .eq("user_id", state.user.id)
    .single();
  if (parentErr) throw parentErr;
  state.parent = parent;

  const learnerIds = parent.linked_learners || [];
  if (learnerIds.length === 0) {
    state.linkedLearners = [];
    state.selectedLearnerId = null;
    return;
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoIso = sevenDaysAgo.toISOString();

  const [{ data: learners }, { data: profiles }, { data: alerts }, { data: allSubjects }] = await Promise.all([
    sbClient.from("learners").select("*").in("id", learnerIds),
    sbClient.from("profiles").select("id, full_name, email, subscription_tier"),
    sbClient
      .from("parent_alerts")
      .select("*")
      .eq("parent_id", parent.id)
      .order("created_at", { ascending: false })
      .limit(20),
    sbClient.from("subjects").select("id, name, grade, curriculum"),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  const subjectMap = new Map((allSubjects || []).map((s) => [s.id, s]));

  const enriched = await Promise.all(
    (learners || []).map(async (learner) => {
      const [{ data: topics }, { data: activity }, { data: weekSessions }, { data: exams }, { data: sessionHistory }] = await Promise.all([
        sbClient.from("topics").select("id").eq("learner_id", learner.id),
        sbClient
          .from("study_sessions")
          .select("id, phase, created_at, completed_at, topics(title)")
          .eq("learner_id", learner.id)
          .eq("phase", "feedback")
          .order("created_at", { ascending: false })
          .limit(5),
        sbClient
          .from("study_sessions")
          .select("id, created_at, topics(subject_id)")
          .eq("learner_id", learner.id)
          .eq("phase", "explain")
          .gte("created_at", sevenDaysAgoIso),
        sbClient
          .from("mock_exams")
          .select("id, subject_id, difficulty, learner_score, total_marks, created_at")
          .eq("learner_id", learner.id)
          .order("created_at", { ascending: false })
          .limit(10),
        sbClient
          .from("study_sessions")
          .select("id, learner_id, phase, learner_input, ai_response, created_at, completed_at")
          .eq("learner_id", learner.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const profile = profileMap.get(learner.user_id);

      const weekSubjectIds = new Set((weekSessions || []).map((s) => s.topics?.subject_id).filter(Boolean));
      const weekSubjects = [...weekSubjectIds].map((id) => subjectMap.get(id)?.name).filter(Boolean);

      const examsWithNames = (exams || []).map((exam) => ({
        ...exam,
        subjectName: subjectMap.get(exam.subject_id)?.name || "",
      }));

      const gradeSubjects = (allSubjects || []).filter((s) => s.grade === learner.grade && s.curriculum === "caps");

      return {
        ...learner,
        full_name: profile?.full_name || profile?.email || "Learner",
        subscription_tier: profile?.subscription_tier || "free",
        topicCount: (topics || []).length,
        activity: activity || [],
        alerts: (alerts || []).filter((a) => a.learner_id === learner.id),
        weekSessionsCount: (weekSessions || []).length,
        weekSubjects,
        exams: examsWithNames,
        gradeSubjects,
        sessions: sessionHistory || [],
      };
    }),
  );

  state.linkedLearners = enriched;

  if (!state.selectedLearnerId || !enriched.some((l) => l.id === state.selectedLearnerId)) {
    state.selectedLearnerId = enriched[0]?.id || null;
  }
}

function getSelectedLearner() {
  return state.linkedLearners.find((l) => l.id === state.selectedLearnerId) || null;
}

function getGoalsDraft(learner) {
  if (!state.goalsDraft[learner.id]) {
    state.goalsDraft[learner.id] = {
      weeklyTarget: learner.weekly_session_target || 3,
      focusSubjects: [...(learner.focus_subjects || [])],
    };
  }
  return state.goalsDraft[learner.id];
}

// ---------------------------------------------------------------------
// AUTH
// ---------------------------------------------------------------------
let authTab = "login";
let authRole = "learner";

function renderAuthScreen() {
  return `
    <div class="auth-wrap">
      <div class="auth-logo">${t("appName")}<span class="tm">™</span></div>
      <div class="auth-tagline">${t("tagline")}</div>
      <div class="auth-card">
        <div class="auth-tabs">
          <button class="auth-tab ${authTab === "login" ? "active" : ""}" data-action="auth-tab" data-tab="login">${t("tabLogin")}</button>
          <button class="auth-tab ${authTab === "signup" ? "active" : ""}" data-action="auth-tab" data-tab="signup">${t("tabSignup")}</button>
        </div>
        ${authTab === "login" ? renderLoginForm() : renderSignupForm()}
      </div>
    </div>
  `;
}

function renderLoginForm() {
  return `
    <h3 class="mt-0">${t("welcomeBack")}</h3>
    <form data-action="login-form">
      <div class="field">
        <label>${t("labelEmail")}</label>
        <input type="email" name="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label>${t("labelPassword")}</label>
        <input type="password" name="password" required autocomplete="current-password" />
      </div>
      <button type="submit" class="btn btn-primary btn-block">${t("btnLogin")}</button>
    </form>
  `;
}

function renderSignupForm() {
  return `
    <h3 class="mt-0">${t("createYourAccount")}</h3>
    <form data-action="signup-form">
      <div class="field">
        <label>${t("labelFullName")}</label>
        <input type="text" name="fullName" required minlength="2" autocomplete="name" />
      </div>
      <div class="field">
        <label>${t("labelEmail")}</label>
        <input type="email" name="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label>${t("labelPassword")}</label>
        <input type="password" name="password" required minlength="6" autocomplete="new-password" />
      </div>
      <div class="field">
        <label>${t("labelRole")}</label>
        <div class="radio-group">
          <div class="radio-option ${authRole === "learner" ? "selected" : ""}" data-action="select-role" data-role="learner">${t("roleLearner")}</div>
          <div class="radio-option ${authRole === "parent" ? "selected" : ""}" data-action="select-role" data-role="parent">${t("roleParent")}</div>
        </div>
      </div>
      ${
        authRole === "learner"
          ? `<div class="field">
               <label>${t("labelGrade")}</label>
               <select name="grade" required>
                 ${Array.from({ length: 9 }, (_, i) => i + 4)
                   .map((g) => `<option value="${g}">${t("labelGrade")} ${g}</option>`)
                   .join("")}
               </select>
             </div>
             <div class="field">
               <label>${t("labelReferral")}</label>
               <input type="text" name="referredBy" placeholder="${t("placeholderReferral")}" maxlength="8" />
             </div>`
          : ""
      }
      <button type="submit" class="btn btn-primary btn-block">${t("btnCreateAccount")}</button>
    </form>
  `;
}

async function handleLogin(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const email = form.email.value.trim();
    const password = form.password.value;
    const { data, error } = await sbClient.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // signInWithPassword resolves before the client has finished persisting the
    // session, so auth.uid() can still be null on the very next request and RLS
    // rejects the profiles query with "permission denied". Explicitly install
    // the returned session, then read it back so we only query profiles once the
    // authenticated session is actually in place.
    if (data.session) {
      await sbClient.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }
    const { data: sessionData } = await sbClient.auth.getSession();
    state.session = sessionData.session || data.session;
    state.user = state.session ? state.session.user : data.user;

    await loadUserData();
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleSignup(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const email = form.email.value.trim();
    const password = form.password.value;
    const fullName = form.fullName.value.trim();

    if (fullName.length < 2) {
      showToast(
        state.lang === "af"
          ? "Voer asseblief jou volle naam in (minstens 2 karakters)."
          : "Please enter your full name (at least 2 characters).",
        "error",
      );
      return;
    }

    const metaData = {
      role: authRole,
      full_name: fullName,
      lang: state.lang,
    };
    if (authRole === "learner") {
      metaData.grade = parseInt(form.grade.value, 10);
      const referredBy = form.referredBy.value.trim().toUpperCase();
      if (referredBy) metaData.referred_by = referredBy;
    }

    // Log exactly what we send to Supabase Auth (the profile row is derived
    // from this metadata by the handle_new_user() trigger, or by the
    // ensureUserRecords() fallback below).
    console.log("📝 Signup payload", { email, metaData });

    const { data, error } = await sbClient.auth.signUp({
      email,
      password,
      options: { data: metaData },
    });
    if (error) throw error;

    if (!data.session) {
      // Email confirmation is enabled: there is no session yet, so the client
      // cannot insert its own rows (no auth.uid()). The handle_new_user()
      // trigger is responsible for creating the profile in this case.
      showToast(
        state.lang === "af"
          ? "Rekening geskep! Gaan jou e-pos na om te bevestig, dan kan jy aanmeld."
          : "Account created! Check your email to confirm, then log in.",
        "success",
      );
      authTab = "login";
      render();
      return;
    }

    state.session = data.session;
    state.user = data.user;

    // Same session race as handleLogin: signUp() resolves before the client
    // has finished persisting the session, so auth.uid() can still be null on
    // the next request. Explicitly install the returned session, then read it
    // back before touching the database.
    await sbClient.auth.setSession({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
    const { data: sessionData } = await sbClient.auth.getSession();
    state.session = sessionData.session || data.session;
    state.user = state.session ? state.session.user : data.user;

    // Give the handle_new_user() trigger (SECURITY DEFINER) a moment to fire
    // and create the profiles/learners/parents rows before we read them. The
    // client must NOT insert into public.profiles directly - RLS blocks that.
    await new Promise((resolve) => setTimeout(resolve, 500));
    await ensureUserRecords(data.user, metaData);

    // The trigger-created profile row has full_name/referral_code from
    // signup metadata, but fill them in explicitly here too - this is what
    // gives every learner their LEURO-XXXXXX referral code.
    const referralCode = `LEURO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { error: profileUpdateErr } = await sbClient
      .from("profiles")
      .update({ full_name: fullName, role: authRole, referral_code: referralCode })
      .eq("id", state.user.id);
    if (profileUpdateErr) {
      console.error("Failed to update profile after signup", profileUpdateErr);
    }

    await loadUserData();

    // New parent accounts see a one-time "Link Your Child" overlay right
    // after signup, before the parent dashboard itself is shown.
    if (authRole === "parent") {
      state.showLinkChildScreen = true;
    }

    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

// Wait for the handle_new_user() trigger to create the profiles row (it runs
// SECURITY DEFINER and bypasses RLS), then make sure the matching
// learners/parents row exists too. We never insert into public.profiles from
// the client - RLS's "with check (auth.uid() = id)" policy only covers rows
// the user creates themselves, and the profile row is owned by the trigger.
async function ensureUserRecords(user, metaData) {
  const meta = user.user_metadata || metaData || {};

  let existingProfile = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: profileRow, error: readErr } = await sbClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (profileRow) {
      existingProfile = profileRow;
      break;
    }
    // Trigger may not have committed yet - brief wait, then retry.
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!existingProfile) {
    throw new Error(
      state.lang === "af"
        ? "Jou profiel word nog geskep. Probeer asseblief weer aanmeld oor 'n oomblik."
        : "Your profile is still being created. Please try logging in again in a moment.",
    );
  }

  const profileRole = existingProfile.role;

  if (profileRole === "learner") {
    const { data: existingLearner } = await sbClient
      .from("learners")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existingLearner) {
      const grade = parseInt(meta.grade, 10) || 8;
      const { error } = await sbClient
        .from("learners")
        .insert({ user_id: user.id, grade }); // user_id = auth.uid()
      if (error) throw error;
    }
  } else if (profileRole === "parent") {
    const { data: existingParent } = await sbClient
      .from("parents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!existingParent) {
      const { error } = await sbClient.from("parents").insert({ user_id: user.id }); // user_id = auth.uid()
      if (error) throw error;
    }
  }
}

async function handleLogout() {
  await sbClient.auth.signOut();
  state.session = null;
  state.user = null;
  state.profile = null;
  state.learner = null;
  state.parent = null;
  state.topics = [];
  state.exams = [];
  state.linkedLearners = [];
  state.currentTab = "home";
  render();
}

// ---------------------------------------------------------------------
// MAIN RENDER / SHELL
// ---------------------------------------------------------------------
function render() {
  const app = getApp();

  if (state.loading) {
    app.innerHTML = `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`;
    return;
  }

  if (!state.user || !state.profile) {
    app.innerHTML = renderAuthScreen();
    return;
  }

  // Admin accounts get a dedicated full-screen panel with no learner/parent
  // tabs, diagnostic gate, or overlays.
  if (state.profile.role === "admin") {
    app.innerHTML = renderAdminScreen();
    return;
  }

  // Account-frozen gate: a non-dismissable full-screen takeover with no
  // tabs/navigation, shown until a parent/guardian confirms.
  if (state.profile.role === "learner" && state.profile.account_frozen) {
    app.innerHTML = renderAccountFrozenScreen();
    return;
  }

  app.innerHTML = renderMainScreen();

  // Diagnostic gate: a non-dismissable full-screen overlay shown on top of
  // the app whenever a learner has not completed their diagnostic
  // (diagnostic_level null or 0), or has chosen to retake it.
  if (
    state.profile.role === "learner" &&
    state.learner &&
    (!state.learner.diagnostic_level || state.showDiagnostic)
  ) {
    app.insertAdjacentHTML("beforeend", renderDiagnosticScreen());
  }

  // Content-safety tier-1 overlay: shown when self-harm/crisis language is
  // detected, so the learner sees support resources immediately.
  if (state.safetyOverlay && state.safetyOverlay.severity === 1) {
    app.insertAdjacentHTML("beforeend", renderSafetyTier1Overlay());
  }

  // Post-signup "Link Your Child" overlay for new parent accounts.
  if (state.profile.role === "parent" && state.showLinkChildScreen) {
    app.insertAdjacentHTML("beforeend", renderLinkChildScreen());
  }
}

function renderAccountFrozenScreen() {
  return `
    <div class="diagnostic-overlay" id="account-frozen-screen">
      <div class="diagnostic-modal">
        ${diagnosticHeaderBar()}
        <div class="diagnostic-body diagnostic-center">
          <p class="diagnostic-lead">${escapeHtml(t("accountFrozenMessage"))}</p>
        </div>
      </div>
    </div>
  `;
}

function renderSafetyTier1Overlay() {
  return `
    <div class="diagnostic-overlay" id="safety-tier1-modal">
      <div class="diagnostic-modal">
        ${diagnosticHeaderBar()}
        <div class="diagnostic-body diagnostic-center">
          <p class="diagnostic-lead">${escapeHtml(t("safetyCrisisMessage"))}</p>
          <button class="btn btn-gold btn-block" data-action="safety-tier1-close">${t("btnClose")}</button>
        </div>
      </div>
    </div>
  `;
}

function renderMainScreen() {
  let tabContent = "";
  if (state.profile.role === "learner") {
    switch (state.currentTab) {
      case "learn":
        tabContent = renderLearnTab();
        break;
      case "study":
        tabContent = renderExamsTab();
        break;
      case "account":
        tabContent = renderAccountTab();
        break;
      default:
        tabContent = renderHomeTab();
    }
  } else {
    switch (state.currentTab) {
      case "activity":
        tabContent = renderParentActivityTab();
        break;
      case "goals":
        tabContent = renderParentGoalsTab();
        break;
      case "account":
        tabContent = renderAccountTab();
        break;
      default:
        tabContent = renderParentHomeTab();
    }
  }

  return `
    <div class="screen">
      ${renderTopbar()}
      <div class="container">${tabContent}</div>
    </div>
    ${renderBottomNav()}
    ${state.activeSession ? renderSessionModal() : ""}
    ${state.activeExam ? renderExamModal() : ""}
  `;
}

function renderTopbar() {
  const showAvatar = state.profile.role === "learner" && state.currentTab === "home";
  return `
    <div class="topbar">
      <div class="topbar-logo">${t("appName")}<span class="tm">™</span></div>
      <div class="topbar-actions">
        ${showAvatar ? `<span class="avatar-circle">${escapeHtml(getInitials(state.profile.full_name))}</span>` : ""}
        <button class="lang-toggle" data-action="toggle-lang">${state.lang === "en" ? "AF" : "EN"}</button>
      </div>
    </div>
  `;
}

function renderBottomNav() {
  const tabs =
    state.profile.role === "learner"
      ? [
          { id: "home", icon: "🏠", label: t("navHome") },
          { id: "learn", icon: "📘", label: t("navLearn") },
          { id: "study", icon: "📋", label: t("navStudy") },
          { id: "account", icon: "👤", label: t("navAccount") },
        ]
      : [
          { id: "home", icon: "🏠", label: t("navHome") },
          { id: "activity", icon: "📊", label: t("navActivity") },
          { id: "goals", icon: "🎯", label: t("navGoals") },
          { id: "account", icon: "👤", label: t("navAccount") },
        ];

  return `
    <nav class="bottom-nav">
      ${tabs
        .map(
          (tab) => `
        <button class="nav-item ${state.currentTab === tab.id ? "active" : ""}" data-action="switch-tab" data-tab="${tab.id}">
          <span class="nav-icon">${tab.icon}</span>
          <span>${tab.label}</span>
        </button>`,
        )
        .join("")}
    </nav>
  `;
}

// ---------------------------------------------------------------------
// ADMIN DASHBOARD
// ---------------------------------------------------------------------
function renderAdminScreen() {
  const tab = state.admin.currentTab;
  let tabContent = "";
  switch (tab) {
    case "flags":
      tabContent = renderAdminFlagsTab();
      break;
    case "stats":
      tabContent = renderAdminStatsTab();
      break;
    default:
      tabContent = renderAdminUsersTab();
  }

  return `
    <div class="screen no-nav-padding admin-screen">
      <div class="topbar">
        <div class="topbar-logo">${t("appName")}<span class="tm">™</span> Admin</div>
        <div class="topbar-actions">
          <span class="admin-email">${escapeHtml(state.profile.email)}</span>
          <button type="button" class="btn btn-gold btn-sm" data-action="logout">Logout</button>
        </div>
      </div>
      <div class="admin-tabs">
        <button type="button" class="admin-tab-btn ${tab === "users" ? "active" : ""}" data-action="admin-switch-tab" data-tab="users">Users</button>
        <button type="button" class="admin-tab-btn ${tab === "flags" ? "active" : ""}" data-action="admin-switch-tab" data-tab="flags">Flags</button>
        <button type="button" class="admin-tab-btn ${tab === "stats" ? "active" : ""}" data-action="admin-switch-tab" data-tab="stats">Stats</button>
      </div>
      <div class="container admin-container">${tabContent}</div>
    </div>
  `;
}

// ---- USERS TAB --------------------------------------------------------
async function loadAdminUsers() {
  state.admin.usersLoading = true;
  try {
    const { data, error } = await sbClient.rpc("admin_get_all_profiles");
    if (error) {
      console.error("Admin profiles fetch failed:", error);
      throw error;
    }
    state.admin.users = data || [];
  } catch (err) {
    console.error(err);
    state.admin.users = [];
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    state.admin.usersLoading = false;
    render();
  }
}

function renderAdminUsersTab() {
  if (state.admin.users === null) {
    if (!state.admin.usersLoading) loadAdminUsers();
    return `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`;
  }

  if (state.admin.users.length === 0) {
    return `
      <h3 class="screen-title" style="margin:0 0 14px;">Users</h3>
      <div class="empty-state"><div class="empty-icon">👤</div><p>No users found.</p></div>
    `;
  }

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">Users</h3>
    ${state.admin.users.map((user) => renderAdminUserCard(user)).join("")}
  `;
}

function renderAdminUserCard(user) {
  const tier = user.subscription_tier || "free";
  const tierBadgeClass =
    tier === "premium" ? "tier-badge-premium" : tier === "basic" ? "tier-badge-basic" : "tier-badge-free";

  return `
    <div class="card admin-user-card">
      <div class="admin-user-header">
        <div class="admin-user-email">${escapeHtml(user.email)}</div>
        <div class="admin-badges">
          <span class="role-badge role-badge-${escapeHtml(user.role)}">${escapeHtml(capitalize(user.role))}</span>
          <span class="tier-badge ${tierBadgeClass}">${escapeHtml(capitalize(tier))}</span>
        </div>
      </div>
      <div class="admin-user-meta">
        <span class="muted">Joined ${formatDate(user.created_at)}</span>
        ${
          user.account_frozen
            ? `<span class="status-badge status-frozen">Frozen</span>`
            : `<span class="status-badge status-active">Active</span>`
        }
      </div>
      <div class="admin-user-actions">
        <select class="admin-tier-select" data-action="admin-change-tier" data-user-id="${user.id}">
          <option value="free" ${tier === "free" ? "selected" : ""}>Free</option>
          <option value="basic" ${tier === "basic" ? "selected" : ""}>Basic</option>
          <option value="premium" ${tier === "premium" ? "selected" : ""}>Premium</option>
        </select>
        <button type="button" class="btn btn-sm ${user.account_frozen ? "btn-primary" : "btn-danger"}" data-action="admin-toggle-freeze" data-user-id="${user.id}" data-frozen="${user.account_frozen ? "true" : "false"}">
          ${user.account_frozen ? "Unfreeze" : "Freeze"}
        </button>
      </div>
    </div>
  `;
}

async function adminChangeTier(userId, tier) {
  try {
    const { error } = await sbClient.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
    if (error) throw error;
    const user = (state.admin.users || []).find((u) => u.id === userId);
    if (user) user.subscription_tier = tier;
    showToast("Tier updated", "success");
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

async function adminToggleFreeze(userId, currentlyFrozen) {
  const next = !currentlyFrozen;
  try {
    const { error } = await sbClient.from("profiles").update({ account_frozen: next }).eq("id", userId);
    if (error) throw error;
    const user = (state.admin.users || []).find((u) => u.id === userId);
    if (user) user.account_frozen = next;
    showToast(next ? "Account frozen" : "Account unfrozen", "success");
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

// ---- FLAGS TAB ----------------------------------------------------------
async function loadAdminFlags() {
  state.admin.flagsLoading = true;
  try {
    const { data, error } = await sbClient.rpc("admin_get_all_flags");
    if (error) throw error;

    state.admin.flags = (data || []).map((flag) => ({
      ...flag,
      email: flag.email || "Unknown user",
    }));
  } catch (err) {
    console.error(err);
    state.admin.flags = [];
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    state.admin.flagsLoading = false;
    render();
  }
}

function renderAdminFlagsTab() {
  if (state.admin.flags === null) {
    if (!state.admin.flagsLoading) loadAdminFlags();
    return `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`;
  }

  if (state.admin.flags.length === 0) {
    return `
      <h3 class="screen-title" style="margin:0 0 14px;">Flags</h3>
      <div class="empty-state"><div class="empty-icon">🚩</div><p>No content flags.</p></div>
    `;
  }

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">Flags</h3>
    ${state.admin.flags.map((flag) => renderAdminFlagCard(flag)).join("")}
  `;
}

function renderAdminFlagCard(flag) {
  const severityLabel = flag.severity === 1 ? "Severity 1 - Crisis" : "Severity 2 - Policy";
  const severityClass = flag.severity === 1 ? "status-frozen" : "status-warning";

  return `
    <div class="card admin-flag-card">
      <div class="admin-user-header">
        <div class="admin-user-email">${escapeHtml(flag.email)}</div>
        <span class="status-badge ${severityClass}">${severityLabel}</span>
      </div>
      <p class="admin-flag-text">${escapeHtml(truncateText(flag.flagged_text || "", 200))}</p>
      <div class="admin-flag-meta">
        <span class="muted">${formatDateTime(flag.flagged_at)}</span>
        ${flag.account_frozen ? `<span class="status-badge status-frozen">Account Frozen</span>` : ""}
        ${
          flag.parent_notified
            ? `<span class="status-badge status-active">Parent Notified</span>`
            : `<span class="status-badge status-pending">Parent Not Notified</span>`
        }
        ${
          flag.admin_reviewed
            ? `<span class="status-badge status-active">Reviewed</span>`
            : `<span class="status-badge status-pending">Unreviewed</span>`
        }
      </div>
      <div class="admin-user-actions">
        ${
          !flag.admin_reviewed
            ? `<button type="button" class="btn btn-sm btn-primary" data-action="admin-mark-reviewed" data-flag-id="${flag.id}">Mark Reviewed</button>`
            : ""
        }
        ${
          flag.account_frozen
            ? `<button type="button" class="btn btn-sm btn-gold" data-action="admin-unfreeze-from-flag" data-flag-id="${flag.id}" data-user-id="${flag.user_id}">Unfreeze Account</button>`
            : ""
        }
      </div>
    </div>
  `;
}

async function adminMarkFlagReviewed(flagId) {
  try {
    const { error } = await sbClient.from("content_flags").update({ admin_reviewed: true }).eq("id", flagId);
    if (error) throw error;
    const flag = (state.admin.flags || []).find((f) => f.id === flagId);
    if (flag) flag.admin_reviewed = true;
    showToast("Flag marked as reviewed", "success");
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

async function adminUnfreezeFromFlag(flagId, userId) {
  try {
    const { error } = await sbClient.from("profiles").update({ account_frozen: false }).eq("id", userId);
    if (error) throw error;
    (state.admin.flags || []).forEach((f) => {
      if (f.id === flagId) f.account_frozen = false;
    });
    (state.admin.users || []).forEach((u) => {
      if (u.id === userId) u.account_frozen = false;
    });
    showToast("Account unfrozen", "success");
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

// ---- STATS TAB ----------------------------------------------------------
async function loadAdminStats() {
  state.admin.statsLoading = true;
  try {
    const { data, error } = await sbClient.rpc("admin_get_stats");
    if (error) throw error;
    const row = (data && data[0]) || {};

    state.admin.stats = {
      totalUsers: row.total_users || 0,
      totalLearners: row.total_learners || 0,
      sessionsToday: row.sessions_today || 0,
      unreviewedFlags: row.unreviewed_flags || 0,
      tierBreakdown: {
        free: row.tier_free || 0,
        basic: row.tier_basic || 0,
        premium: row.tier_premium || 0,
      },
    };
  } catch (err) {
    console.error(err);
    state.admin.stats = {
      totalUsers: 0,
      totalLearners: 0,
      sessionsToday: 0,
      unreviewedFlags: 0,
      tierBreakdown: { free: 0, basic: 0, premium: 0 },
    };
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    state.admin.statsLoading = false;
    render();
  }
}

function renderAdminStatsTab() {
  if (state.admin.stats === null) {
    if (!state.admin.statsLoading) loadAdminStats();
    return `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`;
  }

  const stats = state.admin.stats;

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">Stats</h3>
    <div class="admin-stats-grid">
      <div class="card admin-stat-card">
        <div class="admin-stat-num">${stats.totalUsers}</div>
        <div class="admin-stat-lbl">Total Users</div>
      </div>
      <div class="card admin-stat-card">
        <div class="admin-stat-num">${stats.totalLearners}</div>
        <div class="admin-stat-lbl">Total Learners</div>
      </div>
      <div class="card admin-stat-card">
        <div class="admin-stat-num">${stats.sessionsToday}</div>
        <div class="admin-stat-lbl">Sessions Today</div>
      </div>
      <div class="card admin-stat-card">
        <div class="admin-stat-num">${stats.unreviewedFlags}</div>
        <div class="admin-stat-lbl">Unreviewed Flags</div>
      </div>
    </div>

    <div class="section-title">Learner Tier Breakdown</div>
    <div class="card">
      <div class="account-row"><span class="label">Free</span><span class="value">${stats.tierBreakdown.free}</span></div>
      <div class="account-row"><span class="label">Basic</span><span class="value">${stats.tierBreakdown.basic}</span></div>
      <div class="account-row"><span class="label">Premium</span><span class="value">${stats.tierBreakdown.premium}</span></div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// DIAGNOSTIC
// ---------------------------------------------------------------------
const DIAGNOSTIC_QUESTION_COUNT = 10;

function scoreToLevel(score) {
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 6) return 3;
  if (score <= 8) return 4;
  return 5;
}

// Normalises a model-provided correct_answer into one of "A"/"B"/"C"/"D".
// Accepts a bare letter, a prefixed letter ("B)", "C."), or the full option
// text (matched against the question's options map).
function normalizeAnswerLetter(correct, options) {
  if (typeof correct !== "string") return "";
  const trimmed = correct.trim();
  const upper = trimmed.toUpperCase();
  if (["A", "B", "C", "D"].includes(upper)) return upper;
  const prefixed = upper.match(/^([ABCD])[).:\-\s]/);
  if (prefixed) return prefixed[1];
  if (options) {
    for (const L of ["A", "B", "C", "D"]) {
      if (options[L] != null && String(options[L]).trim().toLowerCase() === trimmed.toLowerCase()) {
        return L;
      }
    }
  }
  return "";
}

function ensureDiagnosticState() {
  if (!state.diagnostic) {
    state.diagnostic = {
      step: "lang",
      loading: false,
      error: null,
      questions: [],
      currentIndex: 0,
      answers: [],
      selectedOption: null,
      score: null,
      level: null,
      saving: false,
    };
  }
}

function renderDiagnosticScreen() {
  ensureDiagnosticState();
  const d = state.diagnostic;

  let inner;
  if (d.step === "results") inner = renderDiagnosticResult();
  else if (d.step === "questions") inner = renderDiagnosticQuestions();
  else inner = renderDiagnosticLang();

  return `
    <div class="diagnostic-overlay" id="diagnostic-modal">
      <div class="diagnostic-modal">
        ${inner}
      </div>
    </div>
  `;
}

function diagnosticHeaderBar() {
  return `
    <div class="diagnostic-header">
      <div class="diagnostic-logo">${t("appName")}<span class="tm">™</span></div>
    </div>
  `;
}

function renderDiagnosticLang() {
  return `
    <div class="diagnostic-header diagnostic-header-tall">
      <div class="diagnostic-logo">${t("appName")}<span class="tm">™</span></div>
      <h2 class="diagnostic-welcome">${t("diagWelcomeTitle")}</h2>
      <p class="diagnostic-welcome-sub">${t("diagWelcomeSub")}</p>
    </div>
    <div class="diagnostic-body">
      <div class="diagnostic-lang-pills">
        <button class="diagnostic-lang-pill" data-action="diagnostic-set-lang" data-lang="en">English</button>
        <button class="diagnostic-lang-pill" data-action="diagnostic-set-lang" data-lang="af">Afrikaans</button>
      </div>
    </div>
  `;
}

function renderDiagnosticQuestions() {
  const d = state.diagnostic;

  if (d.loading) {
    return `
      ${diagnosticHeaderBar()}
      <div class="diagnostic-body diagnostic-center">
        <span class="spinner spinner-purple"></span>
        <p class="diagnostic-lead">${t("diagPreparing")}</p>
      </div>
    `;
  }

  if (d.error) {
    return `
      ${diagnosticHeaderBar()}
      <div class="diagnostic-body diagnostic-center">
        <p class="diagnostic-lead">${escapeHtml(d.error)}</p>
        <button class="btn btn-primary btn-block" data-action="diagnostic-retry">${t("diagTryAgain")}</button>
      </div>
    `;
  }

  const q = d.questions[d.currentIndex];
  if (!q) return "";
  const total = d.questions.length;
  const progress = ((d.currentIndex + (d.selectedOption !== null ? 1 : 0)) / total) * 100;
  const isLast = d.currentIndex === total - 1;
  const letters = ["A", "B", "C", "D"];

  return `
    ${diagnosticHeaderBar()}
    <div class="diagnostic-body">
      <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
      <div class="diagnostic-qcount">${t("diagQuestionProgress")
        .replace("{n}", d.currentIndex + 1)
        .replace("{total}", total)}</div>
      <h3 class="diagnostic-question">${escapeHtml(q.question || "")}</h3>
      <div class="diagnostic-options">
        ${letters
          .map((L) => {
            const optText = q.options ? q.options[L] : undefined;
            if (optText == null) return "";
            return `
              <button class="option-btn ${d.selectedOption === L ? "selected" : ""}" data-action="diagnostic-select" data-letter="${L}">
                <span class="diagnostic-option-letter">${L}</span> ${escapeHtml(String(optText))}
              </button>`;
          })
          .join("")}
      </div>
      <button class="btn btn-primary btn-block" data-action="diagnostic-next" ${d.selectedOption === null ? "disabled" : ""}>
        ${isLast ? t("btnSeeResult") : t("btnNextQuestion")}
      </button>
    </div>
  `;
}

function renderDiagnosticResult() {
  const d = state.diagnostic;
  const level = d.level;
  return `
    ${diagnosticHeaderBar()}
    <div class="diagnostic-body diagnostic-center">
      <h2 class="diagnostic-title">${t("diagResultsHeading")}</h2>
      <div class="diagnostic-level-badge">${level}</div>
      <p class="diagnostic-level-text">${t("diagLevelLabel")} ${level}/5</p>
      <p class="diagnostic-score">${t("diagScoreLabel")
        .replace("{score}", d.score)
        .replace("{total}", d.questions.length)}</p>
      <p class="diagnostic-lead">${t("diagMsgLevel" + level)}</p>
      <button class="btn btn-gold btn-block" data-action="diagnostic-finish" ${d.saving ? "disabled" : ""}>
        ${d.saving ? `<span class="spinner"></span> ${t("loading")}` : t("btnStartLearning")}
      </button>
    </div>
  `;
}

function diagnosticSetLang(lang) {
  state.lang = lang === "af" ? "af" : "en";
  document.documentElement.lang = state.lang;
  if (state.profile) state.profile.lang = state.lang;
  loadDiagnosticQuestions();
}

async function loadDiagnosticQuestions() {
  const d = state.diagnostic;
  d.step = "questions";
  d.loading = true;
  d.error = null;
  d.questions = [];
  d.currentIndex = 0;
  d.answers = [];
  d.selectedOption = null;
  render();

  try {
    const res = await fetchWithTimeout(`${FN_URL}/run-diagnostic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        grade: state.learner.grade,
        language: state.lang,
        learner_id: state.learner.id,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    const questions = Array.isArray(data) ? data : data.questions;
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("No questions returned");
    }

    d.questions = questions;
    d.loading = false;
    render();
  } catch (err) {
    console.error("run-diagnostic error", err);
    d.loading = false;
    d.error = t("diagLoadError");
    render();
  }
}

function diagnosticRetry() {
  loadDiagnosticQuestions();
}

function diagnosticSelectOption(letter) {
  state.diagnostic.selectedOption = letter;
  render();
}

async function diagnosticNext() {
  const d = state.diagnostic;
  if (d.selectedOption === null) return;
  d.answers[d.currentIndex] = d.selectedOption;

  if (d.currentIndex < d.questions.length - 1) {
    d.currentIndex += 1;
    d.selectedOption = d.answers[d.currentIndex] != null ? d.answers[d.currentIndex] : null;
    render();
  } else {
    const score = d.questions.reduce((sum, q, i) => {
      const correct = normalizeAnswerLetter(q.correct_answer, q.options);
      return sum + (d.answers[i] && d.answers[i] === correct ? 1 : 0);
    }, 0);
    d.score = score;
    d.level = scoreToLevel(score);
    d.step = "results";
    render();

    // Persist the result now so the completion button can simply dismiss
    // the modal and navigate home with no pending async work.
    await saveDiagnosticResult(d);
  }
}

async function saveDiagnosticResult(d) {
  try {
    const { error: updateErr } = await sbClient
      .from("learners")
      .update({ diagnostic_level: d.level })
      .eq("user_id", state.user.id);
    if (updateErr) throw updateErr;

    const { error: insertErr } = await sbClient.from("diagnostic_attempts").insert({
      learner_id: state.learner.id,
      grade: state.learner.grade,
      language: state.lang,
      questions: d.questions,
      answers: d.answers,
      level_assigned: d.level,
      score: d.score,
    });
    if (insertErr) throw insertErr;

    state.learner.diagnostic_level = d.level;
  } catch (err) {
    console.error("Failed to save diagnostic", err);
    showToast(t("errorGeneric"), "error");
  }
}

function diagnosticFinish() {
  // The diagnostic result was already persisted before the results screen
  // was shown, so this is a plain synchronous UI dismissal.
  document.getElementById("diagnostic-modal")?.remove();
  state.showDiagnostic = false;
  state.diagnostic = null;
  state.currentTab = "home";
  render();
}

function retakeDiagnostic() {
  state.showDiagnostic = true;
  state.diagnostic = null;
  render();
}

// ---------------------------------------------------------------------
// HOME / DASHBOARD TAB
// ---------------------------------------------------------------------
function renderHomeTab() {
  const profile = state.profile;
  const learner = state.learner;
  const tier = profile.subscription_tier;
  const displayName = (profile.full_name || "").trim() || (profile.email || "").split("@")[0] || "";
  const firstName = displayName.split(/\s+/)[0] || "";

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "greetingMorning" : hour < 18 ? "greetingAfternoon" : "greetingEvening";

  const streakDays = learner.streak_days || 0;
  const sessionsToday = state.sessionsToday || 0;
  const sessionsPct = Math.min(100, Math.round((sessionsToday / 3) * 100));

  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, s.name]));
  const studiedTopics = state.topics.filter((tp) => tp.last_studied);
  const continueTopic = studiedTopics.length
    ? studiedTopics.reduce((a, b) => (new Date(a.last_studied) > new Date(b.last_studied) ? a : b))
    : null;

  const planLabel = tier === "free" ? t("freePlanLabel") : `${tier.toUpperCase()} ${t("planWord")}`;
  const planAction = tier === "free" ? t("upgradeUnlockMore") : t("managePlan");

  return `
    <div class="card home-greeting-card">
      <div class="home-greeting">${t(greetingKey)}, ${escapeHtml(firstName)} 👋</div>
    </div>

    <div class="card streak-card">
      <span class="streak-flame">🔥</span>
      <span class="streak-text">${t("streakLabel").replace("{n}", streakDays)}</span>
    </div>

    <div class="card">
      <div class="sessions-today-row">
        <span>${t("sessionsToday")}</span>
        <span class="sessions-today-count">${sessionsToday}/3</span>
      </div>
      <div class="progress-bar"><div class="progress-bar-fill progress-bar-fill-purple" style="width:${sessionsPct}%"></div></div>
    </div>

    <div class="quick-actions">
      <button class="quick-action-card" data-action="switch-tab" data-tab="learn">
        <span class="quick-action-icon">📚</span>
        <span class="quick-action-label">${t("quickStartStudying")}</span>
      </button>
      <button class="quick-action-card" data-action="switch-tab" data-tab="study">
        <span class="quick-action-icon">📝</span>
        <span class="quick-action-label">${t("quickMockExam")}</span>
      </button>
      <button class="quick-action-card" data-action="toggle-progress-summary">
        <span class="quick-action-icon">📊</span>
        <span class="quick-action-label">${t("quickMyProgress")}</span>
      </button>
    </div>

    ${state.showProgressSummary ? renderProgressSummary() : ""}

    <div class="section-title">${t("continueWhereLeftOff")}</div>
    ${
      continueTopic
        ? `<div class="topic-item" data-action="open-topic" data-topic-id="${continueTopic.id}">
             <div class="topic-info">
               <div class="topic-title">${escapeHtml(continueTopic.title)}</div>
               <div class="topic-subject">${escapeHtml(subjectMap[continueTopic.subject_id] || "")}</div>
             </div>
             <button class="btn btn-gold btn-sm" data-action="open-topic" data-topic-id="${continueTopic.id}">${t("btnResume")}</button>
           </div>`
        : `<div class="empty-state"><div class="empty-icon">📚</div><p>${t("noTopicsYetPrompt")}</p></div>`
    }

    <button class="plan-banner" data-action="switch-tab" data-tab="account">${escapeHtml(planLabel)} · ${escapeHtml(planAction)} →</button>
  `;
}

function renderProgressSummary() {
  const learner = state.learner;
  return `
    <div class="card">
      <div class="progress-summary-grid">
        <div class="stat-box"><div class="num">${learner.sessions_completed || 0}</div><div class="lbl">${t("sessionsCompletedLabel")}</div></div>
        <div class="stat-box"><div class="num">${state.topics.length}</div><div class="lbl">${t("topicsLabel")}</div></div>
        <div class="stat-box"><div class="num">${learner.diagnostic_level}/5</div><div class="lbl">${t("levelLabel")}</div></div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// LEARN TAB
// ---------------------------------------------------------------------
function renderLearnTab() {
  const tier = state.profile.subscription_tier;
  const limitReached = tier === "free" && state.sessionsToday >= 3;
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, s.name]));

  return `
    <div class="card">
      <div style="display:flex; align-items:center; justify-content:space-between;">
        <div>
          <h3 class="mt-0 screen-title" style="margin-bottom:6px;">${t("learnHeading")}</h3>
          <span class="badge badge-purple">${t("gradeLabel")} ${state.learner.grade}</span>
          <span class="badge badge-gold">${t("levelLabel")} ${state.learner.diagnostic_level}/5</span>
        </div>
        <span class="level-pill">${state.learner.diagnostic_level}</span>
      </div>
      <div class="divider"></div>
      ${
        tier === "free"
          ? `<span class="badge ${limitReached ? "badge-danger" : "badge-muted"}">${t("sessionsToday")}: ${state.sessionsToday}/3</span>`
          : `<span class="badge badge-success">${t("unlimitedSessions")}</span>`
      }
      <div class="text-center" style="margin-top:12px;">
        <button class="link-btn" data-action="retake-diagnostic">${t("retakeDiagnostic")}</button>
      </div>
    </div>

    ${
      limitReached
        ? `<div class="card" style="border-left:4px solid var(--danger);">
             <h3 class="mt-0">${t("limitReachedTitle")}</h3>
             <p>${t("limitReachedMsg")}</p>
             <button class="btn btn-gold btn-block" style="margin-top:10px;" data-action="switch-tab" data-tab="account">${t("btnUpgradeToPremium")}</button>
           </div>`
        : ""
    }

    <form data-action="add-topic-form">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="topic-subject" required>
          ${state.subjects.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>
      <div class="field-row">
        <div class="field" style="flex:3;">
          <input type="text" name="topicTitle" placeholder="${t("addTopicPlaceholder")}" required maxlength="120" />
        </div>
        <button type="submit" class="btn btn-primary" style="flex:1; height:44px; align-self:flex-end; margin-bottom:14px;">${t("btnAdd")}</button>
      </div>
    </form>

    <div class="section-title">${t("yourTopics")}</div>
    ${
      state.topics.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📚</div><p>${t("noTopics")}</p></div>`
        : state.topics
            .map(
              (topic) => `
        <div class="topic-item" data-action="open-topic" data-topic-id="${topic.id}">
          <div class="topic-info">
            <div class="topic-title">${escapeHtml(topic.title)}</div>
            <div class="topic-subject">${escapeHtml(subjectMap[topic.subject_id] || "")}</div>
          </div>
          <div class="topic-count">${t("studiedTimes").replace("{n}", topic.times_studied || 0)}</div>
        </div>`,
            )
            .join("")
    }
  `;
}

async function handleAddTopic(form) {
  const subjectSelect = document.getElementById("topic-subject");
  const title = form.topicTitle.value.trim();
  if (!title || !subjectSelect || !subjectSelect.value) return;

  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const { data, error } = await sbClient
      .from("topics")
      .insert({
        learner_id: state.learner.id,
        subject_id: subjectSelect.value,
        title,
      })
      .select()
      .single();
    if (error) throw error;
    await loadTopics();
    render();
    if (data) await openTopicSession(data.id);
  } catch (err) {
    console.error(err);
    showToast(t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

// ---------------------------------------------------------------------
// STUDY SESSION (Explain -> Example -> Attempt -> Feedback)
// ---------------------------------------------------------------------
async function openTopicSession(topicId) {
  const topic = state.topics.find((tp) => tp.id === topicId);
  if (!topic) return;

  const tier = state.profile.subscription_tier;
  if (tier === "free" && (state.sessionsToday >= 3 || getLocalSessionCount() >= 3)) {
    showToast(t("limitReachedMsg"), "error");
    return;
  }

  state.activeSession = {
    topicId,
    topicTitle: topic.title,
    messages: [],
    loading: true,
    chatLoading: false,
    explainText: null,
    exampleText: null,
    attemptQuestion: null,
    safetyFlag: false,
    error: null,
    retry: null,
  };
  render();
  await runSessionPhase("explain");
}

async function callStudyGuideApi(payload) {
  const res = await fetchWithTimeout(`${FN_URL}/generate-study-guide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

async function callStudyGuide(phase, learnerInput, context) {
  return callStudyGuideApi({ topicId: state.activeSession.topicId, phase, learnerInput, context });
}

function scrollChatToBottom() {
  requestAnimationFrame(() => {
    const el = document.getElementById("chat-scroll");
    if (el) el.scrollTop = el.scrollHeight;
  });
}

async function runSessionPhase(phase, learnerInput, context) {
  const s = state.activeSession;
  s.loading = true;
  s.error = null;
  s.retry = { phase, learnerInput, context };
  render();
  scrollChatToBottom();

  try {
    const data = await callStudyGuide(phase, learnerInput, context);
    if (data.safety_flag) {
      s.safetyFlag = true;
      s.messages.push({ role: "ai", phase: "feedback", text: data.response, safety: true });
    } else {
      let text = data.response;
      if (phase === "explain") {
        s.explainText = data.response;
        text = `${t("chatGreeting").replace("{topic}", s.topicTitle)}\n\n${data.response}`;
      } else if (phase === "example") {
        s.exampleText = data.response;
      } else if (phase === "attempt") {
        s.attemptQuestion = data.response;
      }
      s.messages.push({ role: "ai", phase, text, answerBox: phase === "attempt" });
    }

    if (phase === "explain") incrementLocalSessionCount();
  } catch (err) {
    s.error = err && err.name === "AbortError" ? t("errorRetryContent") : (err && err.message) || t("errorRetryContent");
    console.error("Study Guide API error", s.error);
  } finally {
    s.loading = false;
    render();
    scrollChatToBottom();
  }

  if (!s.error && !s.safetyFlag) {
    if (phase === "explain") {
      await runSessionPhase("example", null, { explainText: s.explainText });
    } else if (phase === "example") {
      await runSessionPhase("attempt", null, { exampleText: s.exampleText });
    } else if (phase === "feedback") {
      await finalizeStructuredSession();
    }
  }
}

function sessionRetry() {
  const s = state.activeSession;
  if (!s || !s.retry) return;
  runSessionPhase(s.retry.phase, s.retry.learnerInput, s.retry.context);
}

async function sessionSubmitAnswer(index) {
  const s = state.activeSession;
  const textarea = document.getElementById(`session-answer-${index}`);
  const answer = textarea ? textarea.value.trim() : "";
  if (!answer) {
    showToast(t("yourAnswerLabel"), "error");
    return;
  }

  const safe = await checkContent(answer, "learn-attempt", state.learner?.id);
  if (!safe) return;

  s.messages[index].answerBox = false;
  s.messages[index].answered = true;
  s.messages.push({ role: "learner", phase: "attempt-answer", text: answer });
  runSessionPhase("feedback", answer, { attemptQuestion: s.attemptQuestion });
}

async function sessionSendChat(form) {
  const input = form.querySelector('[name="chatMessage"]');
  const text = input ? input.value.trim() : "";
  if (!text) return;

  const safe = await checkContent(text, "learn-chat", state.learner?.id);
  if (!safe) return;

  const s = state.activeSession;
  if (!s || s.loading || s.chatLoading || s.safetyFlag) return;

  input.value = "";
  s.messages.push({ role: "learner", phase: "chat", text });
  s.chatLoading = true;
  render();
  scrollChatToBottom();

  const history = s.messages
    .filter((m) => !(m.role === "ai" && m.answerBox && !m.answered))
    .slice(-8)
    .map((m) => ({ role: m.role === "learner" ? "learner" : "ai", text: m.text }));

  try {
    const data = await callStudyGuide("chat", text, { history });
    if (data.safety_flag) {
      s.safetyFlag = true;
      s.messages.push({ role: "ai", phase: "chat", text: data.response, safety: true });
    } else {
      s.messages.push({ role: "ai", phase: "chat", text: data.response });
    }
  } catch (err) {
    const message = err && err.name === "AbortError" ? t("errorRetryContent") : (err && err.message) || t("errorRetryContent");
    s.messages.push({ role: "ai", phase: "chat", text: message });
  } finally {
    s.chatLoading = false;
    render();
    scrollChatToBottom();
  }
}

async function reloadLearner() {
  const { data } = await sbClient.from("learners").select("*").eq("id", state.learner.id).single();
  if (data) state.learner = data;
}

async function finalizeStructuredSession() {
  const previousSessionsCompleted = state.learner.sessions_completed || 0;

  await Promise.all([loadTopics(), loadSessionsToday(), reloadLearner()]);

  if (
    state.learner.sessions_completed > previousSessionsCompleted &&
    state.learner.sessions_completed > 0 &&
    state.learner.sessions_completed % 5 === 0
  ) {
    try {
      await sbClient.rpc("create_parent_alert", {
        p_learner_id: state.learner.id,
        p_alert_type: "study_streak",
        p_message: `${state.profile.full_name || "Your child"} just completed their ${state.learner.sessions_completed}th study session. Great consistency!`,
      });
    } catch (err) {
      console.warn("Could not create streak alert:", err);
    }
  }

  render();
}

async function sessionClose() {
  state.activeSession = null;
  await loadSessionsToday();
  render();
}

function renderSessionModal() {
  const s = state.activeSession;

  return `
    <div class="modal-overlay">
      <div class="modal-sheet chat-sheet">
        <div class="modal-header">
          <div class="chat-header-info">
            <span class="chat-avatar">L</span>
            <h3>${escapeHtml(s.topicTitle)}</h3>
          </div>
          <button class="modal-close" data-action="session-close">✕</button>
        </div>
        <div class="modal-body chat-body" id="chat-scroll">
          ${s.messages.map((msg, i) => renderChatMessage(msg, i)).join("")}
          ${
            s.loading || s.chatLoading
              ? `<div class="chat-row chat-row-ai">
                   <span class="chat-avatar">L</span>
                   <div class="chat-bubble chat-bubble-ai chat-typing"><span class="spinner spinner-purple"></span> ${t("generating")}</div>
                 </div>`
              : ""
          }
          ${
            s.error
              ? `<div class="card" style="border-left:4px solid var(--danger);">
                   <p>${escapeHtml(s.error)}</p>
                   <button class="btn btn-primary btn-block" style="margin-top:10px;" data-action="session-retry">${t("btnRetry")}</button>
                 </div>`
              : ""
          }
        </div>
        <div class="modal-footer chat-footer">
          ${
            s.safetyFlag
              ? ""
              : `<form data-action="session-chat-form" class="chat-input-row">
                   <input type="text" name="chatMessage" autocomplete="off" placeholder="${t("chatInputPlaceholder")}" ${s.loading || s.chatLoading ? "disabled" : ""} />
                   <button type="submit" class="btn btn-primary chat-send-btn" ${s.loading || s.chatLoading ? "disabled" : ""}>${t("btnSend")}</button>
                 </form>`
          }
        </div>
      </div>
    </div>
  `;
}

function renderChatMessage(msg, index) {
  if (msg.role === "learner") {
    return `<div class="chat-row chat-row-learner"><div class="chat-bubble chat-bubble-learner">${escapeHtml(msg.text)}</div></div>`;
  }

  const bubbleClass = msg.safety ? "chat-bubble-safety" : "chat-bubble-ai";
  const safetyPrefix = msg.safety ? `<strong>${t("supportResources")}</strong><br/><br/>` : "";
  let html = `
    <div class="chat-row chat-row-ai">
      <span class="chat-avatar">L</span>
      <div class="chat-bubble ${bubbleClass}">${safetyPrefix}${escapeHtml(msg.text)}</div>
    </div>`;

  if (msg.answerBox && !msg.answered) {
    html += `
      <div class="chat-answer-box">
        <textarea id="session-answer-${index}" rows="3" placeholder="${t("yourAnswerLabel")}"></textarea>
        <button class="btn btn-primary btn-block" data-action="session-submit-answer" data-index="${index}">${t("btnSubmitAnswer")}</button>
      </div>`;
  }

  return html;
}

// ---------------------------------------------------------------------
// EXAMS TAB
// ---------------------------------------------------------------------
function renderExamsTab() {
  const view = state.examsView || "studyguide";

  return `
    <div class="card">
      <h3 class="mt-0 screen-title">${t("examsHeading")}</h3>
      <span class="badge badge-gold">${t("yourDiagnosticLevel")}: ${state.learner.diagnostic_level}/5</span>
    </div>

    <div class="exams-toggle">
      <button class="exams-toggle-btn ${view === "studyguide" ? "active" : ""}" data-action="exams-switch-view" data-view="studyguide">${t("tabStudyGuide")}</button>
      <button class="exams-toggle-btn ${view === "mockexam" ? "active" : ""}" data-action="exams-switch-view" data-view="mockexam">${t("tabMockExam")}</button>
      <button class="exams-toggle-btn ${view === "refresher" ? "active" : ""}" data-action="exams-switch-view" data-view="refresher">${t("tabExamRefresher")}</button>
    </div>

    ${view === "studyguide" ? renderStudyGuideSection() : view === "mockexam" ? renderMockExamSection() : renderRefresherSection()}
  `;
}

function renderStudyGuideSection() {
  const sg = state.studyGuide;

  return `
    <div class="card">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="study-guide-subject">
          ${state.subjects.map((s) => `<option value="${s.id}" ${sg.subjectId === s.id ? "selected" : ""}>${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>${t("topicLabel")}</label>
        <input type="text" id="study-guide-topic" placeholder="${t("addTopicPlaceholder")}" maxlength="120" value="${escapeHtml(sg.topicTitle || "")}" />
      </div>
      <button class="btn btn-gold btn-block" data-action="generate-study-guide" ${sg.loading ? "disabled" : ""}>
        ${sg.loading ? `<span class="spinner"></span> ${t("generating")}` : t("btnGenerateStudyGuide")}
      </button>
    </div>

    ${sg.error ? `<div class="card" style="border-left:4px solid var(--danger);"><p>${escapeHtml(sg.error)}</p></div>` : ""}
    ${sg.result ? renderStudyGuideCard(sg) : ""}
  `;
}

function renderStudyGuideCard(sg) {
  const r = sg.result;
  const concepts = Array.isArray(r.keyConcepts) ? r.keyConcepts : [];

  return `
    <div class="card study-guide-card">
      <h3 class="mt-0">${escapeHtml(r.topicTitle || sg.topicTitle || "")}</h3>

      <div class="section-title" style="margin-top:0;">${t("keyConceptsLabel")}</div>
      <ul class="study-guide-list">
        ${concepts.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}
      </ul>

      <div class="section-title">${t("exampleLabel")}</div>
      <div class="ai-bubble">${escapeHtml(r.example || "")}</div>

      <div class="section-title">${t("selfCheckLabel")}</div>
      <div class="ai-bubble" style="margin-bottom:10px;">${escapeHtml(r.selfCheckQuestion || "")}</div>
      <div class="field">
        <textarea id="study-guide-answer" rows="3" placeholder="${t("yourAnswerLabel")}">${escapeHtml(sg.answer || "")}</textarea>
      </div>

      <button class="btn btn-primary btn-block" data-action="save-study-guide" ${sg.saving ? "disabled" : ""}>
        ${sg.saving ? `<span class="spinner"></span> ${t("loading")}` : sg.saved ? t("btnSaved") : t("btnSaveGuide")}
      </button>
    </div>
  `;
}

function renderMockExamSection() {
  const tier = state.profile.subscription_tier;
  const isPremium = tier === "premium";
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, s.name]));
  const completedExams = state.exams.filter((e) => e.completed_at);
  const mx = state.mockExamSetup;

  return `
    <div class="card">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="exam-subject">
          ${state.subjects.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>${t("selectTermLabel")}</label>
        <div class="pill-row">
          ${[1, 2, 3, 4]
            .map(
              (term) => `<button type="button" class="pill-btn ${mx.term === term ? "selected" : ""}" data-action="exam-set-term" data-term="${term}">${t(`term${term}`)}</button>`,
            )
            .join("")}
        </div>
      </div>
      <div class="field">
        <label>${t("examTopicsLabel")}</label>
        <textarea id="exam-topics" rows="3" placeholder="${t("examTopicsPlaceholder")}">${escapeHtml(mx.topics || "")}</textarea>
      </div>
      <div class="field">
        <label>${t("selectDifficultyLabel")}</label>
        <select id="exam-difficulty">
          <option value="low" selected>${t("diffLow")} ✅</option>
          <option value="medium" ${isPremium ? "" : "disabled"}>${t("diffMedium")}${isPremium ? "" : " 🔒"}</option>
          <option value="high" ${isPremium ? "" : "disabled"}>${t("diffHigh")}${isPremium ? "" : " 🔒"}</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" data-action="start-exam">${t("btnStartExam")}</button>
      ${
        !isPremium
          ? `<p class="muted" style="margin-top:10px;">${t("mediumHighPremiumNote")}</p>
             <button class="btn btn-gold btn-block" data-action="switch-tab" data-tab="account">${t("btnUpgradeToPremium")}</button>`
          : ""
      }
    </div>

    <div class="section-title">${t("completedExams")}</div>
    ${
      completedExams.length === 0
        ? `<div class="empty-state"><div class="empty-icon">📝</div><p>${t("noExams")}</p></div>`
        : completedExams
            .map(
              (exam) => `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>${escapeHtml(subjectMap[exam.subject_id] || "")}</strong>
              <div class="muted">${difficultyLabel(exam.difficulty)} • ${formatDate(exam.completed_at)}</div>
            </div>
            <div class="badge badge-purple">${exam.learner_score ?? "-"}/${exam.total_marks}</div>
          </div>
        </div>`,
            )
            .join("")
    }
  `;
}

function examsSwitchView(view) {
  state.examsView = view;
  render();
  // Refresh saved guides so any guide saved earlier this session shows up in
  // the Exam Refresher setup screen.
  if (view === "refresher") {
    loadSavedGuides()
      .then(() => render())
      .catch((err) => console.warn("Could not reload saved guides:", err));
  }
}

async function generateStudyGuide() {
  const subjectSelect = document.getElementById("study-guide-subject");
  const topicInput = document.getElementById("study-guide-topic");
  if (!subjectSelect || !topicInput) return;

  const topicTitle = topicInput.value.trim();
  if (!topicTitle) {
    showToast(t("enterTopicFirst"), "error");
    return;
  }

  const safe = await checkContent(topicTitle, "study-guide-topic", state.learner?.id);
  if (!safe) return;

  const sg = state.studyGuide;
  sg.subjectId = subjectSelect.value;
  sg.topicTitle = topicTitle;
  sg.loading = true;
  sg.error = null;
  sg.result = null;
  sg.answer = "";
  sg.saved = false;
  render();

  try {
    const data = await callStudyGuideApi({ phase: "studyguide", subjectId: sg.subjectId, topicTitle: sg.topicTitle });
    sg.result = data.studyGuide;
  } catch (err) {
    sg.error = err && err.name === "AbortError" ? t("errorRetryContent") : (err && err.message) || t("errorStudyGuideGeneration");
  } finally {
    sg.loading = false;
    render();
  }
}

async function saveStudyGuide() {
  const sg = state.studyGuide;
  if (!sg.result) return;

  const answerInput = document.getElementById("study-guide-answer");
  sg.answer = answerInput ? answerInput.value.trim() : "";
  sg.saving = true;
  render();

  try {
    const { error } = await sbClient.from("saved_guides").insert({
      learner_id: state.learner.id,
      subject_id: sg.subjectId,
      topic_title: sg.result.topicTitle || sg.topicTitle,
      key_concepts: sg.result.keyConcepts || [],
      example: sg.result.example || "",
      self_check_question: sg.result.selfCheckQuestion || "",
      self_check_answer: sg.answer || null,
    });
    if (error) throw error;
    sg.saved = true;
    showToast(t("studyGuideSaved"), "success");
  } catch (err) {
    console.error(err);
    showToast(t("errorGeneric"), "error");
  } finally {
    sg.saving = false;
    render();
  }
}

// ---------------------------------------------------------------------
// EXAM REFRESHER
// ---------------------------------------------------------------------
let refresherTimerId = null;

function renderRefresherSection() {
  const r = state.refresher;
  if (r.step === "active") return renderRefresherActive();
  if (r.step === "complete") return renderRefresherComplete();
  return renderRefresherSetup();
}

const REFRESHER_LEVELS = [
  { level: "confident", emoji: "💪", labelKey: "levelConfidentLabel", descKey: "levelConfidentDesc" },
  { level: "revising", emoji: "📖", labelKey: "levelRevisingLabel", descKey: "levelRevisingDesc" },
  { level: "rescue", emoji: "🆘", labelKey: "levelRescueLabel", descKey: "levelRescueDesc" },
];

function renderRefresherSetup() {
  const r = state.refresher;
  const guides = state.savedGuides || [];

  // The Exam Refresher revises topics the learner has already saved as Study
  // Guides. Only offer subjects (and topics) that have saved guides.
  if (guides.length === 0) {
    return `
      <div class="card">
        <div class="empty-state">
          <div class="empty-icon">📘</div>
          <p>${t("noSavedGuides")}</p>
        </div>
        <button class="btn btn-gold btn-block" data-action="exams-switch-view" data-view="studyguide">${t("btnGoToStudyGuide")}</button>
      </div>
    `;
  }

  const subjectName = Object.fromEntries(state.subjects.map((s) => [s.id, s.name]));
  const guideSubjectIds = [...new Set(guides.map((g) => g.subject_id).filter(Boolean))];
  const subjectId = guideSubjectIds.includes(r.subjectId) ? r.subjectId : guideSubjectIds[0] || null;
  const guidesForSubject = guides.filter((g) => g.subject_id === subjectId);

  return `
    <div class="card">
      <h3 class="mt-0 screen-title">${t("refresherSetupHeading")}</h3>

      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="refresher-subject" data-action="refresher-subject-select">
          ${guideSubjectIds.map((id) => `<option value="${id}" ${id === subjectId ? "selected" : ""}>${escapeHtml(subjectName[id] || "")}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>${t("selectTopicsLabel")}</label>
        <div class="chip-row">
          ${guidesForSubject
            .map(
              (g) => `<button type="button" class="topic-chip ${r.selectedTopics.includes(g.id) ? "selected" : ""}" data-action="refresher-toggle-topic" data-topic-id="${g.id}">${escapeHtml(g.topic_title)}</button>`,
            )
            .join("")}
        </div>
      </div>

      <div class="field">
        <label>${t("sessionLengthLabel")}</label>
        <div class="pill-row">
          ${[20, 30, 40]
            .map(
              (d) => `<button type="button" class="pill-btn ${r.duration === d ? "selected" : ""}" data-action="refresher-set-duration" data-duration="${d}">${t(`min${d}`)}</button>`,
            )
            .join("")}
        </div>
      </div>

      <div class="field">
        <label>${t("prepLevelLabel")}</label>
        <div class="level-card-list">
          ${REFRESHER_LEVELS.map((lvl) => renderRefresherLevelCard(lvl)).join("")}
        </div>
      </div>

      ${r.error ? `<p style="color:var(--danger);">${escapeHtml(r.error)}</p>` : ""}

      <button class="btn btn-gold btn-block" data-action="refresher-start" ${r.loading ? "disabled" : ""}>
        ${r.loading ? `<span class="spinner"></span> ${t("generatingRefresher")}` : t("btnStartRefresher")}
      </button>
    </div>
  `;
}

function renderRefresherLevelCard(lvl) {
  const r = state.refresher;
  return `
    <div class="level-card ${r.level === lvl.level ? "selected" : ""}" data-action="refresher-set-level" data-level="${lvl.level}">
      <div class="level-card-emoji">${lvl.emoji}</div>
      <div class="level-card-label">${t(lvl.labelKey)}</div>
      <div class="level-card-desc">${t(lvl.descKey)}</div>
    </div>
  `;
}

function refresherSubjectChange(subjectId) {
  const r = state.refresher;
  r.subjectId = subjectId;
  r.selectedTopics = [];
  render();
}

function refresherToggleTopic(topicId) {
  const r = state.refresher;
  const idx = r.selectedTopics.indexOf(topicId);
  if (idx === -1) r.selectedTopics.push(topicId);
  else r.selectedTopics.splice(idx, 1);
  render();
}

function refresherSetDuration(duration) {
  state.refresher.duration = duration;
  render();
}

function refresherSetLevel(level) {
  state.refresher.level = level;
  render();
}

async function refresherStart() {
  const r = state.refresher;
  if (!r.selectedTopics.length) {
    showToast(t("selectAtLeastOneTopic"), "error");
    return;
  }

  const subjectSelect = document.getElementById("refresher-subject");
  r.subjectId = (subjectSelect && subjectSelect.value) || r.subjectId;

  // selectedTopics holds saved_guide ids - map them to their topic titles
  // (deduped) to send to the edge function, which generates fresh content.
  const guideMap = Object.fromEntries((state.savedGuides || []).map((g) => [g.id, g.topic_title]));
  const topicTitles = [...new Set(r.selectedTopics.map((id) => guideMap[id]).filter(Boolean))];
  if (!topicTitles.length) {
    showToast(t("selectAtLeastOneTopic"), "error");
    return;
  }

  r.loading = true;
  r.error = null;
  render();

  try {
    const data = await callStudyGuideApi({
      phase: "refresher",
      subjectId: r.subjectId,
      topics: topicTitles,
      level: r.level,
      duration: r.duration,
    });

    const sections = (data.refresher?.sections || []).map((sec) => ({
      topicTitle: sec.topicTitle || "",
      summary: Array.isArray(sec.summary) ? sec.summary : [],
      definitions: Array.isArray(sec.definitions) ? sec.definitions : [],
      workedExample: sec.workedExample || "",
      questions: (Array.isArray(sec.questions) ? sec.questions : []).map((q) => ({
        question: q.question || "",
        marks: q.marks || null,
        answer: "",
        submitted: false,
        loading: false,
        feedback: null,
      })),
      expanded: true,
    }));

    if (!sections.length) {
      r.error = t("errorRefresherGeneration");
      r.loading = false;
      render();
      return;
    }

    r.sections = sections;
    r.totalSeconds = r.duration * 60;
    r.remainingSeconds = r.totalSeconds;
    r.paused = false;
    r.step = "active";
    r.loading = false;
    render();
    startRefresherTimer();
  } catch (err) {
    r.error = err && err.name === "AbortError" ? t("errorRetryContent") : (err && err.message) || t("errorRefresherGeneration");
    r.loading = false;
    render();
  }
}

function startRefresherTimer() {
  stopRefresherTimer();
  refresherTimerId = setInterval(() => {
    const r = state.refresher;
    if (r.paused) return;
    r.remainingSeconds = Math.max(0, r.remainingSeconds - 1);
    updateRefresherTimerDisplay();
    if (r.remainingSeconds <= 0) {
      refresherEndSession();
    }
  }, 1000);
}

function stopRefresherTimer() {
  if (refresherTimerId) {
    clearInterval(refresherTimerId);
    refresherTimerId = null;
  }
}

function updateRefresherTimerDisplay() {
  const r = state.refresher;
  const timerEl = document.getElementById("refresher-timer");
  const fillEl = document.getElementById("refresher-progress-fill");
  if (timerEl) {
    timerEl.textContent = formatTimer(r.remainingSeconds);
    timerEl.classList.toggle("timer-danger", r.remainingSeconds <= 300);
  }
  if (fillEl) {
    const pct = r.totalSeconds > 0 ? Math.min(100, ((r.totalSeconds - r.remainingSeconds) / r.totalSeconds) * 100) : 0;
    fillEl.style.width = `${pct}%`;
  }
}

function formatTimer(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function refresherTogglePause() {
  state.refresher.paused = !state.refresher.paused;
  render();
}

function refresherEndSession() {
  stopRefresherTimer();
  state.refresher.step = "complete";
  render();
}

function refresherToggleSection(index) {
  const r = state.refresher;
  if (!r.sections || !r.sections[index]) return;
  r.sections[index].expanded = !r.sections[index].expanded;
  render();
}

async function refresherSubmitAnswer(sectionIndex, questionIndex) {
  const r = state.refresher;
  const section = r.sections && r.sections[sectionIndex];
  const question = section && section.questions[questionIndex];
  if (!section || !question) return;

  const textarea = document.getElementById(`refresher-answer-${sectionIndex}-${questionIndex}`);
  const answer = textarea ? textarea.value.trim() : "";
  if (!answer) {
    showToast(t("yourAnswerLabel"), "error");
    return;
  }

  const safe = await checkContent(answer, "refresher-answer", state.learner?.id);
  if (!safe) return;

  question.answer = answer;
  question.loading = true;
  render();

  try {
    const data = await callStudyGuideApi({
      phase: "refresher-feedback",
      subjectId: r.subjectId,
      topicTitle: section.topicTitle,
      learnerInput: answer,
      level: r.level,
      context: { refresherQuestion: question.question },
    });

    question.feedback = data.feedback || { correct: false, feedback: "" };
    question.submitted = true;
  } catch (err) {
    question.feedback = { correct: false, feedback: (err && err.message) || t("errorRetryContent") };
    question.submitted = true;
  } finally {
    question.loading = false;
    render();
  }
}

function refresherTryAgain() {
  stopRefresherTimer();
  const r = state.refresher;
  r.step = "setup";
  r.sections = null;
  r.error = null;
  r.paused = false;
  r.totalSeconds = 0;
  r.remainingSeconds = 0;
  render();
}

function refresherBackToStudy() {
  stopRefresherTimer();
  const r = state.refresher;
  r.step = "setup";
  r.sections = null;
  r.selectedTopics = [];
  r.error = null;
  r.paused = false;
  r.totalSeconds = 0;
  r.remainingSeconds = 0;
  state.examsView = "studyguide";
  render();
}

function renderRefresherActive() {
  const r = state.refresher;
  const pct = r.totalSeconds > 0 ? Math.min(100, ((r.totalSeconds - r.remainingSeconds) / r.totalSeconds) * 100) : 0;

  return `
    <div class="card">
      <div class="refresher-timer-row">
        <h3 class="mt-0 screen-title">${t("tabExamRefresher")}</h3>
        <span id="refresher-timer" class="refresher-timer ${r.remainingSeconds <= 300 ? "timer-danger" : ""}">${formatTimer(r.remainingSeconds)}</span>
      </div>
      <div class="progress-bar">
        <div id="refresher-progress-fill" class="progress-bar-fill progress-bar-fill-purple" style="width:${pct}%;"></div>
      </div>
      <button class="btn btn-outline btn-block" data-action="refresher-toggle-pause">${r.paused ? t("btnResume") : t("btnPause")}</button>
    </div>

    ${(r.sections || []).map((sec, i) => renderRefresherSectionCard(sec, i)).join("")}

    <button class="btn btn-gold btn-block" data-action="refresher-end-session">${t("btnEndSession")}</button>
  `;
}

function renderRefresherSectionCard(section, index) {
  return `
    <div class="card refresher-section-card">
      <button type="button" class="refresher-section-header" data-action="refresher-toggle-section" data-index="${index}">
        <span>${escapeHtml(section.topicTitle)}</span>
        <span class="refresher-section-chevron">${section.expanded ? "▾" : "▸"}</span>
      </button>
      ${section.expanded ? renderRefresherSectionBody(section, index) : ""}
    </div>
  `;
}

function renderRefresherSectionBody(section, index) {
  return `
    <div class="refresher-section-body">
      ${
        section.summary.length
          ? `<div class="section-title">${t("summaryLabel")}</div>
             <ul class="study-guide-list">${section.summary.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
          : ""
      }
      ${
        section.definitions.length
          ? `<div class="section-title">${t("definitionsLabel")}</div>
             <ul class="study-guide-list">${section.definitions.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>`
          : ""
      }
      ${
        section.workedExample
          ? `<div class="section-title">${t("workedExampleLabel")}</div>
             <div class="ai-bubble">${escapeHtml(section.workedExample)}</div>`
          : ""
      }
      ${
        section.questions.length
          ? `<div class="section-title">${t("practiceQuestionsLabel")}</div>
             ${section.questions.map((q, qi) => renderRefresherQuestion(q, index, qi)).join("")}`
          : ""
      }
    </div>
  `;
}

function renderRefresherQuestion(question, sectionIndex, questionIndex) {
  const marks = question.marks ? ` (${question.marks} ${t("marksLabel")})` : "";
  return `
    <div class="refresher-question">
      <div class="ai-bubble">${escapeHtml(question.question)}${escapeHtml(marks)}</div>
      ${
        question.submitted
          ? ""
          : `<div class="chat-answer-box">
               <textarea id="refresher-answer-${sectionIndex}-${questionIndex}" rows="3" placeholder="${t("yourAnswerLabel")}">${escapeHtml(question.answer || "")}</textarea>
               <button class="btn btn-primary btn-block" data-action="refresher-submit-answer" data-section-index="${sectionIndex}" data-question-index="${questionIndex}" ${question.loading ? "disabled" : ""}>
                 ${question.loading ? `<span class="spinner"></span> ${t("generating")}` : t("btnSubmitAnswer")}
               </button>
             </div>`
      }
      ${
        question.feedback
          ? `<div class="refresher-feedback ${question.feedback.correct ? "feedback-correct" : "feedback-incorrect"}">
               <strong>${question.feedback.correct ? t("correctLabel") : t("incorrectLabel")}</strong>
               <p>${escapeHtml(question.feedback.feedback || "")}</p>
             </div>`
          : ""
      }
    </div>
  `;
}

function renderRefresherComplete() {
  const r = state.refresher;
  const sections = r.sections || [];
  const allQuestions = sections.flatMap((s) => s.questions);
  const attempted = allQuestions.filter((q) => q.submitted).length;
  const correct = allQuestions.filter((q) => q.submitted && q.feedback && q.feedback.correct).length;
  const timeUsed = Math.max(0, r.totalSeconds - r.remainingSeconds);

  let motivationKey = "motivationLow";
  if (attempted > 0) {
    const ratio = correct / attempted;
    if (ratio >= 0.7) motivationKey = "motivationHigh";
    else if (ratio >= 0.4) motivationKey = "motivationMedium";
  }

  return `
    <div class="card text-center">
      <h3 class="mt-0 screen-title">${t("sessionCompleteHeading")}</h3>
      <div class="refresher-stat-row">
        <span>${t("timeUsedLabel")}</span>
        <strong>${formatTimer(timeUsed)}</strong>
      </div>
      <div class="refresher-stat-row">
        <span>${t("topicsCoveredLabel")}</span>
        <strong>${sections.length}</strong>
      </div>
      <div class="refresher-stat-row">
        <span>${t("questionsAttemptedLabel")}</span>
        <strong>${attempted} / ${allQuestions.length}</strong>
      </div>
      <div class="refresher-stat-row">
        <span>${t("questionsCorrectLabel")}</span>
        <strong>${correct} / ${attempted}</strong>
      </div>
      <p class="muted">${t(motivationKey)}</p>
      <button class="btn btn-outline btn-block" data-action="refresher-try-again">${t("btnTryAgain")}</button>
      <button class="btn btn-gold btn-block" style="margin-top:10px;" data-action="refresher-back-to-study">${t("btnBackToStudy")}</button>
    </div>
  `;
}

function examSetTerm(term) {
  const topicsTextarea = document.getElementById("exam-topics");
  if (topicsTextarea) state.mockExamSetup.topics = topicsTextarea.value;
  state.mockExamSetup.term = term;
  render();
}

async function startMockExam() {
  const subjectSelect = document.getElementById("exam-subject");
  const difficultySelect = document.getElementById("exam-difficulty");
  const topicsTextarea = document.getElementById("exam-topics");
  if (!subjectSelect || !difficultySelect) return;

  const topicsText = topicsTextarea ? topicsTextarea.value : "";

  const safe = await checkContent(topicsText, "mock-exam-topics", state.learner?.id);
  if (!safe) return;

  const difficulty = difficultySelect.value;
  const term = state.mockExamSetup.term;
  const topics = topicsText
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  const btn = document.querySelector('[data-action="start-exam"]');
  setButtonLoading(btn, true);

  console.log("📋 Mock Exam API", { difficulty, term, topics, status: "calling" });

  try {
    const res = await fetchWithTimeout(`${FN_URL}/generate-mock-exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        learnerId: state.learner.id,
        subjectId: subjectSelect.value,
        difficulty,
        term,
        topics,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw data;

    state.activeExam = {
      examId: data.examId,
      subjectId: subjectSelect.value,
      difficulty,
      questions: data.questions,
      answers: {},
      currentIndex: 0,
      loading: false,
      results: null,
      error: null,
    };
    console.log("📋 Mock Exam API", {
      difficulty,
      status: "success",
      questionCount: data.questions.length,
      totalMarks: data.totalMarks,
    });
    render();
  } catch (err) {
    const message = err && err.name === "AbortError" ? "Request timed out" : err && err.message;
    console.error("📋 Mock Exam API ERROR", message || err);
    const toastMessage = err && err.error === "premium_required" ? err.message : t("errorExamGeneration");
    showToast(toastMessage, "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

function examCurrentQuestion() {
  const e = state.activeExam;
  return e.questions[e.currentIndex];
}

function examSelectOption(optionText) {
  const e = state.activeExam;
  const q = examCurrentQuestion();
  e.answers[q.id] = optionText;
  render();
}

function examSaveCurrentAnswer() {
  const e = state.activeExam;
  const q = examCurrentQuestion();
  if (q.question_type !== "mcq") {
    const textarea = document.getElementById(`exam-answer-${q.id}`);
    if (textarea) e.answers[q.id] = textarea.value.trim();
  }
}

function examNextQuestion() {
  const e = state.activeExam;
  examSaveCurrentAnswer();
  e.currentIndex++;
  render();
}

async function submitExam() {
  const e = state.activeExam;
  examSaveCurrentAnswer();

  const responses = e.questions.map((q) => ({
    questionId: q.id,
    answer: e.answers[q.id] || "",
  }));

  e.loading = true;
  render();

  try {
    const res = await fetchWithTimeout(`${FN_URL}/grade-mock-exam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ examId: e.examId, responses }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    e.results = data;

    const percentage = data.totalMarks > 0 ? Math.round((data.totalAwarded / data.totalMarks) * 100) : 0;
    console.log("💾 Exam submitted", { score: data.totalAwarded, total: data.totalMarks, percentage });
  } catch (err) {
    const message = err && err.name === "AbortError" ? "Request timed out" : err && err.message;
    console.error("📋 Mock Exam API ERROR", message || err);
    showToast(message || t("errorGeneric"), "error");
  } finally {
    e.loading = false;
    render();
  }
}

function examClose() {
  state.activeExam = null;
  render();
}

async function examDone() {
  state.activeExam = null;
  await loadExams();
  render();
}

function renderExamModal() {
  const e = state.activeExam;
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, s.name]));

  if (e.results) {
    const percentage = e.results.totalMarks > 0 ? Math.round((e.results.totalAwarded / e.results.totalMarks) * 100) : 0;
    return `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <h3>${t("examResultsHeading")}</h3>
            <button class="modal-close" data-action="exam-done">✕</button>
          </div>
          <div class="modal-body">
            <div class="result-bar">
              <div class="result-score">${e.results.totalAwarded}/${e.results.totalMarks} (${percentage}%)</div>
              <div class="muted">${t("yourScore")}</div>
            </div>
            ${e.questions
              .map((q, i) => {
                const r = e.results.results.find((res) => res.question_id === q.id);
                return `
                <div class="exam-question">
                  <div class="q-head"><span>${t("questionLabel")} ${i + 1}</span><span>${r?.marks_awarded ?? 0}/${q.marks}</span></div>
                  <div class="q-text">${escapeHtml(q.question_text)}</div>
                  <p class="muted">${escapeHtml(r?.feedback || "")}</p>
                </div>`;
              })
              .join("")}
          </div>
          <div class="modal-footer">
            <button class="btn btn-gold btn-block" data-action="exam-done">${t("btnDone")}</button>
          </div>
        </div>
      </div>
    `;
  }

  const q = e.questions[e.currentIndex];
  const isLast = e.currentIndex === e.questions.length - 1;
  const progress = ((e.currentIndex + 1) / e.questions.length) * 100;
  const selectedAnswer = e.answers[q.id] || "";

  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${escapeHtml(subjectMap[e.subjectId] || "")} - ${difficultyLabel(e.difficulty)}</h3>
          <button class="modal-close" data-action="exam-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
          <div class="section-title">${t("questionLabel")} ${e.currentIndex + 1} ${t("examOf").replace("{n}", e.questions.length)}</div>
          <div class="exam-question">
            <div class="q-head"><span>${t("questionLabel")} ${e.currentIndex + 1}</span><span>${q.marks} marks</span></div>
            <div class="q-text">${escapeHtml(q.question_text)}</div>
            ${
              q.question_type === "mcq" && Array.isArray(q.options)
                ? q.options
                    .map(
                      (opt) => `
              <div class="option-btn ${selectedAnswer === opt ? "selected" : ""}" data-action="exam-select-option" data-option="${escapeHtml(opt)}">
                ${escapeHtml(opt)}
              </div>`,
                    )
                    .join("")
                : `<textarea id="exam-answer-${q.id}" rows="4" ${e.loading ? "disabled" : ""}>${escapeHtml(e.answers[q.id] || "")}</textarea>`
            }
          </div>
        </div>
        <div class="modal-footer">
          ${
            isLast
              ? `<button class="btn btn-primary btn-block" data-action="submit-exam" ${e.loading ? "disabled" : ""}>
                   ${e.loading ? `<span class="spinner"></span> ${t("loading")}` : t("btnSubmitExam")}
                 </button>`
              : `<button class="btn btn-primary btn-block" data-action="exam-next-question">${t("btnNextExamQuestion")}</button>`
          }
        </div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// PARENT DASHBOARD - HOME TAB
// ---------------------------------------------------------------------
const ALERT_ICONS = {
  safety_flag: "🚨",
  safety_flag_crisis: "🚨",
  safety_flag_language: "🚨",
  low_performance: "📉",
  study_streak: "🔥",
};

function renderChildSelector() {
  if (state.linkedLearners.length <= 1) return "";
  return `
    <div class="pill-row child-selector">
      ${state.linkedLearners
        .map(
          (l) => `<button type="button" class="pill-btn ${state.selectedLearnerId === l.id ? "selected" : ""}" data-action="select-child" data-learner-id="${l.id}">${escapeHtml(l.full_name)}</button>`,
        )
        .join("")}
    </div>
  `;
}

function renderParentHomeTab() {
  const profile = state.profile;
  const displayName = (profile.full_name || "").trim() || (profile.email || "").split("@")[0] || "";
  const firstName = displayName.split(/\s+/)[0] || "";
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "greetingMorning" : hour < 18 ? "greetingAfternoon" : "greetingEvening";

  const greetingCard = `
    <div class="card home-greeting-card">
      <div class="home-greeting">${t(greetingKey)}, ${escapeHtml(firstName)} 👋</div>
    </div>
  `;

  if (state.linkedLearners.length === 0) {
    return `
      ${greetingCard}
      <div class="empty-state">
        <div class="empty-icon">👨‍👩‍👧</div>
        <p>${t("noChildrenLinked")}</p>
        <button class="btn btn-primary" style="margin-top:14px;" data-action="open-link-child-modal">${t("btnLinkAnotherChild")}</button>
      </div>
      ${state.linkChildModalOpen ? renderLinkChildModal() : ""}
    `;
  }

  const learner = getSelectedLearner();
  const unreadAlerts = (learner.alerts || []).filter((a) => !a.read_at);

  return `
    ${greetingCard}
    ${renderChildSelector()}

    ${
      unreadAlerts.length > 0
        ? `<div class="alert-banner alert-banner-danger">
            <span class="alert-banner-icon">🚨</span>
            <span>${unreadAlerts.length === 1 ? t("alertsActiveBannerOne") : t("alertsActiveBannerMany").replace("{n}", unreadAlerts.length)}</span>
          </div>
          ${unreadAlerts.map((a) => renderAlertItem(a)).join("")}`
        : `<div class="alert-banner alert-banner-ok">
            <span class="alert-banner-icon">✅</span>
            <span>${t("allLookingGood")}</span>
          </div>`
    }

    <div class="account-stats" style="margin-top:var(--spacing-16);">
      <div class="account-stat">
        <div class="num">${learner.streak_days || 0}</div>
        <div class="lbl">${t("statStreak")}</div>
      </div>
      <div class="account-stat">
        <div class="num">${learner.weekSessionsCount}</div>
        <div class="lbl">${t("statSessionsWeek")}</div>
      </div>
      <div class="account-stat">
        <div class="num">${learner.diagnostic_level || 0}</div>
        <div class="lbl">${t("statLevel")}</div>
      </div>
    </div>

    <div class="card">
      <div class="account-section-row">
        <span class="account-section-label">${t("statLastActive")}</span>
        <span class="muted">${formatDateTime(learner.last_session)}</span>
      </div>
    </div>

    ${state.linkChildModalOpen ? renderLinkChildModal() : ""}
  `;
}

// ---------------------------------------------------------------------
// PARENT DASHBOARD - ACTIVITY TAB (read-only)
// ---------------------------------------------------------------------
function renderParentActivityTab() {
  if (state.linkedLearners.length === 0) {
    return `
      <h3 class="screen-title" style="margin:0 0 14px;">${t("activityHeading")}</h3>
      <div class="empty-state"><div class="empty-icon">📊</div><p>${t("noChildrenLinked")}</p></div>
    `;
  }

  const learner = getSelectedLearner();

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">${t("activityHeading")}</h3>
    ${renderChildSelector()}

    <div class="card">
      <div class="section-title" style="margin-top:0;">${t("thisWeekHeading")}</div>
      <div class="stat-grid">
        <div class="stat-box"><div class="num">${learner.weekSessionsCount}</div><div class="lbl">${t("sessionsCompletedLabel")}</div></div>
        <div class="stat-box"><div class="num">${learner.weekSubjects.length}</div><div class="lbl">${t("topicsStudiedHeading")}</div></div>
      </div>
      ${
        learner.weekSubjects.length > 0
          ? `<div class="chip-row" style="margin-top:var(--spacing-12);">
              ${learner.weekSubjects.map((s) => `<span class="topic-chip">${escapeHtml(s)}</span>`).join("")}
            </div>`
          : ""
      }
    </div>

    <div class="section-title">${t("mockExamsHeading")}</div>
    ${
      learner.exams.length === 0
        ? `<p class="muted">${t("noMockExams")}</p>`
        : learner.exams.map((exam) => renderParentExamItem(exam)).join("")
    }

    <div class="section-title">${t("sessionHistoryHeading")}</div>
    ${renderSessionHistory(learner.sessions || [])}
  `;
}

function renderSessionHistory(sessions) {
  if (!sessions || sessions.length === 0) {
    return `<p class="muted">${t("noSessionsRecorded")}</p>`;
  }

  const groups = [];
  let lastLabel = null;
  for (const session of sessions) {
    const label = sessionDateGroupLabel(session.created_at);
    if (label !== lastLabel) {
      groups.push({ label, sessions: [] });
      lastLabel = label;
    }
    groups[groups.length - 1].sessions.push(session);
  }

  return groups
    .map((group) => {
      const isOpen = state.expandedDateGroups.has(group.label);
      const count = group.sessions.length;
      const countLabel = (count === 1 ? t("sessionCountOne") : t("sessionCountMany")).replace("{n}", count);
      return `
        <button type="button" class="session-date-header" data-action="toggle-date-group" data-date-label="${escapeHtml(group.label)}">
          <span>${escapeHtml(group.label)} (${escapeHtml(countLabel)})</span>
          <span class="session-date-chevron">${isOpen ? "▼" : "▶"}</span>
        </button>
        ${isOpen ? group.sessions.map((session) => renderSessionHistoryItem(session)).join("") : ""}
      `;
    })
    .join("");
}

function sessionDateGroupLabel(value) {
  if (!value) return "";
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d, today)) return t("today");
  if (isSameDay(d, yesterday)) return t("yesterday");
  return formatDate(value);
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function sessionPhaseLabel(phase) {
  return t(`phase${capitalize(phase)}`);
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

function renderSessionHistoryItem(session) {
  const expanded = !!state.expandedSessionIds[session.id];

  return `
    <div class="card session-history-card">
      <div class="session-history-header">
        <span class="session-phase-tag">${escapeHtml(sessionPhaseLabel(session.phase))}</span>
        <span class="muted session-history-time">${formatDateTime(session.created_at)}</span>
      </div>
      <p class="session-history-preview">${escapeHtml(truncateText(session.learner_input || "", 100))}</p>
      <button type="button" class="link-btn" data-action="toggle-session-detail" data-session-id="${session.id}">
        ${expanded ? t("hideFullSession") : t("viewFullSession")}
      </button>
      ${
        expanded
          ? `
        <div class="session-history-detail">
          <div class="session-history-block">
            <div class="session-history-label">${t("learnerLabel")}</div>
            <div class="ai-bubble session-history-text">${escapeHtml(session.learner_input || "")}</div>
          </div>
          <div class="session-history-block">
            <div class="session-history-label">${t("appName")}™:</div>
            <div class="ai-bubble session-history-text session-history-ai">${escapeHtml(session.ai_response || "")}</div>
          </div>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderParentExamItem(exam) {
  const hasScore = exam.learner_score !== null && exam.learner_score !== undefined;
  const pct = hasScore && exam.total_marks ? Math.round((exam.learner_score / exam.total_marks) * 100) : null;
  const scoreClass = pct === null ? "" : pct >= 70 ? "score-good" : pct >= 50 ? "score-mid" : "score-low";

  return `
    <div class="activity-item">
      <div class="account-section-row">
        <div>
          <div style="font-weight:700;">${escapeHtml(exam.subjectName)}</div>
          <div class="muted">${difficultyLabel(exam.difficulty)} · ${formatDate(exam.created_at)}</div>
        </div>
        <div class="exam-score ${scoreClass}">${pct === null ? "—" : pct + "%"}</div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------
// PARENT DASHBOARD - GOALS TAB
// ---------------------------------------------------------------------
function renderParentGoalsTab() {
  if (state.linkedLearners.length === 0) {
    return `
      <h3 class="screen-title" style="margin:0 0 14px;">${t("goalsHeading")}</h3>
      <div class="empty-state"><div class="empty-icon">🎯</div><p>${t("noChildrenLinked")}</p></div>
    `;
  }

  const learner = getSelectedLearner();
  const draft = getGoalsDraft(learner);
  const firstName = (learner.full_name || "").split(/\s+/)[0] || learner.full_name;

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">${t("goalsHeading")}</h3>
    ${renderChildSelector()}

    <div class="card">
      <div class="section-title" style="margin-top:0;">${t("weeklySessionTargetLabel")}</div>
      <p class="muted">${t("weeklySessionTargetHelp").replace("{name}", escapeHtml(firstName))}</p>
      <div class="field" style="margin-bottom:0;">
        <input type="number" min="1" max="14" data-action="goals-set-target" value="${draft.weeklyTarget}" />
      </div>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">${t("focusSubjectsLabel")}</div>
      <p class="muted">${t("focusSubjectsHelp").replace("{name}", escapeHtml(firstName))}</p>
      <div class="chip-row" style="margin-top:var(--spacing-12);">
        ${learner.gradeSubjects
          .map(
            (s) => `<button type="button" class="topic-chip ${draft.focusSubjects.includes(s.id) ? "selected" : ""}" data-action="goals-toggle-subject" data-subject-id="${s.id}" data-learner-id="${learner.id}">${escapeHtml(s.name)}</button>`,
          )
          .join("")}
      </div>
    </div>

    <p class="muted">${t("goalsVisibleNote").replace("{name}", escapeHtml(firstName))}</p>
    <button class="btn btn-primary btn-block" data-action="goals-save">${t("btnSaveGoals")}</button>
  `;
}

async function saveGoals() {
  const learner = getSelectedLearner();
  if (!learner) return;
  const draft = getGoalsDraft(learner);

  try {
    const { error } = await sbClient.rpc("update_learner_goals", {
      p_learner_id: learner.id,
      p_weekly_target: draft.weeklyTarget,
      p_focus_subjects: draft.focusSubjects,
    });
    if (error) throw error;

    learner.weekly_session_target = draft.weeklyTarget;
    learner.focus_subjects = [...draft.focusSubjects];
    showToast(t("goalsSaved"), "success");
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

function goalsToggleSubject(learnerId, subjectId) {
  const learner = state.linkedLearners.find((l) => l.id === learnerId);
  if (!learner) return;
  const draft = getGoalsDraft(learner);
  const idx = draft.focusSubjects.indexOf(subjectId);
  if (idx >= 0) draft.focusSubjects.splice(idx, 1);
  else draft.focusSubjects.push(subjectId);
  render();
}

function goalsSetTarget(value) {
  const learner = getSelectedLearner();
  if (!learner) return;
  const draft = getGoalsDraft(learner);
  let n = parseInt(value, 10);
  if (isNaN(n)) n = 3;
  draft.weeklyTarget = Math.max(1, Math.min(14, n));
}

// Escape the message, then turn any https:// URL into a clickable link
// (used for the content-flag acknowledgment link in safety alerts).
function linkifyAlertMessage(message) {
  return escapeHtml(message || "").replace(
    /(https:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noopener">$1</a>',
  );
}

function renderAlertItem(alert) {
  return `
    <div class="alert-item ${alert.read_at ? "" : "unread"}">
      <span class="alert-icon">${ALERT_ICONS[alert.alert_type] || "🔔"}</span>
      <div style="flex:1;">
        <div>${linkifyAlertMessage(alert.message)}</div>
        <div class="alert-meta">${formatDateTime(alert.created_at)}</div>
        ${!alert.read_at ? `<button class="link-btn" data-action="mark-alert-read" data-alert-id="${alert.id}">${t("markRead")}</button>` : ""}
      </div>
    </div>
  `;
}

async function markAlertRead(alertId) {
  try {
    await sbClient.from("parent_alerts").update({ read_at: new Date().toISOString() }).eq("id", alertId);
    await loadParentData();
    render();
  } catch (err) {
    console.error(err);
    showToast(t("errorGeneric"), "error");
  }
}

// ---------------------------------------------------------------------
// LINK CHILD (post-signup screen + account tab modal)
// ---------------------------------------------------------------------
function renderLinkChildScreen() {
  return `
    <div class="diagnostic-overlay" id="link-child-screen">
      <div class="diagnostic-modal">
        ${diagnosticHeaderBar()}
        <div class="diagnostic-body diagnostic-center">
          <h2 class="diagnostic-title">${t("linkChildHeading")}</h2>
          <p class="diagnostic-lead">${t("linkChildIntro")}</p>
          <form data-action="link-child-screen-form" style="width:100%;">
            <div class="field">
              <label>${t("linkChildEmailLabel")}</label>
              <input type="email" name="childEmail" placeholder="${t("linkChildPlaceholder")}" required />
            </div>
            <button type="submit" class="btn btn-gold btn-block">${t("btnLinkChild")}</button>
          </form>
          <button class="link-btn" style="margin-top:var(--spacing-16);" data-action="skip-link-child">${t("btnSkipForNow")}</button>
        </div>
      </div>
    </div>
  `;
}

function renderLinkChildModal() {
  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${t("linkChildHeading")}</h3>
          <button class="modal-close" data-action="close-link-child-modal">✕</button>
        </div>
        <div class="modal-body">
          <p class="muted">${t("linkChildIntro")}</p>
          <form data-action="link-child-form">
            <div class="field">
              <label>${t("linkChildEmailLabel")}</label>
              <input type="email" name="childEmail" placeholder="${t("linkChildPlaceholder")}" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block">${t("btnLinkChild")}</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

async function handleLinkChildByEmail(form, onSuccess) {
  const email = form.childEmail.value.trim();
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);

  try {
    const { data, error } = await sbClient.rpc("link_learner_by_email", { p_email: email });
    if (error) throw error;

    if (!data) {
      showToast(t("linkChildEmailNotFound"), "error");
      return;
    }

    await loadParentData();
    showToast(t("linkChildSuccess"), "success");
    if (onSuccess) onSuccess();
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function toggleMonthlyRecap() {
  const next = !state.profile.monthly_recap_email;
  state.profile.monthly_recap_email = next;
  render();

  try {
    const { error } = await sbClient.from("profiles").update({ monthly_recap_email: next }).eq("id", state.user.id);
    if (error) throw error;
  } catch (err) {
    console.error(err);
    state.profile.monthly_recap_email = !next;
    showToast(t("errorGeneric"), "error");
    render();
  }
}

// ---------------------------------------------------------------------
// ACCOUNT TAB
// ---------------------------------------------------------------------
function renderAccountTab() {
  const profile = state.profile;
  const learner = state.learner;
  const isLearner = profile.role === "learner";
  const tier = profile.subscription_tier || "free";
  const tierBadgeClass =
    tier === "premium" ? "tier-badge-premium" : tier === "basic" ? "tier-badge-basic" : "tier-badge-free";

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">${t("accountHeading")}</h3>

    <!-- 1. Profile -->
    <div class="card account-profile-card">
      <span class="avatar-circle avatar-lg">${escapeHtml(getInitials(profile.full_name))}</span>
      <div class="account-profile-info">
        <div class="account-profile-name">${escapeHtml(profile.full_name || "-")}</div>
        <div class="account-profile-email">${escapeHtml(profile.email || "")}</div>
        ${isLearner && learner ? `<div class="account-profile-grade">${t("labelGrade")} ${learner.grade}</div>` : ""}
      </div>
    </div>

    <!-- 2. Subscription -->
    <div class="card">
      <div class="account-section-row">
        <span class="account-section-label">${t("subscriptionLabel")}</span>
        <span class="tier-badge ${tierBadgeClass}">${t(tier)}</span>
      </div>
      ${
        tier === "free"
          ? `<button class="btn btn-gold btn-block" style="margin-top:14px;" data-action="account-upgrade">${t("upgradeLabel")}</button>`
          : ""
      }
    </div>

    <!-- 3. Language -->
    <div class="card">
      <span class="account-section-label">Language / Taal</span>
      <div class="pill-row" style="margin-top:12px;">
        <button type="button" class="pill-btn ${state.lang === "en" ? "selected" : ""}" data-action="set-lang" data-lang="en">English</button>
        <button type="button" class="pill-btn ${state.lang === "af" ? "selected" : ""}" data-action="set-lang" data-lang="af">Afrikaans</button>
      </div>
    </div>

    <!-- 4. Stats -->
    ${isLearner && learner ? renderAccountStats(learner) : ""}

    <!-- Referral rewards (existing feature, learners only) -->
    ${isLearner ? renderReferralCard() : ""}

    <!-- Parent dashboard extras: linked children + notification preferences -->
    ${!isLearner ? renderParentAccountExtras() : ""}

    <!-- 5. Logout -->
    <button class="btn btn-danger btn-block" data-action="logout" style="margin-top:6px;">${t("btnLogout")}</button>
  `;
}

function renderParentAccountExtras() {
  return `
    <div class="section-title">${t("linkedChildrenHeading")}</div>
    ${
      state.linkedLearners.length === 0
        ? `<p class="muted">${t("noChildrenLinked")}</p>`
        : state.linkedLearners.map((l) => renderLinkedChildCard(l)).join("")
    }
    <button class="btn btn-outline btn-block" style="margin-top:var(--spacing-8);" data-action="open-link-child-modal">${t("btnLinkAnotherChild")}</button>

    <div class="section-title">${t("notificationPrefsHeading")}</div>
    <div class="card">
      <div class="toggle-row">
        <span>${t("monthlyRecapLabel")}</span>
        <button type="button" class="toggle-switch ${state.profile.monthly_recap_email ? "on" : ""}" data-action="toggle-monthly-recap" role="switch" aria-checked="${state.profile.monthly_recap_email ? "true" : "false"}"></button>
      </div>
      <div class="toggle-row">
        <span>${t("immediateSafetyAlertsLabel")}</span>
        <span class="toggle-switch on locked" title="${t("alwaysOnLabel")}"></span>
      </div>
    </div>

    ${state.linkChildModalOpen ? renderLinkChildModal() : ""}
  `;
}

function renderLinkedChildCard(learner) {
  const tier = learner.subscription_tier || "free";
  const tierBadgeClass = tier === "premium" ? "tier-badge-premium" : tier === "basic" ? "tier-badge-basic" : "tier-badge-free";
  return `
    <div class="linked-child-card">
      <div>
        <div style="font-weight:700;">${escapeHtml(learner.full_name)}</div>
        <div class="muted">${t("gradeLabel")} ${learner.grade}</div>
      </div>
      <span class="tier-badge ${tierBadgeClass}">${t(tier)}</span>
    </div>
  `;
}

function renderAccountStats(learner) {
  return `
    <div class="account-stats">
      <div class="account-stat">
        <div class="num">${learner.streak_days || 0}</div>
        <div class="lbl">${t("statStreak")}</div>
      </div>
      <div class="account-stat">
        <div class="num">${learner.sessions_completed || 0}</div>
        <div class="lbl">${t("statSessions")}</div>
      </div>
      <div class="account-stat">
        <div class="num">${learner.diagnostic_level || 0}</div>
        <div class="lbl">${t("statLevel")}</div>
      </div>
    </div>
  `;
}

function renderReferralCard() {
  const profile = state.profile;
  const count = profile.referral_count || 0;
  const filled = count % 3;

  return `
    <div class="card">
      <h3 class="mt-0">${t("yourReferralCode")}</h3>
      <div class="referral-code-box">
        <span class="code">${escapeHtml(profile.referral_code || "")}</span>
        <button class="btn btn-outline btn-sm" data-action="copy-referral">${t("btnCopy")}</button>
      </div>
      <p class="muted">${count % 3}/3 ${t("referralProgress")}</p>
      <div class="referral-progress">
        ${[0, 1, 2].map((i) => `<div class="referral-dot ${i < filled ? "filled" : ""}"></div>`).join("")}
      </div>
    </div>
  `;
}

function renderTierCards(currentTier) {
  const tiers = [
    {
      id: "free",
      name: t("free"),
      price: 0,
      features: [t("feature3Sessions"), t("featureLearnOnly"), t("featureBilingual")],
    },
    {
      id: "basic",
      name: t("basic"),
      price: TIER_PRICES.basic,
      features: [t("featureUnlimitedLearn"), t("featureBilingual")],
    },
    {
      id: "premium",
      name: t("premium"),
      price: TIER_PRICES.premium,
      features: [t("featureFullAccess"), t("featureUnlimitedLearn"), t("featureBilingual")],
    },
  ];

  return `
    <div class="section-title">${t("currentPlan")}</div>
    ${tiers
      .map((tier) => {
        const isCurrent = tier.id === currentTier;
        return `
        <div class="tier-card ${isCurrent ? "current" : ""}">
          <div class="tier-name">${tier.name}</div>
          <div class="tier-price">
            ${tier.price === 0 ? t("free") : `R${tier.price}`}
            ${tier.price > 0 ? `<span>${t("perMonth")}</span>` : ""}
          </div>
          <ul class="tier-features">${tier.features.map((f) => `<li>${f}</li>`).join("")}</ul>
          ${
            isCurrent
              ? `<span class="badge badge-success">${t("yourCurrentPlan")}</span>`
              : tier.id === "free"
                ? ""
                : `<button class="btn btn-gold btn-block" data-action="upgrade" data-tier="${tier.id}">${t("upgradeTo")} ${tier.name}</button>`
          }
        </div>`;
      })
      .join("")}
  `;
}

function copyReferralCode() {
  const code = state.profile.referral_code || "";
  navigator.clipboard
    .writeText(code)
    .then(() => showToast(t("copied"), "success"))
    .catch(() => showToast(t("errorGeneric"), "error"));
}

async function toggleLanguage() {
  state.lang = state.lang === "en" ? "af" : "en";
  document.documentElement.lang = state.lang;
  // Keep the choice in local state only. The frontend must never write to
  // public.profiles directly - persisting language is the DB/trigger's job.
  if (state.profile) state.profile.lang = state.lang;
  render();
}

// Account-tab language selection: switch the UI immediately, then persist the
// choice to profiles.lang (the "Users can update own profile" RLS policy
// permits this for the authenticated user).
async function setLanguage(lang) {
  const next = lang === "af" ? "af" : "en";
  state.lang = next;
  document.documentElement.lang = next;
  if (state.profile) state.profile.lang = next;
  render();

  try {
    const { error } = await sbClient.from("profiles").update({ lang: next }).eq("id", state.user.id);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to persist language preference", err);
  }
}

// ---------------------------------------------------------------------
// PAYFAST UPGRADE
// ---------------------------------------------------------------------
function handleUpgrade(tier) {
  const amount = TIER_PRICES[tier];
  if (!amount) return;

  const fields = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: `${window.location.origin}${window.location.pathname}?payment=success`,
    cancel_url: `${window.location.origin}${window.location.pathname}?payment=cancelled`,
    notify_url: PAYFAST_CONFIG.notifyUrl,
    name_first: state.profile.full_name || "Leuro Learner",
    email_address: state.profile.email,
    m_payment_id: `${state.user.id}-${Date.now()}`,
    amount: amount.toFixed(2),
    item_name: `Leuro ${capitalize(tier)} Subscription`,
    custom_str1: state.user.id,
    custom_str2: tier,
  };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = PAYFAST_CONFIG.processUrl;
  form.style.display = "none";

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

// ---------------------------------------------------------------------
// GLOBAL EVENT DISPATCHER
// ---------------------------------------------------------------------
function attachGlobalListeners() {
  document.body.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    switch (action) {
      case "auth-tab":
        authTab = target.dataset.tab;
        render();
        break;
      case "select-role":
        authRole = target.dataset.role;
        render();
        break;
      case "switch-tab":
        state.currentTab = target.dataset.tab;
        render();
        break;
      case "toggle-progress-summary":
        state.showProgressSummary = !state.showProgressSummary;
        render();
        break;
      case "toggle-lang":
        toggleLanguage();
        break;
      case "set-lang":
        setLanguage(target.dataset.lang);
        break;
      case "account-upgrade":
        showToast(t("comingSoon"), "info");
        break;
      case "logout":
        handleLogout();
        break;
      case "diagnostic-set-lang":
        diagnosticSetLang(target.dataset.lang);
        break;
      case "diagnostic-retry":
        diagnosticRetry();
        break;
      case "diagnostic-finish":
        diagnosticFinish();
        break;
      case "diagnostic-select":
        diagnosticSelectOption(target.dataset.letter);
        break;
      case "diagnostic-next":
        diagnosticNext();
        break;
      case "retake-diagnostic":
        retakeDiagnostic();
        break;
      case "safety-tier1-close":
        state.safetyOverlay = null;
        state.currentTab = "home";
        render();
        break;
      case "open-topic":
        openTopicSession(target.dataset.topicId);
        break;
      case "session-close":
        sessionClose();
        break;
      case "session-submit-answer":
        sessionSubmitAnswer(parseInt(target.dataset.index, 10));
        break;
      case "session-retry":
        sessionRetry();
        break;
      case "exams-switch-view":
        examsSwitchView(target.dataset.view);
        break;
      case "generate-study-guide":
        generateStudyGuide();
        break;
      case "save-study-guide":
        saveStudyGuide();
        break;
      case "refresher-toggle-topic":
        refresherToggleTopic(target.dataset.topicId);
        break;
      case "refresher-set-duration":
        refresherSetDuration(parseInt(target.dataset.duration, 10));
        break;
      case "refresher-set-level":
        refresherSetLevel(target.dataset.level);
        break;
      case "refresher-start":
        refresherStart();
        break;
      case "refresher-toggle-pause":
        refresherTogglePause();
        break;
      case "refresher-end-session":
        refresherEndSession();
        break;
      case "refresher-toggle-section":
        refresherToggleSection(parseInt(target.dataset.index, 10));
        break;
      case "refresher-submit-answer":
        refresherSubmitAnswer(parseInt(target.dataset.sectionIndex, 10), parseInt(target.dataset.questionIndex, 10));
        break;
      case "refresher-try-again":
        refresherTryAgain();
        break;
      case "refresher-back-to-study":
        refresherBackToStudy();
        break;
      case "exam-set-term":
        examSetTerm(parseInt(target.dataset.term, 10));
        break;
      case "start-exam":
        startMockExam();
        break;
      case "exam-close":
        examClose();
        break;
      case "submit-exam":
        submitExam();
        break;
      case "exam-done":
        examDone();
        break;
      case "exam-select-option":
        examSelectOption(target.dataset.option);
        break;
      case "exam-next-question":
        examNextQuestion();
        break;
      case "mark-alert-read":
        markAlertRead(target.dataset.alertId);
        break;
      case "copy-referral":
        copyReferralCode();
        break;
      case "upgrade":
        handleUpgrade(target.dataset.tier);
        break;
      case "select-child":
        state.selectedLearnerId = target.dataset.learnerId;
        render();
        break;
      case "toggle-session-detail":
        state.expandedSessionIds[target.dataset.sessionId] = !state.expandedSessionIds[target.dataset.sessionId];
        render();
        break;
      case "toggle-date-group": {
        const dateLabel = target.dataset.dateLabel;
        if (state.expandedDateGroups.has(dateLabel)) {
          state.expandedDateGroups.delete(dateLabel);
        } else {
          state.expandedDateGroups.add(dateLabel);
        }
        render();
        break;
      }
      case "goals-toggle-subject":
        goalsToggleSubject(target.dataset.learnerId, target.dataset.subjectId);
        break;
      case "goals-save":
        saveGoals();
        break;
      case "open-link-child-modal":
        state.linkChildModalOpen = true;
        render();
        break;
      case "close-link-child-modal":
        state.linkChildModalOpen = false;
        render();
        break;
      case "skip-link-child":
        state.showLinkChildScreen = false;
        render();
        break;
      case "toggle-monthly-recap":
        toggleMonthlyRecap();
        break;
      case "admin-switch-tab":
        state.admin.currentTab = target.dataset.tab;
        render();
        break;
      case "admin-toggle-freeze":
        adminToggleFreeze(target.dataset.userId, target.dataset.frozen === "true");
        break;
      case "admin-mark-reviewed":
        adminMarkFlagReviewed(target.dataset.flagId);
        break;
      case "admin-unfreeze-from-flag":
        adminUnfreezeFromFlag(target.dataset.flagId, target.dataset.userId);
        break;
      default:
        break;
    }
  });

  document.body.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-action]");
    if (!form) return;
    e.preventDefault();
    const action = form.dataset.action;

    switch (action) {
      case "login-form":
        handleLogin(form);
        break;
      case "signup-form":
        handleSignup(form);
        break;
      case "add-topic-form":
        handleAddTopic(form);
        break;
      case "session-chat-form":
        sessionSendChat(form);
        break;
      case "link-child-form":
        handleLinkChildByEmail(form, () => {
          state.linkChildModalOpen = false;
        });
        break;
      case "link-child-screen-form":
        handleLinkChildByEmail(form, () => {
          state.showLinkChildScreen = false;
        });
        break;
      default:
        break;
    }
  });

  document.body.addEventListener("change", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;

    switch (action) {
      case "refresher-subject-select":
        refresherSubjectChange(target.value);
        break;
      case "goals-set-target":
        goalsSetTarget(target.value);
        break;
      case "admin-change-tier":
        adminChangeTier(target.dataset.userId, target.value);
        break;
      default:
        break;
    }
  });
}
