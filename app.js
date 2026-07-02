/* =====================================================================
   Leuro - App Logic
   ===================================================================== */

// ---------------------------------------------------------------------
// CONFIG
// ---------------------------------------------------------------------
const SUPABASE_URL = "https://izyrizwudvalrbqgbhgl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_a-PcjnZDacNw4UN51zUOcQ_U_gozE2O";
const FN_URL = `${SUPABASE_URL}/functions/v1`;


// Paystack — public key is safe to expose in the browser.
// The secret key is stored in Supabase secrets as PAYSTACK_TEST_SECRET (never in client code).
const PAYSTACK_CONFIG = {
  publicKey: "pk_test_243ec9c224153ee5679f251dba0f8459772525a1",
};

const TIER_PRICES = { basic: 99, premium: 199 };

// Cloudflare Turnstile — site key is public/safe to embed. Verification
// happens server-side inside Supabase Auth itself when captchaToken is
// passed to signUp() (Supabase checks it against Turnstile's siteverify
// API using the secret key configured in the Supabase Auth dashboard).
const TURNSTILE_SITE_KEY = "0x4AAAAAADun3qqu0CAy78jv";
let turnstileWidgetId = null;

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
    labelReferral: "School referral code (optional)",
    placeholderReferral: "e.g. LEURO-YOURSCHOOL",
    invalidReferralCode: "Invalid or inactive promo code. Please check and try again.",
    referralApplied: "Promo code applied — your discount is now active!",
    promoCodeHeading: "Promo Code",
    activePromoLabel: "Active code",
    offLabel: "off",
    expired: "Expired",
    enterPromoCodeLabel: "Enter a promo code",
    btnApply: "Apply",
    promoCodeDisclaimer: "Applying a new code replaces your current one and starts a new discount period.",
    keepMeSignedIn: "Keep me signed in",
    showPassword: "Show password",
    hidePassword: "Hide password",
    btnCreateAccount: "Create Account",
    btnLogin: "Log In",
    welcomeBack: "Welcome back",
    createYourAccount: "Create your account",
    pwTooShort: "Too short — at least 8 characters",
    pwOk: "OK",
    pwStrong: "Strong",
    pwWeak: "Password is too weak or too common.",
    forgotPassword: "Forgot password?",
    resetPasswordHeading: "Reset your password",
    btnSendResetLink: "Send reset link",
    resetEmailSentMsg: "If that email is registered, a reset link has been sent.",
    setNewPasswordHeading: "Set new password",
    labelNewPassword: "New password",
    labelConfirmPassword: "Confirm password",
    btnUpdatePassword: "Update password",
    pwMismatch: "Passwords do not match.",
    pwUpdated: "Password updated! Please log in.",
    checkboxTcPrefix: "I agree to the ",
    checkboxTcAnd: " and ",
    linkTc: "Terms & Conditions",
    linkPrivacy: "Privacy Policy",
    checkboxConsent: "I am 18 or older, or I am the parent/guardian completing this registration on behalf of a minor.",
    checkboxTcRequired: "Please accept the Terms & Conditions, Privacy Policy, and age confirmation to continue.",
    turnstileRequired: "Please complete the verification.",
    legalHeading: "Legal",
    tcModalTitle: "Terms & Conditions",
    privacyModalTitle: "Privacy Policy",

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
    enterAnswer: "Please enter an answer",
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
    btnDownloadPdf: "Download PDF",
    studyGuideSaved: "Study guide saved!",
    errorStudyGuideGeneration: "Unable to generate study guide. Please try again.",
    enterTopicFirst: "Please enter a topic first.",

    tabFlashcards: "Flashcards",
    flashcardCountLabel: "Number of questions",
    btnStartFlashcards: "Start Game",
    flashcardProgress: "Question {0} of {1}",
    flashcardFrontLabel: "Question",
    flashcardBackLabel: "Result",
    flashcardCorrect: "✓ Correct!",
    flashcardWrong: "✗ Incorrect",
    flashcardTimeUp: "⏱ Time's up!",
    flashcardExplanationLabel: "Explanation",
    btnFlashcardNext: "Next Question",
    flashcardResultsHeading: "Results",
    flashcardMissedLabel: "Review these",
    flashcardPerfect: "Perfect score! You know them all.",
    btnFlashcardPlayAgain: "Play Again",
    btnFlashcardNew: "New Topic",
    errorFlashcardGeneration: "Unable to generate flashcards. Please try again.",

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
    btnBack: "Back",
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
    studyGuidePremiumMsg: "Study Guides are part of the Premium plan.",
    refresherPremiumMsg: "The Exam Refresher is part of the Premium plan.",
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
    examStatLow: "10 Questions · 3 marks each",
    examStatMedium: "6 Questions · 5 marks each",
    examStatHigh: "5 Questions · 6 marks each",
    examYourAnswer: "Your answer",
    examCorrectAnswer: "Correct answer",
    examNoAnswer: "Not answered",
    marksLabel: "marks",
    examGrading: "Grading…",

    sessionsCompletedLabel: "Sessions completed",
    activityHeading: "Recent Activity",
    markRead: "Mark as read",
    btnAcknowledgeFlag: "Acknowledge & Reactivate",
    flagAcknowledgedMsg: "Account reactivated.",
    flagAlreadyAcknowledgedMsg: "This was already acknowledged.",
    flagAcknowledgeFailedMsg: "Couldn't acknowledge this. Please try again or contact hello@leuroai.co.za.",

    navActivity: "Activity",
    navGoals: "Goals",

    linkedChildrenHeading: "Linked Children",
    noChildrenLinked: "No children linked yet.",
    addChildHeading: "Add a Child",
    addChildChooseMode: "How would you like to add your child?",
    addChildDirectLabel: "I'll set the password",
    addChildDirectDesc: "Create an account now — you'll receive login details to share with your child.",
    addChildInviteLabel: "Send invite to child",
    addChildInviteDesc: "Email your child a link so they can set their own password.",
    addChildNameLabel: "Child's full name",
    addChildEmailLabel: "Child's email address",
    addChildPasswordLabel: "Login password (share this with your child)",
    btnAddChildDirect: "Create Account",
    btnAddChildInvite: "Send Invite",
    addChildSuccessDirect: "Child account created!",
    addChildSuccessInvite: "Invite sent to",
    inviteStatusPending: "Invite sent",
    btnAddChild: "Add Child",
    acceptInviteHeading: "Welcome to Leuro™",
    acceptInviteIntro: "Set a password to activate your learner account.",
    acceptInvitePasswordLabel: "Choose a password",
    btnActivateAccount: "Activate Account",
    acceptInviteSuccess: "Account activated! You can now log in.",
    acceptInviteInvalidToken: "This invite link is invalid or has already been used.",

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
    noSubjectsForGrade: "No subjects available for this grade yet.",
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
    upgradeModalTitle: "Choose your plan",
    upgradeModalIntro: "Pick the plan that suits you. Cancel anytime.",
    btnSubscribe: "Subscribe",
    featBasicUnlimited: "Unlimited sessions",
    featBasic4Step: "Full 4-step loop",
    featBasicAfrikaans: "Afrikaans",
    featPremiumEverything: "Everything in Basic",
    featPremiumStudyGuide: "Study Guide",
    featPremiumMockExam: "Mock Exam",
    featPremiumRefresher: "Exam Refresher",
    paymentSuccessMsg: "Payment successful! Your plan is being activated.",
    paymentCancelledMsg: "Payment cancelled.",
    paymentVerifyingMsg: "Confirming payment…",
    upgradeChildModalTitle: "Upgrade {name}'s Plan",
    upgradeChildIntro: "Choose a plan for {name}.",
    btnUpgrade: "Upgrade",
    btnCancelSubscription: "Cancel Subscription",
    pastDueBannerMsg: "Payment issue — please renew to keep Premium access.",
    btnDeleteChild: "Delete Child",
    deleteChildModalTitle: "Delete {name}?",
    deleteChildWarning: "This permanently deletes ALL of {name}'s data — study history, progress, exam results, everything. This cannot be undone.",
    deleteChildTypePrompt: "Type {name} to confirm:",
    btnDeleteChildConfirm: "Delete Permanently",
    btnDeleteAccount: "Delete Account",
    confirmDeleteAccountStep1: "Delete your account? This will also permanently delete all your linked children and their data. This cannot be undone.",
    deleteAccountModalTitle: "Delete your account?",
    deleteAccountWarning: "This permanently deletes YOUR account and ALL linked children{children} — everything, forever. This cannot be undone.",
    deleteAccountTypePrompt: "Type {name} to confirm:",
    btnDeleteAccountConfirm: "Delete My Account Permanently",

    loading: "Loading...",
    errorGeneric: "Something went wrong. Please try again.",
    offlineMsg: "You're offline. Some features may not work.",
    never: "Never",
    cancel: "Cancel",
    btnConfirm: "Confirm",
    confirmCloseExam: "Close exam? Your progress will be lost and the exam won't be scored.",
    confirmRetakeDiagnostic: "Retake the diagnostic? This will replace your current level.",
    confirmFreezeAccount: "Freeze this account? The user will be locked out immediately.",
    confirmCancelChildSubscription: "Cancel this child's subscription? They'll keep access until the current billing period ends, then drop to the Free tier.",
    changeEmailHeading: "Change Email Address",
    changeEmailBtn: "Change email",
    changeEmailNewLabel: "New email address",
    changeEmailSubmitBtn: "Update email",
    changeEmailSuccess: "Check both your new and current email for confirmation links. Your email won't change until you've clicked both.",
    changeEmailSameError: "The new email is the same as your current one.",
    changeEmailInvalidError: "Please enter a valid email address.",

    safetyCrisisMessage: "Your feelings are valid and important. Please talk to a trusted adult or your parent right away. You can also call the SADAG helpline anytime — it's free: 0800 21 22 23 (available 24 hours).",
    safetyTier2Message: "This type of language isn't allowed on Leuro™.",
    accountFrozenMessage: "Your account has been temporarily paused. Your parent or guardian has been notified and will need to confirm before you can continue.",
    safetyCheckErrorMessage: "Something went wrong — please try again in a moment.",
    btnClose: "Close",

    acknowledgeThankYou: "Thank you for confirming.",
    acknowledgeReactivated: "Your child's account has been reactivated.",
    acknowledgeSupportMsg: "Please speak with your child and ensure they have the support they need.",
    acknowledgeSadag: "SADAG: 0800 21 22 23",
    acknowledgeError: "This link no longer works on its own. Please log in to your Leuro™ account and check your notifications to reactivate your child's account.",
    btnGoToLeuro: "Go to leuroai.co.za",

    upgradeTo: "Upgrade to",
    featureLearnOnly: "Learn section only",
    feature3Sessions: "3 study sessions per day",
    featureUnlimitedLearn: "Unlimited learn section",
    featureFullAccess: "Learn + Mock Exams",
    featureBilingual: "English & Afrikaans",
    supportHeading: "Help & Contact",
    supportIntro: "Have a question or issue? We'll get back to you.",
    supportLabelName: "Name",
    supportLabelEmail: "Email",
    supportLabelCategory: "Category",
    supportLabelMessage: "Message",
    supportCategoryDefault: "Select a category",
    supportCategoryGeneral: "General",
    supportCategoryBilling: "Billing",
    supportCategoryTechnical: "Technical",
    supportCategoryReport: "Report a problem",
    supportPlaceholderMessage: "Describe your question or issue...",
    supportBtnSubmit: "Send Message",
    supportSuccess: "Thanks — we've received your message and will get back to you.",
    supportBtnAnother: "Send another message",
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
    labelReferral: "Skool-verwysingskode (opsioneel)",
    placeholderReferral: "bv. LEURO-JOUGSKOOL",
    invalidReferralCode: "Ongeldige of onaktiewe promosie-kode. Kontroleer asseblief en probeer weer.",
    referralApplied: "Promosie-kode toegepas — jou afslag is nou aktief!",
    promoCodeHeading: "Promosie-kode",
    activePromoLabel: "Aktiewe kode",
    offLabel: "afslag",
    expired: "Verval",
    enterPromoCodeLabel: "Voer 'n promosie-kode in",
    btnApply: "Pas toe",
    promoCodeDisclaimer: "Deur 'n nuwe kode toe te pas, vervang jy jou huidige kode en begin 'n nuwe afslagtydperk.",
    keepMeSignedIn: "Bly aangemeld",
    showPassword: "Wys wagwoord",
    hidePassword: "Versteek wagwoord",
    btnCreateAccount: "Skep Rekening",
    btnLogin: "Meld Aan",
    welcomeBack: "Welkom terug",
    createYourAccount: "Skep jou rekening",
    pwTooShort: "Te kort — minstens 8 karakters",
    pwOk: "Reg",
    pwStrong: "Sterk",
    pwWeak: "Wagwoord is te swak of te algemeen.",
    forgotPassword: "Wagwoord vergeet?",
    resetPasswordHeading: "Herstel jou wagwoord",
    btnSendResetLink: "Stuur herstelskakel",
    resetEmailSentMsg: "As daardie e-pos geregistreer is, is 'n herstelskakel gestuur.",
    setNewPasswordHeading: "Stel nuwe wagwoord",
    labelNewPassword: "Nuwe wagwoord",
    labelConfirmPassword: "Bevestig wagwoord",
    btnUpdatePassword: "Dateer wagwoord op",
    pwMismatch: "Wagwoorde stem nie ooreen nie.",
    pwUpdated: "Wagwoord opgedateer! Meld asseblief aan.",
    checkboxTcPrefix: "Ek stem saam met die ",
    checkboxTcAnd: " en ",
    linkTc: "Bepalings en Voorwaardes",
    linkPrivacy: "Privaatheidsbeleid",
    checkboxConsent: "Ek is 18 jaar of ouer, of ek is die ouer/voog wat hierdie registrasie namens 'n minderjarige voltooi.",
    checkboxTcRequired: "Aanvaar asseblief die Bepalings en Voorwaardes, Privaatheidsbeleid en ouderdomsbevestiging om voort te gaan.",
    turnstileRequired: "Voltooi asseblief die verifikasie.",
    legalHeading: "Regsake",
    tcModalTitle: "Bepalings en Voorwaardes",
    privacyModalTitle: "Privaatheidsbeleid",

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
    enterAnswer: "Voer asseblief 'n antwoord in",
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
    btnDownloadPdf: "Laai PDF af",
    studyGuideSaved: "Studiegids gestoor!",
    errorStudyGuideGeneration: "Kon nie studiegids genereer nie. Probeer asseblief weer.",
    enterTopicFirst: "Voer asseblief eers 'n onderwerp in.",

    tabFlashcards: "Flitskaarte",
    flashcardCountLabel: "Aantal vrae",
    btnStartFlashcards: "Begin Spel",
    flashcardProgress: "Vraag {0} van {1}",
    flashcardFrontLabel: "Vraag",
    flashcardBackLabel: "Resultaat",
    flashcardCorrect: "✓ Korrek!",
    flashcardWrong: "✗ Verkeerd",
    flashcardTimeUp: "⏱ Tyd verstreke!",
    flashcardExplanationLabel: "Verduideliking",
    btnFlashcardNext: "Volgende Vraag",
    flashcardResultsHeading: "Resultate",
    flashcardMissedLabel: "Hersien hierdie",
    flashcardPerfect: "Perfekte punt! Jy ken almal.",
    btnFlashcardPlayAgain: "Speel Weer",
    btnFlashcardNew: "Nuwe Onderwerp",
    errorFlashcardGeneration: "Kon nie flitskaarte genereer nie. Probeer asseblief weer.",

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
    btnBack: "Terug",
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
    studyGuidePremiumMsg: "Studiegidse is deel van die Premium-plan.",
    refresherPremiumMsg: "Die Eksamenopfrisser is deel van die Premium-plan.",
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
    examStatLow: "10 Vrae · 3 punte elk",
    examStatMedium: "6 Vrae · 5 punte elk",
    examStatHigh: "5 Vrae · 6 punte elk",
    examYourAnswer: "Jou antwoord",
    examCorrectAnswer: "Korrekte antwoord",
    examNoAnswer: "Nie beantwoord nie",
    marksLabel: "punte",
    examGrading: "Nasien…",

    sessionsCompletedLabel: "Sessies voltooi",
    activityHeading: "Onlangse Aktiwiteit",
    markRead: "Merk as gelees",
    btnAcknowledgeFlag: "Bevestig & Heraktiveer",
    flagAcknowledgedMsg: "Rekening heraktiveer.",
    flagAlreadyAcknowledgedMsg: "Dit is reeds bevestig.",
    flagAcknowledgeFailedMsg: "Kon nie dit bevestig nie. Probeer asseblief weer of kontak hello@leuroai.co.za.",

    navActivity: "Aktiwiteit",
    navGoals: "Doelwitte",

    linkedChildrenHeading: "Geskakelde Kinders",
    noChildrenLinked: "Nog geen kinders geskakel nie.",
    addChildHeading: "Voeg 'n Kind By",
    addChildChooseMode: "Hoe wil jy jou kind byvoeg?",
    addChildDirectLabel: "Ek sal die wagwoord stel",
    addChildDirectDesc: "Skep nou 'n rekening — jy ontvang aanmeldbesonderhede om met jou kind te deel.",
    addChildInviteLabel: "Stuur uitnodiging aan kind",
    addChildInviteDesc: "Stuur jou kind 'n skakel per e-pos sodat hulle hul eie wagwoord kan stel.",
    addChildNameLabel: "Kind se volle naam",
    addChildEmailLabel: "Kind se e-posadres",
    addChildPasswordLabel: "Aanmeldwagwoord (deel dit met jou kind)",
    btnAddChildDirect: "Skep Rekening",
    btnAddChildInvite: "Stuur Uitnodiging",
    addChildSuccessDirect: "Kindrekening geskep!",
    addChildSuccessInvite: "Uitnodiging gestuur aan",
    inviteStatusPending: "Uitnodiging gestuur",
    btnAddChild: "Voeg Kind By",
    acceptInviteHeading: "Welkom by Leuro™",
    acceptInviteIntro: "Stel 'n wagwoord om jou leerderrekening te aktiveer.",
    acceptInvitePasswordLabel: "Kies 'n wagwoord",
    btnActivateAccount: "Aktiveer Rekening",
    acceptInviteSuccess: "Rekening geaktiveer! Jy kan nou aanmeld.",
    acceptInviteInvalidToken: "Hierdie uitnodigingskakel is ongeldig of is reeds gebruik.",

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
    noSubjectsForGrade: "Nog geen vakke beskikbaar vir hierdie graad nie.",
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
    upgradeModalTitle: "Kies jou plan",
    upgradeModalIntro: "Kies die plan wat by jou pas. Kanselleer enige tyd.",
    btnSubscribe: "Teken in",
    featBasicUnlimited: "Onbeperkte sessies",
    featBasic4Step: "Volledige 4-stap-lus",
    featBasicAfrikaans: "Afrikaans",
    featPremiumEverything: "Alles in Basies",
    featPremiumStudyGuide: "Studiegids",
    featPremiumMockExam: "Toetseksamen",
    featPremiumRefresher: "Eksamenopfrisser",
    paymentSuccessMsg: "Betaling suksesvol! Jou plan word geaktiveer.",
    paymentCancelledMsg: "Betaling gekanselleer.",
    paymentVerifyingMsg: "Bevestig Betaling",
    upgradeChildModalTitle: "Gradeer {name} se Plan op",
    upgradeChildIntro: "Kies 'n plan vir {name}.",
    btnUpgrade: "Gradeer op",
    btnCancelSubscription: "Kanselleer Subskripsie",
    pastDueBannerMsg: "Betalingprobleem — hernu asseblief om Premium-toegang te behou.",
    btnDeleteChild: "Skrap Kind",
    deleteChildModalTitle: "Skrap {name}?",
    deleteChildWarning: "Dit skrap ALLE data van {name} permanent — studiegeskiedenis, vordering, eksamenuitslae, alles. Dit kan nie ongedaan gemaak word nie.",
    deleteChildTypePrompt: "Tik {name} om te bevestig:",
    btnDeleteChildConfirm: "Skrap Permanent",
    btnDeleteAccount: "Skrap Rekening",
    confirmDeleteAccountStep1: "Skrap jou rekening? Dit sal ook al jou gekoppelde kinders en hul data permanent skrap. Dit kan nie ongedaan gemaak word nie.",
    deleteAccountModalTitle: "Skrap jou rekening?",
    deleteAccountWarning: "Dit skrap JOU rekening en ALLE gekoppelde kinders{children} permanent — alles, vir altyd. Dit kan nie ongedaan gemaak word nie.",
    deleteAccountTypePrompt: "Tik {name} om te bevestig:",
    btnDeleteAccountConfirm: "Skrap My Rekening Permanent",

    loading: "Laai...",
    errorGeneric: "Iets het verkeerd geloop. Probeer asseblief weer.",
    offlineMsg: "Jy is vanlyn. Sommige funksies werk dalk nie.",
    never: "Nooit",
    cancel: "Kanselleer",
    btnConfirm: "Bevestig",
    confirmCloseExam: "Eksamen sluit? Jou vordering sal verlore gaan en die eksamen sal nie gegradeer word nie.",
    confirmRetakeDiagnostic: "Diagnose herhaal? Dit sal jou huidige vlak vervang.",
    confirmFreezeAccount: "Hierdie rekening bevries? Die gebruiker sal onmiddellik uitgeskakel word.",
    confirmCancelChildSubscription: "Kanselleer hierdie kind se subskripsie? Hulle behou toegang tot die huidige faktureringstydperk eindig, en val dan terug na die Gratis vlak.",
    changeEmailHeading: "Verander e-posadres",
    changeEmailBtn: "Verander e-pos",
    changeEmailNewLabel: "Nuwe e-posadres",
    changeEmailSubmitBtn: "Dateer e-pos op",
    changeEmailSuccess: "Kyk in beide jou nuwe en huidige e-pos vir bevestigingskakels. Jou e-pos verander nie totdat jy albei geklik het nie.",
    changeEmailSameError: "Die nuwe e-pos is dieselfde as jou huidige e-pos.",
    changeEmailInvalidError: "Voer asseblief 'n geldige e-posadres in.",

    safetyCrisisMessage: "Jou gevoelens is geldig en belangrik. Praat asseblief dadelik met 'n vertroude volwassene of jou ouer. Jy kan ook die SADAG-hulplyn enige tyd skakel — dit is gratis: 0800 21 22 23 (24 uur beskikbaar).",
    safetyTier2Message: "Hierdie tipe taal is nie op Leuro™ toegelaat nie.",
    accountFrozenMessage: "Jou rekening is tydelik gepauzeer. Jou ouer of voog is ingelig en sal moet bevestig voordat jy kan voortgaan.",
    safetyCheckErrorMessage: "Iets het verkeerd geloop — probeer asseblief oor 'n oomblik weer.",
    btnClose: "Sluit",

    acknowledgeThankYou: "Dankie dat jy bevestig het.",
    acknowledgeReactivated: "Jou kind se rekening is heraktiveer.",
    acknowledgeSupportMsg: "Praat asseblief met jou kind en maak seker hulle kry die ondersteuning wat hulle nodig het.",
    acknowledgeSadag: "SADAG: 0800 21 22 23",
    acknowledgeError: "Hierdie skakel werk nie meer op sy eie nie. Meld asseblief by jou Leuro™-rekening aan en gaan jou kennisgewings na om jou kind se rekening te heraktiveer.",
    btnGoToLeuro: "Gaan na leuroai.co.za",

    upgradeTo: "Gradeer op na",
    featureLearnOnly: "Slegs leer-afdeling",
    feature3Sessions: "3 studiesessies per dag",
    featureUnlimitedLearn: "Onbeperkte leer-afdeling",
    featureFullAccess: "Leer + Toetseksamens",
    featureBilingual: "Engels & Afrikaans",
    supportHeading: "Hulp & Kontak",
    supportIntro: "Het jy 'n vraag of probleem? Ons sal by jou terugkom.",
    supportLabelName: "Naam",
    supportLabelEmail: "E-pos",
    supportLabelCategory: "Kategorie",
    supportLabelMessage: "Boodskap",
    supportCategoryDefault: "Kies 'n kategorie",
    supportCategoryGeneral: "Algemeen",
    supportCategoryBilling: "Betaling",
    supportCategoryTechnical: "Tegnies",
    supportCategoryReport: "Rapporteer 'n probleem",
    supportPlaceholderMessage: "Beskryf jou vraag of probleem...",
    supportBtnSubmit: "Stuur Boodskap",
    supportSuccess: "Dankie — ons het jou boodskap ontvang en sal by jou terugkom.",
    supportBtnAnother: "Stuur nog 'n boodskap",
  },
};

