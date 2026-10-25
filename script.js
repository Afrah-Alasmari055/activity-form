document.addEventListener("DOMContentLoaded", () => {
  // 1. شاشة الترحيب (5 ثوانٍ)
  const welcomeScreen = document.getElementById("welcome-screen");
  const countdownNum = document.getElementById("countdown-num");
  const welcomeProgress = document.getElementById("welcome-progress");
  const skipBtn = document.getElementById("skip-welcome-btn");

  const TOTAL_TIME = 5000;
  const INTERVAL = 50;
  let elapsed = 0;

  const closeWelcome = () => {
    clearInterval(timerInterval);
    welcomeScreen.classList.add("hide-screen");
  };

  const timerInterval = setInterval(() => {
    elapsed += INTERVAL;
    welcomeProgress.style.width = Math.min((elapsed / TOTAL_TIME) * 100, 100) + "%";
    countdownNum.textContent = Math.max(Math.ceil((TOTAL_TIME - elapsed) / 1000), 0);
    if (elapsed >= TOTAL_TIME) closeWelcome();
  }, INTERVAL);

  skipBtn.addEventListener("click", closeWelcome);

  // 2. تبديل الوضع الليلي
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = document.getElementById("theme-icon");
  const rootEl = document.documentElement;

  themeToggle.addEventListener("click", () => {
    const nextTheme = rootEl.getAttribute("data-theme") === "dark" ? "light" : "dark";
    rootEl.setAttribute("data-theme", nextTheme);
    themeIcon.textContent = nextTheme === "dark" ? "☀️" : "🌙";
  });

  // 3. شريط التقدم الحي
  const form = document.getElementById("survey-form");
  const progressBar = document.getElementById("form-progress-bar");
  const progressText = document.getElementById("progress-text");
  const stmts = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"];

  function updateProgress() {
    let completed = 0;
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
    const pct = Math.round((completed / 13) * 100);
    progressBar.style.width = pct + "%";
    progressText.textContent = pct + "%";
  }

  document.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener("change", updateProgress);
  });

  function showError(id, show) {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? "block" : "none";
  }

  // 4. التحقق والإرسال الخلفي لنموذج قوقل فورم
  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");
  const successScreen = document.getElementById("success-screen");
  const reqBanner = document.getElementById("req-banner");
  const submissionTime = document.getElementById("submission-time");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let valid = true;

    // التحقق من الصف الدراسي
    const gradeVal = document.querySelector('input[name="grade"]:checked');
    showError("grade-err", !gradeVal);
    document.getElementById("grade-block").classList.toggle("field-error", !gradeVal);
    if (!gradeVal) valid = false;

    // التحقق من المشاركة السابقة
    const prevVal = document.querySelector('input[name="prev"]:checked');
    showError("prev-err", !prevVal);
    document.getElementById("prev-block").classList.toggle("field-error", !prevVal);
    if (!prevVal) valid = false;

    // التحقق من العبارات العشر
    stmts.forEach((q) => {
      const val = document.querySelector(`input[name="${q}"]:checked`);
      showError(q + "-err", !val);
      const row = document.querySelector(`.stmt-row[data-q="${q}"]`);
      if (row) row.classList.toggle("field-error", !val);
      if (!val) valid = false;
    });

    // التحقق من المجالات
    const areasSelected = document.querySelectorAll('input[name="areas"]:checked');
    const areasOk = areasSelected.length > 0;
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

    // تفعيل وضع التحميل على الزر
    submitBtn.disabled = true;
    btnText.textContent = "جاري إرسال الاستبانة...";
    btnLoader.hidden = false;

    // توجيه إرسال البيانات مباشرة لنموذج قوقل فورم الخاص بك في الخلفية عبر iframe مخفي
    const googleFormURL = "https://docs.google.com/forms/d/e/1FAIpQLSeXChnwf6i-K1vW32GbeQbcoOtWciwQ95NovjYq_X5J6gB4SQ/formResponse";

    let iframe = document.getElementById("hidden-iframe");
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = "hidden-iframe";
      iframe.id = "hidden-iframe";
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    form.target = "hidden-iframe";
    form.action = googleFormURL;
    form.method = "POST";

    // إرسال البيانات للفورم
    form.submit();

    // عرض شاشة الشكر الفخمة للمستخدم فوراً
    setTimeout(() => {
      form.hidden = true;
      reqBanner.hidden = true;
      submissionTime.textContent = "تاريخ ووقت الإرسال: " + new Date().toLocaleString("ar-SA");
      successScreen.hidden = false;
      successScreen.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 600);
  });
});