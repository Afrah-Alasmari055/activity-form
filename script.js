// تفعيل شاشة الشكر وإظهارها للمستخدم فوراً بدون أي تأخير
    form.hidden = true;
    reqBanner.hidden = true;
    submissionTime.textContent = "تاريخ ووقت الإرسال: " + new Date().toLocaleString("ar-SA");
    successScreen.hidden = false;
    successScreen.scrollIntoView({ behavior: "smooth", block: "center" });

    // إرسال البيانات للفورم في الخلفية بصمت تام
    form.target = "hidden-iframe";
    form.action = googleFormURL;
    form.method = "POST";
    form.submit();