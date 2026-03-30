import { ODOO_CONFIG } from '../config/odoo';

let reqId     = 1;
let sessionId = null;

// ── JSON-RPC POST ──
async function post(path, body) {
  const headers = { 'Content-Type': 'application/json' };

  let res;
  try {
    res = await fetch(`${ODOO_CONFIG.baseUrl}${path}`, {
      method:      'POST',
      headers,
      credentials: 'include',   // يرسل الكوكي الذي كتبه الـ proxy
      body:        JSON.stringify(body),
    });
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('فشل الاتصال بالخادم. الرجاء التأكد من أن رابط Odoo صحيح (استخدم /odoo محلياً) وأن السيرفر يعمل. (' + err.message + ')');
    }
    throw err;
  }

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error?.data?.message || json.error?.message || 'خطأ من أودو');
  }
  return json.result;
}

// ── JSON-RPC على model ──
async function rpc(model, method, args = [], kwargs = {}) {
  return post('/web/dataset/call_kw', {
    jsonrpc: '2.0', method: 'call', id: reqId++,
    params:  { model, method, args, kwargs: { context: {}, ...kwargs } },
  });
}

// ── إنشاء جلسة (مرة واحدة) ──
async function ensureSession() {
  if (sessionId) return;

  const result = await post('/web/session/authenticate', {
    jsonrpc: '2.0', method: 'call', id: reqId++,
    params: {
      db:       ODOO_CONFIG.db,
      login:    ODOO_CONFIG.serviceEmail,
      password: ODOO_CONFIG.apiKey,
    },
  });

  if (!result?.uid) {
    throw new Error('فشل المصادقة مع أودو');
  }

  sessionId = result.session_id;
  console.log('✅ Session OK | uid:', result.uid, '| user:', result.name);
  return result; // return result to allow extracting name/db if needed
}

// ── فحص الاتصال من لوحة الإدارة ──
export async function testAdminConnection() {
  clearSession();
  const res = await ensureSession();
  
  // Try to fetch company name if possible (optional)
  try {
    const companies = await rpc('res.company', 'search_read', [], { fields: ['name'], limit: 1 });
    if (companies?.length) {
      return { msg: 'تم الاتصال بنجاح!', company: companies[0].name };
    }
  } catch(e) { /* ignore RPC error if no permission */ }
  
  return { msg: 'تم الاتصال بنجاح!', company: res.db || 'قاعدة البيانات المحددة' };
}

// ──────────────────────────────────────────
// تسجيل دخول الموظف
// ──────────────────────────────────────────
export async function loginEmployee(employeeCode, pin) {
  await ensureSession();

  const employees = await rpc('hr.employee', 'search_read',
    [[['barcode', '=', employeeCode]]],
    { fields: [
        'id', 'name', 'job_title', 'department_id', 'work_email', 'pin',
        'image_128', 'parent_id', 'coach_id', 'work_phone', 'mobile_phone',
        'identification_id', 'passport_id', 'permit_no', 'visa_no',
        'visa_expire', 'work_permit_expiration_date',
        'gender', 'birthday', 'marital', 'children', 'ssnid',
        'study_field', 'study_school', 'study_field',
        'emergency_contact', 'emergency_phone',
        'resource_calendar_id', 'tz', 'work_location_id', 'company_id',
        'km_home_work', 'barcode',
      ], limit: 1 }
  );

  if (!employees?.length) throw new Error('رقم الموظف غير موجود في النظام');
  const emp = employees[0];
  if (emp.pin && emp.pin !== pin) throw new Error('رمز PIN غير صحيح');
  return emp;
}

// ──────────────────────────────────────────
// أنواع الإجازات
// ──────────────────────────────────────────
export async function getLeaveTypes() {
  await ensureSession();
  return rpc('hr.leave.type', 'search_read',
    [[['requires_allocation', '=', 'no']]],
    { fields: ['id', 'name'], limit: 30 }
  );
}

// ──────────────────────────────────────────
// رفع طلب إجازة
// ──────────────────────────────────────────
export async function submitLeaveRequest({ employeeId, leaveTypeId, dateFrom, dateTo, reason }) {
  await ensureSession();
  return rpc('hr.leave', 'create',
    [{ employee_id: employeeId, holiday_status_id: leaveTypeId,
       date_from: `${dateFrom} 08:00:00`, date_to: `${dateTo} 17:00:00`,
       name: reason || 'إجازة سنوية' }], {}
  );
}

// ──────────────────────────────────────────
// رفع طلب غياب / تأخر
// ──────────────────────────────────────────
export async function submitAbsenceRequest({ employeeId, date, type, reason }) {
  await ensureSession();

  // نبحث فقط عن أنواع إجازات لا تحتاج مخصصات مسبقة
  let types = await rpc('hr.leave.type', 'search_read',
    [[['requires_allocation', '=', 'no']]],
    { fields: ['id', 'name'], limit: 10 }
  );

  // إذا ما لقينا، نأخذ أي نوع متاح بدون allocation
  if (!types?.length) {
    throw new Error('لا توجد أنواع إجازات متاحة. يرجى التواصل مع HR لإضافة نوع إجازة لا يحتاج مخصصات.');
  }

  return rpc('hr.leave', 'create',
    [{ employee_id: employeeId, holiday_status_id: types[0].id,
       date_from: `${date} 08:00:00`, date_to: `${date} 17:00:00`,
       name: `${type}: ${reason}` }], {}
  );
}

// ──────────────────────────────────────────
// رفع طلب مأمورية / سفر
// ──────────────────────────────────────────
export async function submitTravelRequest({ employeeId, employeeName, destination, dateFrom, dateTo, purpose }) {
  await ensureSession();
  return rpc('mail.message', 'create',
    [{
      model:        'hr.employee',
      res_id:       employeeId,
      message_type: 'comment',
      subtype_id:   1,
      body: `<b>📋 طلب سفر / مأمورية</b><br/><b>الموظف:</b> ${employeeName}<br/>الوجهة: ${destination}<br/>من: ${dateFrom} → حتى: ${dateTo}<br/>الغرض: ${purpose}`,
    }], {}
  );
}

// ──────────────────────────────────────────
// رسالة للإدارة
// ──────────────────────────────────────────
export async function submitMessageToManagement({ employeeId, employeeName, subject, body }) {
  await ensureSession();
  return rpc('mail.message', 'create',
    [{
      model:        'hr.employee',
      res_id:       employeeId,
      message_type: 'comment',
      subtype_id:   1,
      body: `<b>💬 ${subject}</b><br/><b>الموظف:</b> ${employeeName}<br/>${body}`,
    }], {}
  );
}

// ──────────────────────────────────────────
// جلب إجازات الموظف
// ──────────────────────────────────────────
export async function getEmployeeLeaves(employeeId) {
  await ensureSession();
  return rpc('hr.leave', 'search_read',
    [[['employee_id', '=', employeeId]]],
    { fields: ['id', 'name', 'date_from', 'date_to', 'state', 'holiday_status_id'], limit: 10, order: 'id desc' }
  );
}

// ──────────────────────────────────────────
// جلب مهام الموظف
// ──────────────────────────────────────────
export async function getEmployeeTasks(employeeId) {
  await ensureSession();
  try {
    return await rpc('project.task', 'search_read',
      [[['user_ids.employee_id', '=', employeeId], ['stage_id.fold', '=', false]]],
      { fields: ['id', 'name', 'date_deadline', 'stage_id', 'priority'], limit: 20 }
    );
  } catch { return []; }
}

// ── Logout ──
export function clearSession() {
  sessionId = null;
}
