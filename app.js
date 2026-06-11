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

    navLearn: "Learn",
    navExams: "Exams",
    navParent: "Parent",
    navAccount: "Account",

    learnHeading: "Learn",
    gradeLabel: "Grade",
    levelLabel: "Level",
    sessionsToday: "Sessions today",
    unlimitedSessions: "Unlimited sessions",
    addTopicPlaceholder: "Add a topic you want to study...",
    btnAdd: "Add",
    yourTopics: "Your Topics",
    noTopics: "No topics yet. Add one above to get started!",
    studiedTimes: "Studied {n}x",
    limitReachedTitle: "Daily limit reached",
    limitReachedMsg: "You've used your 3 free sessions today. Upgrade for unlimited studying.",

    stepExplain: "Explain",
    stepExample: "Example",
    stepAttempt: "Attempt",
    stepFeedback: "Feedback",
    generating: "Leuro is thinking...",
    btnSeeExample: "See an Example",
    btnTryYourself: "Try It Yourself",
    yourAnswerLabel: "Type your answer here",
    btnSubmitAnswer: "Submit Answer",
    btnFinish: "Done",
    supportResources: "Support Resources",
    errorRetryContent: "Unable to generate content. Please try again in 30 seconds.",
    btnRetry: "Retry",

    examsHeading: "Mock Exams",
    yourDiagnosticLevel: "Your diagnostic level",
    selectSubjectLabel: "Subject",
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

    parentHeading: "Parent Dashboard",
    linkLearnerHeading: "Link a Learner",
    linkLearnerPlaceholder: "Enter learner's referral code",
    btnLink: "Link",
    noLearners: "No learners linked yet. Ask your child for their referral code in the Account tab.",
    topicsStudiedLabel: "Topics studied",
    sessionsCompletedLabel: "Sessions completed",
    lastSessionLabel: "Last session",
    diagnosticLevelLabel: "Diagnostic level",
    alertsHeading: "Alerts",
    noAlerts: "No alerts.",
    activityHeading: "Recent Activity",
    noActivity: "No recent activity.",
    markRead: "Mark as read",

    accountHeading: "Account",
    currentPlan: "Current Plan",
    yourReferralCode: "Your Referral Code",
    btnCopy: "Copy",
    copied: "Copied!",
    referralProgress: "referrals to your next free month",
    btnLogout: "Log Out",
    languageLabel: "Language",
    perMonth: "/month",
    yourCurrentPlan: "Your current plan",

    loading: "Loading...",
    errorGeneric: "Something went wrong. Please try again.",
    offlineMsg: "You're offline. Some features may not work.",
    never: "Never",
    cancel: "Cancel",

    linkSuccess: "Learner linked successfully!",
    linkNotFound: "No learner found with that referral code.",
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

    navLearn: "Leer",
    navExams: "Eksamens",
    navParent: "Ouer",
    navAccount: "Rekening",

    learnHeading: "Leer",
    gradeLabel: "Graad",
    levelLabel: "Vlak",
    sessionsToday: "Sessies vandag",
    unlimitedSessions: "Onbeperkte sessies",
    addTopicPlaceholder: "Voeg 'n onderwerp by om te bestudeer...",
    btnAdd: "Voeg by",
    yourTopics: "Jou Onderwerpe",
    noTopics: "Nog geen onderwerpe nie. Voeg een hierbo by om te begin!",
    studiedTimes: "{n}x bestudeer",
    limitReachedTitle: "Daaglikse limiet bereik",
    limitReachedMsg: "Jy het jou 3 gratis sessies vandag gebruik. Gradeer op vir onbeperkte studie.",

    stepExplain: "Verduidelik",
    stepExample: "Voorbeeld",
    stepAttempt: "Probeer",
    stepFeedback: "Terugvoer",
    generating: "Leuro dink...",
    btnSeeExample: "Wys 'n Voorbeeld",
    btnTryYourself: "Probeer Self",
    yourAnswerLabel: "Tik jou antwoord hier",
    btnSubmitAnswer: "Dien Antwoord In",
    btnFinish: "Klaar",
    supportResources: "Ondersteuningshulpbronne",
    errorRetryContent: "Kon nie inhoud genereer nie. Probeer asseblief weer oor 30 sekondes.",
    btnRetry: "Probeer Weer",

    examsHeading: "Toetseksamens",
    yourDiagnosticLevel: "Jou diagnostiese vlak",
    selectSubjectLabel: "Vak",
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

    parentHeading: "Ouer-paneelbord",
    linkLearnerHeading: "Skakel 'n Leerder",
    linkLearnerPlaceholder: "Voer leerder se verwysingskode in",
    btnLink: "Skakel",
    noLearners: "Nog geen leerders geskakel nie. Vra jou kind vir hul verwysingskode in die Rekening-oortjie.",
    topicsStudiedLabel: "Onderwerpe bestudeer",
    sessionsCompletedLabel: "Sessies voltooi",
    lastSessionLabel: "Laaste sessie",
    diagnosticLevelLabel: "Diagnostiese vlak",
    alertsHeading: "Kennisgewings",
    noAlerts: "Geen kennisgewings nie.",
    activityHeading: "Onlangse Aktiwiteit",
    noActivity: "Geen onlangse aktiwiteit nie.",
    markRead: "Merk as gelees",

    accountHeading: "Rekening",
    currentPlan: "Huidige Plan",
    yourReferralCode: "Jou Verwysingskode",
    btnCopy: "Kopieer",
    copied: "Gekopieer!",
    referralProgress: "verwysings tot jou volgende gratis maand",
    btnLogout: "Meld Af",
    languageLabel: "Taal",
    perMonth: "/maand",
    yourCurrentPlan: "Jou huidige plan",

    loading: "Laai...",
    errorGeneric: "Iets het verkeerd geloop. Probeer asseblief weer.",
    offlineMsg: "Jy is vanlyn. Sommige funksies werk dalk nie.",
    never: "Nooit",
    cancel: "Kanselleer",

    linkSuccess: "Leerder suksesvol geskakel!",
    linkNotFound: "Geen leerder met daardie verwysingskode gevind nie.",
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
  subjects: [],
  topics: [],
  exams: [],
  sessionsToday: 0,
  currentTab: "learn",
  lang: "en",
  loading: true,
  showDiagnostic: false,
  diagnostic: null,
  activeSession: null,
  activeExam: null,
};

