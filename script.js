/* =====================================================
   استبانة أولياء الأمور — الابتدائية الثانية بالقاعدة الجوية
   ربط جوجل فورمز: يتم إرسال البيانات بصمت في الخلفية
   ===================================================== */

"use strict";

/* ─── 1. إعدادات جوجل فورمز ────────────────────────── */
const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSeXChnwf6i-K1vW32GbeQbcoOtWciwQ95NovjYq_X5J6gB4SQ/formResponse";

// ربط كل حقل في الموقع بمعرّف حقله في جوجل فورمز
const ENTRY = {
  grade:        "entry.2031392563",
  prev:         "entry.1392707806",
  q1:           "entry.1335100219",
  q2:           "entry.372816807",
  q3:           "entry.1342798522",
  q4:           "entry.1467956903",
  q5:           "entry.1472576256",
  q6:           "entry.246349931",
  q7:           "entry.1723237920",
  q8:           "entry.1331886788",
  q9:           "entry.1388457364",
  q10:          "entry.1708697287",
  areas:        "entry.47759611",
  suggestions:  "entry.1304127292"
};

/* دالة إرسال البيانات لجوجل فورمز بصمت تام (no-cors) */
function sendToGoogleForms(formElement) {
  try {
    const src = new FormData(formElement);
    const fd  = new FormData();

    for (const [name, entryId] of Object.entries(ENTRY)) {
      const vals = src.getAll(name);
      for (const v of vals) {
        if (v && v.toString().trim() !== "") {
          fd.append(entryId, v);
        }
      }
    }

    fetch(GOOGLE_FORM_ACTION, {
      method: "POST",
      mode:   "no-cors",   // تجاوز CORS — لا نحتاج قراءة الاستجابة
      body:   fd
    }).catch(() => {});     // تجاهل أي خطأ بصمت
  } catch (_) {}
}

/* ─── 2. المتغيرات والعناصر ─────────────────────────── */
const welcomeScreen  = document.getElementById("welcome-screen");
const skipBtn        = document.getElementById("skip-welcome-btn");
const countdownNum   = document.getElementById("countdown-num");
const welcomeBar     = document.getElementById("welcome-progress");

const themeToggle    = document.getElementById("theme-toggle");
const themeIcon      = document.getElementById("theme-icon");

const formProgressBar = document.getElementById("form-progress-bar");
const progressText    = document.getElementById("progress-text");

const form           = document.getElementById("survey-form");
const submitBtn      = document.getElementById("submit-btn");
const btnText        = submitBtn.querySelector(".btn-text");
const btnLoader      = submitBtn.querySelector(".btn-loader");

const successScreen  = document.getElementById("success-screen");
const submissionTime = document.getElementById("submission-time");
const reqBanner      = document.getElementById("req-banner");

/* ─── 3. شاشة الترحيب (5 ثوانٍ) ─────────────────────── */
let timerInterval;
let remaining = 5;

function startWelcomeTimer() {
  const total = 5000;
  const start = Date.now();

  timerInterval = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.min((elapsed / total) * 100, 100);
    welcomeBar.style.width = pct + "%";

    const secs = Math.max(0, Math.ceil((total - elapsed) / 1000));
    countdownNum.textContent = secs;

    if (elapsed >= total) {
      clearInterval(timerInterval);
      dismissWelcome();
    }
  }, 80);
}

function dismissWelcome() {
  clearInterval(timerInterval);
  welcomeScreen.classList.add("hide-screen");
  // setTimeout أكثر موثوقية من transitionend
  setTimeout(() => {
    welcomeScreen.hidden = true;
  }, 700); // أطول بقليل من مدة الـ transition (0.65s)
}

skipBtn.addEventListener("click", dismissWelcome);
startWelcomeTimer();

/* ─── 4. الوضع الليلي / النهاري ──────────────────────── */
const root = document.documentElement;

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("survey-theme", theme);
}

themeToggle.addEventListener("click", () => {
  applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
});

// تطبيق الثيم المحفوظ
const savedTheme = localStorage.getItem("survey-theme");
if (savedTheme) applyTheme(savedTheme);

