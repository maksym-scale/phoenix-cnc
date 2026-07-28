/* =========================================================
   Phoenix — ЧПУ-порізка. Логіка сайту.
   ========================================================= */

/* --- НАЛАШТУВАННЯ --- */
/* Після деплою Cloudflare Worker вставте сюди його адресу,
   напр.: 'https://phoenix-form.ВАШ-АКАУНТ.workers.dev' */
const WORKER_URL = 'REPLACE_WITH_WORKER_URL';

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Рік у футері ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Мобільне меню ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav__link').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Модалка «Дякуємо» ---------- */
  var modal = document.getElementById('thanks');
  function openModal() { if (modal) modal.hidden = false; }
  function closeModal() { if (modal) modal.hidden = true; }
  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.hasAttribute('data-close-modal')) closeModal();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  /* ---------- Назва прикріпленого файлу ---------- */
  document.querySelectorAll('.file input[type="file"]').forEach(function (input) {
    input.addEventListener('change', function () {
      var wrap = input.closest('.file');
      var label = wrap.querySelector('.file__label');
      if (input.files && input.files.length) {
        wrap.classList.add('has-file');
        label.innerHTML = '📎 ' + input.files[0].name;
      } else {
        wrap.classList.remove('has-file');
        label.innerHTML = '📎 Прикріпити креслення <em>(необов\'язково)</em>';
      }
    });
  });

  /* ---------- Валідація ---------- */
  function validPhone(v) {
    // мінімум 9 цифр
    return (v.replace(/\D/g, '').length >= 9);
  }
  function validEmail(v) {
    if (!v) return true; // email не обов'язковий
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }
  function setError(field, on) {
    if (!field) return;
    field.classList.toggle('is-error', on);
  }

  /* ---------- Відправка форм ---------- */
  document.querySelectorAll('.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var phoneInput = form.querySelector('[name="phone"]');
      var emailInput = form.querySelector('[name="email"]');
      var ok = true;

      if (!validPhone(phoneInput.value)) { setError(phoneInput.closest('.field'), true); ok = false; }
      else setError(phoneInput.closest('.field'), false);

      if (!validEmail(emailInput.value)) { setError(emailInput.closest('.field'), true); ok = false; }
      else setError(emailInput.closest('.field'), false);

      if (!ok) { phoneInput.focus(); return; }

      var btn = form.querySelector('button[type="submit"]');
      var btnText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Відправляємо…';

      // Дані форми + джерело (який блок)
      var card = form.closest('[data-form-source]');
      var source = card ? card.getAttribute('data-form-source') : 'Сайт';
      var fd = new FormData(form);
      fd.append('source', source);
      fd.append('page', location.href);

      var done = function (success) {
        btn.disabled = false;
        btn.textContent = btnText;
        if (success) {
          form.reset();
          form.querySelectorAll('.file').forEach(function (f) {
            f.classList.remove('has-file');
            var l = f.querySelector('.file__label');
            if (l) l.innerHTML = '📎 Прикріпити креслення <em>(необов\'язково)</em>';
          });
          openModal();
          fireLead();
        } else {
          alert('Не вдалося відправити заявку. Зателефонуйте, будь ласка: 068 85 57 623');
        }
      };

      if (!WORKER_URL || WORKER_URL === 'REPLACE_WITH_WORKER_URL') {
        // Ендпоінт ще не підключено — не блокуємо тест верстки
        console.warn('WORKER_URL не налаштовано. Заявка не відправлена (тестовий режим).');
        done(true);
        return;
      }

      fetch(WORKER_URL, { method: 'POST', body: fd })
        .then(function (r) { done(r.ok); })
        .catch(function () { done(false); });
    });
  });

  /* ---------- Подія конверсії для аналітики ---------- */
  function fireLead() {
    try { if (typeof gtag === 'function') gtag('event', 'generate_lead'); } catch (e) {}
    try { if (typeof fbq === 'function') fbq('track', 'Lead'); } catch (e) {}
  }
});