function t(key) {
  const lang = state.lang || "en";
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

// Returns a subject's display name in the active language, falling back to
// the English `name` when no Afrikaans translation is set.
function subjectLabel(subject) {
  if (!subject) return "";
  return (state.lang === "af" && subject.name_af) || subject.name || "";
}

// ---------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------
const state = {
  session: null,
  user: null,
  profile: null,
  passwordRecovery: false,
  learner: null,
  parent: null,
  linkedLearners: [],
  selectedLearnerId: null,
  showAddChildModal: false,
  addChildMode: null,
  childForm: { name: "", grade: 4, email: "" },
  addChildLoading: false,
  acceptInviteToken: null,
  acceptInviteData: null,
  upgradeModalOpen: false,
  childUpgradeModalOpen: false,
  upgradeTargetLearnerId: null,
  deleteChildTarget: null,
  deleteAccountModalOpen: false,
  promoCode: null,
  tcModalOpen: false,
  privacyModalOpen: false,
  supportForm: { success: false },
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
    referralCodes: null,
    referralCodesLoading: false,
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
  confirmModal: null,  // { message, confirmAction, userId? }
  emailChangeOpen: false,
  emailChangeError: null,
  emailChangeSuccess: false,
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
  flashcard: {
    subjectId: null,
    topicTitle: "",
    cardCount: 10,
    loading: false,
    error: null,
    cards: null,
    step: "setup",
    currentIndex: 0,
    flipped: false,
    correct: [],
    secondsLeft: 10,
    answered: false,
    selectedAnswer: null,
  },
  mockExamSetup: {
    subjectId: null,
    term: 1,
    topics: "",
    difficulty: "low",
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
  // FET (Grade 10-12) subject selection, shown before the diagnostic.
  showSubjectSelection: false,
  subjectSelectionComplete: false,
  learnerSubjects: [],      // subject IDs saved in learner_subjects table
  subjectSelection: {
    mathChoiceId: null,
    selectedElectiveIds: [],
    saving: false,
    error: null,
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
    return await handleTier1Flag(text, context, learnerId);
  }

  if (TIER2_REGEX.test(text)) {
    await flagContent(text, 2, context, learnerId);
    showToast(t("safetyTier2Message"), "error");
    return false;
  }

  return true;
}

// Tier-1 (self-harm/crisis) content is a fail-closed safety check: the
// paused screen is shown ONLY once save-content-flag has confirmed (via its
// `frozen` response field) that profiles.account_frozen was actually
// persisted server-side — never optimistically. A single automatic retry
// covers transient failures; if both attempts fail we block the learner's
// message and show an error instead of a fake paused screen that would
// simply vanish on refresh, since nothing would actually have been written
// to the DB (see the July 2026 investigation into this exact failure mode).
async function handleTier1Flag(text, context, learnerId) {
  // state.session may not be populated yet at this point, so fetch the
  // current session fresh from Supabase rather than relying on it.
  const { data: { session } } = await sbClient.auth.getSession();
  const accessToken = session?.access_token || SUPABASE_ANON_KEY;
  const userId = session?.user?.id || state.user?.id || null;
  const payload = {
    user_id: userId,
    learner_id: learnerId || null,
    severity: 1,
    flagged_text: text,
    context,
    account_frozen: true,
  };

  console.log("handleTier1Flag: calling save-content-flag (attempt 1)", payload);
  let result = await saveTier1Flag(payload, accessToken);

  if (!result.frozen) {
    console.error("handleTier1Flag: freeze not confirmed on first attempt, retrying once", { context, learnerId });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    result = await saveTier1Flag(payload, accessToken);
  }

  if (!result.frozen) {
    console.error("handleTier1Flag: freeze NOT confirmed after retry — failing closed, message blocked", { context, learnerId, userId });
    showToast(t("safetyCheckErrorMessage"), "error");
    return false;
  }

  if (state.profile) {
    state.profile.account_frozen = true;
    state.profile.freeze_reason = "Self-harm content detected";
  }
  state.safetyOverlay = { severity: 1 };
  render();

  if (learnerId) {
    await notifyParentOfFlag(learnerId, 1, text, context, accessToken);
  }

  return false;
}

// Single save-content-flag attempt for tier-1 content. Returns
// { frozen: true } ONLY when the server response confirms
// profiles.account_frozen was actually persisted — never on a bare
// HTTP 200/{success:true}, since the content_flags insert and the profile
// freeze update are two separate steps on the server that can fail
// independently (see save-content-flag's response shape).
async function saveTier1Flag(payload, accessToken) {
  try {
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
    console.log("saveTier1Flag: save-content-flag raw response", res.status, raw);
    let data = null;
    try { data = JSON.parse(raw); } catch { /* non-JSON body */ }
    if (!res.ok || !data || data.success !== true) {
      console.error("saveTier1Flag: save-content-flag did not succeed", res.status, raw);
      return { frozen: false };
    }
    return { frozen: data.frozen === true };
  } catch (err) {
    console.error("saveTier1Flag: request failed", err);
    return { frozen: false };
  }
}

// Notifies the learner's linked parent(s) that a content-safety flag was
// raised. Best-effort — failures are logged but never block the caller.
async function notifyParentOfFlag(learnerId, severity, text, context, accessToken) {
  console.log("notifyParentOfFlag: calling notify-parent");
  try {
    const res = await fetchWithTimeout(`${FN_URL}/notify-parent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ learnerId, severity, flaggedText: text, context }),
    });
    if (!res.ok) {
      console.error("notifyParentOfFlag: notify-parent failed", res.status, await res.text());
    } else {
      console.log("notifyParentOfFlag: notify-parent ok");
    }
  } catch (err) {
    console.error("notifyParentOfFlag: request failed", err);
  }
}

// Records a tier-2 content safety flag, freezes the account after 3 flags
// within 7 days, and notifies the learner's parent/guardian.
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

  // save-content-flag intentionally returns only { success, frozen } — it
  // never hands back the flag's own id, since this caller is the flagged
  // learner's own browser (see save-content-flag's header comment for why).
  try {
    const payload = {
      user_id: userId,
      learner_id: learnerId || null,
      severity,
      flagged_text: text,
      context,
      account_frozen: false,
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
    }
  } catch (err) {
    console.error("flagContent: save-content-flag request failed", err);
  }

  try {
    // Freeze the account only after 3 tier-2 flags within the last 7 days.
    // This path already gates the client-side mutation on a successful,
    // awaited profiles UPDATE (never optimistic) — same fail-closed
    // principle as tier-1, confirmed still true as of this fix.
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

    if (learnerId) {
      await notifyParentOfFlag(learnerId, severity, text, context, accessToken);
    }
  } catch (err) {
    console.error("flagContent error:", err);
  }
}

const API_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, options, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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
  handleRecoveryHash();
  handleInviteToken();
  attachGlobalListeners();

  const { data } = await sbClient.auth.getSession();
  state.session = data.session;

  sbClient.auth.onAuthStateChange((event, session) => {
    state.session = session;
    if (event === "PASSWORD_RECOVERY") {
      state.passwordRecovery = true;
      state.user = session?.user ?? null;
      render();
      return;
    }
    if (!session) {
      state.user = null;
      state.profile = null;
      state.promoCode = null;
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
      state.promoCode = null;
      state.learner = null;
      state.parent = null;
    }
    setupKeepSignedIn();
  }

  state.loading = false;
  render();

  // If the user arrived via an invite link, fetch the learner record by token.
  if (state.acceptInviteToken) {
    await loadInviteData();
  }
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

// Parses the URL hash Supabase appends to the recovery redirect URL.
// Sets state.passwordRecovery early so the first render() shows the
// set-new-password screen without waiting for onAuthStateChange.
function handleRecoveryHash() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  if (hash.get("type") === "recovery") {
    state.passwordRecovery = true;
    window.history.replaceState({}, "", window.location.pathname + window.location.search);
  }
}

function handleInviteToken() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  if (token && window.location.pathname.includes("accept-invite")) {
    state.acceptInviteToken = token;
    window.history.replaceState({}, "", window.location.pathname);
  }
}

async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateToken(byteLength = 32) {
  const array = new Uint8Array(byteLength);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generatePassword(length = 12) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => chars[b % chars.length])
    .join("");
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

  // Load the promo code details so isDiscountActive() and price rendering have
  // access to discount_percent, discount_months and active without extra queries.
  state.promoCode = null;
  if (profile.referral_code_used) {
    const { data: codeData } = await sbClient
      .from("referral_codes")
      .select("code, discount_percent, discount_months, active")
      .eq("code", profile.referral_code_used)
      .maybeSingle();
    state.promoCode = codeData || null;
  }
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

    await Promise.all([loadSubjects(), loadTopics(), loadExams(), loadSessionsToday(), loadSavedGuides(), loadLearnerSubjects()]);
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

async function loadLearnerSubjects() {
  if (!state.learner || state.learner.grade < 10) return;
  const { data, error } = await sbClient
    .from("learner_subjects")
    .select("subject_id")
    .eq("learner_id", state.learner.id);
  if (error) throw error;
  state.learnerSubjects = (data || []).map((r) => r.subject_id);
  if (state.learnerSubjects.length === 0) {
    state.showSubjectSelection = true;
  }
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
    sbClient.from("subjects").select("id, name, name_af, grade, curriculum"),
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
      const weekSubjects = [...weekSubjectIds].map((id) => subjectLabel(subjectMap.get(id))).filter(Boolean);

      const examsWithNames = (exams || []).map((exam) => ({
        ...exam,
        subjectName: subjectLabel(subjectMap.get(exam.subject_id)),
      }));

      const gradeSubjects = (allSubjects || []).filter((s) => s.grade === learner.grade && s.curriculum === "caps");

      return {
        ...learner,
        full_name: learner.full_name || profile?.full_name || profile?.email || "Learner",
        subscription_tier: learner.subscription_tier || profile?.subscription_tier || "free",
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
let authRole = "parent";
let resetEmailSent = false;

function renderAuthScreen() {
  const showTabs = authTab !== "forgot";
  return `
    <div class="auth-wrap">
      <div class="auth-logo">${t("appName")}<span class="tm">™</span></div>
      <div class="auth-tagline">${t("tagline")}</div>
      <div class="auth-card">
        ${showTabs ? `
          <div class="auth-tabs">
            <button class="auth-tab ${authTab === "login" ? "active" : ""}" data-action="auth-tab" data-tab="login">${t("tabLogin")}</button>
            <button class="auth-tab ${authTab === "signup" ? "active" : ""}" data-action="auth-tab" data-tab="signup">${t("tabSignup")}</button>
          </div>
        ` : ""}
        ${authTab === "login" ? renderLoginForm() : authTab === "signup" ? renderSignupForm() : renderForgotForm()}
      </div>
    </div>
    ${state.tcModalOpen ? renderTcModal() : ""}
    ${state.privacyModalOpen ? renderPrivacyModal() : ""}
  `;
}

function renderLoginForm() {
  const keepChecked = localStorage.getItem("leuro_keep_signed_in") !== "false";
  return `
    <h3 class="mt-0">${t("welcomeBack")}</h3>
    <form data-action="login-form">
      <div class="field">
        <label>${t("labelEmail")}</label>
        <input type="email" name="email" required autocomplete="email" />
      </div>
      <div class="field">
        <label>${t("labelPassword")}</label>
        <div class="pw-field-wrap">
          <input type="password" name="password" required autocomplete="current-password" />
          <button type="button" class="pw-visibility-btn" data-action="toggle-pw-visibility" aria-label="${t("showPassword")}">👁</button>
        </div>
      </div>
      <label class="checkbox-label keep-signed-in-row">
        <input type="checkbox" name="keepSignedIn" ${keepChecked ? "checked" : ""} />
        <span>${t("keepMeSignedIn")}</span>
      </label>
      <div class="field">
        <div id="turnstile-container" class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${t("btnLogin")}</button>
    </form>
    <p class="forgot-link"><button class="btn-link" data-action="show-forgot">${t("forgotPassword")}</button></p>
  `;
}

// Length-based password strength check for signup. NOT a composition rule —
// we never force uppercase/number/special characters. Trim outer spaces
// before measuring length, but spaces inside the password are allowed.
const PW_MIN_LENGTH = 8;
const PW_BLOCKLIST = [
  "password",
  "12345678",
  "qwerty",
  "leuro",
  "abc12345",
  "11111111",
];

// Returns { valid, level, messageKey } where level is one of
// "short" | "ok" | "strong". `email` is optional — when present, the
// email local-part is added to the blocklist (case-insensitive).
function evaluatePassword(rawPassword, email) {
  const pw = (rawPassword || "").trim();
  const blocked = [...PW_BLOCKLIST];
  const localPart = (email || "").split("@")[0].trim().toLowerCase();
  if (localPart.length >= 4) blocked.push(localPart);

  if (pw.length < PW_MIN_LENGTH) {
    return { valid: false, level: "short", messageKey: "pwTooShort" };
  }
  if (blocked.includes(pw.toLowerCase())) {
    return { valid: false, level: "short", messageKey: "pwWeak" };
  }
  if (pw.length >= 12) {
    return { valid: true, level: "strong", messageKey: "pwStrong" };
  }
  return { valid: true, level: "ok", messageKey: "pwOk" };
}

// Live hint + submit-button gating for the signup password field. Wired up
// after the auth screen renders (see render()). Reads the email field too so
// the email local-part can be blocked.
function updatePasswordHint(form) {
  if (!form) return;
  const input = form.password;
  const hint = form.querySelector("[data-pw-hint]");
  const submitBtn = form.querySelector("button[type=submit]");
  if (!input || !hint) return;

  const email = form.email ? form.email.value : "";
  if (!input.value) {
    hint.textContent = "";
    hint.className = "pw-hint";
    if (submitBtn) submitBtn.disabled = true;
    return;
  }

  const result = evaluatePassword(input.value, email);
  hint.textContent = t(result.messageKey);
  hint.className = `pw-hint pw-hint-${result.level}`;
  const tcChecked = form.querySelector('[name="tcAccepted"]')?.checked ?? false;
  const ageChecked = form.querySelector('[name="ageConsent"]')?.checked ?? false;
  if (submitBtn) submitBtn.disabled = !(result.valid && tcChecked && ageChecked);
}

function renderForgotForm() {
  if (resetEmailSent) {
    return `
      <h3 class="mt-0">${t("resetPasswordHeading")}</h3>
      <p class="auth-info-msg">${t("resetEmailSentMsg")}</p>
      <button class="btn btn-outline btn-block" data-action="back-to-login">${t("tabLogin")}</button>
    `;
  }
  return `
    <h3 class="mt-0">${t("resetPasswordHeading")}</h3>
    <form data-action="forgot-form">
      <div class="field">
        <label>${t("labelEmail")}</label>
        <input type="email" name="email" required autocomplete="email" />
      </div>
      <div class="field">
        <div id="turnstile-container" class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}"></div>
      </div>
      <button type="submit" class="btn btn-primary btn-block">${t("btnSendResetLink")}</button>
    </form>
    <p class="forgot-link"><button class="btn-link" data-action="back-to-login">${t("tabLogin")}</button></p>
  `;
}

async function handleResetPasswordRequest(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const email = form.email.value.trim();

    // Same Turnstile requirement as login/signup — Supabase Auth's CAPTCHA
    // protection, once enabled project-wide, also covers /recover.
    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value || "";
    if (!turnstileToken) {
      showToast(t("turnstileRequired"), "error");
      return;
    }

    await sbClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
      captchaToken: turnstileToken,
    });
    // Always show the same neutral message — don't leak whether the email exists.
    resetEmailSent = true;
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
    if (typeof turnstile !== "undefined" && turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
    }
  } finally {
    setButtonLoading(btn, false);
  }
}

function renderPasswordRecoveryScreen() {
  return `
    <div class="auth-wrap">
      <div class="auth-logo">${t("appName")}<span class="tm">™</span></div>
      <div class="auth-tagline">${t("tagline")}</div>
      <div class="auth-card">
        <h3 class="mt-0">${t("setNewPasswordHeading")}</h3>
        <form data-action="set-new-password-form">
          <div class="field">
            <label>${t("labelNewPassword")}</label>
            <div class="pw-field-wrap">
              <input type="password" name="password" required minlength="8" autocomplete="new-password" />
              <button type="button" class="pw-visibility-btn" data-action="toggle-pw-visibility" aria-label="${t("showPassword")}">👁</button>
            </div>
            <p class="pw-hint" data-pw-hint></p>
          </div>
          <div class="field">
            <label>${t("labelConfirmPassword")}</label>
            <div class="pw-field-wrap">
              <input type="password" name="confirm" required autocomplete="new-password" />
              <button type="button" class="pw-visibility-btn" data-action="toggle-pw-visibility" aria-label="${t("showPassword")}">👁</button>
            </div>
            <p class="pw-hint" data-confirm-hint></p>
          </div>
          <button type="submit" class="btn btn-primary btn-block" disabled>${t("btnUpdatePassword")}</button>
        </form>
      </div>
    </div>
  `;
}

// Gates the submit button on the recovery form: new password must pass
// evaluatePassword() AND the confirm field must match exactly.
function updateRecoveryHints(form) {
  if (!form) return;
  const pwInput = form.password;
  const confirmInput = form.confirm;
  const pwHint = form.querySelector("[data-pw-hint]");
  const confirmHint = form.querySelector("[data-confirm-hint]");
  const submitBtn = form.querySelector("button[type=submit]");
  if (!pwInput || !confirmInput || !pwHint || !confirmHint) return;

  const pwResult = evaluatePassword(pwInput.value);
  if (!pwInput.value) {
    pwHint.textContent = "";
    pwHint.className = "pw-hint";
  } else {
    pwHint.textContent = t(pwResult.messageKey);
    pwHint.className = `pw-hint pw-hint-${pwResult.level}`;
  }

  const matches = confirmInput.value.length > 0 && confirmInput.value === pwInput.value;
  if (!confirmInput.value) {
    confirmHint.textContent = "";
    confirmHint.className = "pw-hint";
  } else {
    confirmHint.textContent = matches ? "" : t("pwMismatch");
    confirmHint.className = matches ? "pw-hint" : "pw-hint pw-hint-short";
  }

  if (submitBtn) submitBtn.disabled = !(pwResult.valid && matches);
}

function renderAcceptInviteScreen() {
  const learner = state.acceptInviteData;
  return `
    <div class="auth-wrap">
      <div class="auth-logo">${t("appName")}<span class="tm">™</span></div>
      <div class="auth-card">
        <h3 class="mt-0">${t("acceptInviteHeading")}</h3>
        <p class="muted" style="margin-top:0;">${t("acceptInviteIntro")}</p>
        ${
          learner
            ? `<form data-action="accept-invite-form">
                <div class="field">
                  <label>${t("addChildNameLabel")}</label>
                  <input type="text" name="fullName" value="${escapeHtml(learner.full_name || "")}" readonly style="background:var(--color-surface);opacity:.8;" />
                </div>
                <div class="field">
                  <label>${t("acceptInvitePasswordLabel")}</label>
                  <div class="pw-field-wrap">
                    <input type="password" name="password" required minlength="8" autocomplete="new-password" />
                    <button type="button" class="pw-visibility-btn" data-action="toggle-pw-visibility" aria-label="${t("showPassword")}">👁</button>
                  </div>
                  <p class="pw-hint" data-pw-hint></p>
                </div>
                <button type="submit" class="btn btn-primary btn-block">${t("btnActivateAccount")}</button>
              </form>`
            : state.acceptInviteToken === "loading"
              ? `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`
              : `<p class="muted" style="color:var(--danger);">${t("acceptInviteInvalidToken")}</p>
                 <button class="btn btn-outline btn-block" data-action="back-to-login">${t("btnLogin")}</button>`
        }
      </div>
    </div>
  `;
}

async function loadInviteData() {
  const token = state.acceptInviteToken;
  if (!token || token === "loading") return;
  state.acceptInviteToken = "loading";
  render();
  const { data, error } = await sbClient
    .from("learners")
    .select("id, full_name, email, invite_status")
    .eq("invite_token", token)
    .maybeSingle();
  if (error || !data || data.invite_status === "accepted") {
    state.acceptInviteToken = "invalid";
    state.acceptInviteData = null;
  } else {
    state.acceptInviteToken = token;
    state.acceptInviteData = data;
  }
  render();
}

async function handleAcceptInvite(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const password = form.password.value;
    const check = evaluatePassword(password);
    if (!check.valid) {
      showToast(t(check.messageKey), "error");
      return;
    }
    const { data: fnData, error: fnErr } = await sbClient.functions.invoke("accept-child-invite", {
      body: { token: state.acceptInviteToken, password },
    });

    if (fnErr) {
      showToast(fnErr.message || t("errorGeneric"), "error");
      return;
    }
    if (!fnData?.ok) {
      showToast(fnData?.error || t("errorGeneric"), "error");
      return;
    }

    showToast(t("acceptInviteSuccess"), "success");
    state.acceptInviteToken = null;
    authTab = "login";
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleUpdatePassword(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const password = form.password.value;
    const check = evaluatePassword(password);
    if (!check.valid) {
      showToast(t(check.messageKey), "error");
      return;
    }
    if (form.confirm.value !== password) {
      showToast(t("pwMismatch"), "error");
      return;
    }
    const { error } = await sbClient.auth.updateUser({ password });
    if (error) throw error;
    showToast(t("pwUpdated"), "success");
    state.passwordRecovery = false;
    await sbClient.auth.signOut();
    state.session = null;
    state.user = null;
    authTab = "login";
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

async function handleChangeEmail(form) {
  const newEmail = (form.newEmail?.value || "").trim().toLowerCase();
  const currentEmail = (state.profile?.email || "").trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    state.emailChangeError = t("changeEmailInvalidError");
    render();
    return;
  }
  if (newEmail === currentEmail) {
    state.emailChangeError = t("changeEmailSameError");
    render();
    return;
  }

  state.emailChangeError = null;
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const { error } = await sbClient.auth.updateUser({ email: newEmail });
    if (error) throw error;
    state.emailChangeSuccess = true;
    state.emailChangeOpen = false;
  } catch (err) {
    console.error(err);
    state.emailChangeError = err.message || t("errorGeneric");
  } finally {
    setButtonLoading(btn, false);
    render();
  }
}

function renderConfirmModal() {
  const m = state.confirmModal;
  return `
    <div class="modal-overlay">
      <div class="modal-sheet" style="max-width:360px;">
        <div class="modal-body" style="padding-top:24px;padding-bottom:8px;">
          <p style="margin:0;font-weight:600;">${escapeHtml(m.message)}</p>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" data-action="confirm-modal-cancel">${t("cancel")}</button>
          <button class="btn btn-danger" style="flex:1;" data-action="confirm-modal-ok">${t("btnConfirm")}</button>
        </div>
      </div>
    </div>
  `;
}

function renderTcModal() {
  return `
    <div class="modal-overlay" data-action="close-tc-modal">
      <div class="modal-sheet" onclick="if (!event.target.closest('[data-action]')) event.stopPropagation()">
        <div class="modal-header">
          <h3>${t("tcModalTitle")}</h3>
          <button class="modal-close" data-action="close-tc-modal">✕</button>
        </div>
        <div class="modal-body legal-modal-body">
          <p><strong>LEURO™ TERMS AND CONDITIONS</strong><br>
          Leuro Education PTY LTD | Reg: 2026/302958/07<br>
          Effective date: 16 June 2026<br>
          Contact: hello@leuroai.co.za</p>
          <h4>1. Who We Are</h4>
          <p>Leuro Education PTY LTD ("Leuro", "we", "us") is a South African company registered under the Companies Act 71 of 2008. We operate the Leuro™ learning platform accessible at leuroai.co.za and leuro-app.vercel.app ("the Platform").</p>
          <h4>2. Acceptance of Terms</h4>
          <p>By registering for or using the Platform, you agree to these Terms and Conditions. If you are under 18, a parent or guardian must read and agree to these terms on your behalf.</p>
          <h4>3. The Platform and Its Purpose</h4>
          <p>Leuro™ is an AI-assisted educational tool designed to support South African learners (Grades 4–12) with original AI-generated study content, diagnostic assessments, and mock examinations aligned to the South African national curriculum (CAPS). The Platform is suitable for all South African learners, regardless of their school or examination board, as it supports the core knowledge of the national curriculum that underpins South African schooling at every level.</p>
          <h4>4. AI-Generated Content — Important Disclaimer</h4>
          <p>Please read this section carefully.</p>
          <p>Content on the Platform — including study guides, diagnostic questions, mock examination questions, answer keys, explanations, and feedback — is generated by artificial intelligence (AI).</p>
          <ul>
            <li>AI-generated content may contain errors, inaccuracies, or outdated information.</li>
            <li>Mock examination questions, answer keys, and explanations are original content generated by AI, aligned to CAPS, and have not been verified by a qualified educator unless explicitly stated. They are not reproduced from any third-party or copyrighted curriculum materials.</li>
            <li>Leuro™ content is intended as a study aid only and does not replace your teacher, textbooks, or official DBE materials.</li>
            <li>Results and scores on the Platform are for practice purposes only and carry no academic credit or official standing.</li>
            <li>Do not rely solely on Leuro™ content for examination preparation. Always verify important information against approved curriculum materials.</li>
          </ul>
          <p>Leuro Education PTY LTD accepts no liability for any loss, academic outcome, or harm arising from reliance on AI-generated content on the Platform.</p>
          <h4>5. Accounts and Registration</h4>
          <ul>
            <li>You must provide accurate information when registering.</li>
            <li>You are responsible for keeping your password secure. Use a password of at least 8 characters.</li>
            <li>You must not share your account with others or allow others to use it.</li>
            <li>We reserve the right to suspend or terminate accounts that violate these terms.</li>
          </ul>
          <h4>6. Subscriptions and Payments</h4>
          <ul>
            <li>The Platform offers free and premium subscription tiers.</li>
            <li>Premium subscriptions are billed monthly at the advertised rate (currently R99 or R199/month depending on tier).</li>
            <li>Payments are processed securely via Paystack. We do not store your card details.</li>
            <li>Subscriptions renew automatically unless cancelled before the next billing date.</li>
            <li>Refunds are considered on a case-by-case basis. Contact hello@leuroai.co.za within 7 days of a charge if you believe an error has occurred.</li>
          </ul>
          <h4>7. Acceptable Use</h4>
          <p>You agree not to:</p>
          <ul>
            <li>Use the Platform for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, copy, or extract content from the Platform at scale</li>
            <li>Submit false, offensive, or harmful content</li>
            <li>Attempt to circumvent any access controls or subscription gates</li>
            <li>Use automated tools to access or scrape the Platform</li>
          </ul>
          <h4>8. Intellectual Property</h4>
          <p>All Platform content, branding, code, and AI-generated outputs are the property of Leuro Education PTY LTD or its licensors. Leuro™ is a registered trademark (Application 2026/13108, Class 41). You may use content generated for your own personal study only — you may not redistribute, republish, or commercialise it.</p>
          <h4>9. Safety Flagging</h4>
          <p>The Platform includes a safety monitoring feature. If content submitted by a learner suggests distress or risk, a flag may be raised and a parent or guardian may be notified. By using the Platform, learners and parents consent to this safety mechanism.</p>
          <h4>10. Limitation of Liability</h4>
          <p>To the maximum extent permitted by South African law, Leuro Education PTY LTD shall not be liable for any indirect, incidental, or consequential loss or damage arising from use of the Platform, including but not limited to academic outcomes, reliance on AI-generated content, or service interruptions.</p>
          <h4>11. Changes to These Terms</h4>
          <p>We may update these terms from time to time. We will notify registered users of material changes via email. Continued use of the Platform after notification constitutes acceptance.</p>
          <h4>12. Governing Law</h4>
          <p>These terms are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the jurisdiction of the South African courts.</p>
        </div>
      </div>
    </div>
  `;
}

function renderPrivacyModal() {
  return `
    <div class="modal-overlay" data-action="close-privacy-modal">
      <div class="modal-sheet" onclick="if (!event.target.closest('[data-action]')) event.stopPropagation()">
        <div class="modal-header">
          <h3>${t("privacyModalTitle")}</h3>
          <button class="modal-close" data-action="close-privacy-modal">✕</button>
        </div>
        <div class="modal-body legal-modal-body">
          <p><strong>LEURO™ PRIVACY POLICY</strong><br>
          Leuro Education PTY LTD | Reg: 2026/302958/07<br>
          Effective date: 16 June 2026<br>
          Contact: hello@leuroai.co.za<br>
          Information Officer: Grant Duncan</p>
          <h4>1. Introduction</h4>
          <p>Leuro Education PTY LTD is committed to protecting your personal information in accordance with the Protection of Personal Information Act 4 of 2013 (POPIA). This policy explains what we collect, why, how we use it, and your rights.</p>
          <h4>2. Who This Policy Covers</h4>
          <p>This policy applies to:</p>
          <ul>
            <li>Learners using the Leuro™ platform (including minors under 18)</li>
            <li>Parents and guardians who register on behalf of a learner</li>
            <li>Teachers using Leuro Assistant</li>
          </ul>
          <h4>3. Information We Collect</h4>
          <table class="legal-table">
            <thead><tr><th>What</th><th>Why</th></tr></thead>
            <tbody>
              <tr><td>Name and email address</td><td>Account registration and communication</td></tr>
              <tr><td>Grade</td><td>Personalising content</td></tr>
              <tr><td>Subject selections</td><td>Filtering relevant content</td></tr>
              <tr><td>Learning activity (topics studied, diagnostic results, exam scores)</td><td>Powering the AI study tools and tracking progress</td></tr>
              <tr><td>Subscription and payment status</td><td>Managing access tiers — we do not store card details</td></tr>
              <tr><td>Language preference</td><td>Delivering content in English or Afrikaans</td></tr>
              <tr><td>Safety flags</td><td>Notifying parents/guardians of potential learner distress</td></tr>
            </tbody>
          </table>
          <p>We do not collect race, religion, biometric data, or any other special personal information as defined by POPIA, except where a learner voluntarily discloses such information in free-text fields.</p>
          <h4>4. Children's Personal Information</h4>
          <p>Where a learner is under 18, we require a parent or guardian to register the account or to provide consent for the learner's use of the Platform.</p>
          <p>We do not knowingly collect personal information from children under 13 without verifiable parental consent.</p>
          <p>Parents and guardians may request access to, correction of, or deletion of their child's data at any time by contacting hello@leuroai.co.za.</p>
          <p>Learning activity data for minors is used solely to provide the educational service and is not used for marketing or shared with third parties for commercial purposes.</p>
          <h4>5. How We Use Your Information</h4>
          <ul>
            <li>To provide, personalise, and improve the Platform</li>
            <li>To generate AI-assisted study content relevant to your grade and subjects</li>
            <li>To track learning progress and surface it to linked parents/guardians</li>
            <li>To process subscription payments</li>
            <li>To send account-related emails (reset links, receipts, important notices)</li>
            <li>To flag potential learner safety concerns to parents/guardians</li>
            <li>To comply with legal obligations</li>
          </ul>
          <p>We do not sell your personal information. We do not use your data for advertising.</p>
          <h4>6. Who We Share Information With</h4>
          <table class="legal-table">
            <thead><tr><th>Recipient</th><th>Purpose</th></tr></thead>
            <tbody>
              <tr><td>Supabase (EU-West-2, London)</td><td>Database and authentication hosting</td></tr>
              <tr><td>Anthropic (Claude API)</td><td>AI content generation — prompts contain curriculum context, not personal identifiers</td></tr>
              <tr><td>Paystack</td><td>Payment processing</td></tr>
              <tr><td>Vercel</td><td>Platform hosting</td></tr>
              <tr><td>SendGrid</td><td>Transactional email delivery</td></tr>
            </tbody>
          </table>
          <p>All third-party processors are required to handle data in accordance with applicable law. Our database is hosted in the EU (London region) under Supabase's data processing terms.</p>
          <h4>7. How Long We Keep Your Information</h4>
          <table class="legal-table">
            <thead><tr><th>Data</th><th>Retention period</th></tr></thead>
            <tbody>
              <tr><td>Account data</td><td>Until account deletion is requested</td></tr>
              <tr><td>Learning activity</td><td>Until account deletion or 3 years of inactivity, whichever comes first</td></tr>
              <tr><td>Payment records</td><td>5 years (statutory requirement)</td></tr>
              <tr><td>Safety flags</td><td>1 year from creation</td></tr>
            </tbody>
          </table>
          <h4>8. Your Rights Under POPIA</h4>
          <p>You have the right to:</p>
          <ul>
            <li>Access the personal information we hold about you</li>
            <li>Correct inaccurate information</li>
            <li>Request deletion of your information (subject to legal retention requirements)</li>
            <li>Object to processing in certain circumstances</li>
            <li>Lodge a complaint with the Information Regulator of South Africa</li>
          </ul>
          <p>Information Regulator contact: enquiries@inforegulator.org.za | +27 (0)10 023 5207</p>
          <p>To exercise any of the above rights, contact: hello@leuroai.co.za</p>
          <h4>9. Security</h4>
          <p>We implement reasonable technical and organisational measures to protect your personal information, including encrypted data transmission (HTTPS), row-level security on our database, and access controls. No system is completely secure — if you believe your account has been compromised, contact us immediately.</p>
          <h4>10. Changes to This Policy</h4>
          <p>We may update this policy from time to time. We will notify users of material changes via email. The current version is always available on the Platform.</p>
        </div>
      </div>
    </div>
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
        <div class="pw-field-wrap">
          <input type="password" name="password" required minlength="8" autocomplete="new-password" />
          <button type="button" class="pw-visibility-btn" data-action="toggle-pw-visibility" aria-label="${t("showPassword")}">👁</button>
        </div>
        <p class="pw-hint" data-pw-hint></p>
      </div>
      <div class="field">
        <label>${t("labelReferral")}</label>
        <input type="text" name="referredBy" placeholder="${t("placeholderReferral")}" maxlength="32" style="text-transform:uppercase;" />
      </div>
      <div class="field">
        <div id="turnstile-container" class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}"></div>
      </div>
      <div class="legal-checkboxes">
        <label class="checkbox-label">
          <input type="checkbox" name="tcAccepted" />
          <span>${t("checkboxTcPrefix")}<button type="button" class="btn-link" data-action="open-tc-modal">${t("linkTc")}</button>${t("checkboxTcAnd")}<button type="button" class="btn-link" data-action="open-privacy-modal">${t("linkPrivacy")}</button></span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" name="ageConsent" />
          <span>${t("checkboxConsent")}</span>
        </label>
      </div>
      <button type="submit" class="btn btn-primary btn-block" disabled>${t("btnCreateAccount")}</button>
    </form>
  `;
}

// Explicitly (re)renders the Turnstile widget into the signup form's
// container. render() replaces app.innerHTML wholesale on every tab
// switch/state change, which destroys any previously-rendered widget
// along with its container element — Turnstile's own automatic DOM scan
// only runs once, at script-load time (long before the signup form ever
// exists in the DOM), so it never picks up containers added afterwards.
// Called from render() via requestAnimationFrame whenever the signup tab
// is showing, so this must be idempotent per container instance.
function initTurnstileWidget() {
  const container = document.getElementById("turnstile-container");
  if (!container || typeof turnstile === "undefined") return;
  if (container.dataset.turnstileRendered === "true") return;
  container.dataset.turnstileRendered = "true";
  turnstileWidgetId = turnstile.render(container, { sitekey: TURNSTILE_SITE_KEY });
}

async function handleLogin(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const email = form.email.value.trim();
    const password = form.password.value;
    const keep = form.querySelector('[name="keepSignedIn"]')?.checked ?? true;
    localStorage.setItem("leuro_keep_signed_in", keep ? "true" : "false");

    // Turnstile injects a hidden `cf-turnstile-response` input inside its
    // container once the challenge is solved (see the signup form for the
    // same pattern) — Supabase Auth's CAPTCHA protection, once enabled
    // project-wide, is enforced on sign-in the same as sign-up.
    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value || "";
    if (!turnstileToken) {
      showToast(t("turnstileRequired"), "error");
      return;
    }

    const { data, error } = await sbClient.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: turnstileToken },
    });
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

    // If the user signed up with a referral code but needed email confirmation,
    // apply_referral_code() was deferred to this first login.
    const pendingCode = sessionStorage.getItem("pending_referral_code");
    if (pendingCode) {
      sessionStorage.removeItem("pending_referral_code");
      const { data: applyResult, error: applyErr } = await sbClient.rpc("apply_referral_code", {
        p_code: pendingCode,
      });
      if (applyErr || !applyResult?.valid) {
        console.error("apply_referral_code (deferred) failed:", applyErr || applyResult);
      } else {
        // Refresh profile so state.profile.referral_code_used is set before render().
        await loadUserData();
        showToast(t("referralApplied"), "success");
      }
    }

    setupKeepSignedIn();
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
    // Turnstile tokens are single-use and expire quickly — reset the
    // still-mounted widget (no full page reload) so the user gets a fresh
    // token to retry with, e.g. after "invalid credentials".
    if (typeof turnstile !== "undefined" && turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
    }
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

    // Password strength gate — mirrors the live hint, in case the disabled
    // submit button was bypassed (e.g. programmatic form submission).
    const pwCheck = evaluatePassword(password, email);
    if (!pwCheck.valid) {
      showToast(t(pwCheck.messageKey), "error");
      return;
    }

    // Legal consent guard — mirrors the checkbox gating on the button.
    const tcAccepted = form.querySelector('[name="tcAccepted"]')?.checked;
    const ageConsent = form.querySelector('[name="ageConsent"]')?.checked;
    if (!tcAccepted || !ageConsent) {
      showToast(t("checkboxTcRequired"), "error");
      return;
    }

    // Turnstile injects a hidden `cf-turnstile-response` input inside its
    // container once the challenge is solved; read it here rather than
    // gating the submit button, so a failed/expired widget produces a
    // clear message instead of a confusing raw Supabase Auth error.
    const turnstileToken = form.querySelector('[name="cf-turnstile-response"]')?.value || "";
    if (!turnstileToken) {
      showToast(t("turnstileRequired"), "error");
      return;
    }

    const metaData = {
      role: "parent",
      full_name: fullName,
      lang: state.lang,
    };
    let referredByCode = form.referredBy?.value.trim().toUpperCase() || "";
    if (referredByCode) {
      // Validate code exists before creating the account (public SELECT policy).
      const { data: codeRow } = await sbClient
        .from("referral_codes")
        .select("code")
        .eq("code", referredByCode)
        .eq("active", true)
        .maybeSingle();
      if (!codeRow) {
        showToast(t("invalidReferralCode"), "error");
        setButtonLoading(btn, false);
        return;
      }
    }

    // Log exactly what we send to Supabase Auth (the profile row is derived
    // from this metadata by the handle_new_user() trigger, or by the
    // ensureUserRecords() fallback below).
    console.log("📝 Signup payload", { email, metaData });

    const { data, error } = await sbClient.auth.signUp({
      email,
      password,
      options: { data: metaData, captchaToken: turnstileToken },
    });
    if (error) throw error;

    if (!data.session) {
      // Email confirmation is enabled: there is no session yet, so the client
      // cannot insert its own rows (no auth.uid()). The handle_new_user()
      // trigger is responsible for creating the profile in this case.
      //
      // Stash the referral code so handleLogin() can apply it after the user
      // confirms their email and signs in — apply_referral_code() needs a live
      // auth session (auth.uid()) so we can't call it here.
      if (referredByCode) {
        sessionStorage.setItem("pending_referral_code", referredByCode);
      }
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
      .update({ full_name: fullName, role: "parent", referral_code: referralCode })
      .eq("id", state.user.id);
    if (profileUpdateErr) {
      console.error("Failed to update profile after signup", profileUpdateErr);
    }

    // Apply institutional referral code if one was validated pre-signup.
    if (referredByCode) {
      const { data: applyResult, error: applyErr } = await sbClient.rpc("apply_referral_code", {
        p_code: referredByCode,
      });
      if (applyErr || !applyResult?.valid) {
        console.error("apply_referral_code failed:", applyErr || applyResult);
      } else {
        showToast(t("referralApplied"), "success");
      }
    }

    await loadUserData();

    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
    // Turnstile tokens are single-use and expire quickly — reset the
    // still-mounted widget (no full page reload) so the user gets a fresh
    // token to retry with, e.g. after "email already registered".
    if (typeof turnstile !== "undefined" && turnstileWidgetId !== null) {
      turnstile.reset(turnstileWidgetId);
    }
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

// Registers a beforeunload handler that clears the Supabase session token
// from localStorage when "Keep me signed in" is unchecked. Called once on
// init (for returning users) and once after each login.
function setupKeepSignedIn() {
  const keep = localStorage.getItem("leuro_keep_signed_in") !== "false";
  if (!keep) {
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
    window.addEventListener("beforeunload", () => {
      localStorage.removeItem(`sb-${projectRef}-auth-token`);
    }, { once: true });
  }
}

async function handleLogout() {
  await sbClient.auth.signOut();
  state.session = null;
  state.user = null;
  state.profile = null;
  state.promoCode = null;
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

// Track which tab was active on the previous render so we can decide
// whether to restore the scroll position after rebuilding the DOM.
let _lastRenderedTab = null;

function render() {
  const app = getApp();
  const savedScrollY = window.scrollY;
  const sameTab = state.currentTab === _lastRenderedTab;

  // Save chat scroll state before DOM rebuild so we can restore it below.
  const chatEl = document.getElementById("chat-scroll");
  const savedChatScrollTop = chatEl ? chatEl.scrollTop : null;
  const chatWasAtBottom = chatEl
    ? chatEl.scrollTop + chatEl.clientHeight >= chatEl.scrollHeight - 5
    : false;

  if (state.loading) {
    app.innerHTML = `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`;
    return;
  }

  // Password recovery: user arrived via a reset-link email. Show the
  // set-new-password form regardless of profile state.
  if (state.passwordRecovery) {
    app.innerHTML = renderPasswordRecoveryScreen();
    return;
  }

  // Accept-invite: child arrived via a parent-generated invite link.
  if (state.acceptInviteToken !== null) {
    app.innerHTML = renderAcceptInviteScreen();
    return;
  }

  if (!state.user || !state.profile) {
    app.innerHTML = renderAuthScreen();
    if (authTab === "signup" || authTab === "login" || authTab === "forgot") {
      requestAnimationFrame(() => initTurnstileWidget());
    }
    return;
  }

  // Admin accounts get a dedicated full-screen panel with no learner/parent
  // tabs, diagnostic gate, or overlays.
  if (state.profile.role === "admin") {
    app.innerHTML = renderAdminScreen();
    if (state.confirmModal) {
      app.insertAdjacentHTML("beforeend", renderConfirmModal());
    }
    return;
  }

  // Account-frozen gate: a non-dismissable full-screen takeover with no
  // tabs/navigation, shown until a parent/guardian confirms.
  if (state.profile.role === "learner" && state.profile.account_frozen) {
    app.innerHTML = renderAccountFrozenScreen();
    return;
  }

  app.innerHTML = renderMainScreen();

  // Preserve scroll position when the user is interacting within the same
  // tab (e.g. answering a flashcard, submitting a form). On tab switches
  // the browser naturally resets to the top when innerHTML is replaced.
  if (sameTab) {
    requestAnimationFrame(() => window.scrollTo(0, savedScrollY));
  }
  _lastRenderedTab = state.currentTab;

  // Restore chat scroll position after DOM rebuild. If the user was at (or
  // within 5px of) the bottom, pin to the new bottom — handles the case where
  // new content changed scrollHeight. Otherwise restore the exact position so
  // mid-scroll reading isn't interrupted.
  if (savedChatScrollTop !== null) {
    requestAnimationFrame(() => {
      const el = document.getElementById("chat-scroll");
      if (!el) return;
      el.scrollTop = chatWasAtBottom ? el.scrollHeight : savedChatScrollTop;
    });
  }

  // Subject-selection gate: Grade 10-12 learners who have not yet chosen
  // their subjects see this overlay before the diagnostic. The two gates
  // are mutually exclusive — subject selection takes priority.
  if (
    state.profile.role === "learner" &&
    state.learner &&
    state.showSubjectSelection
  ) {
    app.insertAdjacentHTML("beforeend", renderSubjectSelectionScreen());
  } else if (
    // Diagnostic gate: shown whenever a learner has not completed their
    // diagnostic (diagnostic_level null or 0), or has chosen to retake it.
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

  if (state.confirmModal) {
    app.insertAdjacentHTML("beforeend", renderConfirmModal());
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
        <button class="topbar-logout-btn" data-action="logout" title="${t("btnLogout")}">⏏</button>
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
    case "referral":
      tabContent = renderAdminReferralCodesTab();
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
        <button type="button" class="admin-tab-btn ${tab === "referral" ? "active" : ""}" data-action="admin-switch-tab" data-tab="referral">Referral Codes</button>
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
        ${user.referral_code_used ? `<span class="admin-referral-tag">Ref: ${escapeHtml(user.referral_code_used)}</span>` : ""}
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

async function adminChangeTier(userId, tier, selectEl) {
  if (selectEl) selectEl.disabled = true;
  try {
    const { error } = await sbClient.rpc("admin_update_tier", { p_user_id: userId, p_tier: tier });
    if (error) throw error;
    const user = (state.admin.users || []).find((u) => u.id === userId);
    if (user) user.subscription_tier = tier;
    showToast("Tier updated", "success");
    render();
  } catch (err) {
    console.error(err);
    if (selectEl) selectEl.disabled = false;
    showToast(err.message || t("errorGeneric"), "error");
    // Re-render so the dropdown reverts to the tier actually stored, rather
    // than leaving the failed selection visible (the write did not persist).
    render();
  }
}

async function adminToggleFreeze(userId, currentlyFrozen, btn) {
  const next = !currentlyFrozen;
  setButtonLoading(btn, true);
  try {
    const { error } = await sbClient.from("profiles").update({ account_frozen: next }).eq("id", userId);
    if (error) throw error;
    const user = (state.admin.users || []).find((u) => u.id === userId);
    if (user) user.account_frozen = next;
    showToast(next ? "Account frozen" : "Account unfrozen", "success");
    render();
  } catch (err) {
    console.error(err);
    setButtonLoading(btn, false);
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

async function adminMarkFlagReviewed(flagId, btn) {
  setButtonLoading(btn, true);
  try {
    const { error } = await sbClient.from("content_flags").update({ admin_reviewed: true }).eq("id", flagId);
    if (error) throw error;
    const flag = (state.admin.flags || []).find((f) => f.id === flagId);
    if (flag) flag.admin_reviewed = true;
    showToast("Flag marked as reviewed", "success");
    render();
  } catch (err) {
    console.error(err);
    setButtonLoading(btn, false);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

async function adminUnfreezeFromFlag(flagId, userId, btn) {
  setButtonLoading(btn, true);
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
    setButtonLoading(btn, false);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

// ---- STATS TAB ----------------------------------------------------------
async function loadAdminStats() {
  state.admin.statsLoading = true;
  try {
    const { data, error } = await sbClient.rpc("admin_get_stats");
    if (error) throw error;
    console.log("admin_get_stats response", data);
    // rpc() returns an array of rows for a TABLE-returning function, but may
    // auto-unwrap to a single object - handle both. bigint counts can also
    // arrive as strings, so coerce with Number().
    const row = (Array.isArray(data) ? data[0] : data) || {};

    state.admin.stats = {
      totalUsers: Number(row.total_users) || 0,
      totalLearners: Number(row.total_learners) || 0,
      sessionsToday: Number(row.sessions_today) || 0,
      unreviewedFlags: Number(row.unreviewed_flags) || 0,
      tierBreakdown: {
        free: Number(row.free_learners) || 0,
        basic: Number(row.basic_learners) || 0,
        premium: Number(row.premium_learners) || 0,
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

// ---- REFERRAL CODES TAB ----------------------------------------------
async function loadAdminReferralCodes() {
  state.admin.referralCodesLoading = true;
  try {
    const { data, error } = await sbClient.rpc("admin_get_referral_codes");
    if (error) throw error;
    state.admin.referralCodes = data || [];
  } catch (err) {
    console.error("loadAdminReferralCodes:", err);
    state.admin.referralCodes = [];
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    state.admin.referralCodesLoading = false;
    render();
  }
}

async function createAdminReferralCode(schoolName, discountPercent, discountMonths) {
  const code = `LEURO-${schoolName.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  if (code.length < 7) {
    showToast("Please enter a valid school name.", "error");
    return;
  }
  try {
    const { data, error } = await sbClient.rpc("admin_create_referral_code", {
      p_code: code,
      p_description: schoolName,
      p_discount_percent: discountPercent,
      p_discount_months: discountMonths,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    showToast(`Code ${code} created.`, "success");
    state.admin.referralCodes = null; // trigger reload
    render();
  } catch (err) {
    console.error("createAdminReferralCode:", err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

async function adminToggleReferralCode(codeId) {
  try {
    const { error } = await sbClient.rpc("admin_toggle_referral_code_active", { p_id: codeId });
    if (error) throw error;
    state.admin.referralCodes = null; // trigger reload
    render();
  } catch (err) {
    console.error("adminToggleReferralCode:", err);
    showToast(err.message || t("errorGeneric"), "error");
  }
}

function renderAdminReferralCodesTab() {
  if (state.admin.referralCodes === null) {
    if (!state.admin.referralCodesLoading) loadAdminReferralCodes();
    return `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("loading")}</div>`;
  }

  const rows = state.admin.referralCodes.map(
    (r) => `
    <tr>
      <td class="referral-code-cell">${escapeHtml(r.code)}</td>
      <td>${escapeHtml(r.description || "—")}</td>
      <td style="text-align:center;">${r.discount_percent ?? 20}%</td>
      <td style="text-align:center;">${r.discount_months ?? 3} mo</td>
      <td style="text-align:center;">${r.used_count}</td>
      <td class="muted">${formatDate(r.created_at)}</td>
      <td style="text-align:center;">
        <button class="btn btn-sm ${r.active ? "btn-outline" : "btn-primary"}" data-action="admin-toggle-referral-code" data-code-id="${r.id}">
          ${r.active ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  `
  ).join("");

  return `
    <h3 class="screen-title" style="margin:0 0 14px;">Referral Codes</h3>
    <div class="card admin-referral-create-card">
      <h4 style="margin:0 0 10px;">Generate New Code</h4>
      <form data-action="admin-create-referral-code" class="admin-referral-form">
        <div class="field">
          <label>School name</label>
          <div class="admin-referral-input-row">
            <input type="text" name="schoolName" placeholder="e.g. YOURSCHOOL" maxlength="24" required style="text-transform:uppercase;" />
          </div>
          <p class="field-hint">Code will be created as <strong>LEURO-SCHOOLNAME</strong></p>
        </div>
        <div style="display:flex;gap:12px;">
          <div class="field" style="flex:1;margin-bottom:0;">
            <label>Discount %</label>
            <input type="number" name="discountPercent" min="1" max="100" value="20" required />
          </div>
          <div class="field" style="flex:1;margin-bottom:0;">
            <label>Duration (months)</label>
            <input type="number" name="discountMonths" min="1" max="24" value="3" required />
          </div>
          <div class="field" style="flex:0;margin-bottom:0;align-self:flex-end;">
            <button type="submit" class="btn btn-primary btn-sm">Generate &amp; Create</button>
          </div>
        </div>
      </form>
    </div>
    ${state.admin.referralCodes.length === 0
      ? `<div class="empty-state"><div class="empty-icon">🏫</div><p>No referral codes yet.</p></div>`
      : `<div class="card" style="padding:0;overflow:auto;">
           <table class="admin-referral-table">
             <thead><tr><th>Code</th><th>School</th><th>Discount</th><th>Duration</th><th>Used</th><th>Created</th><th>Active</th></tr></thead>
             <tbody>${rows}</tbody>
           </table>
         </div>`
    }
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

// ---------------------------------------------------------------------
// FET SUBJECT SELECTION (Grade 10-12 only)
// ---------------------------------------------------------------------

const SUBSEL_COMPULSORY = new Set(["english", "afrikaans", "life orientation"]);
const SUBSEL_MATHS      = new Set(["mathematics", "mathematical literacy"]);

function renderSubjectSelectionScreen() {
  const lang = state.lang;
  const ss   = state.subjectSelection;
  const subjects = state.subjects;

  const compulsory = subjects.filter((s) => SUBSEL_COMPULSORY.has(s.name.toLowerCase()));
  const mathsOptions = subjects.filter((s) => SUBSEL_MATHS.has(s.name.toLowerCase()));
  const electives = subjects
    .filter((s) => !SUBSEL_COMPULSORY.has(s.name.toLowerCase()) && !SUBSEL_MATHS.has(s.name.toLowerCase()))
    .slice()
    .sort((a, b) => subjectLabel(a).localeCompare(subjectLabel(b)));

  const electiveCount = ss.selectedElectiveIds.length;
  const af = lang === "af";

  return `
    <div class="diagnostic-overlay" id="subject-selection-modal">
      <div class="diagnostic-modal">
        ${diagnosticHeaderBar()}
        <div class="diagnostic-body">
          <h2 class="diagnostic-title">${af ? "Kies Jou Vakke" : "Choose Your Subjects"}</h2>

          <div class="subject-section">
            <div class="subject-section-label">${af ? "Verpligte Vakke" : "Compulsory Subjects"}</div>
            ${compulsory.map((s) => `
              <label class="subject-row subject-row-locked">
                <input type="checkbox" checked disabled class="subject-checkbox">
                <span class="subject-name">${escapeHtml(subjectLabel(s))}</span>
                <span class="subject-required-badge">${af ? "Verpligtend" : "Required"}</span>
              </label>
            `).join("")}
          </div>

          <div class="subject-section">
            <div class="subject-section-label">${af ? "Wiskunde (kies een)" : "Mathematics (choose one)"}</div>
            ${mathsOptions.map((s) => `
              <label class="subject-row">
                <input type="radio" name="subject-maths"
                  class="subject-radio"
                  data-action="subject-maths-select"
                  data-subject-id="${escapeHtml(s.id)}"
                  ${ss.mathChoiceId === s.id ? "checked" : ""}>
                <span class="subject-name">${escapeHtml(subjectLabel(s))}</span>
              </label>
            `).join("")}
          </div>

          <div class="subject-section">
            <div class="subject-section-label">${af ? "Keusevakke (kies minstens 3)" : "Elective Subjects (choose at least 3)"}</div>
            <div class="subject-elective-counter ${electiveCount >= 3 ? "counter-met" : ""}">
              ${af ? `${electiveCount} van 3 minimum gekies` : `${electiveCount} of 3 minimum selected`}
            </div>
            ${electives.map((s) => `
              <label class="subject-row">
                <input type="checkbox"
                  class="subject-checkbox"
                  data-action="subject-elective-toggle"
                  data-subject-id="${escapeHtml(s.id)}"
                  ${ss.selectedElectiveIds.includes(s.id) ? "checked" : ""}>
                <span class="subject-name">${escapeHtml(subjectLabel(s))}</span>
              </label>
            `).join("")}
          </div>

          ${ss.error ? `<p class="form-error">${escapeHtml(ss.error)}</p>` : ""}

          <button class="btn btn-gold btn-block" data-action="subject-selection-submit" ${ss.saving ? "disabled" : ""}>
            ${ss.saving ? `<span class="spinner"></span>` : escapeHtml(af ? "Begin My Diagnostiek →" : "Start My Diagnostic →")}
          </button>
        </div>
      </div>
    </div>
  `;
}

async function submitSubjectSelection() {
  const lang = state.lang;
  const ss   = state.subjectSelection;
  const af   = lang === "af";

  if (!ss.mathChoiceId) {
    ss.error = af
      ? "Kies asseblief Wiskunde of Wiskundige Geletterdheid."
      : "Please select either Mathematics or Mathematical Literacy.";
    render();
    return;
  }
  if (ss.selectedElectiveIds.length < 3) {
    ss.error = af
      ? "Kies asseblief minstens 3 keusevakke."
      : "Please select at least 3 elective subjects.";
    render();
    return;
  }

  ss.error = null;
  ss.saving = true;
  render();

  try {
    const compulsoryIds = state.subjects
      .filter((s) => SUBSEL_COMPULSORY.has(s.name.toLowerCase()))
      .map((s) => s.id);
    const allSelected = [...compulsoryIds, ss.mathChoiceId, ...ss.selectedElectiveIds];

    const { error } = await sbClient
      .from("learner_subjects")
      .insert(allSelected.map((subjectId) => ({ learner_id: state.learner.id, subject_id: subjectId })));
    if (error) throw error;

    state.learnerSubjects = allSelected;
    state.subjectSelectionComplete = true;
    state.showSubjectSelection = false;
    ss.saving = false;
    render();
  } catch (err) {
    console.error("Subject selection error:", err);
    ss.saving = false;
    ss.error = af
      ? "Kon nie vakke stoor nie. Probeer asseblief weer."
      : "Failed to save subjects. Please try again.";
    render();
  }
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
        ...(state.learnerSubjects.length > 0 && {
          subjectNames: state.subjects
            .filter((s) => state.learnerSubjects.includes(s.id))
            .map((s) => s.name),
        }),
      }),
    }, 60000);
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
    d.savePromise = saveDiagnosticResult(d);
    await d.savePromise;
  }
}

async function saveDiagnosticResult(d) {
  try {
    const { error: updateErr } = await sbClient
      .from("learners")
      .update({ diagnostic_level: d.level })
      .eq("user_id", state.user.id);
    if (updateErr) throw updateErr;

    // Reflect the saved level locally immediately, so the diagnostic gate in
    // render() passes on the first pass. This is the write that controls the
    // gate; it must not depend on the (non-critical) attempt-history insert
    // below succeeding.
    state.learner.diagnostic_level = d.level;
  } catch (err) {
    console.error("Failed to save diagnostic level", err);
    showToast(t("errorGeneric"), "error");
    return;
  }

  // Attempt history is a non-critical record. A failure here (e.g. a missing
  // column on an un-migrated database) must not re-gate the learner into the
  // diagnostic or block them from entering the app.
  try {
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
  } catch (err) {
    console.error("Failed to record diagnostic attempt history", err);
  }
}

async function diagnosticFinish() {
  // If the result save is still in flight (e.g. the learner tapped Finish
  // immediately), wait for it so state.learner.diagnostic_level is set
  // before the gate below re-evaluates - otherwise render() would treat
  // this as an incomplete diagnostic and show it again from the start.
  if (state.diagnostic?.savePromise) {
    await state.diagnostic.savePromise;
  }
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

  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, subjectLabel(s)]));
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
// Returns the subjects to display in learner-facing dropdowns. For Grade
// 10-12 learners who have completed subject selection, only their chosen
// subjects are shown. All other learners see the full grade subject list.
function getAvailableSubjects() {
  if (state.learner && state.learner.grade >= 10 && state.learnerSubjects.length > 0) {
    return state.subjects.filter((s) => state.learnerSubjects.includes(s.id));
  }
  return state.subjects;
}

function renderLearnTab() {
  const tier = getEffectiveLearnerTier();
  const limitReached = tier === "free" && state.sessionsToday >= 3;
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, subjectLabel(s)]));

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
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; flex-wrap:wrap;">
        ${
          tier === "free"
            ? `<span class="badge ${limitReached ? "badge-danger" : "badge-muted"}">${t("sessionsToday")}: ${state.sessionsToday}/3</span>`
            : `<span class="badge badge-success">${t("unlimitedSessions")}</span>`
        }
        <button class="badge badge-purple" data-action="retake-diagnostic-confirm">${t("retakeDiagnostic")}</button>
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
          ${getAvailableSubjects().map((s) => `<option value="${s.id}">${escapeHtml(subjectLabel(s))}</option>`).join("")}
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

  const tier = getEffectiveLearnerTier();
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
  }, 60000);
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

  let wasWeakAttempt = false;

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
      } else if (phase === "feedback") {
        wasWeakAttempt = !!data.wasWeakAttempt;
      }
      // A weak attempt re-shows the answer box on this same feedback/hint
      // message, reusing the existing answerBox/answered fields so the
      // learner can retry the same question right where the hint appears.
      s.messages.push({ role: "ai", phase, text, answerBox: phase === "attempt" || wasWeakAttempt });
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
    } else if (phase === "feedback" && !wasWeakAttempt) {
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
    showToast(t("enterAnswer"), "error");
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

  try {
    await Promise.all([loadTopics(), loadSessionsToday(), reloadLearner()]);
  } catch (err) {
    console.error("Failed to refresh data after session", err);
    showToast(t("errorGeneric"), "error");
  }

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
  try {
    await loadSessionsToday();
  } catch (err) {
    console.error("Failed to refresh session count", err);
    showToast(t("errorGeneric"), "error");
  }
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
      <h3 class="mt-0 screen-title">${
        view === "studyguide" ? t("tabStudyGuide") :
        view === "mockexam"   ? t("tabMockExam") :
        view === "flashcard"  ? t("tabFlashcards") :
                                t("tabExamRefresher")
      }</h3>
      <span class="badge badge-gold">${t("yourDiagnosticLevel")}: ${state.learner.diagnostic_level}/5</span>
    </div>

    <div class="exams-toggle">
      <button class="exams-toggle-btn ${view === "studyguide" ? "active" : ""}" data-action="exams-switch-view" data-view="studyguide">${t("tabStudyGuide")}</button>
      <button class="exams-toggle-btn ${view === "mockexam" ? "active" : ""}" data-action="exams-switch-view" data-view="mockexam">${t("tabMockExam")}</button>
      <button class="exams-toggle-btn ${view === "flashcard" ? "active" : ""}" data-action="exams-switch-view" data-view="flashcard">${t("tabFlashcards")}</button>
      <button class="exams-toggle-btn ${view === "refresher" ? "active" : ""}" data-action="exams-switch-view" data-view="refresher">${t("tabExamRefresher")}</button>
    </div>

    ${view === "studyguide" ? renderStudyGuideSection() : view === "mockexam" ? renderMockExamSection() : view === "flashcard" ? renderFlashcardSection() : renderRefresherSection()}
  `;
}

// A failed/cancelled renewal (learners.subscription_status) overrides
// subscription_tier client-side too: the tier column can lag briefly before
// the webhook clears it, so status is the authoritative signal. This is a
// UX mirror only — the real enforcement is server-side in generate-study-guide
// and generate-mock-exam.
function getEffectiveLearnerTier() {
  const status = state.learner?.subscription_status;
  if (status === "past_due" || status === "cancelled") return "free";
  return state.profile.subscription_tier;
}

// Small "please renew" banner shown on the learner's Study Guide / Mock Exam
// sections when their subscription is past_due. Reuses the existing
// alert-banner-danger styling from the parent dashboard's alert banners.
function renderPastDueBanner() {
  if (state.learner?.subscription_status !== "past_due") return "";
  return `
    <div class="alert-banner alert-banner-danger">
      <span class="alert-banner-icon">⚠️</span>
      <span>${t("pastDueBannerMsg")}</span>
    </div>
  `;
}

// Renders a "Premium feature" lock card with an upgrade CTA, mirroring how the
// Mock Exam tab steers free/basic learners to the Account tab to upgrade.
function renderPremiumGate(messageKey) {
  return `
    <div class="card">
      <div class="empty-state">
        <div class="empty-icon">🔒</div>
        <p><strong>${t("premiumOnlyTitle")}</strong></p>
        <p>${t(messageKey)}</p>
      </div>
      <button class="btn btn-gold btn-block" data-action="switch-tab" data-tab="account">${t("btnUpgradeToPremium")}</button>
    </div>
  `;
}

function renderStudyGuideSection() {
  if (getEffectiveLearnerTier() !== "premium") {
    return renderPastDueBanner() + renderPremiumGate("studyGuidePremiumMsg");
  }

  const sg = state.studyGuide;
  const selectedSubjectId = sg.subjectId ?? getAvailableSubjects()[0]?.id;

  return `
    <div class="card">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="study-guide-subject" data-action="study-guide-subject-change">
          ${getAvailableSubjects().map((s) => `<option value="${s.id}" ${selectedSubjectId === s.id ? "selected" : ""}>${escapeHtml(subjectLabel(s))}</option>`).join("")}
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
      <div class="study-guide-card-header">
        <h3 class="mt-0">${escapeHtml(r.topicTitle || sg.topicTitle || "")}</h3>
        <button class="btn btn-gold btn-sm study-guide-download-btn pdf-exclude" data-action="download-study-guide">${t("btnDownloadPdf")}</button>
      </div>

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

      <button class="btn btn-primary btn-block pdf-exclude" data-action="save-study-guide" ${sg.saving ? "disabled" : ""}>
        ${sg.saving ? `<span class="spinner"></span> ${t("loading")}` : sg.saved ? t("btnSaved") : t("btnSaveGuide")}
      </button>
    </div>
  `;
}

// ---------------------------------------------------------------------
// FLASHCARD GAME
// ---------------------------------------------------------------------
function renderFlashcardSection() {
  const fc = state.flashcard;
  if (fc.step === "game") return renderFlashcardGame(fc);
  if (fc.step === "results") return renderFlashcardResults(fc);
  return renderFlashcardSetup(fc);
}

function renderFlashcardSetup(fc) {
  const selectedSubjectId = fc.subjectId ?? getAvailableSubjects()[0]?.id;
  return `
    <div class="card">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="flashcard-subject" data-action="flashcard-subject-change">
          ${getAvailableSubjects().map((s) => `<option value="${s.id}" ${selectedSubjectId === s.id ? "selected" : ""}>${escapeHtml(subjectLabel(s))}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label>${t("topicLabel")}</label>
        <input type="text" id="flashcard-topic" placeholder="${t("addTopicPlaceholder")}" maxlength="120" value="${escapeHtml(fc.topicTitle || "")}" />
      </div>
      <div class="field">
        <label>${t("flashcardCountLabel")}</label>
        <div class="flashcard-count-group">
          ${[10, 15, 20].map((n) => `<button class="flashcard-count-btn ${fc.cardCount === n ? "active" : ""}" data-action="flashcard-count" data-count="${n}">${n}</button>`).join("")}
        </div>
      </div>
      <button class="btn btn-gold btn-block" data-action="generate-flashcards" ${fc.loading ? "disabled" : ""}>
        ${fc.loading ? `<span class="spinner"></span> ${t("generating")}` : t("btnStartFlashcards")}
      </button>
    </div>
    ${fc.error ? `<div class="card" style="border-left:4px solid var(--danger);"><p>${escapeHtml(fc.error)}</p></div>` : ""}
  `;
}

function renderFlashcardGame(fc) {
  const card = fc.cards[fc.currentIndex];
  const total = fc.cards.length;
  const current = fc.currentIndex + 1;
  const timerDanger = fc.secondsLeft < 3;
  const { answered, selectedAnswer } = fc;
  const isCorrect = answered && selectedAnswer === card.correct;
  const isTimeUp = answered && !selectedAnswer;

  const resultLabel = isTimeUp ? t("flashcardTimeUp") : isCorrect ? t("flashcardCorrect") : t("flashcardWrong");

  return `
    <div class="card flashcard-game-card">
      <div class="flashcard-progress">
        <span>${t("flashcardProgress").replace("{0}", current).replace("{1}", total)}</span>
        ${answered
          ? `<span class="flashcard-timer">&nbsp;</span>`
          : `<span id="flashcard-timer" class="flashcard-timer ${timerDanger ? "timer-danger" : ""}">${fc.secondsLeft}s</span>`}
      </div>

      <div class="flashcard-flip-container ${fc.flipped ? "flipped" : ""}">
        <div class="flashcard-inner">
          <div class="flashcard-face flashcard-front">
            <div class="flashcard-label">${t("flashcardFrontLabel")}</div>
            <div class="flashcard-text">${escapeHtml(card.question)}</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="flashcard-result-label ${isCorrect ? "result-correct" : "result-wrong"}">${resultLabel}</div>
            <div class="flashcard-label" style="margin-top:var(--spacing-8);">${t("flashcardExplanationLabel")}</div>
            <div class="flashcard-explanation">${escapeHtml(card.explanation)}</div>
          </div>
        </div>
      </div>

      <div class="flashcard-options">
        ${["A", "B", "C", "D"].map((key) => {
          let cls = "flashcard-option-btn";
          if (answered) {
            if (key === card.correct) cls += " option-correct";
            else if (key === selectedAnswer) cls += " option-wrong";
            else cls += " option-dim";
          }
          return `<button class="${cls}" data-action="flashcard-answer" data-answer="${key}" ${answered ? "disabled" : ""}>
            <span class="flashcard-option-key">${key}</span>
            <span class="flashcard-option-text">${escapeHtml(card.options[key])}</span>
          </button>`;
        }).join("")}
      </div>

      ${answered ? `<button class="btn btn-primary btn-block" style="margin-top:var(--spacing-12);" data-action="flashcard-next">${t("btnFlashcardNext")} →</button>` : ""}
    </div>
  `;
}

function renderFlashcardResults(fc) {
  const total = fc.cards.length;
  const correctCount = fc.correct.filter(Boolean).length;
  const pct = Math.round((correctCount / total) * 100);
  const missed = fc.cards.filter((_, i) => !fc.correct[i]);

  return `
    <div class="card flashcard-results-card">
      <h3 class="mt-0">${t("flashcardResultsHeading")}</h3>
      <div class="flashcard-score">
        <span class="flashcard-score-big">${correctCount}/${total}</span>
        <span class="flashcard-score-pct">${pct}%</span>
      </div>
      ${missed.length === 0
        ? `<p>${t("flashcardPerfect")}</p>`
        : `<div class="section-title">${t("flashcardMissedLabel")}</div>
           <div class="flashcard-missed-list">
             ${missed.map((c) => `
               <div class="flashcard-missed-item">
                 <strong>${escapeHtml(c.question)}</strong>
                 <p><span class="flashcard-option-key" style="font-size:0.7rem;">${c.correct}</span> ${escapeHtml(c.options[c.correct])}</p>
               </div>`).join("")}
           </div>`}
      <div class="flashcard-result-actions">
        <button class="btn btn-gold btn-block" data-action="flashcard-play-again">${t("btnFlashcardPlayAgain")}</button>
        <button class="btn btn-outline btn-block" data-action="flashcard-restart">${t("btnFlashcardNew")}</button>
      </div>
    </div>
  `;
}

// Maps each mock-exam difficulty to its translation key for the question/marks
// breakdown shown under the difficulty selector.
const EXAM_DIFF_STAT = { low: "examStatLow", medium: "examStatMedium", high: "examStatHigh" };

function renderMockExamSection() {
  const tier = getEffectiveLearnerTier();
  const isPremium = tier === "premium";
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, subjectLabel(s)]));
  const completedExams = state.exams.filter((e) => e.completed_at);
  const mx = state.mockExamSetup;
  const selectedSubjectId = mx.subjectId ?? getAvailableSubjects()[0]?.id;
  const selectedDifficulty = isPremium ? mx.difficulty || "low" : "low";

  return `
    ${renderPastDueBanner()}
    <div class="card">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="exam-subject" data-action="exam-subject-change">
          ${getAvailableSubjects().map((s) => `<option value="${s.id}" ${selectedSubjectId === s.id ? "selected" : ""}>${escapeHtml(subjectLabel(s))}</option>`).join("")}
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
        <select id="exam-difficulty" data-action="exam-difficulty-change">
          <option value="low" ${selectedDifficulty === "low" ? "selected" : ""}>${t("diffLow")}</option>
          <option value="medium" ${isPremium ? "" : "disabled"} ${selectedDifficulty === "medium" ? "selected" : ""}>${t("diffMedium")}</option>
          <option value="high" ${isPremium ? "" : "disabled"} ${selectedDifficulty === "high" ? "selected" : ""}>${t("diffHigh")}</option>
        </select>
        <p class="muted mock-exam-stat">${t(EXAM_DIFF_STAT[selectedDifficulty] || EXAM_DIFF_STAT.low)}</p>
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
  if (state.examsView === "flashcard" && view !== "flashcard") {
    clearFlashcardTimer();
  }
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
  if (getEffectiveLearnerTier() !== "premium") {
    showToast(t("studyGuidePremiumMsg"), "error");
    return;
  }

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

async function downloadStudyGuidePdf() {
  const card = document.querySelector(".study-guide-card");
  if (!card) return;

  const sg = state.studyGuide;
  const subjectSlug = (sg.topicTitle || "guide").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const filename = `leuro-study-guide-${subjectSlug}-${timestamp}.pdf`;

  const btn = document.querySelector('[data-action="download-study-guide"]');
  if (btn) { btn.disabled = true; btn.textContent = "Generating…"; }

  try {
    // Exclude UI-only action buttons (Download PDF, Save Guide) from the
    // capture - they're page controls, not exportable content, and this
    // also means the "Generating…" label this function sets on the
    // button above can never leak into the export regardless of its
    // current text. Hidden via visibility (not removed/ignored) so the
    // cloned document html2canvas renders keeps the exact same layout
    // widths as the live page.
    //
    // IMPORTANT: do NOT pass width/windowWidth here. windowWidth tells
    // html2canvas to re-render the page inside a simulated browser window
    // of that width - forcing it to card.scrollWidth (measured in the
    // REAL viewport) caused the whole page to re-layout under a narrower
    // simulated window, where this app's own responsive breakpoints can
    // resolve differently, so the card's true re-rendered width no longer
    // matched the `width` canvas-buffer size we'd also pinned - the
    // excess got hard-clipped at the canvas edge. That caused the
    // widespread right-edge clipping confirmed on retest (worse than
    // before this pair of options was added). Leaving both unset lets
    // html2canvas use its real defaults (real window.innerWidth, and the
    // element's actual offsetWidth within it), which is what correctly
    // reproduces the live page.
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll(".pdf-exclude").forEach((el) => {
          el.style.visibility = "hidden";
        });
      },
    });

    // TEMPORARY debug step: download the raw captured canvas as its own
    // PNG, separate from the PDF, so we can see whether clipping is
    // already present in html2canvas's own capture (before it ever
    // reaches jsPDF) or only appears once the image is placed into the
    // PDF page.
    const debugLink = document.createElement("a");
    debugLink.href = canvas.toDataURL("image/png");
    debugLink.download = `debug-canvas-${timestamp}.png`;
    document.body.appendChild(debugLink);
    debugLink.click();
    document.body.removeChild(debugLink);

    // TEMPORARY diagnostic logging - please check the browser console on
    // your next test export and paste back these numbers, whether or not
    // clipping still occurs. This replaces guessing with real data.
    console.log("[study-guide-pdf-debug]", {
      cardScrollWidth: card.scrollWidth,
      cardScrollHeight: card.scrollHeight,
      cardOffsetWidth: card.offsetWidth,
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      canvasAspect: canvas.width / canvas.height,
      windowInnerWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
    });

    const { jsPDF } = window.jspdf;

    // A4 at 96dpi, in px (matches this function's existing "px" unit).
    const PAGE_WIDTH = 794;
    const PAGE_HEIGHT = 1123;
    const imgW = PAGE_WIDTH;
    const imgH = (canvas.height * PAGE_WIDTH) / canvas.width;

    console.log("[study-guide-pdf-debug] page math", { PAGE_WIDTH, PAGE_HEIGHT, imgW, imgH, willTile: imgH > PAGE_HEIGHT });

    // Small footer watermark instead of a giant diagonal one fixed at
    // page-center - the old one sat directly on top of whatever content
    // happened to be there, most often the Self-Check box.
    const drawFooterWatermark = (targetPdf, pageW, pageH) => {
      targetPdf.saveGraphicsState();
      targetPdf.setGState(new targetPdf.GState({ opacity: 0.35 }));
      targetPdf.setFont("helvetica", "normal");
      targetPdf.setFontSize(9);
      targetPdf.setTextColor(90, 62, 118);
      targetPdf.text("Leuro™ · leuroai.co.za", pageW / 2, pageH - 14, { align: "center" });
      targetPdf.restoreGraphicsState();
    };

    let pdf;
    if (imgH <= PAGE_HEIGHT) {
      // Short guide (the common case): one page sized exactly to the
      // content - no fixed A4 page height, so no trailing blank space.
      pdf = new jsPDF({ unit: "px", format: [imgW, imgH], orientation: "portrait" });
      // Read the page size back from jsPDF itself rather than reusing
      // imgW/imgH directly - a custom format array's internal unit
      // handling isn't guaranteed to round-trip identically to the
      // coordinate space addImage draws in. pageSize.getWidth()/Height()
      // is always in the doc's actual coordinate space, so this is the
      // one guaranteed-consistent source for both. This was the actual
      // bug: passing independently-computed imgW/imgH straight to
      // addImage (rather than reading them back like the original code
      // did for its "a4" page) let the image get drawn larger than the
      // page's real size, which a PDF hard-clips at the page edge -
      // matching the uniform right-edge cut confirmed against a clean
      // source canvas.
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pageW, pageH);
      drawFooterWatermark(pdf, pageW, pageH);
    } else {
      // Long guide (e.g. a multi-topic Grade 11 study guide covering
      // several exam topics) - falls back to tiling across fixed
      // A4-height pages, same as before, just with the same footer
      // watermark instead of the old page-center one.
      pdf = new jsPDF({ unit: "px", format: [PAGE_WIDTH, PAGE_HEIGHT], orientation: "portrait" });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let yOffset = 0;
      while (yOffset < imgH) {
        if (yOffset > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, -yOffset, pageW, imgH);
        drawFooterWatermark(pdf, pageW, pageH);
        yOffset += pageH;
      }
    }

    pdf.save(filename);
  } catch (err) {
    console.error(err);
    showToast(t("errorGeneric"), "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t("btnDownloadPdf"); }
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
// FLASHCARD GAME HANDLERS
// ---------------------------------------------------------------------
let flashcardTimerId = null;

function clearFlashcardTimer() {
  if (flashcardTimerId) {
    clearInterval(flashcardTimerId);
    flashcardTimerId = null;
  }
}

function startFlashcardTimer() {
  clearFlashcardTimer();
  state.flashcard.secondsLeft = 10;
  flashcardTimerId = setInterval(() => {
    const fc = state.flashcard;
    if (fc.answered) { clearFlashcardTimer(); return; }
    fc.secondsLeft = Math.max(0, fc.secondsLeft - 1);
    if (fc.secondsLeft <= 0) {
      clearFlashcardTimer();
      // Time's up — mark wrong, flip to reveal answer.
      fc.correct.push(false);
      fc.answered = true;
      fc.selectedAnswer = null;
      fc.flipped = false;
      render();
      requestAnimationFrame(() => {
        const container = document.querySelector(".flashcard-flip-container");
        if (container) container.classList.add("flipped");
      });
      return;
    }
    // Lightweight DOM update — avoids a full re-render each second.
    const timerEl = document.getElementById("flashcard-timer");
    if (timerEl) {
      timerEl.textContent = `${fc.secondsLeft}s`;
      timerEl.classList.toggle("timer-danger", fc.secondsLeft < 3);
    }
  }, 1000);
}

function handleFlashcardAnswer(answer) {
  const fc = state.flashcard;
  if (fc.answered) return;
  clearFlashcardTimer();
  const isCorrect = answer === fc.cards[fc.currentIndex].correct;
  fc.selectedAnswer = answer;
  fc.answered = true;
  fc.correct.push(isCorrect);
  fc.flipped = false;
  render();
  // Animate flip in next frame so the newly rendered (unflipped) card transitions.
  requestAnimationFrame(() => {
    const container = document.querySelector(".flashcard-flip-container");
    if (container) container.classList.add("flipped");
  });
}

function flashcardNext() {
  const fc = state.flashcard;
  clearFlashcardTimer();
  if (fc.currentIndex + 1 >= fc.cards.length) {
    fc.step = "results";
    render();
    return;
  }
  fc.currentIndex++;
  fc.flipped = false;
  fc.answered = false;
  fc.selectedAnswer = null;
  fc.secondsLeft = 10;
  render();
  startFlashcardTimer();
}

async function generateFlashcards() {
  const subjectSelect = document.getElementById("flashcard-subject");
  const topicInput = document.getElementById("flashcard-topic");
  const topicTitle = topicInput ? topicInput.value.trim() : state.flashcard.topicTitle;

  if (!topicTitle) {
    showToast(t("enterTopicFirst"), "error");
    return;
  }

  const fc = state.flashcard;
  if (subjectSelect) fc.subjectId = subjectSelect.value;
  fc.topicTitle = topicTitle;
  fc.loading = true;
  fc.error = null;
  render();

  try {
    const res = await fetchWithTimeout(`${FN_URL}/generate-flashcards`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.session.access_token}`,
      },
      body: JSON.stringify({
        subjectId: fc.subjectId ?? getAvailableSubjects()[0]?.id,
        topicTitle: fc.topicTitle,
        cardCount: fc.cardCount,
      }),
    }, 60000);

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || t("errorFlashcardGeneration"));

    fc.cards = data.cards;
    fc.step = "game";
    fc.currentIndex = 0;
    fc.flipped = false;
    fc.correct = [];
    fc.secondsLeft = 10;
    fc.answered = false;
    fc.selectedAnswer = null;
    fc.loading = false;
    render();
    startFlashcardTimer();
  } catch (err) {
    console.error(err);
    fc.loading = false;
    fc.error = err.message || t("errorFlashcardGeneration");
    render();
  }
}

function flashcardPlayAgain() {
  const fc = state.flashcard;
  fc.step = "game";
  fc.currentIndex = 0;
  fc.flipped = false;
  fc.correct = [];
  fc.secondsLeft = 10;
  fc.answered = false;
  fc.selectedAnswer = null;
  render();
  startFlashcardTimer();
}

function flashcardRestart() {
  clearFlashcardTimer();
  const prev = state.flashcard;
  state.flashcard = {
    subjectId: prev.subjectId,
    topicTitle: "",
    cardCount: 10,
    loading: false,
    error: null,
    cards: null,
    step: "setup",
    currentIndex: 0,
    flipped: false,
    correct: [],
    secondsLeft: 10,
    answered: false,
    selectedAnswer: null,
  };
  render();
}

// ---------------------------------------------------------------------
// EXAM REFRESHER
// ---------------------------------------------------------------------
let refresherTimerId = null;

function renderRefresherSection() {
  if (getEffectiveLearnerTier() !== "premium") {
    return renderPastDueBanner() + renderPremiumGate("refresherPremiumMsg");
  }

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

  const subjectName = Object.fromEntries(state.subjects.map((s) => [s.id, subjectLabel(s)]));
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
  if (getEffectiveLearnerTier() !== "premium") {
    showToast(t("refresherPremiumMsg"), "error");
    return;
  }

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
    showToast(t("enterAnswer"), "error");
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
  const subjectSelect = document.getElementById("exam-subject");
  if (subjectSelect) state.mockExamSetup.subjectId = subjectSelect.value;
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
  const subjectId = state.mockExamSetup.subjectId || subjectSelect.value || state.subjects[0]?.id;
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
        subjectId,
        difficulty,
        term,
        topics,
      }),
    }, 60000);
    const data = await res.json();
    if (!res.ok) throw data;

    state.activeExam = {
      examId: data.examId,
      subjectId,
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
    console.error("MOCK EXAM FULL ERROR:", err, "status:", err?.status);
    const toastMessage = (err && err.message) || (err && err.error) || t("errorExamGeneration");
    showToast(toastMessage, "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

function examCurrentQuestion() {
  const e = state.activeExam;
  return e.questions[e.currentIndex];
}

// Letters indexed to the position of each option (all questions are MCQ).
const EXAM_OPTION_LETTERS = ["A", "B", "C", "D"];

// Returns the option text for a given answer letter on a question.
function examOptionText(q, letter) {
  const idx = EXAM_OPTION_LETTERS.indexOf(letter);
  return idx >= 0 && Array.isArray(q.options) && q.options[idx] != null ? String(q.options[idx]) : "";
}

function examSelectOption(letter) {
  const e = state.activeExam;
  const q = examCurrentQuestion();
  e.answers[q.id] = letter;
  render();
}

function examNextQuestion() {
  const e = state.activeExam;
  e.currentIndex++;
  render();
}

async function submitExam() {
  const e = state.activeExam;

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
      body: JSON.stringify({
        examId: e.examId,
        responses,
        lang: state.profile?.lang ?? "en",
      }),
    }, 60000);
    const data = await res.json();
    if (!res.ok) throw data;
    e.results = data;
    console.log("💾 Exam graded", { score: data.totalAwarded, total: data.totalMarks, pct: data.percentage });
  } catch (err) {
    console.error("Exam grading error:", err);
    showToast(err?.message || err?.error || t("errorGeneric"), "error");
  } finally {
    e.loading = false;
    render();
  }
}

function examClose() {
  state.activeExam = null;
  render();
}

// Close results screen and refresh the completed-exams list.
async function examDone() {
  state.activeExam = null;
  try {
    await loadExams();
  } catch (err) {
    console.error("Failed to refresh exams:", err);
  }
  render();
}

function renderExamModal() {
  const e = state.activeExam;
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, subjectLabel(s)]));

  if (e.results) {
    const { totalAwarded, totalMarks, percentage: pct } = e.results;
    const percentage = pct ?? (totalMarks > 0 ? Math.round((totalAwarded / totalMarks) * 100) : 0);
    const pctClass = percentage >= 70 ? "result-pct-good" : percentage >= 50 ? "result-pct-mid" : "result-pct-bad";
    return `
      <div class="modal-overlay">
        <div class="modal-sheet">
          <div class="modal-header">
            <h3>${t("examResultsHeading")}</h3>
            <button class="modal-close" data-action="exam-done">✕</button>
          </div>
          <div class="modal-body">
            <div class="result-bar">
              <div class="result-score">${totalAwarded} / ${totalMarks}</div>
              <div class="result-pct ${pctClass}">${percentage}%</div>
              <div class="muted">${t("yourScore")}</div>
            </div>
            ${e.questions
              .map((q, i) => {
                const r = e.results.results.find((res) => res.question_id === q.id);
                const given = r?.learner_answer || "";
                const correct = r?.correct_answer || "";
                const isCorrect = !!r?.is_correct;
                const givenText = given
                  ? `${given}. ${escapeHtml(examOptionText(q, given))}`
                  : t("examNoAnswer");
                const correctText = `${correct}. ${escapeHtml(examOptionText(q, correct))}`;
                return `
                <div class="exam-question">
                  <div class="q-head">
                    <span>${t("questionLabel")} ${i + 1}</span>
                    <span class="${isCorrect ? "q-correct" : "q-wrong"}">${isCorrect ? "✓" : "✗"} ${r?.marks_awarded ?? 0}/${q.marks}</span>
                  </div>
                  <div class="q-text">${escapeHtml(q.question_text)}</div>
                  <div class="exam-answer-line"><span class="muted">${t("examYourAnswer")}:</span> <span class="${isCorrect ? "q-correct" : "q-wrong"}">${givenText}</span></div>
                  <div class="exam-answer-line"><span class="muted">${t("examCorrectAnswer")}:</span> <span class="q-correct">${correctText}</span></div>
                  ${r?.explanation ? `<p class="muted">${escapeHtml(r.explanation)}</p>` : ""}
                </div>`;
              })
              .join("")}
          </div>
          <div class="modal-footer">
            <button class="btn btn-gold btn-block" data-action="exam-done">${t("btnTryAgain")}</button>
          </div>
        </div>
      </div>
    `;
  }

  const q = e.questions[e.currentIndex];
  const isLast = e.currentIndex === e.questions.length - 1;
  const progress = ((e.currentIndex + 1) / e.questions.length) * 100;
  const selectedAnswer = e.answers[q.id] || "";
  const hasAnswer = !!selectedAnswer;

  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${escapeHtml(subjectMap[e.subjectId] || "")} - ${difficultyLabel(e.difficulty)}</h3>
          <button class="modal-close" data-action="exam-close-confirm">✕</button>
        </div>
        <div class="modal-body">
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
          <div class="section-title">${t("questionLabel")} ${e.currentIndex + 1} ${t("examOf").replace("{n}", e.questions.length)}</div>
          <div class="exam-question">
            <div class="q-head"><span>${t("questionLabel")} ${e.currentIndex + 1}</span><span>${q.marks} ${t("marksLabel")}</span></div>
            <div class="q-text">${escapeHtml(q.question_text)}</div>
            ${(Array.isArray(q.options) ? q.options : [])
              .map((opt, idx) => {
                const L = EXAM_OPTION_LETTERS[idx];
                if (!L) return "";
                return `
              <button class="option-btn ${selectedAnswer === L ? "selected" : ""}" data-action="exam-select-option" data-letter="${L}">
                <span class="diagnostic-option-letter">${L}</span> ${escapeHtml(String(opt))}
              </button>`;
              })
              .join("")}
          </div>
        </div>
        <div class="modal-footer">
          ${
            isLast
              ? `<button class="btn btn-primary btn-block" data-action="submit-exam" ${hasAnswer && !e.loading ? "" : "disabled"}>
                   ${e.loading ? `<span class="spinner"></span> ${t("examGrading")}` : t("btnSubmitExam")}
                 </button>`
              : `<button class="btn btn-primary btn-block" data-action="exam-next-question" ${hasAnswer ? "" : "disabled"}>${t("btnNextExamQuestion")}</button>`
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
  payment_failed: "💳",
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
        <button class="btn btn-primary" style="margin-top:14px;" data-action="open-add-child-modal">${t("btnAddChild")}</button>
      </div>
      ${state.showAddChildModal ? renderAddChildModal() : ""}
    `;
  }

  const learner = getSelectedLearner();
  const unreadAlerts = (learner.alerts || []).filter((a) => !a.read_at);

  return `
    ${greetingCard}
    ${renderChildSelector()}
    <div style="text-align:right;margin-bottom:var(--spacing-8);">
      <button class="btn btn-gold btn-sm" data-action="open-add-child-modal">${t("btnAddChild")}</button>
    </div>

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

    ${state.showAddChildModal ? renderAddChildModal() : ""}
    ${state.childUpgradeModalOpen ? renderChildUpgradeModal() : ""}
    ${renderDeleteChildModal()}
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
        ? `<div class="empty-state"><div class="empty-icon">📝</div><p>${t("noMockExams")}</p></div>`
        : learner.exams.map((exam) => renderParentExamItem(exam)).join("")
    }

    <div class="section-title">${t("sessionHistoryHeading")}</div>
    ${renderSessionHistory(learner.sessions || [])}
  `;
}

function renderSessionHistory(sessions) {
  if (!sessions || sessions.length === 0) {
    return `<div class="empty-state"><div class="empty-icon">📅</div><p>${t("noSessionsRecorded")}</p></div>`;
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
      ${
        learner.gradeSubjects.length === 0
          ? `<div class="empty-state"><div class="empty-icon">📚</div><p>${t("noSubjectsForGrade")}</p></div>`
          : `<div class="chip-row" style="margin-top:var(--spacing-12);">
              ${learner.gradeSubjects
                .map(
                  (s) => `<button type="button" class="topic-chip ${draft.focusSubjects.includes(s.id) ? "selected" : ""}" data-action="goals-toggle-subject" data-subject-id="${s.id}" data-learner-id="${learner.id}">${escapeHtml(subjectLabel(s))}</button>`,
                )
                .join("")}
            </div>`
      }
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
  // Safety-flag alerts (the ones that can freeze an account) get an
  // in-app "Acknowledge & Reactivate" action instead of the old public
  // /acknowledge?token= email link, which now requires parent auth and can
  // no longer be honored as a bare URL. Wired to the caller's OWN logged-in
  // session (see handleAcknowledgeFlag()) — a logged-out visitor or a
  // parent not linked to this learner cannot trigger it; the edge function
  // re-verifies both server-side regardless of what this button sends.
  const isSafetyFlag = alert.alert_type === "safety_flag_crisis" || alert.alert_type === "safety_flag_language";
  return `
    <div class="alert-item ${alert.read_at ? "" : "unread"}">
      <span class="alert-icon">${ALERT_ICONS[alert.alert_type] || "🔔"}</span>
      <div style="flex:1;">
        <div>${linkifyAlertMessage(alert.message)}</div>
        <div class="alert-meta">${formatDateTime(alert.created_at)}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;">
          ${!alert.read_at ? `<button class="link-btn" data-action="mark-alert-read" data-alert-id="${alert.id}">${t("markRead")}</button>` : ""}
          ${isSafetyFlag ? `<button class="link-btn" data-action="acknowledge-flag" data-learner-id="${alert.learner_id}">${t("btnAcknowledgeFlag")}</button>` : ""}
        </div>
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

// Acknowledges the most recent pending safety flag for a linked child and
// reactivates their account. Uses the logged-in parent's OWN session token -
// the edge function independently re-verifies both that the caller is a
// parent and that learnerId is in their own linked_learners before doing
// anything, so this can never be used against a learner that isn't the
// caller's own child, regardless of what learnerId this button sends.
async function handleAcknowledgeFlag(learnerId, btn) {
  if (btn) setButtonLoading(btn, true);
  try {
    const { data: sess } = await sbClient.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/acknowledge-flag`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ learnerId }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.alreadyAcknowledged ? t("flagAlreadyAcknowledgedMsg") : t("flagAcknowledgedMsg"), "success");
    } else {
      showToast(t("flagAcknowledgeFailedMsg"), "error");
      console.error("acknowledge-flag failed:", result);
    }
  } catch (e) {
    console.error("acknowledge-flag call failed:", e);
    showToast(t("flagAcknowledgeFailedMsg"), "error");
  } finally {
    await loadParentData();
    render();
  }
}

function renderAddChildModal() {
  const mode = state.addChildMode;
  const grades = Array.from({ length: 9 }, (_, i) => i + 4);
  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${t("addChildHeading")}</h3>
          <button class="modal-close" data-action="close-add-child-modal">✕</button>
        </div>
        <div class="modal-body">
          ${
            mode === null
              ? `<p class="muted" style="margin-top:0;">${t("addChildChooseMode")}</p>
                 <div class="add-child-mode-cards">
                   <button class="add-child-mode-card" data-action="set-child-mode" data-mode="direct">
                     <div class="add-child-mode-icon">🔑</div>
                     <div class="add-child-mode-label">${t("addChildDirectLabel")}</div>
                     <div class="add-child-mode-desc muted">${t("addChildDirectDesc")}</div>
                   </button>
                   <button class="add-child-mode-card" data-action="set-child-mode" data-mode="invite">
                     <div class="add-child-mode-icon">✉️</div>
                     <div class="add-child-mode-label">${t("addChildInviteLabel")}</div>
                     <div class="add-child-mode-desc muted">${t("addChildInviteDesc")}</div>
                   </button>
                 </div>`
              : `<form data-action="add-child-form">
                   <input type="hidden" name="mode" value="${mode}" />
                   <div class="field">
                     <label>${t("addChildNameLabel")}</label>
                     <input type="text" name="childName" required minlength="2" autocomplete="off" />
                   </div>
                   <div class="field">
                     <label>${t("labelGrade")}</label>
                     <select name="childGrade" required>
                       ${grades.map((g) => `<option value="${g}">${t("labelGrade")} ${g}</option>`).join("")}
                     </select>
                   </div>
                   <div class="field">
                     <label>${t("addChildEmailLabel")}</label>
                     <input type="email" name="childEmail" required autocomplete="off" />
                   </div>
                   ${
                     mode === "direct"
                       ? `<div class="field">
                            <label>${t("addChildPasswordLabel")}</label>
                            <div class="pw-field-wrap">
                              <input type="password" name="childPassword" required minlength="8" autocomplete="new-password" />
                              <button type="button" class="pw-visibility-btn" data-action="toggle-pw-visibility" aria-label="${t("showPassword")}">👁</button>
                            </div>
                          </div>`
                       : ""
                   }
                   <div style="display:flex;gap:8px;margin-top:4px;">
                     <button type="button" class="btn btn-outline" style="flex:1;" data-action="set-child-mode" data-mode="null">${t("btnBack")}</button>
                     <button type="submit" class="btn btn-primary" style="flex:2;" ${state.addChildLoading ? "disabled" : ""}>
                       ${state.addChildLoading ? `<span class="spinner spinner-white"></span>` : mode === "direct" ? t("btnAddChildDirect") : t("btnAddChildInvite")}
                     </button>
                   </div>
                 </form>`
          }
        </div>
      </div>
    </div>
  `;
}

async function handleAddChild(form) {
  const mode = form.mode.value;
  const name = form.childName.value.trim();
  const grade = parseInt(form.childGrade.value, 10);
  const email = form.childEmail.value.trim().toLowerCase();

  state.addChildLoading = true;
  render();

  try {
    if (mode === "direct") {
      const rawPassword = form.childPassword.value;
      if (rawPassword.length < 8) {
        showToast(t("pwTooShort"), "error");
        return;
      }

      const { data: fnData, error: fnErr } = await sbClient.functions.invoke("create-child-auth", {
        body: { email, password: rawPassword, full_name: name, grade },
      });

      if (fnErr) {
        showToast(fnErr.message || t("errorGeneric"), "error");
        return;
      }
      if (!fnData?.ok) {
        showToast(fnData?.error || t("errorGeneric"), "error");
        return;
      }

      await loadParentData();
      state.showAddChildModal = false;
      state.addChildMode = null;
      render();
      showToast(`${t("addChildSuccessDirect")} ${t("labelEmail")}: ${email}`, "success");
      // Show credentials in an alert so the parent can copy them
      setTimeout(() => {
        alert(`${t("addChildSuccessDirect")}\n\n${t("labelEmail")}: ${email}\n${t("labelPassword")}: ${rawPassword}`);
      }, 300);
    } else {
      const { data: fnData, error: fnErr } = await sbClient.functions.invoke("create-child-auth", {
        body: { mode: "invite", email, full_name: name, grade },
      });

      if (fnErr) {
        showToast(fnErr.message || t("errorGeneric"), "error");
        return;
      }
      if (!fnData?.ok) {
        showToast(fnData?.error || t("errorGeneric"), "error");
        return;
      }

      await sbClient.functions.invoke("send-invite-email", {
        body: { email, name, token: fnData.invite_token },
      });

      await loadParentData();
      state.showAddChildModal = false;
      state.addChildMode = null;
      render();
      showToast(`${t("addChildSuccessInvite")} ${email}`, "success");
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    state.addChildLoading = false;
    render();
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
function renderChangeEmailSection() {
  if (state.emailChangeSuccess) {
    return `
      <div class="card">
        <div class="account-section-row">
          <span class="account-section-label">${t("changeEmailHeading")}</span>
        </div>
        <p style="margin:8px 0 10px;color:var(--success);font-size:0.9rem;">${t("changeEmailSuccess")}</p>
        <button class="btn btn-outline btn-sm" data-action="email-change-toggle">${t("changeEmailBtn")}</button>
      </div>
    `;
  }
  if (!state.emailChangeOpen) {
    return `
      <div class="card">
        <div class="account-section-row">
          <span class="account-section-label">${t("changeEmailHeading")}</span>
          <button class="btn btn-outline btn-sm" data-action="email-change-toggle">${t("changeEmailBtn")}</button>
        </div>
      </div>
    `;
  }
  return `
    <div class="card">
      <div class="account-section-label" style="margin-bottom:10px;">${t("changeEmailHeading")}</div>
      <form data-action="change-email-form">
        <label style="display:block;margin-bottom:6px;font-size:0.88rem;">${t("changeEmailNewLabel")}</label>
        <input type="email" name="newEmail" required autocomplete="email" style="margin-bottom:${state.emailChangeError ? "6px" : "10px"};" />
        ${state.emailChangeError ? `<p class="form-error" style="margin:0 0 10px;">${escapeHtml(state.emailChangeError)}</p>` : ""}
        <div style="display:flex;gap:10px;">
          <button type="button" class="btn btn-outline" style="flex:1;" data-action="email-change-toggle">${t("cancel")}</button>
          <button type="submit" class="btn btn-primary" style="flex:1;">${t("changeEmailSubmitBtn")}</button>
        </div>
      </form>
    </div>
  `;
}

function renderAccountTab() {
  const profile = state.profile;
  const learner = state.learner;
  const isLearner = profile.role === "learner";

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

    <!-- 2. Change email (parent only) -->
    ${!isLearner ? renderChangeEmailSection() : ""}

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

    <!-- Legal -->
    <div class="section-title">${t("legalHeading")}</div>
    <div class="card">
      <button class="btn-link legal-section-link" data-action="open-tc-modal">${t("linkTc")}</button>
      <button class="btn-link legal-section-link" data-action="open-privacy-modal">${t("linkPrivacy")}</button>
    </div>

    <!-- Help & Contact -->
    ${renderSupportSection()}

    <!-- 5. Logout -->
    <button class="btn btn-danger btn-block" data-action="logout" style="margin-top:6px;">${t("btnLogout")}</button>
    ${!isLearner
      ? `<button class="btn btn-danger btn-block" style="margin-top:10px;" data-action="open-delete-account-step1">${t("btnDeleteAccount")}</button>`
      : ""
    }

    ${state.tcModalOpen ? renderTcModal() : ""}
    ${state.privacyModalOpen ? renderPrivacyModal() : ""}
    ${renderDeleteAccountModal()}
  `;
}

// ---------------------------------------------------------------------
// UPGRADE MODAL (learner)
// ---------------------------------------------------------------------

// Renders the price block for a tier card, with referral discount markup
// when the signed-in user has an active promo code.
function renderTierPriceBlock(price) {
  if (price === 0) return `<div class="tier-price">${t("free")}</div>`;
  if (!isDiscountActive()) {
    return `<div class="tier-price">R${price}<span>${t("perMonth")}</span></div>`;
  }
  const pct = state.promoCode?.discount_percent ?? 20;
  const discounted = (Math.round(price * (1 - pct / 100) * 100) / 100).toFixed(2);
  const expiryStr = (() => {
    const started = state.profile?.discount_started_at ? new Date(state.profile.discount_started_at) : null;
    if (!started) return "";
    const months = state.promoCode?.discount_months ?? 3;
    const exp = new Date(started);
    exp.setMonth(exp.getMonth() + months);
    return exp.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  })();
  return `
    <div class="tier-price-block">
      <div class="tier-price-row">
        <span class="tier-price-original">R${price}</span>
        <span class="tier-discount-badge">${pct}% OFF</span>
      </div>
      <div class="tier-price tier-price-discounted">R${discounted}<span>${t("perMonth")}</span></div>
      <div class="tier-discount-expiry">Discount expires ${expiryStr} · renews at R${price}/mo</div>
    </div>
  `;
}

function renderUpgradeModal() {
  const plans = [
    {
      id: "basic",
      name: t("basic"),
      price: TIER_PRICES.basic,
      features: [t("featBasicUnlimited"), t("featBasic4Step"), t("featBasicAfrikaans")],
    },
    {
      id: "premium",
      name: t("premium"),
      price: TIER_PRICES.premium,
      features: [
        t("featPremiumEverything"),
        t("featPremiumStudyGuide"),
        t("featPremiumMockExam"),
        t("featPremiumRefresher"),
      ],
    },
  ];

  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${t("upgradeModalTitle")}</h3>
          <button class="modal-close" data-action="close-upgrade-modal">✕</button>
        </div>
        <div class="modal-body">
          <p class="muted">${t("upgradeModalIntro")}</p>
          ${plans
            .map(
              (plan) => `
            <div class="tier-card">
              <div class="tier-name">${plan.name}</div>
              ${renderTierPriceBlock(plan.price)}
              <ul class="tier-features">${plan.features.map((f) => `<li>${f}</li>`).join("")}</ul>
              <button class="btn btn-gold btn-block" data-action="subscribe" data-tier="${plan.id}">${t("btnSubscribe")}</button>
            </div>`,
            )
            .join("")}
        </div>
      </div>
    </div>
  `;
}

async function handleApplyPromoCode(form) {
  const code = (form.promoCode?.value ?? "").trim().toUpperCase();
  if (!code) return;
  try {
    const { data, error } = await sbClient.rpc("apply_referral_code", { p_code: code });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    // Reload profile + promoCode so state reflects the applied code immediately.
    const { data: profile } = await sbClient
      .from("profiles")
      .select("*")
      .eq("id", state.user.id)
      .single();
    if (profile) {
      state.profile = profile;
      state.lang = profile.lang || "en";
      state.promoCode = null;
      if (profile.referral_code_used) {
        const { data: codeData } = await sbClient
          .from("referral_codes")
          .select("code, discount_percent, discount_months, active")
          .eq("code", profile.referral_code_used)
          .maybeSingle();
        state.promoCode = codeData || null;
      }
    }
    showToast(t("referralApplied"), "success");
    render();
  } catch (err) {
    console.error("handleApplyPromoCode:", err);
    showToast(t("invalidReferralCode"), "error");
  }
}

function renderSupportSection() {
  const profile = state.profile;
  if (state.supportForm.success) {
    return `
      <div class="section-title">${t("supportHeading")}</div>
      <div class="card">
        <p style="margin:0 0 12px;color:#2d8a4e;">${t("supportSuccess")}</p>
        <button class="btn btn-outline btn-block" data-action="support-reset">${t("supportBtnAnother")}</button>
      </div>
    `;
  }
  return `
    <div class="section-title">${t("supportHeading")}</div>
    <div class="card">
      <p class="muted" style="margin:0 0 16px;font-size:14px;">${t("supportIntro")}</p>
      <form data-action="support-form">
        <div class="field">
          <label>${t("supportLabelName")}</label>
          <input type="text" name="supportName" value="${escapeHtml(profile?.full_name || "")}" required />
        </div>
        <div class="field">
          <label>${t("supportLabelEmail")}</label>
          <input type="email" name="supportEmail" value="${escapeHtml(profile?.email || "")}" required />
        </div>
        <div class="field">
          <label>${t("supportLabelCategory")}</label>
          <select name="supportCategory">
            <option value="">${t("supportCategoryDefault")}</option>
            <option value="general">${t("supportCategoryGeneral")}</option>
            <option value="billing">${t("supportCategoryBilling")}</option>
            <option value="technical">${t("supportCategoryTechnical")}</option>
            <option value="report">${t("supportCategoryReport")}</option>
          </select>
        </div>
        <div class="field">
          <label>${t("supportLabelMessage")}</label>
          <textarea name="supportMessage" rows="4" placeholder="${t("supportPlaceholderMessage")}" required style="resize:vertical;"></textarea>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${t("supportBtnSubmit")}</button>
      </form>
    </div>
  `;
}

async function handleSupportSubmit(form) {
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);
  try {
    const name     = form.supportName.value.trim();
    const email    = form.supportEmail.value.trim();
    const category = form.supportCategory.value;
    const message  = form.supportMessage.value.trim();

    const { data: fnData, error: fnErr } = await sbClient.functions.invoke("submit-support-message", {
      body: { name, email, category, message },
    });

    if (fnErr) { showToast(fnErr.message || t("errorGeneric"), "error"); return; }
    if (!fnData?.ok) { showToast(fnData?.error || t("errorGeneric"), "error"); return; }

    state.supportForm.success = true;
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
}

function renderPromoCodeCard() {
  const promo = state.promoCode;
  const profile = state.profile;
  const active = promo && promo.active && isDiscountActive();

  const activeBlock = active ? (() => {
    const started = profile?.discount_started_at ? new Date(profile.discount_started_at) : null;
    const months = promo.discount_months ?? 3;
    const expiry = started ? new Date(started) : null;
    if (expiry) expiry.setMonth(expiry.getMonth() + months);
    const expiryStr = expiry
      ? expiry.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })
      : "";
    return `
      <div class="referral-code-box" style="margin-bottom:8px;">
        <span class="code">${escapeHtml(profile.referral_code_used || "")}</span>
        <span class="tier-badge tier-badge-basic">${t("activePromoLabel")}</span>
      </div>
      <p class="muted" style="margin-bottom:12px;">${promo.discount_percent ?? 20}% ${t("offLabel")} · expires ${expiryStr}</p>
    `;
  })() : profile?.referral_code_used ? `
    <p class="muted" style="margin-bottom:8px;">${t("expired")}: <strong>${escapeHtml(profile.referral_code_used)}</strong></p>
  ` : "";

  return `
    <div class="card">
      <h3 class="mt-0">${t("promoCodeHeading")}</h3>
      ${activeBlock}
      <form data-action="apply-promo-form">
        <div class="admin-referral-input-row">
          <input type="text" name="promoCode" placeholder="${t("enterPromoCodeLabel")}" style="text-transform:uppercase;" />
          <button type="submit" class="btn btn-primary btn-sm">${t("btnApply")}</button>
        </div>
        <p class="muted" style="font-size:0.78rem;margin-top:6px;margin-bottom:0;">${t("promoCodeDisclaimer")}</p>
      </form>
    </div>
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
    <button class="btn btn-gold btn-block" style="margin-top:var(--spacing-8);" data-action="open-add-child-modal">${t("btnAddChild")}</button>

    ${renderPromoCodeCard()}

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

    ${state.showAddChildModal ? renderAddChildModal() : ""}
    ${state.childUpgradeModalOpen ? renderChildUpgradeModal() : ""}
    ${renderDeleteChildModal()}
  `;
}

function renderLinkedChildCard(learner) {
  const tier = learner.subscription_tier || "free";
  const tierBadgeClass = tier === "premium" ? "tier-badge-premium" : tier === "basic" ? "tier-badge-basic" : "tier-badge-free";
  const isPending = learner.invite_status === "pending";
  const canUpgrade = !isPending && tier !== "premium";
  const canCancel = !isPending && tier !== "free";
  return `
    <div class="linked-child-card">
      <div>
        <div style="font-weight:700;">${escapeHtml(learner.full_name)}</div>
        <div class="muted">${t("gradeLabel")} ${learner.grade}</div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
        <div style="display:flex;align-items:center;gap:8px;">
          ${isPending
            ? `<span class="tier-badge" style="background:var(--border);color:var(--text-muted);">${t("inviteStatusPending")}</span>`
            : `<span class="tier-badge ${tierBadgeClass}">${t(tier)}</span>`
          }
          ${canUpgrade
            ? `<button class="btn btn-gold btn-sm" data-action="open-child-upgrade-modal" data-learner-id="${learner.id}">${t("btnUpgrade")}</button>`
            : ""
          }
        </div>
        ${canCancel
          ? `<button class="btn btn-danger btn-sm" data-action="cancel-child-subscription-confirm" data-learner-id="${learner.id}">${t("btnCancelSubscription")}</button>`
          : ""
        }
        ${learner.subscription_status === "past_due"
          ? `<div class="muted" style="color:var(--danger);font-size:12px;text-align:right;">⚠️ ${t("pastDueBannerMsg")}</div>`
          : ""
        }
        <button class="btn btn-danger btn-sm" data-action="open-delete-child-modal" data-learner-id="${learner.id}">${t("btnDeleteChild")}</button>
      </div>
    </div>
  `;
}

// Type-to-confirm modal for permanently deleting a linked child. Not the
// simple Yes/No confirmModal pattern — this is irreversible data deletion,
// so the Delete button stays disabled until the parent types the child's
// exact full name (validated live via the global "input" listener, no
// re-render, matching the updatePasswordHint() pattern).
function renderDeleteChildModal() {
  const target = state.deleteChildTarget;
  if (!target) return "";
  const name = escapeHtml(target.full_name || "");
  return `
    <div class="modal-overlay">
      <div class="modal-sheet" style="max-width:400px;">
        <div class="modal-header">
          <h3>${t("deleteChildModalTitle").replace("{name}", name)}</h3>
          <button class="modal-close" data-action="close-delete-child-modal">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--danger);font-weight:600;">${t("deleteChildWarning").replace("{name}", name)}</p>
          <div class="field">
            <label>${t("deleteChildTypePrompt").replace("{name}", name)}</label>
            <input type="text" id="delete-child-confirm-input" autocomplete="off" data-expected-name="${name}" />
          </div>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" data-action="close-delete-child-modal">${t("cancel")}</button>
          <button class="btn btn-danger" style="flex:1;" id="delete-child-confirm-btn" data-action="confirm-delete-child" data-learner-id="${target.id}" disabled>${t("btnDeleteChildConfirm")}</button>
        </div>
      </div>
    </div>
  `;
}

// Step 2 of the two-step account-deletion flow (step 1 is the simple
// confirmModal Yes/No prompt). Modeled directly on renderDeleteChildModal():
// type-to-confirm, Delete button disabled until the parent types their own
// full name (falling back to email) exactly, validated live via the global
// "input" listener (direct DOM toggle, no re-render, so focus is preserved).
function renderDeleteAccountModal() {
  if (!state.deleteAccountModalOpen) return "";
  const parentName = state.profile?.full_name || state.profile?.email || "";
  const nameEsc = escapeHtml(parentName);
  const childNames = state.linkedLearners.map((l) => l.full_name).filter(Boolean);
  const childList = childNames.length > 0 ? ` (${childNames.map((n) => escapeHtml(n)).join(", ")})` : "";
  return `
    <div class="modal-overlay">
      <div class="modal-sheet" style="max-width:420px;">
        <div class="modal-header">
          <h3>${t("deleteAccountModalTitle")}</h3>
          <button class="modal-close" data-action="close-delete-account-modal">✕</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--danger);font-weight:600;">${t("deleteAccountWarning").replace("{children}", childList)}</p>
          <div class="field">
            <label>${t("deleteAccountTypePrompt").replace("{name}", nameEsc)}</label>
            <input type="text" id="delete-account-confirm-input" autocomplete="off" data-expected-name="${nameEsc}" />
          </div>
        </div>
        <div class="modal-footer" style="display:flex;gap:10px;">
          <button class="btn btn-outline" style="flex:1;" data-action="close-delete-account-modal">${t("cancel")}</button>
          <button class="btn btn-danger" style="flex:1;" id="delete-account-confirm-btn" data-action="confirm-delete-account" disabled>${t("btnDeleteAccountConfirm")}</button>
        </div>
      </div>
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
          ${renderTierPriceBlock(tier.price)}
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

// Persist the learner's language preference to profiles.lang and update
// local state/UI on success. Chained with .select() so the write is
// verified - without it, an RLS-filtered update returns error=null with
// zero rows affected (the same silent-failure pattern as the earlier
// tier-change bug), leaving the DB language stale while the UI flips.
// Edge functions (mock exam, study guide) read profiles.lang from the DB,
// so a stale DB value causes AI content to keep generating in English.
async function persistLanguage(next) {
  try {
    const { error, data } = await sbClient
      .from("profiles")
      .update({ lang: next })
      .eq("id", state.user.id)
      .select("lang");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("No profile row updated");

    state.lang = next;
    document.documentElement.lang = next;
    if (state.profile) state.profile.lang = next;
    render();
    showToast(next === "af" ? "Taal verander na Afrikaans ✓" : "Language changed to English ✓", "success");
  } catch (err) {
    console.error("Failed to persist language preference", err);
    showToast("Could not save language preference. Please try again.", "error");
  }
}

async function toggleLanguage() {
  const next = state.lang === "en" ? "af" : "en";
  await persistLanguage(next);
}

// Account-tab language selection.
async function setLanguage(lang) {
  const next = lang === "af" ? "af" : "en";
  await persistLanguage(next);
}

// ---------------------------------------------------------------------
// PAYSTACK UPGRADE
// ---------------------------------------------------------------------
// Kobo amounts (1 kobo = R0.01). Full prices: basic=9900, premium=19900.
// With 20% referral discount: basic=7920, premium=15920.
const PAYSTACK_KOBO = {
  basic:   { full: 9900,  discounted: 7920  },
  premium: { full: 19900, discounted: 15920 },
};

const PAYSTACK_PLANS = {
  basic: "PLN_x2bz5sdsky99bk5",
  premium: "PLN_gmx6yhgo5ikqg64",
};

// Returns true when the parent has an active promo code AND is still within
// the discount window anchored on discount_started_at (set when code applied).
function isDiscountActive() {
  const profile = state.profile;
  if (!profile?.referral_code_used || !profile?.discount_started_at) return false;
  const promo = state.promoCode;
  if (!promo?.active) return false;
  const started = new Date(profile.discount_started_at);
  const expiry = new Date(started);
  expiry.setMonth(expiry.getMonth() + (promo.discount_months ?? 3));
  return new Date() < expiry;
}

// Per-child upgrade modal: shows Basic and Premium plans (excluding the
// child's current tier) with the correct discounted or full price.
function renderChildUpgradeModal() {
  const learnerId = state.upgradeTargetLearnerId;
  const learner = state.linkedLearners.find((l) => l.id === learnerId);
  if (!learner) return "";

  const discountActive = isDiscountActive();
  const childName = escapeHtml(learner.full_name);
  const currentTier = learner.subscription_tier || "free";
  const pct = state.promoCode?.discount_percent ?? 20;

  const expiryStr = (() => {
    const started = state.profile?.discount_started_at ? new Date(state.profile.discount_started_at) : null;
    if (!started) return "";
    const months = state.promoCode?.discount_months ?? 3;
    const exp = new Date(started);
    exp.setMonth(exp.getMonth() + months);
    return exp.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
  })();

  const plans = [
    { id: "basic",   name: t("basic"),   price: TIER_PRICES.basic   },
    { id: "premium", name: t("premium"), price: TIER_PRICES.premium },
  ].filter((p) => p.id !== currentTier);

  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${t("upgradeChildModalTitle").replace("{name}", childName)}</h3>
          <button class="modal-close" data-action="close-child-upgrade-modal">✕</button>
        </div>
        <div class="modal-body">
          <p class="muted">${t("upgradeChildIntro").replace("{name}", childName)}</p>
          ${plans.map((plan) => {
            const discPrice = (Math.round(plan.price * (1 - pct / 100) * 100) / 100).toFixed(2);
            const priceBlock = discountActive
              ? `<div class="tier-price-block">
                   <div class="tier-price-row">
                     <span class="tier-price-original">R${plan.price}</span>
                     <span class="tier-discount-badge">${pct}% ${t("offLabel")}</span>
                   </div>
                   <div class="tier-price tier-price-discounted">R${discPrice}<span>${t("perMonth")}</span></div>
                   <div class="tier-discount-expiry">Discount expires ${expiryStr} · renews at R${plan.price}/mo</div>
                 </div>`
              : `<div class="tier-price">R${plan.price}<span>${t("perMonth")}</span></div>`;
            return `
              <div class="tier-card">
                <div class="tier-name">${plan.name}</div>
                ${priceBlock}
                <button class="btn btn-gold btn-block" data-action="child-subscribe" data-learner-id="${learnerId}" data-tier="${plan.id}">${t("btnSubscribe")}</button>
              </div>`;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}

function handleUpgrade(tier) {
  if (!PAYSTACK_KOBO[tier]) return;

  if (!window.PaystackPop) {
    showToast(t("errorGeneric"), "error");
    console.error("handleUpgrade: PaystackPop not loaded");
    return;
  }

  const fullKobo = PAYSTACK_KOBO[tier].full;
  const pct = isDiscountActive() ? (state.promoCode?.discount_percent ?? 20) : 0;
  const amountKobo = pct > 0 ? Math.round(fullKobo * (1 - pct / 100)) : fullKobo;
  const reference = `LEURO-${state.user.id}-${Date.now()}`;

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_CONFIG.publicKey,
    email: state.profile.email,
    amount: amountKobo,
    currency: "ZAR",
    ref: reference,
    label: `Leuro ${capitalize(tier)} Monthly`,
    metadata: {
      tier,
      user_id: state.user.id,
      referral_code: state.profile.referral_code_used || "",
    },
    callback(response) {
      console.log("Paystack success:", response.reference);
      showToast(t("paymentSuccessMsg"), "success");
      state.upgradeModalOpen = false;
      render();
    },
    onClose() {
      showToast(t("paymentCancelledMsg"), "info");
    },
  });
  handler.openIframe();
}

// Per-child upgrade: reference encodes the learner's UUID (not the parent
// user_id) so the webhook can update learners.subscription_tier directly.
function handleChildUpgrade(learnerId, tier) {
  if (!PAYSTACK_KOBO[tier]) return;

  if (!window.PaystackPop) {
    showToast(t("errorGeneric"), "error");
    console.error("handleChildUpgrade: PaystackPop not loaded");
    return;
  }

  const reference = `LEURO-${learnerId}-${Date.now()}`;

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_CONFIG.publicKey,
    email: state.profile.email,
    plan: PAYSTACK_PLANS[tier],
    currency: "ZAR",
    ref: reference,
    label: `Leuro ${capitalize(tier)} Monthly`,
    channels: ["card"],
    metadata: {
      tier,
      learner_id: learnerId,
      user_id: state.user.id,
      referral_code: state.profile.referral_code_used || "",
    },
    callback(response) {
      console.log("[SUBSCRIBE] popup succeeded, ref:", response?.reference);
      showToast(t("paymentSuccessMsg"), "success");
      state.childUpgradeModalOpen = false;
      state.upgradeTargetLearnerId = null;
      render();
    },
    onClose() {
      showToast(t("paymentCancelledMsg"), "info");
    },
  });
  handler.openIframe();
}

async function handleCancelChildSubscription(learnerId) {
  showToast("Cancelling subscription…", "info");
  try {
    const { data: sess } = await sbClient.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/cancel-child-subscription`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ learnerId }),
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message || "Subscription cancelled.", "success");
    } else {
      showToast("Couldn't cancel subscription. Please try again or contact hello@leuroai.co.za.", "error");
      console.error("cancel-child-subscription failed:", result);
    }
  } catch (e) {
    console.error("cancel-child-subscription call failed:", e);
    showToast("Couldn't cancel subscription. Please try again or contact hello@leuroai.co.za.", "error");
  } finally {
    await loadParentData();
    render();
  }
}

async function handleDeleteChild(learnerId) {
  showToast("Deleting…", "info");
  try {
    const { data: sess } = await sbClient.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-child`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ learnerId }),
    });
    const result = await res.json();
    if (result.success) {
      showToast("Child deleted.", "success");
    } else {
      showToast(`Couldn't delete: ${result.reason || "unknown error"}. Contact hello@leuroai.co.za if this persists.`, "error");
      console.error("delete-child failed:", result);
    }
  } catch (e) {
    console.error("delete-child call failed:", e);
    showToast("Couldn't delete child. Please try again or contact hello@leuroai.co.za.", "error");
  } finally {
    await loadParentData();
    render();
  }
}

