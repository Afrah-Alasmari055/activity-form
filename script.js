/**
 * ضع رابط تطبيق الويب (Web App URL) الخاص بـ Google Sheets هنا بين علامتي التنصيص
 * بعد اتباع خطوة الربط البسيطة الموضحة أسفل الكود.
 */
const GOOGLE_SCRIPT_URL = "";

document.addEventListener("DOMContentLoaded", () => {
  // 1. إدارة شاشة الترحيب لمدة 5 ثوانٍ
  const welcomeScreen = document.getElementById("welcome-screen");
  const countdownNum = document.getElementById("countdown-num");
  const welcomeProgress = document.getElementById("welcome-progress");
  const skipBtn = document.getElementById("skip-welcome-btn");

  const TOTAL_TIME = 5000; // 5 ثوانٍ
  const INTERVAL = 50;
  let elapsed = 0;

  const closeWelcome = () => {
    clearInterval(timerInterval);
    welcomeScreen.classList.add("hide-screen");
  };

  const timerInterval = setInterval(() => {
    elapsed += INTERVAL;
    const percent = Math.min((elapsed / TOTAL_TIME) * 100, 100);
    welcomeProgress.style.width = percent + "%";

    const remainingSeconds = Math.ceil((TOTAL_TIME - elapsed) / 1000);
    countdownNum.textContent = Math.max(remainingSeconds, 0);

    if (elapsed >= TOTAL_TIME) {
      closeWelcome();
    }
  }, INTERVAL);

  skipBtn.addEventListener("click", closeWelcome);

  // 2. تبديل الوضع الليلي والنهاري
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const rootEl = document.documentElement;

  themeToggle.addEventListener("click", () => {
    const isDark = rootEl.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";
    rootEl.setAttribute("data-theme", nextTheme);
    themeIcon.textContent = nextTheme === "dark" ? "☀️" : "🌙";
  });

  // 3. حساب نسبة التقدم الحي (13 سؤالاً إجبارياً)
  const form = document.getElementById("survey-form");
  const progressBar = document.getElementById("form-progress-bar");
  const progressText = document.getElementById("progress-text");
  const stmts = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];

  function updateProgress() {
    let completed = 0;
    const totalRequired = 13;

    if (document.querySelector('input[name="grade"]:checked')) completed++;
    if (document.querySelector('input[name="prev"]:checked')) completed++;

    stmts.forEach((q) => {
      const checked = document.querySelector(`input[name="${q}"]:checked`);
      const row = document.querySelector(`.stmt-row[data-q="${q}"]`);
      if (checked) {
        completed++;
        if (row) row.classList.add("answered");
      }
    });

    if (document.querySelector('input[name="areas"]:checked')) completed++;

    const pct = Math.round((completed / totalRequired) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = pct + "%";
  }

  // إزالة رسائل الخطأ وتحديث شريط التقدم عند التفاعل
  document.querySelectorAll('input[type="radio"]').forEach((inp) => {
    inp.addEventListener("change", function () {
      const name = this.name;
      showError(`${name}-err`, false);
      const block = document.getElementById(`${name}-block`);
      if (block) block.classList.remove("field-error");
      const row = document.querySelector(`.stmt-row[data-q="${name}"]`);
      if (row) row.classList.remove("field-error");
      updateProgress();
    });
  });

  document.querySelectorAll('input[name="areas"]').forEach((inp) => {
    inp.addEventListener("change", () => {
      showError("areas-err", false);
      const block = document.getElementById("areas-block");
      if (block) block.classList.remove("field-error");
      updateProgress();
    });
  });

  function showError(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? "block" : "none";
  }

  // 4. التحقق من الحقول وإرسال الاستبانة
  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");
  const successScreen = document.getElementById("success-screen");
  const reqBanner = document.getElementById("req-banner");
  const submissionTime = document.getElementById("submission-time");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    let valid = true;

    // التحقق من الصف الدراسي
    const gradeVal = document.querySelector('input[name="grade"]:checked')?.value;
    showError("grade-err", !gradeVal);
    document.getElementById("grade-block").classList.toggle("field-error", !gradeVal);
    if (!gradeVal) valid = false;

    // التحقق من المشاركة السابقة
    const prevVal = document.querySelector('input[name="prev"]:checked')?.value;
    showError("prev-err", !prevVal);
    document.getElementById("prev-block").classList.toggle("field-error", !prevVal);
    if (!prevVal) valid = false;

    // التحقق من عبارات التقييم العشر
    const answers = {};
    stmts.forEach((q) => {
      const val = document.querySelector(`input[name="${q}"]:checked`)?.value;
      showError(`${q}-err`, !val);
      const row = document.querySelector(`.stmt-row[data-q="${q}"]`);
      if (row) row.classList.toggle("field-error", !val);
      if (!val) valid = false;
      else answers[q] = val;
    });

    // التحقق من المجالات المفضلة
    const selectedAreas = Array.from(
      document.querySelectorAll('input[name="areas"]:checked')
    ).map((el) => el.value);
    const areasOk = selectedAreas.length > 0;
    showError("areas-err", !areasOk);
    document.getElementById("areas-block").classList.toggle("field-error", !areasOk);
    if (!areasOk) valid = false;

    if (!valid) {
      const firstErr = form.querySelector(".field-error");
      if (firstErr) {
        firstErr.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // تجهيز حزمة البيانات للإرسال إلى Google Sheets
    const payload = {
      timestamp: new Date().toLocaleString("ar-SA"),
      grade: gradeVal,
      previousParticipation: prevVal,
      ...answers,
      preferredAreas: selectedAreas.join(" ، "),
      suggestions: document.getElementById("suggestions").value.trim() || "لا يوجد"
    };

    // تفعيل وضع التحميل على الزر
    submitBtn.disabled = true;
    btnText.textContent = "جاري حفظ وإرسال مشاركتكم...";
    btnLoader.hidden = false;

    try {
      if (GOOGLE_SCRIPT_URL.trim() !== "") {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "text/plain;charset=utf-8" },
          body: JSON.stringify(payload)
        });
      }
    } catch (err) {
      console.error("خطأ أثناء الإرسال:", err);
    }

    // إظهار شاشة الشكر
    form.hidden = true;
    reqBanner.hidden = true;
    submissionTime.textContent = "تاريخ ووقت الإرسال: " + payload.timestamp;
    successScreen.hidden = false;
    successScreen.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});