/* ─── 5. شريط التقدم ─────────────────────────────────── */
// الحقول الإجبارية: grade، prev، q1-q10، areas (13 مجموعة)
const REQUIRED_NAMES = [
  "grade", "prev",
  "q1","q2","q3","q4","q5","q6","q7","q8","q9","q10",
  "areas"
];

function updateProgress() {
  let answered = 0;

  // راديو بتونات (grade, prev, q1–q10)
  REQUIRED_NAMES.filter(n => n !== "areas").forEach(name => {
    if (form.querySelector(`[name="${name}"]:checked`)) answered++;
  });

  // checkboxes (areas)
  if (form.querySelector('[name="areas"]:checked')) answered++;

  const pct = Math.round((answered / REQUIRED_NAMES.length) * 100);
  formProgressBar.style.width = pct + "%";
  progressText.textContent = pct + "%";
}

form.addEventListener("change", updateProgress);

/* ─── 6. التحقق من الحقول ───────────────────────────── */
function clearError(el) {
  el.classList.remove("field-error");
  const err = document.getElementById(el.id.replace("-block", "-err") + "") ||
              el.closest(".stmt-row");
  if (err && err.classList.contains("stmt-row")) {
    err.classList.remove("field-error");
  }
}

function showError(el, msgId) {
  el.classList.add("field-error");
  const msg = document.getElementById(msgId);
  if (msg) {
    msg.style.display = "block";
    setTimeout(() => { msg.style.display = "none"; }, 4000);
  }
}

function validateForm() {
  let valid = true;
  let firstError = null;

  // grade
  const gradeBlock = document.getElementById("grade-block");
  if (!form.querySelector('[name="grade"]:checked')) {
    showError(gradeBlock, "grade-err");
    if (!firstError) firstError = gradeBlock;
    valid = false;
  }

  // prev
  const prevBlock = document.getElementById("prev-block");
  if (!form.querySelector('[name="prev"]:checked')) {
    showError(prevBlock, "prev-err");
    if (!firstError) firstError = prevBlock;
    valid = false;
  }

  // q1–q10 (stmt-rows)
  for (let i = 1; i <= 10; i++) {
    const row = form.querySelector(`[data-q="q${i}"]`);
    if (!row) continue;
    row.classList.remove("field-error");
    const errMsg = document.getElementById(`q${i}-err`);
    if (errMsg) errMsg.style.display = "none";

    if (!form.querySelector(`[name="q${i}"]:checked`)) {
      row.classList.add("field-error");
      if (errMsg) {
        errMsg.style.display = "block";
        setTimeout(() => { errMsg.style.display = "none"; }, 4000);
      }
      if (!firstError) firstError = row;
      valid = false;
    } else {
      row.classList.add("answered");
    }
  }

  // areas (checkboxes)
  const areasBlock = document.getElementById("areas-block");
  if (!form.querySelector('[name="areas"]:checked')) {
    showError(areasBlock, "areas-err");
    if (!firstError) firstError = areasBlock;
    valid = false;
  }

  if (firstError) {
    firstError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return valid;
}

/* ─── 7. الإرسال ──────────────────────────────────────── */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  // تعطيل زر الإرسال وإظهار المؤشر
  submitBtn.disabled = true;
  btnText.textContent = "جارٍ الإرسال...";
  btnLoader.hidden = false;

  // ① إرسال البيانات لجوجل فورمز في الخلفية
  sendToGoogleForms(form);

  // ② إظهار شاشة الشكر فوراً
  setTimeout(() => {
    form.style.display = "none";   // يتجاوز الـ display:flex في CSS
    reqBanner.style.display = "none";

    submissionTime.textContent =
      "تاريخ ووقت الإرسال: " +
      new Date().toLocaleString("ar-SA", {
        dateStyle: "full",
        timeStyle: "short"
      });

    successScreen.hidden = false;
    successScreen.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 600);
});

/* ─── 8. تحديث حالة stmt-rows عند الإجابة ──────────── */
form.querySelectorAll('.stmt-row').forEach(row => {
  const name = row.dataset.q;
  if (!name) return;
  row.querySelectorAll(`[name="${name}"]`).forEach(radio => {
    radio.addEventListener("change", () => {
      row.classList.add("answered");
      row.classList.remove("field-error");
      const err = document.getElementById(`${name}-err`);
      if (err) err.style.display = "none";
    });
  });
});
