import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';

const API = window.SKYVEIL_API;

const FIELDS = [
  { name: 'BJ·스트리머', en: 'Streamer', icon: 'radio', desc: '라이브 방송으로 팬과 실시간으로 소통하는 메인 플레이어' },
  { name: '보컬', en: 'Vocal', icon: 'mic-vocal', desc: '목소리 하나로 무대를 채우는 음색과 표현력의 아티스트' },
  { name: '댄서', en: 'Dancer', icon: 'sparkles', desc: '퍼포먼스와 안무로 콘텐츠에 생명력을 불어넣는 무버' },
  { name: '크리에이터', en: 'Creator', icon: 'clapperboard', desc: '숏폼·롱폼 콘텐츠를 기획하고 직접 만들어가는 메이커' },
  { name: '편집자', en: 'Editor', icon: 'scissors', desc: '영상의 리듬과 감각을 완성하는 포스트 프로덕션 전문가' },
  { name: '매니저', en: 'Manager', icon: 'briefcase', desc: '크루의 일정·운영·협업을 책임지는 든든한 조력자' },
];

const FAQ = [
  ['경력이 없어도 지원할 수 있나요?', '네, 가능합니다. SKYVEIL은 경력보다 가능성과 태도를 중요하게 봅니다. 활동 경력란에 "신입"이라고 적어주세요.'],
  ['여러 분야에 중복 지원이 가능한가요?', '한 번에 하나의 분야만 선택할 수 있습니다. 다른 분야도 희망하신다면 지원 동기에 함께 적어주세요.'],
  ['면접은 어떻게 진행되나요?', '서류 검토 후 남겨주신 연락 수단으로 일정을 안내드리며, 온라인 또는 오프라인으로 진행됩니다.'],
  ['결과는 언제 알 수 있나요?', '접수 후 영업일 기준 약 7일 이내에 검토 결과를 개별적으로 안내드립니다.'],
];

const CONTACT_PH = { '카카오톡': '카카오톡 ID', '디스코드': '디스코드 사용자명', '이메일': 'name@example.com', '전화': '010-0000-0000', '인스타그램': '@instagram' };

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Render field cards
$('#fieldGrid').innerHTML = FIELDS.map((f, i) => `
  <button type="button" data-field="${esc(f.name)}" class="field-card text-left bg-white border border-navy/5 hover:border-navy/30 rounded-2xl p-7 group">
    <div class="flex items-start justify-between">
      <div class="w-12 h-12 rounded-full bg-mist flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-colors">
        <i data-lucide="${f.icon}" class="w-5 h-5"></i>
      </div>
      <span class="font-display text-navy/25 text-xl">0${i + 1}</span>
    </div>
    <p class="mt-8 text-[11px] tracking-luxe text-gold">${f.en.toUpperCase()}</p>
    <h3 class="mt-1.5 text-xl font-semibold">${esc(f.name)}</h3>
    <p class="mt-2 text-sm text-navy/60 leading-relaxed">${esc(f.desc)}</p>
    <span class="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-navy/80 group-hover:text-navy">이 분야로 지원 <i data-lucide="arrow-up-right" class="w-4 h-4"></i></span>
  </button>`).join('');

$('#fieldChips').innerHTML = FIELDS.map(f => `
  <label class="chip relative"><input type="radio" name="field" value="${esc(f.name)}"><span><i data-lucide="${f.icon}" class="w-4 h-4"></i>${esc(f.name)}</span></label>`).join('');

$('#faqList').innerHTML = FAQ.map(([q, a]) => `
  <details class="group py-6">
    <summary class="flex items-center justify-between cursor-pointer list-none font-medium text-base md:text-lg">
      ${esc(q)}<i data-lucide="plus" class="w-5 h-5 shrink-0 ml-4 transition-transform group-open:rotate-45"></i>
    </summary>
    <p class="mt-4 text-navy/65 leading-relaxed">${esc(a)}</p>
  </details>`).join('');

createIcons({ icons });

document.querySelectorAll('[data-field]').forEach(btn => btn.addEventListener('click', () => {
  const r = document.querySelector(`input[name="field"][value="${btn.dataset.field}"]`);
  if (r) r.checked = true;
  clearErr('field');
  $('#apply').scrollIntoView({ behavior: 'smooth' });
}));

