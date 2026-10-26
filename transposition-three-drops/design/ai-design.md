# طراحی هوش مصنوعی

## ۱. عامل‌ها

### ناظم

```yaml
role: تهدید/نظارت
states: [patrol, suspicious, chase, return, stunned]
perception: vision cone + hearing radius + lantern visibility
memory: lastSeen, suspicion, waypoint
policy: patrol → investigate sound → chase if suspicion ≥ 1 → return
```

- **دید:** مخروط ۷۰°، شعاع ۲۸۰؛ نور فانوس شعاع/تشخیص را ۱.۶ برابر می‌کند.
- **شنیدن:** شعاع ۱۸۰؛ دویدن/شلیک/گربه.
- **شک:** ۰..۱؛ در ۰.۵ تعقیب/هشدار؛ در ۱ حمله.
- **گرفتار:** بازگشت به آخرین قطره؛ شهادت‌ها حفظ.
- **قاعدهٔ اخلاقی:** ناظم هیولای کارتونی نیست؛ خسته/بی‌تفاوت/خشونت نهادی.

### عباس

```yaml
states: [wander, sit, sing, approach, retreat]
memory: playerDistance, lastInteraction
policy: پرسه در باغ؛ نزدیک شدن آرام؛ تصنیف؛ راهنمایی مبهم
```

- اگر بازیکن نزدیک شود: یک بیت/اشاره.
- اگر ناظم نزدیک شود: ساکت/دور.
- بعد از شهادت دوم: اعتراف/هشدار.

### گربه

```yaml
states: [rest, prowl, cry, flee, watch]
memory: playerDistance, noise
policy: مسیر ثابت/تصادفی؛ ناله در فاصله؛ فرار از نور/ناظم
```

- گربه شاهد/عامل است، نه آیتم.
- اگر بازیکن نور بیندازد: فرار/نگاه.
- اگر شهادت گربه ثبت شود: در کاج ظاهر می‌شود.

### رخساره (پایان)

```yaml
states: [absent, appear, judge, embrace]
policy: فقط در پایان؛ قضاوت بر اساس شهادت‌ها
```

## ۲. الگوریتم ساده

- FSM + timer.
- waypoint graph.
- line-of-sight با برخورد دیوار/کاج.
- suspicion با نرخ افزایش/کاهش.
- صدای بازیکن به‌عنوان محرک.

## ۳. آزمون

- ناظم در نور/بدون نور.
- تعقیب/فرار/گرفتار.
- عباس راهنمایی.
- گربه فرار/ناله.
- پایان بر اساس ژورنال.
