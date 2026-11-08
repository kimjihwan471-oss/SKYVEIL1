import { createIcons, icons } from 'https://cdn.jsdelivr.net/npm/lucide@latest/+esm';

const API = window.SKYVEIL_API;
const FIELDS = ['BJ·스트리머', '보컬', '댄서', '크리에이터', '편집자', '매니저'];
const STATUSES = ['접수', '검토중', '면접예정', '합격', '불합격'];
const TOKEN_KEY = 'skyveil_admin_token';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = () => createIcons({ icons });

let items = [];
let selectedId = null;
let tab = 'list';

// ---------- API ----------
function token() { return sessionStorage.getItem(TOKEN_KEY); }
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token() || ''), ...(opts.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) { sessionStorage.removeItem(TOKEN_KEY); showLogin('세션이 만료되었습니다. 다시 로그인해 주세요.'); throw new Error('unauthorized'); }
  if (!res.ok || !data.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
  return data;
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('opacity-0', 'translate-y-2');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('opacity-0', 'translate-y-2'), 2200);
}

// ---------- Auth ----------
function showLogin(msg) {
  $('#appView').classList.add('hidden'); $('#appView').classList.remove('flex');
  $('#loginView').classList.remove('hidden');
  const e = $('#loginErr');
  if (msg) { e.textContent = msg; e.classList.remove('hidden'); } else e.classList.add('hidden');
  setTimeout(() => $('#pw').focus(), 50);
}
function showApp() {
  $('#loginView').classList.add('hidden');
  $('#appView').classList.remove('hidden'); $('#appView').classList.add('flex');
  load();
}

$('#pwToggle').addEventListener('click', () => {
  const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password';
});

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('#pw').value;
  const err = $('#loginErr');
  if (!pw) { err.textContent = '비밀번호를 입력해 주세요.'; err.classList.remove('hidden'); return; }
  const btn = $('#loginBtn');
  btn.disabled = true; btn.innerHTML = '<i data-lucide="loader-circle" class="w-4 h-4 spin"></i>확인 중...'; icon();
  try {
    const res = await fetch(API + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.token) throw new Error(data.error || '로그인에 실패했습니다.');
    sessionStorage.setItem(TOKEN_KEY, data.token);
    $('#pw').value = '';
    showApp();
  } catch (ex) {
    err.textContent = ex.message; err.classList.remove('hidden');
  } finally {
    btn.disabled = false; btn.textContent = '로그인';
  }
});

