// SKYVEIL 지원서 API — 모든 관리자 기능은 서버에서 토큰을 검사합니다.
const FIELDS = ['BJ·스트리머', '보컬', '댄서', '크리에이터', '편집자', '매니저'];
const STATUSES = ['접수', '검토중', '면접예정', '합격', '불합격'];
const CONTACT_TYPES = ['카카오톡', '디스코드', '이메일', '전화', '인스타그램'];
const SESSION_TTL = 1000 * 60 * 60 * 8; // 8시간

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json' }
});
const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

async function requireAdmin(request) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token || token.length < 30) return false;
  const s = await me.puter.kv.get('session:' + token);
  if (!s || !s.exp || s.exp < Date.now()) {
    if (s) await me.puter.kv.del('session:' + token);
    return false;
  }
  return true;
}

async function listApps() {
  const rows = await me.puter.kv.list('app:*', true);
  const out = [];
  for (const r of rows || []) {
    let v = r && r.value !== undefined ? r.value : null;
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = null; } }
    if (v && v.id) out.push(v);
  }
  out.sort((a, b) => b.createdAt - a.createdAt);
  return out;
}

// 지원서 제출 (공개)
router.post('/api/apply', async ({ request }) => {
  let body;
  try { body = await request.json(); } catch { return json({ error: '잘못된 요청입니다.' }, 400); }
  if (body.website) return json({ ok: true, id: 'ok' }); // 봇 차단용 허니팟
  const app = {
    name: clean(body.name, 40),
    field: clean(body.field, 20),
    motivation: clean(body.motivation, 2000),
    career: clean(body.career, 2000),
    contactType: clean(body.contactType, 20),
    contact: clean(body.contact, 120),
    portfolio: clean(body.portfolio, 400),
  };
  if (!app.name) return json({ error: '활동명을 입력해 주세요.' }, 400);
  if (!FIELDS.includes(app.field)) return json({ error: '지원 분야를 선택해 주세요.' }, 400);
  if (app.motivation.length < 10) return json({ error: '지원 동기를 10자 이상 입력해 주세요.' }, 400);
  if (!CONTACT_TYPES.includes(app.contactType) || !app.contact) return json({ error: '연락 수단을 입력해 주세요.' }, 400);
  if (app.portfolio && !/^https?:\/\/\S+$/i.test(app.portfolio)) return json({ error: '포트폴리오 링크는 http(s)://로 시작해야 합니다.' }, 400);

  const id = crypto.randomUUID();
  const now = Date.now();
  const code = 'SV-' + new Date(now).toISOString().slice(2, 10).replace(/-/g, '') + '-' + id.slice(0, 4).toUpperCase();
  const record = { id, code, ...app, status: '접수', interview: null, memo: '', createdAt: now, updatedAt: now };
  await me.puter.kv.set('app:' + id, record);
  return json({ ok: true, code });
});

// 관리자 로그인
router.post('/api/admin/login', async ({ request }) => {
  let body;
  try { body = await request.json(); } catch { return json({ error: '잘못된 요청입니다.' }, 400); }
  const expected = await me.puter.kv.get('secret:ADMIN_PASSWORD');
  if (!expected) return json({ error: '관리자 비밀번호가 아직 설정되지 않았습니다.' }, 500);
  await new Promise(r => setTimeout(r, 400)); // 무차별 대입 완화
  if (String(body.password || '') !== String(expected)) return json({ error: '비밀번호가 올바르지 않습니다.' }, 401);
  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  await me.puter.kv.set('session:' + token, { exp: Date.now() + SESSION_TTL });
  return json({ ok: true, token, expiresIn: SESSION_TTL });
});

router.post('/api/admin/logout', async ({ request }) => {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (token) await me.puter.kv.del('session:' + token);
  return json({ ok: true });
});

// 지원서 목록 (관리자 전용)
router.get('/api/admin/applications', async ({ request }) => {
  if (!(await requireAdmin(request))) return json({ error: '권한이 없습니다.' }, 401);
  return json({ ok: true, items: await listApps() });
});

// 상태·면접 일정·메모 변경 (관리자 전용)
router.post('/api/admin/applications/:id', async ({ request, params }) => {
  if (!(await requireAdmin(request))) return json({ error: '권한이 없습니다.' }, 401);
  const key = 'app:' + clean(params.id, 64);
  const rec = await me.puter.kv.get(key);
  if (!rec) return json({ error: '지원서를 찾을 수 없습니다.' }, 404);
  let body;
  try { body = await request.json(); } catch { return json({ error: '잘못된 요청입니다.' }, 400); }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return json({ error: '잘못된 상태 값입니다.' }, 400);
    rec.status = body.status;
  }
  if (body.interview !== undefined) {
    if (body.interview === null) rec.interview = null;
    else {
      const at = clean(body.interview.at, 30);
      if (!at || isNaN(Date.parse(at))) return json({ error: '면접 일시를 확인해 주세요.' }, 400);
      rec.interview = { at, place: clean(body.interview.place, 120), note: clean(body.interview.note, 300) };
      if (rec.status === '접수' || rec.status === '검토중') rec.status = '면접예정';
    }
  }
  if (body.memo !== undefined) rec.memo = clean(body.memo, 2000);
  rec.updatedAt = Date.now();
  await me.puter.kv.set(key, rec);
  return json({ ok: true, item: rec });
});

// 지원서 삭제 (관리자 전용)
router.delete('/api/admin/applications/:id', async ({ request, params }) => {
  if (!(await requireAdmin(request))) return json({ error: '권한이 없습니다.' }, 401);
  await me.puter.kv.del('app:' + clean(params.id, 64));
  return json({ ok: true });
});

router.get('/api/health', async () => json({ ok: true }));