// Nav style on scroll
const nav = $('#nav');
const cta = nav.querySelector('.nav-cta');
function onScroll() {
  const solid = window.scrollY > window.innerHeight * 0.75;
  nav.classList.toggle('bg-white/90', solid);
  nav.classList.toggle('backdrop-blur', solid);
  nav.classList.toggle('border-b', solid);
  nav.classList.toggle('border-navy/5', solid);
  nav.classList.toggle('text-navy', solid);
  nav.classList.toggle('text-white', !solid);
  cta.className = 'nav-cta text-[13px] font-semibold tracking-wider px-5 py-2.5 rounded-full border transition-colors ' +
    (solid ? 'bg-navy text-white border-navy hover:bg-navy2' : 'border-white/50 hover:bg-white hover:text-navy');
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Reveal animation
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Form
const form = $('#applyForm');
const contactType = $('#f-contactType');
contactType.addEventListener('change', () => { $('#f-contact').placeholder = CONTACT_PH[contactType.value] || ''; });
['motivation', 'career'].forEach(k => {
  const el = $('#f-' + k);
  el.addEventListener('input', () => { $('#cnt-' + k).textContent = el.value.length; });
});
form.addEventListener('input', e => { if (e.target.name) clearErr(e.target.name); });
form.addEventListener('change', e => { if (e.target.name === 'field') clearErr('field'); if (e.target.id === 'f-agree') clearErr('agree'); });

function setErr(key, msg) {
  const p = form.querySelector(`.err[data-for="${key}"]`);
  if (p) { p.textContent = msg; p.classList.remove('hidden'); }
  const input = form.querySelector(`[name="${key}"]`);
  if (input && input.classList.contains('input')) input.classList.add('invalid');
}
function clearErr(key) {
  const p = form.querySelector(`.err[data-for="${key}"]`);
  if (p) p.classList.add('hidden');
  const input = form.querySelector(`[name="${key}"]`);
  if (input) input.classList.remove('invalid');
}

function validate(d) {
  let ok = true;
  if (!d.name) { setErr('name', '활동명을 입력해 주세요.'); ok = false; }
  if (!d.field) { setErr('field', '지원 분야를 선택해 주세요.'); ok = false; }
  if (d.motivation.length < 10) { setErr('motivation', '지원 동기를 10자 이상 입력해 주세요.'); ok = false; }
  if (!d.contact) { setErr('contact', '연락처를 입력해 주세요.'); ok = false; }
  else if (d.contactType === '이메일' && !/^\S+@\S+\.\S+$/.test(d.contact)) { setErr('contact', '올바른 이메일 주소를 입력해 주세요.'); ok = false; }
  if (d.portfolio && !/^https?:\/\/\S+$/i.test(d.portfolio)) { setErr('portfolio', 'http:// 또는 https://로 시작하는 링크를 입력해 주세요.'); ok = false; }
  if (!$('#f-agree').checked) { setErr('agree', '개인정보 수집·이용에 동의해 주세요.'); ok = false; }
  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#formError').classList.add('hidden');
  const fd = new FormData(form);
  const d = {
    name: (fd.get('name') || '').trim(),
    field: fd.get('field') || '',
    motivation: (fd.get('motivation') || '').trim(),
    career: (fd.get('career') || '').trim(),
    contactType: fd.get('contactType'),
    contact: (fd.get('contact') || '').trim(),
    portfolio: (fd.get('portfolio') || '').trim(),
    website: fd.get('website') || '',
  };
  if (!validate(d)) {
    const first = form.querySelector('.err:not(.hidden)');
    if (first) first.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  const btn = $('#submitBtn');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-circle" class="w-4 h-4 spin"></i><span>제출 중...</span>';
  createIcons({ icons });
  try {
    const res = await fetch(API + '/api/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || '제출 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    showSuccess(d.name, data.code);
    form.reset();
    $('#cnt-motivation').textContent = '0';
    $('#cnt-career').textContent = '0';
  } catch (err) {
    const fe = $('#formError');
    fe.textContent = err.message || '네트워크 오류가 발생했습니다.';
    fe.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>지원서 제출</span><i data-lucide="send" class="w-4 h-4"></i>';
    createIcons({ icons });
  }
});

const modal = $('#successModal');
function showSuccess(name, code) {
  $('#successName').textContent = name;
  $('#successCode').textContent = code;
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}
function closeModal() { modal.classList.add('hidden'); modal.classList.remove('flex'); }
$('#successClose').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