$('#logoutBtn').addEventListener('click', async () => {
  try { await fetch(API + '/api/admin/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + (token() || '') } }); } catch {}
  sessionStorage.removeItem(TOKEN_KEY);
  items = []; selectedId = null;
  showLogin();
});

// ---------- Data ----------
async function load() {
  $('#loading').classList.remove('hidden');
  $('#list').innerHTML = ''; $('#empty').classList.add('hidden');
  try {
    const data = await api('/api/admin/applications');
    items = data.items || [];
    render();
  } catch (e) {
    if (e.message !== 'unauthorized') toast(e.message);
  } finally {
    $('#loading').classList.add('hidden');
  }
}
$('#refreshBtn').addEventListener('click', () => { load(); toast('새로고침했습니다'); });

// ---------- Render ----------
const fmtDate = (ts) => { const d = new Date(ts); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
const fmtDT = (s) => { const d = new Date(s); if (isNaN(d)) return s; const w = '일월화수목금토'[d.getDay()]; return `${d.getMonth() + 1}월 ${d.getDate()}일 (${w}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const pill = (s) => `<span class="status-pill st-${esc(s)}">${esc(s)}</span>`;

FIELDS.forEach(f => $('#fField').insertAdjacentHTML('beforeend', `<option>${esc(f)}</option>`));
STATUSES.forEach(s => $('#fStatus').insertAdjacentHTML('beforeend', `<option>${esc(s)}</option>`));
['#q', '#fField', '#fStatus', '#fSort'].forEach(s => $(s).addEventListener('input', renderList));

function render() { renderStats(); renderList(); renderDetail(); renderSchedule(); icon(); }

function renderStats() {
  const c = (s) => items.filter(i => i.status === s).length;
  const today = new Date().toDateString();
  const todayNew = items.filter(i => new Date(i.createdAt).toDateString() === today).length;
  const cards = [
    ['전체 지원', items.length, todayNew ? `오늘 +${todayNew}` : '', 'users', ''],
    ...STATUSES.map(s => [s, c(s), '', null, s]),
  ];
  $('#stats').innerHTML = cards.map(([label, n, sub, ic, st]) => `
    <button data-stat="${esc(st)}" class="text-left bg-white border ${$('#fStatus').value === st && st ? 'border-navy' : 'border-navy/5'} rounded-2xl p-4 md:p-5 hover:border-navy/30 transition-colors">
      <div class="flex items-center justify-between text-xs text-navy/55">${esc(label)} ${st ? `<span class="w-2 h-2 rounded-full st-${esc(st)}" style="padding:0"></span>` : `<i data-lucide="${ic}" class="w-4 h-4"></i>`}</div>
      <div class="mt-2 flex items-baseline gap-2"><span class="text-2xl md:text-3xl font-semibold">${n}</span><span class="text-xs text-gold">${esc(sub)}</span></div>
    </button>`).join('');
  document.querySelectorAll('[data-stat]').forEach(b => b.addEventListener('click', () => {
    const st = b.dataset.stat;
    $('#fStatus').value = $('#fStatus').value === st ? '' : st;
    switchTab('list'); renderStats(); renderList(); icon();
  }));
}

function filtered() {
  const q = $('#q').value.trim().toLowerCase();
  const f = $('#fField').value, s = $('#fStatus').value, sort = $('#fSort').value;
  let r = items.filter(i => (!f || i.field === f) && (!s || i.status === s) &&
    (!q || [i.name, i.code, i.contact, i.motivation, i.career, i.portfolio, i.memo].join(' ').toLowerCase().includes(q)));
  if (sort === 'old') r.sort((a, b) => a.createdAt - b.createdAt);
  else if (sort === 'name') r.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  else r.sort((a, b) => b.createdAt - a.createdAt);
  return r;
}

function renderList() {
  const r = filtered();
  $('#empty').classList.toggle('hidden', r.length > 0);
  $('#emptyText').textContent = items.length ? '검색 결과가 없습니다.' : '아직 접수된 지원서가 없습니다.';
  $('#list').innerHTML = r.map(i => `
    <button data-id="${esc(i.id)}" class="row-item ${i.id === selectedId ? 'active' : ''} w-full text-left px-5 py-4 md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_110px] md:gap-4 md:items-center block">
      <div class="flex items-center justify-between md:block">
        <div class="min-w-0">
          <p class="font-semibold truncate">${esc(i.name)}</p>
          <p class="text-xs text-navy/45 font-mono mt-0.5">${esc(i.code)}</p>
        </div>
        <span class="md:hidden">${pill(i.status)}</span>
      </div>
      <p class="text-sm text-navy/75 mt-2 md:mt-0"><span class="md:hidden text-navy/40">분야 · </span>${esc(i.field)}</p>
      <p class="text-sm text-navy/75 truncate hidden md:block"><span class="text-navy/40">${esc(i.contactType)}</span> ${esc(i.contact)}</p>
      <p class="text-sm text-navy/55 hidden md:block">${fmtDate(i.createdAt)}</p>
      <span class="hidden md:block">${pill(i.status)}</span>
    </button>`).join('');
  document.querySelectorAll('#list [data-id]').forEach(b => b.addEventListener('click', () => select(b.dataset.id)));
}

function select(id) {
  selectedId = id;
  renderList(); renderDetail(); icon();
  if (window.innerWidth < 1024) { $('#detailWrap').classList.remove('hidden'); document.body.style.overflow = 'hidden'; }
}
function closeDetailMobile() {
  if (window.innerWidth < 1024) { $('#detailWrap').classList.add('hidden'); document.body.style.overflow = ''; }
}
$('#detailWrap').addEventListener('click', (e) => { if (e.target.id === 'detailWrap') closeDetailMobile(); });

function toLocalInput(s) {
  if (!s) return '';
  const d = new Date(s); if (isNaN(d)) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderDetail() {
  const el = $('#detail');
  const i = items.find(x => x.id === selectedId);
  if (!i) {
    el.innerHTML = `<div class="py-24 px-8 text-center text-navy/45"><i data-lucide="mouse-pointer-click" class="w-7 h-7 mx-auto text-navy/25"></i><p class="mt-3 text-sm">지원서를 선택하면 상세 정보가 표시됩니다.</p></div>`;
    return;
  }
  const portfolio = i.portfolio && /^https?:\/\//i.test(i.portfolio)
    ? `<a href="${esc(i.portfolio)}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-[#2747A8] hover:underline break-all"><i data-lucide="link-2" class="w-4 h-4 shrink-0"></i>${esc(i.portfolio)}</a>`
    : '<span class="text-navy/40">없음</span>';
  el.innerHTML = `
    <div class="sticky top-0 bg-white z-10 px-6 pt-5 pb-4 border-b border-navy/5">
      <div class="lg:hidden w-10 h-1 rounded-full bg-navy/15 mx-auto mb-4"></div>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs text-navy/45 font-mono">${esc(i.code)}</p>
          <h2 class="mt-1 text-xl font-semibold truncate">${esc(i.name)}</h2>
          <p class="mt-1 text-sm text-navy/60">${esc(i.field)} · ${fmtDate(i.createdAt)} 접수</p>
        </div>
        <div class="flex items-center gap-1">
          <button id="delBtn" class="p-2 rounded-full text-[#A33A50] hover:bg-[#F7E8EB]" title="삭제" aria-label="삭제"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
          <button id="closeDetail" class="lg:hidden p-2 rounded-full hover:bg-mist" aria-label="닫기"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
      </div>
    </div>
    <div class="p-6 space-y-7">
      <div>
        <p class="text-xs font-semibold text-navy/50 mb-2.5">진행 상태</p>
        <div class="flex flex-wrap gap-1.5">
          ${STATUSES.map(s => `<button data-status="${esc(s)}" class="px-3.5 py-2 rounded-full text-sm border transition-colors ${i.status === s ? 'bg-navy text-white border-navy' : 'border-navy/10 hover:border-navy/40'}">${esc(s)}</button>`).join('')}
        </div>
      </div>

      <dl class="space-y-5 text-sm">
        <div><dt class="text-xs font-semibold text-navy/50 mb-1.5">연락 수단</dt><dd class="flex items-center gap-2"><span class="text-navy/50">${esc(i.contactType)}</span><span class="font-medium break-all">${esc(i.contact)}</span>
          <button id="copyContact" class="ml-auto p-1.5 rounded-lg hover:bg-mist text-navy/50" title="복사" aria-label="연락처 복사"><i data-lucide="copy" class="w-3.5 h-3.5"></i></button></dd></div>
        <div><dt class="text-xs font-semibold text-navy/50 mb-1.5">포트폴리오</dt><dd>${portfolio}</dd></div>
        <div><dt class="text-xs font-semibold text-navy/50 mb-1.5">지원 동기</dt><dd class="whitespace-pre-wrap leading-relaxed text-navy/85 bg-mist/60 rounded-xl p-4">${esc(i.motivation)}</dd></div>
        <div><dt class="text-xs font-semibold text-navy/50 mb-1.5">활동 경력</dt><dd class="whitespace-pre-wrap leading-relaxed text-navy/85 bg-mist/60 rounded-xl p-4">${i.career ? esc(i.career) : '<span class="text-navy/40">미기재</span>'}</dd></div>
      </dl>

      <div class="border border-navy/10 rounded-2xl p-5">
        <div class="flex items-center justify-between">
          <p class="font-semibold text-sm flex items-center gap-2"><i data-lucide="calendar-clock" class="w-4 h-4 text-gold"></i>면접 일정</p>
          ${i.interview ? `<button id="clearInterview" class="text-xs text-navy/50 hover:text-[#A33A50]">일정 취소</button>` : ''}
        </div>
        ${i.interview ? `<p class="mt-3 text-base font-semibold">${esc(fmtDT(i.interview.at))}</p>${i.interview.place ? `<p class="text-sm text-navy/60 mt-0.5">${esc(i.interview.place)}</p>` : ''}` : ''}
        <form id="ivForm" class="mt-4 space-y-2.5">
          <input id="ivAt" type="datetime-local" class="input !py-2.5 text-sm" value="${esc(toLocalInput(i.interview?.at))}" required>
          <input id="ivPlace" class="input !py-2.5 text-sm" maxlength="120" placeholder="장소 또는 화상 링크" value="${esc(i.interview?.place || '')}">
          <input id="ivNote" class="input !py-2.5 text-sm" maxlength="300" placeholder="메모 (준비물 등)" value="${esc(i.interview?.note || '')}">
          <button class="btn-primary w-full py-2.5 text-sm font-semibold">${i.interview ? '일정 변경' : '일정 등록'}</button>
        </form>
      </div>

      <div>
        <p class="text-xs font-semibold text-navy/50 mb-2">관리자 메모</p>
        <textarea id="memo" class="input text-sm !min-h-[90px]" maxlength="2000" placeholder="내부 검토 메모 (지원자에게 보이지 않음)">${esc(i.memo || '')}</textarea>
        <button id="saveMemo" class="mt-2 text-sm px-4 py-2 rounded-full border border-navy/15 hover:bg-mist font-medium">메모 저장</button>
      </div>
      <p class="text-xs text-navy/40">최종 수정 ${new Date(i.updatedAt).toLocaleString('ko-KR')}</p>
    </div>`;

  el.querySelectorAll('[data-status]').forEach(b => b.addEventListener('click', () => update(i.id, { status: b.dataset.status }, `상태를 '${b.dataset.status}'(으)로 변경했습니다`)));
  $('#closeDetail').addEventListener('click', closeDetailMobile);
  $('#delBtn').addEventListener('click', () => askDelete(i));
  $('#copyContact').addEventListener('click', async () => { try { await navigator.clipboard.writeText(i.contact); toast('연락처를 복사했습니다'); } catch { toast('복사하지 못했습니다'); } });
  $('#saveMemo').addEventListener('click', () => update(i.id, { memo: $('#memo').value }, '메모를 저장했습니다'));
  $('#ivForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = $('#ivAt').value;
    if (!v) { toast('면접 일시를 선택해 주세요'); return; }
    update(i.id, { interview: { at: new Date(v).toISOString(), place: $('#ivPlace').value, note: $('#ivNote').value } }, '면접 일정을 저장했습니다');
  });
  const ci = $('#clearInterview');
  if (ci) ci.addEventListener('click', () => update(i.id, { interview: null }, '면접 일정을 취소했습니다'));
}

async function update(id, patch, msg) {
  try {
    const data = await api('/api/admin/applications/' + encodeURIComponent(id), { method: 'POST', body: JSON.stringify(patch) });
    const idx = items.findIndex(x => x.id === id);
    if (idx > -1) items[idx] = data.item;
    render();
    toast(msg);
  } catch (e) { if (e.message !== 'unauthorized') toast(e.message); }
}

// ---------- Delete ----------
let pendingDelete = null;
function askDelete(i) {
  pendingDelete = i;
  $('#confirmName').textContent = i.name;
  $('#confirm').classList.remove('hidden'); $('#confirm').classList.add('flex');
}
function closeConfirm() { $('#confirm').classList.add('hidden'); $('#confirm').classList.remove('flex'); pendingDelete = null; }
$('#confirmNo').addEventListener('click', closeConfirm);
$('#confirm').addEventListener('click', e => { if (e.target.id === 'confirm') closeConfirm(); });
$('#confirmYes').addEventListener('click', async () => {
  const i = pendingDelete; if (!i) return;
  closeConfirm();
  try {
    await api('/api/admin/applications/' + encodeURIComponent(i.id), { method: 'DELETE' });
    items = items.filter(x => x.id !== i.id);
    selectedId = null;
    closeDetailMobile();
    render();
    toast('지원서를 삭제했습니다');
  } catch (e) { if (e.message !== 'unauthorized') toast(e.message); }
});

// ---------- Schedule ----------
function renderSchedule() {
  const list = items.filter(i => i.interview && i.interview.at).sort((a, b) => new Date(a.interview.at) - new Date(b.interview.at));
  const now = Date.now();
  const upcoming = list.filter(i => new Date(i.interview.at).getTime() >= now - 3600e3);
  const past = list.filter(i => new Date(i.interview.at).getTime() < now - 3600e3).reverse();
  if (!list.length) {
    $('#schedule').innerHTML = `<div class="bg-white border border-navy/5 rounded-2xl py-20 text-center text-navy/50"><i data-lucide="calendar-x" class="w-8 h-8 mx-auto text-navy/25"></i><p class="mt-3 text-sm">등록된 면접 일정이 없습니다.<br>지원서 상세에서 일정을 등록하세요.</p></div>`;
    return;
  }
  const group = (arr) => {
    const g = {};
    arr.forEach(i => { const d = new Date(i.interview.at); const k = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${'일월화수목금토'[d.getDay()]})`; (g[k] = g[k] || []).push(i); });
    return Object.entries(g).map(([day, rows]) => `
      <div>
        <p class="text-xs font-semibold text-navy/50 mb-2 px-1">${esc(day)}</p>
        <div class="bg-white border border-navy/5 rounded-2xl divide-y divide-navy/5 overflow-hidden">
          ${rows.map(i => { const d = new Date(i.interview.at); return `
            <button data-goto="${esc(i.id)}" class="row-item w-full text-left px-5 py-4 flex items-center gap-4">
              <span class="font-display text-2xl w-16 shrink-0">${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}</span>
              <div class="min-w-0 flex-1">
                <p class="font-semibold truncate">${esc(i.name)} <span class="text-sm font-normal text-navy/50">· ${esc(i.field)}</span></p>
                <p class="text-sm text-navy/55 truncate">${esc(i.interview.place || '장소 미정')}${i.interview.note ? ' · ' + esc(i.interview.note) : ''}</p>
              </div>
              ${pill(i.status)}
            </button>`; }).join('')}
        </div>
      </div>`).join('');
  };
  $('#schedule').innerHTML = `
    <div><h3 class="font-semibold mb-3 flex items-center gap-2"><i data-lucide="calendar-days" class="w-4 h-4 text-gold"></i>예정된 면접 <span class="text-navy/40 font-normal">${upcoming.length}</span></h3>
      <div class="space-y-5">${upcoming.length ? group(upcoming) : '<p class="text-sm text-navy/50 px-1">예정된 면접이 없습니다.</p>'}</div></div>
    ${past.length ? `<div class="opacity-70"><h3 class="font-semibold mb-3 mt-4">지난 면접 <span class="text-navy/40 font-normal">${past.length}</span></h3><div class="space-y-5">${group(past)}</div></div>` : ''}`;
  document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => { switchTab('list'); select(b.dataset.goto); }));
}

// ---------- Tabs ----------
function switchTab(t) {
  tab = t;
  document.querySelectorAll('.tab').forEach(b => {
    const on = b.dataset.tab === t;
    b.classList.toggle('bg-navy', on); b.classList.toggle('text-white', on); b.classList.toggle('text-navy/60', !on);
  });
  $('#tab-list').classList.toggle('hidden', t !== 'list');
  $('#tab-schedule').classList.toggle('hidden', t !== 'schedule');
  icon();
}
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
switchTab('list');

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeConfirm(); closeDetailMobile(); } });

// ---------- Init ----------
icon();
if (token()) showApp(); else showLogin();