async function handleDeleteParentAccount() {
  showToast("Deleting your account…", "info");
  try {
    const { data: sess } = await sbClient.auth.getSession();
    const token = sess?.session?.access_token;
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-parent-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "apikey": SUPABASE_ANON_KEY,
      },
    });
    const result = await res.json();
    if (result.success) {
      showToast("Your account has been deleted.", "success");
      // Same reset sequence as handleLogout() — the session is now genuinely
      // invalid, so drop every piece of loaded state and return to the
      // auth/login screen.
      await sbClient.auth.signOut();
      state.session = null;
      state.user = null;
      state.profile = null;
      state.promoCode = null;
      state.learner = null;
      state.parent = null;
      state.topics = [];
      state.exams = [];
      state.linkedLearners = [];
      state.currentTab = "home";
      render();
    } else {
      showToast(`Couldn't delete account: ${result.reason || "unknown error"}. Contact hello@leuroai.co.za.`, "error");
      console.error("delete-parent-account failed:", result);
    }
  } catch (e) {
    console.error("delete-parent-account call failed:", e);
    showToast("Couldn't delete your account. Please try again or contact hello@leuroai.co.za.", "error");
  }
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
      case "show-forgot":
        authTab = "forgot";
        resetEmailSent = false;
        render();
        break;
      case "back-to-login":
        authTab = "login";
        resetEmailSent = false;
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
        state.upgradeModalOpen = true;
        render();
        break;
      case "close-upgrade-modal":
        state.upgradeModalOpen = false;
        render();
        break;
      case "open-child-upgrade-modal":
        state.childUpgradeModalOpen = true;
        state.upgradeTargetLearnerId = target.dataset.learnerId;
        render();
        break;
      case "close-child-upgrade-modal":
        state.childUpgradeModalOpen = false;
        state.upgradeTargetLearnerId = null;
        render();
        break;
      case "child-subscribe":
        state.childUpgradeModalOpen = false;
        handleChildUpgrade(target.dataset.learnerId, target.dataset.tier);
        break;
      case "cancel-child-subscription-confirm":
        state.confirmModal = {
          message: t("confirmCancelChildSubscription"),
          confirmAction: "cancel-child-subscription-confirmed",
          learnerId: target.dataset.learnerId,
        };
        render();
        break;
      case "open-delete-child-modal": {
        const learnerToDelete = state.linkedLearners.find((l) => l.id === target.dataset.learnerId);
        state.deleteChildTarget = learnerToDelete
          ? { id: learnerToDelete.id, full_name: learnerToDelete.full_name }
          : null;
        render();
        break;
      }
      case "close-delete-child-modal":
        state.deleteChildTarget = null;
        render();
        break;
      case "confirm-delete-child": {
        const learnerId = target.dataset.learnerId;
        state.deleteChildTarget = null;
        render();
        handleDeleteChild(learnerId);
        break;
      }
      case "open-delete-account-step1":
        state.confirmModal = {
          message: t("confirmDeleteAccountStep1"),
          confirmAction: "delete-account-step1-confirmed",
        };
        render();
        break;
      case "close-delete-account-modal":
        state.deleteAccountModalOpen = false;
        render();
        break;
      case "confirm-delete-account":
        state.deleteAccountModalOpen = false;
        render();
        handleDeleteParentAccount();
        break;
      case "admin-toggle-referral-code":
        adminToggleReferralCode(target.dataset.codeId);
        break;
      case "open-tc-modal":
        state.tcModalOpen = true;
        render();
        break;
      case "close-tc-modal":
        state.tcModalOpen = false;
        render();
        break;
      case "open-privacy-modal":
        state.privacyModalOpen = true;
        render();
        break;
      case "close-privacy-modal":
        state.privacyModalOpen = false;
        render();
        break;
      case "support-reset":
        state.supportForm.success = false;
        render();
        break;
      case "subscribe":
        state.upgradeModalOpen = false;
        handleUpgrade(target.dataset.tier);
        break;
      case "logout":
        handleLogout();
        break;
      case "toggle-pw-visibility": {
        const wrap = target.closest(".pw-field-wrap");
        if (!wrap) break;
        const pwInput = wrap.querySelector("input");
        if (!pwInput) break;
        const nowVisible = pwInput.type === "text";
        pwInput.type = nowVisible ? "password" : "text";
        target.textContent = nowVisible ? "👁" : "🙈";
        target.setAttribute("aria-label", nowVisible ? t("showPassword") : t("hidePassword"));
        break;
      }
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
      case "retake-diagnostic-confirm":
        state.confirmModal = {
          message: t("confirmRetakeDiagnostic"),
          confirmAction: "retake-diagnostic-confirmed",
        };
        render();
        break;
      case "subject-selection-submit":
        submitSubjectSelection();
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
      case "download-study-guide":
        downloadStudyGuidePdf();
        break;
      case "generate-flashcards":
        generateFlashcards();
        break;
      case "flashcard-answer":
        handleFlashcardAnswer(target.dataset.answer);
        break;
      case "flashcard-next":
        flashcardNext();
        break;
      case "flashcard-play-again":
        flashcardPlayAgain();
        break;
      case "flashcard-restart":
        flashcardRestart();
        break;
      case "flashcard-count":
        state.flashcard.cardCount = parseInt(target.dataset.count, 10);
        render();
        break;
      case "flashcard-subject-change":
        state.flashcard.subjectId = target.value;
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
      case "exam-close-confirm":
        state.confirmModal = {
          message: t("confirmCloseExam"),
          confirmAction: "exam-close-confirmed",
        };
        render();
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
        examSelectOption(target.dataset.letter);
        break;
      case "exam-next-question":
        examNextQuestion();
        break;
      case "mark-alert-read":
        markAlertRead(target.dataset.alertId);
        break;
      case "acknowledge-flag":
        handleAcknowledgeFlag(target.dataset.learnerId, target);
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
      case "open-add-child-modal":
        state.showAddChildModal = true;
        state.addChildMode = null;
        render();
        break;
      case "close-add-child-modal":
        state.showAddChildModal = false;
        state.addChildMode = null;
        render();
        break;
      case "set-child-mode":
        state.addChildMode = target.dataset.mode === "null" ? null : target.dataset.mode;
        render();
        break;
      case "back-to-login":
        state.acceptInviteToken = null;
        state.acceptInviteData = null;
        authTab = "login";
        render();
        break;
      case "toggle-monthly-recap":
        toggleMonthlyRecap();
        break;
      case "admin-switch-tab":
        state.admin.currentTab = target.dataset.tab;
        render();
        break;
      case "email-change-toggle":
        state.emailChangeOpen = !state.emailChangeOpen;
        state.emailChangeError = null;
        state.emailChangeSuccess = false;
        render();
        break;
      case "confirm-modal-cancel":
        state.confirmModal = null;
        render();
        break;
      case "confirm-modal-ok": {
        const { confirmAction, userId: confirmUserId, learnerId: confirmLearnerId } = state.confirmModal || {};
        state.confirmModal = null;
        if (confirmAction === "exam-close-confirmed") examClose();
        else if (confirmAction === "retake-diagnostic-confirmed") retakeDiagnostic();
        else if (confirmAction === "admin-freeze-confirmed") adminToggleFreeze(confirmUserId, false, null);
        else if (confirmAction === "cancel-child-subscription-confirmed") handleCancelChildSubscription(confirmLearnerId);
        else if (confirmAction === "delete-account-step1-confirmed") state.deleteAccountModalOpen = true;
        render();
        break;
      }
      case "admin-toggle-freeze": {
        const isFrozen = target.dataset.frozen === "true";
        if (!isFrozen) {
          state.confirmModal = {
            message: t("confirmFreezeAccount"),
            confirmAction: "admin-freeze-confirmed",
            userId: target.dataset.userId,
          };
          render();
        } else {
          adminToggleFreeze(target.dataset.userId, true, target);
        }
        break;
      }
      case "admin-mark-reviewed":
        adminMarkFlagReviewed(target.dataset.flagId, target);
        break;
      case "admin-unfreeze-from-flag":
        adminUnfreezeFromFlag(target.dataset.flagId, target.dataset.userId, target);
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
      case "forgot-form":
        handleResetPasswordRequest(form);
        break;
      case "set-new-password-form":
        handleUpdatePassword(form);
        break;
      case "add-topic-form":
        handleAddTopic(form);
        break;
      case "session-chat-form":
        sessionSendChat(form);
        break;
      case "add-child-form":
        handleAddChild(form);
        break;
      case "accept-invite-form":
        handleAcceptInvite(form);
        break;
      case "admin-create-referral-code": {
        const schoolName = form.schoolName.value.trim();
        const discountPercent = parseInt(form.discountPercent?.value ?? "20", 10);
        const discountMonths = parseInt(form.discountMonths?.value ?? "3", 10);
        if (schoolName) createAdminReferralCode(schoolName, discountPercent, discountMonths);
        break;
      }
      case "apply-promo-form":
        handleApplyPromoCode(form);
        break;
      case "change-email-form":
        handleChangeEmail(form);
        break;
      case "support-form":
        handleSupportSubmit(form);
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
      case "subject-maths-select":
        state.subjectSelection.mathChoiceId = target.dataset.subjectId;
        state.subjectSelection.error = null;
        render();
        break;
      case "subject-elective-toggle": {
        const subjectId = target.dataset.subjectId;
        const idx = state.subjectSelection.selectedElectiveIds.indexOf(subjectId);
        if (idx === -1) {
          state.subjectSelection.selectedElectiveIds.push(subjectId);
        } else {
          state.subjectSelection.selectedElectiveIds.splice(idx, 1);
        }
        state.subjectSelection.error = null;
        render();
        break;
      }
      case "refresher-subject-select":
        refresherSubjectChange(target.value);
        break;
      case "goals-set-target":
        goalsSetTarget(target.value);
        break;
      case "admin-change-tier":
        adminChangeTier(target.dataset.userId, target.value, target);
        break;
      case "exam-subject-change":
        state.mockExamSetup.subjectId = target.value;
        break;
      case "exam-difficulty-change": {
        // Preserve any topics the learner has typed before re-rendering.
        const examTopics = document.getElementById("exam-topics");
        if (examTopics) state.mockExamSetup.topics = examTopics.value;
        state.mockExamSetup.difficulty = target.value;
        render();
        break;
      }
      case "study-guide-subject-change":
        state.studyGuide.subjectId = target.value;
        break;
      default:
        break;
    }
  });

  // Live password strength hints. Handles both the signup form (strength
  // only, email field also triggers it) and the recovery form (strength +
  // confirm-match).
  document.body.addEventListener("input", (e) => {
    const target = e.target;
    if (target.name === "password" || target.name === "email") {
      const signupForm = target.closest('form[data-action="signup-form"]');
      if (signupForm) { updatePasswordHint(signupForm); return; }
    }
    if (target.name === "password" || target.name === "confirm") {
      const recoveryForm = target.closest('form[data-action="set-new-password-form"]');
      if (recoveryForm) updateRecoveryHints(recoveryForm);
    }
    if (target.id === "delete-child-confirm-input") {
      const expected = (target.dataset.expectedName || "").trim();
      const typed = target.value.trim();
      const confirmBtn = document.getElementById("delete-child-confirm-btn");
      if (confirmBtn) confirmBtn.disabled = typed.length === 0 || typed !== expected;
    }
    if (target.id === "delete-account-confirm-input") {
      const expected = (target.dataset.expectedName || "").trim();
      const typed = target.value.trim();
      const confirmBtn = document.getElementById("delete-account-confirm-btn");
      if (confirmBtn) confirmBtn.disabled = typed.length === 0 || typed !== expected;
    }
  });

  // Re-evaluate the signup submit gate whenever either legal checkbox changes.
  document.body.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") {
      const signupForm = e.target.closest('form[data-action="signup-form"]');
      if (signupForm) updatePasswordHint(signupForm);
    }
  });
}