// ---------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function difficultyLabel(difficulty) {
  return t(`diff${capitalize(difficulty)}`);
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
    if (state.currentTab === "parent") state.currentTab = "learn";

    await Promise.all([loadSubjects(), loadTopics(), loadExams(), loadSessionsToday()]);
  } else if (profile.role === "parent") {
    if (state.currentTab === "learn" || state.currentTab === "exams") state.currentTab = "parent";
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
    return;
  }

  const [{ data: learners }, { data: profiles }, { data: alerts }] = await Promise.all([
    sbClient.from("learners").select("*").in("id", learnerIds),
    sbClient.from("profiles").select("id, full_name, email"),
    sbClient
      .from("parent_alerts")
      .select("*")
      .eq("parent_id", parent.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const enriched = await Promise.all(
    (learners || []).map(async (learner) => {
      const [{ data: topics }, { data: activity }] = await Promise.all([
        sbClient.from("topics").select("id").eq("learner_id", learner.id),
        sbClient
          .from("study_sessions")
          .select("id, phase, created_at, completed_at, topics(title)")
          .eq("learner_id", learner.id)
          .eq("phase", "feedback")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const profile = profileMap.get(learner.user_id);
      return {
        ...learner,
        full_name: profile?.full_name || profile?.email || "Learner",
        topicCount: (topics || []).length,
        activity: activity || [],
        alerts: (alerts || []).filter((a) => a.learner_id === learner.id),
      };
    }),
  );

  state.linkedLearners = enriched;
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
        <input type="text" name="fullName" required autocomplete="name" />
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

    await loadUserData();
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
  state.currentTab = "learn";
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

  if (state.profile.role === "learner" && (!state.learner || state.learner.diagnostic_level === 0 || state.showDiagnostic)) {
    app.innerHTML = renderDiagnosticScreen();
    return;
  }

  app.innerHTML = renderMainScreen();
}

function renderMainScreen() {
  let tabContent = "";
  if (state.profile.role === "learner") {
    switch (state.currentTab) {
      case "exams":
        tabContent = renderExamsTab();
        break;
      case "account":
        tabContent = renderAccountTab();
        break;
      default:
        tabContent = renderLearnTab();
    }
  } else {
    switch (state.currentTab) {
      case "account":
        tabContent = renderAccountTab();
        break;
      default:
        tabContent = renderParentTab();
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
  return `
    <div class="topbar">
      <div class="topbar-logo">${t("appName")}<span class="tm">™</span></div>
      <div class="topbar-actions">
        <button class="lang-toggle" data-action="toggle-lang">${state.lang === "en" ? "AF" : "EN"}</button>
      </div>
    </div>
  `;
}

function renderBottomNav() {
  const tabs =
    state.profile.role === "learner"
      ? [
          { id: "learn", icon: "📘", label: t("navLearn") },
          { id: "exams", icon: "📝", label: t("navExams") },
          { id: "account", icon: "👤", label: t("navAccount") },
        ]
      : [
          { id: "parent", icon: "👨‍👩‍👧", label: t("navParent") },
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
// DIAGNOSTIC
// ---------------------------------------------------------------------
const DIAGNOSTIC_QUESTIONS = [
  {
    correct: 1,
    en: { q: "What is 8 + 5?", options: ["12", "13", "14", "15"] },
    af: { q: "Wat is 8 + 5?", options: ["12", "13", "14", "15"] },
  },
  {
    correct: 1,
    en: { q: "Which word means the opposite of 'happy'?", options: ["Joyful", "Sad", "Excited", "Calm"] },
    af: { q: "Watter woord beteken die teenoorgestelde van 'gelukkig'?", options: ["Vrolik", "Hartseer", "Opgewonde", "Kalm"] },
  },
  {
    correct: 2,
    en: { q: "A train travels 60 km in 1 hour. How far does it travel in 3 hours?", options: ["120 km", "150 km", "180 km", "200 km"] },
    af: { q: "'n Trein reis 60 km in 1 uur. Hoe ver reis dit in 3 uur?", options: ["120 km", "150 km", "180 km", "200 km"] },
  },
  {
    correct: 1,
    en: { q: "Solve for x: 2x + 4 = 14", options: ["4", "5", "6", "7"] },
    af: { q: "Los op vir x: 2x + 4 = 14", options: ["4", "5", "6", "7"] },
  },
  {
    correct: 2,
    en: { q: "A rectangle has a length of 12 cm and a width of 5 cm. What is its area?", options: ["17 cm²", "34 cm²", "60 cm²", "85 cm²"] },
    af: { q: "'n Reghoek het 'n lengte van 12 cm en 'n wydte van 5 cm. Wat is die oppervlakte?", options: ["17 cm²", "34 cm²", "60 cm²", "85 cm²"] },
  },
];

function ensureDiagnosticState() {
  if (!state.diagnostic) {
    state.diagnostic = {
      subjectId: state.subjects[0]?.id || null,
      started: false,
      finished: false,
      currentIndex: 0,
      answers: [],
      selectedOption: null,
      levelResult: null,
    };
  }
}

function renderDiagnosticScreen() {
  ensureDiagnosticState();
  const d = state.diagnostic;

  if (d.finished) return renderDiagnosticResult();
  if (!d.started) return renderDiagnosticIntro();
  return renderDiagnosticQuestion();
}

function renderDiagnosticIntro() {
  const d = state.diagnostic;
  return `
    <div class="screen no-nav-padding">
      <div class="topbar">
        <div class="topbar-logo">${t("appName")}<span class="tm">™</span></div>
        <div class="topbar-actions">
          <button class="lang-toggle" data-action="toggle-lang">${state.lang === "en" ? "AF" : "EN"}</button>
        </div>
      </div>
      <div class="container">
        <div class="card">
          <h3>${t("diagnosticTitle")}</h3>
          <p>${t("diagnosticIntro")}</p>
        </div>
        <div class="field">
          <label>${t("selectSubject")}</label>
          <select id="diagnostic-subject">
            ${state.subjects
              .map((s) => `<option value="${s.id}" ${s.id === d.subjectId ? "selected" : ""}>${escapeHtml(s.name)}</option>`)
              .join("")}
          </select>
        </div>
        <button class="btn btn-primary btn-block" data-action="diagnostic-begin">${t("btnBeginDiagnostic")}</button>
        ${
          state.learner.diagnostic_level > 0
            ? `<div class="text-center" style="margin-top:14px;"><button class="link-btn" data-action="diagnostic-cancel">${t("cancel")}</button></div>`
            : ""
        }
      </div>
    </div>
  `;
}

function renderDiagnosticQuestion() {
  const d = state.diagnostic;
  const q = DIAGNOSTIC_QUESTIONS[d.currentIndex];
  const lang = state.lang === "af" ? "af" : "en";
  const isLast = d.currentIndex === DIAGNOSTIC_QUESTIONS.length - 1;
  const progress = ((d.currentIndex + (d.selectedOption !== null ? 1 : 0)) / DIAGNOSTIC_QUESTIONS.length) * 100;

  return `
    <div class="screen no-nav-padding">
      <div class="topbar">
        <div class="topbar-logo">${t("appName")}<span class="tm">™</span></div>
      </div>
      <div class="container">
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${progress}%"></div></div>
        <div class="section-title">${t("questionLabel")} ${d.currentIndex + 1} ${t("of5")}</div>
        <div class="card">
          <h3 class="mt-0">${escapeHtml(q[lang].q)}</h3>
        </div>
        ${q[lang].options
          .map(
            (opt, i) => `
          <div class="option-btn ${d.selectedOption === i ? "selected" : ""}" data-action="diagnostic-select" data-index="${i}">
            ${escapeHtml(opt)}
          </div>`,
          )
          .join("")}
        <button class="btn btn-primary btn-block" data-action="diagnostic-next" ${d.selectedOption === null ? "disabled" : ""}>
          ${isLast ? t("btnSeeResult") : t("btnNextQuestion")}
        </button>
      </div>
    </div>
  `;
}

function renderDiagnosticResult() {
  const d = state.diagnostic;
  return `
    <div class="screen no-nav-padding">
      <div class="topbar">
        <div class="topbar-logo">${t("appName")}<span class="tm">™</span></div>
      </div>
      <div class="container text-center">
        <div class="card">
          <h3>${t("diagnosticDoneTitle")}</h3>
          <p>${t("diagnosticDoneMsg")}</p>
          <div style="margin:18px 0;">
            <span class="level-pill" style="width:64px;height:64px;font-size:28px;">${d.levelResult}</span>
          </div>
          <p>${t("levelLabel")} ${d.levelResult}/5</p>
        </div>
        <button class="btn btn-gold btn-block" data-action="diagnostic-finish">${t("btnStartLearning")}</button>
      </div>
    </div>
  `;
}

function diagnosticSelectOption(index) {
  state.diagnostic.selectedOption = index;
  render();
}

function diagnosticNext() {
  const d = state.diagnostic;
  const q = DIAGNOSTIC_QUESTIONS[d.currentIndex];
  d.answers.push(d.selectedOption === q.correct ? 1 : 0);

  if (d.currentIndex < DIAGNOSTIC_QUESTIONS.length - 1) {
    d.currentIndex += 1;
    d.selectedOption = null;
    render();
  } else {
    finishDiagnostic();
  }
}

async function finishDiagnostic() {
  const d = state.diagnostic;
  const score = d.answers.reduce((sum, a) => sum + a, 0);
  const level = score === 0 ? 1 : score;

  try {
    await sbClient.from("diagnostic_attempts").insert({
      learner_id: state.learner.id,
      grade: state.learner.grade,
      subject_id: d.subjectId,
      score,
      level_determined: level,
    });

    await sbClient.from("learners").update({ diagnostic_level: level }).eq("id", state.learner.id);

    state.learner.diagnostic_level = level;
    d.levelResult = level;
    d.finished = true;
    render();
  } catch (err) {
    console.error(err);
    showToast(t("errorGeneric"), "error");
  }
}

function diagnosticBegin() {
  const select = document.getElementById("diagnostic-subject");
  state.diagnostic.subjectId = select ? select.value : state.subjects[0]?.id;
  state.diagnostic.started = true;
  render();
}

function diagnosticCancel() {
  state.showDiagnostic = false;
  state.diagnostic = null;
  render();
}

function retakeDiagnostic() {
  state.showDiagnostic = true;
  state.diagnostic = null;
  render();
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
    const { error } = await sbClient.from("topics").insert({
      learner_id: state.learner.id,
      subject_id: subjectSelect.value,
      title,
    });
    if (error) throw error;
    await loadTopics();
    render();
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
const SESSION_STEPS = ["explain", "example", "attempt", "feedback"];
const SESSION_STEP_LABELS = {
  explain: "stepExplain",
  example: "stepExample",
  attempt: "stepAttempt",
  feedback: "stepFeedback",
};

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
    phase: "explain",
    loading: true,
    explainText: null,
    exampleText: null,
    attemptQuestion: null,
    learnerAnswer: "",
    feedbackText: null,
    safetyFlag: false,
    error: null,
    completedPhases: [],
    retry: null,
  };
  render();
  await runSessionPhase("explain");
}

async function callStudyGuide(phase, learnerInput, context) {
  const res = await fetchWithTimeout(`${FN_URL}/generate-study-guide`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.session.access_token}`,
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ topicId: state.activeSession.topicId, phase, learnerInput, context }),
  });
  const data = await res.json();
  if (!res.ok) throw data;
  return data;
}

async function runSessionPhase(phase, learnerInput, context) {
  const s = state.activeSession;
  s.loading = true;
  s.error = null;
  s.retry = { phase, learnerInput, context };
  render();

  console.log("🎓 Study Guide API", { topicId: s.topicId, phase, status: "calling" });

  try {
    const data = await callStudyGuide(phase, learnerInput, context);
    if (data.safety_flag) {
      s.safetyFlag = true;
      s.feedbackText = data.response;
      s.phase = "feedback";
    } else {
      if (phase === "explain") s.explainText = data.response;
      else if (phase === "example") s.exampleText = data.response;
      else if (phase === "attempt") s.attemptQuestion = data.response;
      else if (phase === "feedback") s.feedbackText = data.response;
    }

    if (phase === "explain") incrementLocalSessionCount();

    s.completedPhases.push(phase);
    console.log("🎓 Study Guide API", { phase, status: "success", tokensUsed: data.tokensUsed ?? 0 });
    console.log("💾 Session saved", { topicId: s.topicId, phases: s.completedPhases });
  } catch (err) {
    if (err && err.name === "AbortError") {
      s.error = t("errorRetryContent");
    } else {
      s.error = (err && err.message) || t("errorRetryContent");
    }
    console.error("🎓 Study Guide API ERROR", s.error);
  } finally {
    s.loading = false;
    render();
  }
}

function sessionRetry() {
  const s = state.activeSession;
  if (!s || !s.retry) return;
  runSessionPhase(s.retry.phase, s.retry.learnerInput, s.retry.context);
}

function sessionContinue() {
  const s = state.activeSession;
  if (s.phase === "explain") {
    s.phase = "example";
    runSessionPhase("example", null, { explainText: s.explainText });
  } else if (s.phase === "example") {
    s.phase = "attempt";
    runSessionPhase("attempt", null, { exampleText: s.exampleText });
  }
}

function sessionSubmitAnswer() {
  const s = state.activeSession;
  const textarea = document.getElementById("session-answer");
  const answer = textarea ? textarea.value.trim() : "";
  if (!answer) {
    showToast(t("yourAnswerLabel"), "error");
    return;
  }
  s.learnerAnswer = answer;
  s.phase = "feedback";
  runSessionPhase("feedback", answer, { attemptQuestion: s.attemptQuestion });
}

async function reloadLearner() {
  const { data } = await sbClient.from("learners").select("*").eq("id", state.learner.id).single();
  if (data) state.learner = data;
}

async function sessionClose() {
  state.activeSession = null;
  render();
}

async function sessionDone() {
  state.activeSession = null;
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

function renderSessionModal() {
  const s = state.activeSession;
  const stepIndex = SESSION_STEPS.indexOf(s.phase);

  return `
    <div class="modal-overlay">
      <div class="modal-sheet">
        <div class="modal-header">
          <h3>${escapeHtml(s.topicTitle)}</h3>
          <button class="modal-close" data-action="session-close">✕</button>
        </div>
        <div class="modal-body">
          <div class="step-track">
            ${SESSION_STEPS.map((step, i) => `<div class="step-dot ${i < stepIndex ? "done" : i === stepIndex ? "active" : ""}"></div>`).join("")}
          </div>
          <div class="step-label">${t(SESSION_STEP_LABELS[s.phase])}</div>
          ${renderSessionStepContent()}
        </div>
        <div class="modal-footer">${renderSessionFooter()}</div>
      </div>
    </div>
  `;
}

function renderSessionStepContent() {
  const s = state.activeSession;

  if (s.error) {
    return `<div class="card" style="border-left:4px solid var(--danger);"><p>${escapeHtml(s.error)}</p></div>`;
  }

  if (s.loading) {
    return `<div class="loading-row"><span class="spinner spinner-purple"></span> ${t("generating")}</div>`;
  }

  switch (s.phase) {
    case "explain":
      return `<div class="ai-bubble">${escapeHtml(s.explainText || "")}</div>`;
    case "example":
      return `
        ${s.explainText ? `<div class="ai-bubble" style="margin-bottom:10px;">${escapeHtml(s.explainText)}</div>` : ""}
        <div class="ai-bubble">${escapeHtml(s.exampleText || "")}</div>
      `;
    case "attempt":
      return `
        <div class="ai-bubble" style="margin-bottom:10px;">${escapeHtml(s.attemptQuestion || "")}</div>
        <div class="field">
          <label>${t("yourAnswerLabel")}</label>
          <textarea id="session-answer" rows="4">${escapeHtml(s.learnerAnswer || "")}</textarea>
        </div>
      `;
    case "feedback":
      return s.safetyFlag
        ? `<div class="safety-bubble"><strong>${t("supportResources")}</strong><br/><br/>${escapeHtml(s.feedbackText || "")}</div>`
        : `<div class="ai-bubble">${escapeHtml(s.feedbackText || "")}</div>`;
    default:
      return "";
  }
}

// ---------------------------------------------------------------------
// EXAMS TAB
// ---------------------------------------------------------------------
function renderExamsTab() {
  const tier = state.profile.subscription_tier;
  const isPremium = tier === "premium";
  const subjectMap = Object.fromEntries(state.subjects.map((s) => [s.id, s.name]));
  const completedExams = state.exams.filter((e) => e.completed_at);

  return `
    <div class="card">
      <h3 class="mt-0 screen-title">${t("examsHeading")}</h3>
      <span class="badge badge-gold">${t("yourDiagnosticLevel")}: ${state.learner.diagnostic_level}/5</span>
    </div>

    <div class="card">
      <div class="field">
        <label>${t("selectSubjectLabel")}</label>
        <select id="exam-subject">
          ${state.subjects.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")}
        </select>
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

async function startMockExam() {
  const subjectSelect = document.getElementById("exam-subject");
  const difficultySelect = document.getElementById("exam-difficulty");
  if (!subjectSelect || !difficultySelect) return;

  const difficulty = difficultySelect.value;
  const btn = document.querySelector('[data-action="start-exam"]');
  setButtonLoading(btn, true);

  console.log("📋 Mock Exam API", { difficulty, status: "calling" });

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

function renderSessionFooter() {
  const s = state.activeSession;

  if (s.error) {
    return `
      <button class="btn btn-primary btn-block" data-action="session-retry">${t("btnRetry")}</button>
      <button class="btn btn-outline btn-block" style="margin-top:8px;" data-action="session-close">${t("cancel")}</button>
    `;
  }
  if (s.loading) return "";

  switch (s.phase) {
    case "explain":
      return `<button class="btn btn-primary btn-block" data-action="session-continue">${t("btnSeeExample")}</button>`;
    case "example":
      return `<button class="btn btn-primary btn-block" data-action="session-continue">${t("btnTryYourself")}</button>`;
    case "attempt":
      return `<button class="btn btn-primary btn-block" data-action="session-submit-answer">${t("btnSubmitAnswer")}</button>`;
    case "feedback":
      return `<button class="btn btn-gold btn-block" data-action="session-done">${t("btnFinish")}</button>`;
    default:
      return "";
  }
}

// ---------------------------------------------------------------------
// PARENT TAB
// ---------------------------------------------------------------------
const ALERT_ICONS = { safety_flag: "🚨", low_performance: "📉", study_streak: "🔥" };

function renderParentTab() {
  return `
    <div class="card">
      <h3 class="mt-0 screen-title">${t("parentHeading")}</h3>
    </div>

    <div class="card">
      <div class="section-title" style="margin-top:0;">${t("linkLearnerHeading")}</div>
      <form data-action="link-learner-form">
        <div class="field-row">
          <div class="field" style="flex:3;">
            <input type="text" name="learnerCode" placeholder="${t("linkLearnerPlaceholder")}" maxlength="8" required style="text-transform:uppercase;" />
          </div>
          <button type="submit" class="btn btn-primary" style="flex:1; height:44px; align-self:flex-start;">${t("btnLink")}</button>
        </div>
      </form>
    </div>

    ${
      state.linkedLearners.length === 0
        ? `<div class="empty-state"><div class="empty-icon">👨‍👩‍👧</div><p>${t("noLearners")}</p></div>`
        : state.linkedLearners.map((learner) => renderLearnerCard(learner)).join("")
    }
  `;
}

function renderLearnerCard(learner) {
  return `
    <div class="learner-card">
      <div class="learner-card-head">
        <h3 class="mt-0">${escapeHtml(learner.full_name)}</h3>
        <span class="level-pill">${learner.diagnostic_level}</span>
      </div>
      <span class="badge badge-purple">${t("gradeLabel")} ${learner.grade}</span>
      <span class="badge badge-gold">${t("diagnosticLevelLabel")}: ${learner.diagnostic_level}/5</span>

      <div class="stat-grid">
        <div class="stat-box"><div class="num">${learner.topicCount}</div><div class="lbl">${t("topicsStudiedLabel")}</div></div>
        <div class="stat-box"><div class="num">${learner.sessions_completed}</div><div class="lbl">${t("sessionsCompletedLabel")}</div></div>
      </div>
      <p class="muted">${t("lastSessionLabel")}: ${formatDateTime(learner.last_session)}</p>

      <div class="section-title">${t("alertsHeading")}</div>
      ${
        learner.alerts.length === 0
          ? `<p class="muted">${t("noAlerts")}</p>`
          : learner.alerts.map((alert) => renderAlertItem(alert)).join("")
      }

      <div class="section-title">${t("activityHeading")}</div>
      ${
        learner.activity.length === 0
          ? `<p class="muted">${t("noActivity")}</p>`
          : learner.activity
              .map(
                (act) => `
        <div class="activity-item">
          ${escapeHtml(act.topics?.title || "")}
          <div class="activity-time">${formatDateTime(act.completed_at || act.created_at)}</div>
        </div>`,
              )
              .join("")
      }
    </div>
  `;
}

function renderAlertItem(alert) {
  return `
    <div class="alert-item ${alert.read_at ? "" : "unread"}">
      <span class="alert-icon">${ALERT_ICONS[alert.alert_type] || "🔔"}</span>
      <div style="flex:1;">
        <div>${escapeHtml(alert.message || "")}</div>
        <div class="alert-meta">${formatDateTime(alert.created_at)}</div>
        ${!alert.read_at ? `<button class="link-btn" data-action="mark-alert-read" data-alert-id="${alert.id}">${t("markRead")}</button>` : ""}
      </div>
    </div>
  `;
}

async function handleLinkLearner(form) {
  const code = form.learnerCode.value.trim().toUpperCase();
  const btn = form.querySelector("button[type=submit]");
  setButtonLoading(btn, true);

  try {
    const { data, error } = await sbClient.rpc("link_learner_to_parent", { p_learner_code: code });
    if (error) throw error;

    if (!data) {
      showToast(t("linkNotFound"), "error");
      return;
    }

    await loadParentData();
    form.reset();
    showToast(t("linkSuccess"), "success");
    render();
  } catch (err) {
    console.error(err);
    showToast(err.message || t("errorGeneric"), "error");
  } finally {
    setButtonLoading(btn, false);
  }
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
// ACCOUNT TAB
// ---------------------------------------------------------------------
function renderAccountTab() {
  const profile = state.profile;
  const tier = profile.subscription_tier;

  return `
    <div class="card">
      <h3 class="mt-0 screen-title">${t("accountHeading")}</h3>
      <div class="account-row">
        <span class="label">${t("labelFullName")}</span>
        <span class="value">${escapeHtml(profile.full_name || "-")}</span>
      </div>
      <div class="account-row">
        <span class="label">${t("labelEmail")}</span>
        <span class="value">${escapeHtml(profile.email)}</span>
      </div>
      <div class="account-row">
        <span class="label">${t("currentPlan")}</span>
        <span class="value"><span class="badge badge-purple">${t(tier)}</span></span>
      </div>
      <div class="account-row">
        <span class="label">${t("languageLabel")}</span>
        <span class="value">
          <button class="lang-toggle" style="background:var(--bg); color:var(--purple); border:1px solid var(--border);" data-action="toggle-lang">
            ${state.lang === "en" ? "English" : "Afrikaans"}
          </button>
        </span>
      </div>
    </div>

    ${profile.role === "learner" ? renderReferralCard() : ""}
    ${profile.role === "learner" ? renderTierCards(tier) : ""}

    <button class="btn btn-danger btn-block" data-action="logout" style="margin-top:6px;">${t("btnLogout")}</button>
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
      case "toggle-lang":
        toggleLanguage();
        break;
      case "logout":
        handleLogout();
        break;
      case "diagnostic-begin":
        diagnosticBegin();
        break;
      case "diagnostic-cancel":
        diagnosticCancel();
        break;
      case "diagnostic-finish":
        diagnosticCancel();
        break;
      case "diagnostic-select":
        diagnosticSelectOption(parseInt(target.dataset.index, 10));
        break;
      case "diagnostic-next":
        diagnosticNext();
        break;
      case "retake-diagnostic":
        retakeDiagnostic();
        break;
      case "open-topic":
        openTopicSession(target.dataset.topicId);
        break;
      case "session-close":
        sessionClose();
        break;
      case "session-continue":
        sessionContinue();
        break;
      case "session-submit-answer":
        sessionSubmitAnswer();
        break;
      case "session-done":
        sessionDone();
        break;
      case "session-retry":
        sessionRetry();
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
      case "link-learner-form":
        handleLinkLearner(form);
        break;
      default:
        break;
    }
  });
}
