/**
 * TataDana Comprehensive Authentication & Authorization Security Test Suite
 * Validates all 12 mandatory scenarios end-to-end against http://localhost:3000
 */

const BASE_URL = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] Scenario ${totalTests}: ${testName}`);
  } else {
    console.error(`  [FAIL] Scenario ${totalTests}: ${testName}`);
    if (details) console.error(`         Details: ${details}`);
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log(' TATADANA AUTHENTICATION & AUTHORIZATION SECURITY TEST SUITE');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------------------
    // Scenario 1: User baru mendaftar -> status pending -> tidak dapat membuka dashboard / transactions
    // -------------------------------------------------------------------------
    const uniqueEmail = `user.test.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Budi Test Pending',
        email: uniqueEmail,
        phoneNumber: '081299887766',
        password: 'password123',
      }),
    });
    const regData = await regRes.json();
    const pendingUserId = regData.user?.id;
    const pendingCookie = `tatadana_user_id=${pendingUserId}`;

    assert(
      regRes.status === 200 && regData.status === 'pending' && regData.redirect === '/pending-approval',
      'User baru mendaftar -> status pending & diarahkan ke /pending-approval',
      JSON.stringify(regData)
    );

    const pendingTxRes = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: pendingCookie },
    });
    const pendingTxData = await pendingTxRes.json();
    assert(
      pendingTxRes.status === 403 && pendingTxData.status === 'pending',
      'User status pending diblokir (403) saat mengakses /api/transactions',
      `Status: ${pendingTxRes.status}`
    );

    const pendingWalletRes = await fetch(`${BASE_URL}/api/wallets`, {
      headers: { Cookie: pendingCookie },
    });
    assert(
      pendingWalletRes.status === 403,
      'User status pending diblokir (403) saat mengakses /api/wallets',
      `Status: ${pendingWalletRes.status}`
    );

    // -------------------------------------------------------------------------
    // Scenario 2: User pending mencoba mengakses URL admin -> ditolak
    // -------------------------------------------------------------------------
    const pendingAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: pendingCookie },
    });
    assert(
      pendingAdminRes.status === 403,
      'User pending mengakses endpoint admin (/api/admin/users) ditolak 403 Forbidden',
      `Status: ${pendingAdminRes.status}`
    );

    // -------------------------------------------------------------------------
    // Scenario 3: Admin login -> dapat membuka dashboard admin
    // -------------------------------------------------------------------------
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'email',
        email: 'admin@tatadana.id',
        password: 'admin123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminCookie = `tatadana_user_id=${adminLoginData.user?.id}`;

    assert(
      adminLoginRes.status === 200 &&
      (adminLoginData.role === 'admin' || adminLoginData.role === 'superadmin') &&
      adminLoginData.redirect === '/admin',
      'Admin login berhasil -> role admin/superadmin & diarahkan ke /admin',
      JSON.stringify(adminLoginData)
    );

    const adminUsersRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: adminCookie },
    });
    const adminUsersData = await adminUsersRes.json();
    assert(
      adminUsersRes.status === 200 && adminUsersData.ok === true && Array.isArray(adminUsersData.users),
      'Admin terautentikasi dapat membuka data admin (/api/admin/users)',
      `Total users: ${adminUsersData.total}`
    );

    // -------------------------------------------------------------------------
    // Scenario 4: User biasa login -> tidak dapat membuka dashboard admin
    // -------------------------------------------------------------------------
    const userLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'email',
        email: 'user@tatadana.id',
        password: 'user123',
      }),
    });
    const userLoginData = await userLoginRes.json();
    const userCookie = `tatadana_user_id=${userLoginData.user?.id}`;

    assert(
      userLoginRes.status === 200 && userLoginData.role === 'user' && userLoginData.redirect === '/dashboard',
      'Approved user login berhasil -> role user & diarahkan ke /dashboard',
      JSON.stringify(userLoginData)
    );

    const userTryAdminRes = await fetch(`${BASE_URL}/api/admin/users`, {
      headers: { Cookie: userCookie },
    });
    assert(
      userTryAdminRes.status === 403,
      'User biasa membuka endpoint admin ditolak 403 Forbidden',
      `Status: ${userTryAdminRes.status}`
    );

    // -------------------------------------------------------------------------
    // Scenario 5: Admin menyetujui user -> user dapat login dan masuk dashboard
    // -------------------------------------------------------------------------
    const approveRes = await fetch(`${BASE_URL}/api/admin/approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        targetUserId: pendingUserId,
        action: 'approve',
      }),
    });
    const approveData = await approveRes.json();

    assert(
      approveRes.status === 200 && approveData.user?.approval_status === 'approved',
      'Admin berhasil menyetujui user pending (status -> approved)',
      JSON.stringify(approveData)
    );

    // User yang disetujui sekarang mengakses transaksi
    const approvedTxRes = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: pendingCookie },
    });
    const approvedTxData = await approvedTxRes.json();
    assert(
      approvedTxRes.status === 200 && approvedTxData.ok === true,
      'User yang telah disetujui admin kini berhasil membuka /api/transactions (200 OK)',
      `OK: ${approvedTxData.ok}`
    );

    // -------------------------------------------------------------------------
    // Scenario 6: Admin menolak user -> user tidak dapat mengakses dashboard
    // -------------------------------------------------------------------------
    const rejectedEmail = `user.rejected.${Date.now()}@example.com`;
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Calon User Ditolak',
        email: rejectedEmail,
        password: 'password123',
      }),
    });
    const reg2Data = await reg2Res.json();
    const rejectedUserId = reg2Data.user.id;

    const rejectRes = await fetch(`${BASE_URL}/api/admin/approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        targetUserId: rejectedUserId,
        action: 'reject',
        reason: 'Identitas tidak valid',
      }),
    });
    const rejectData = await rejectRes.json();

    assert(
      rejectRes.status === 200 && rejectData.user?.approval_status === 'rejected',
      'Admin berhasil menolak user (status -> rejected)',
      JSON.stringify(rejectData)
    );

    // User ditolak mencoba login
    const rejectLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'email',
        email: rejectedEmail,
        password: 'password123',
      }),
    });
    const rejectLoginData = await rejectLoginRes.json();

    assert(
      rejectLoginRes.status === 403 && rejectLoginData.redirect === '/access-rejected',
      'User ditolak tidak dapat login dan diarahkan ke /access-rejected',
      JSON.stringify(rejectLoginData)
    );

    // -------------------------------------------------------------------------
    // Scenario 7: Admin menangguhkan user yang aktif -> akses langsung dicabut
    // -------------------------------------------------------------------------
    const suspendRes = await fetch(`${BASE_URL}/api/admin/approval`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        targetUserId: pendingUserId, // user yang tadi disetujui
        action: 'suspend',
      }),
    });
    const suspendData = await suspendRes.json();

    assert(
      suspendRes.status === 200 && suspendData.user?.approval_status === 'suspended',
      'Admin berhasil menangguhkan user aktif (status -> suspended)',
      JSON.stringify(suspendData)
    );

    // Akses user yang ditangguhkan langsung dicabut pada request berikutnya
    const suspendedReqRes = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: pendingCookie },
    });
    assert(
      suspendedReqRes.status === 403,
      'Akses user ditangguhkan langsung dicabut pada request transaksi (403 Forbidden)',
      `Status: ${suspendedReqRes.status}`
    );

    // -------------------------------------------------------------------------
    // Scenario 8: User mencoba mengubah role menjadi admin lewat API -> ditolak
    // -------------------------------------------------------------------------
    const escalateRes = await fetch(`${BASE_URL}/api/profiles`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
      },
      body: JSON.stringify({
        role: 'admin',
        approval_status: 'approved',
      }),
    });
    const escalateData = await escalateRes.json();

    assert(
      escalateRes.status === 403 && escalateData.error?.includes('Akses Ditolak'),
      'User biasa mencoba eskalasi role ke admin ditolak 403 oleh server & trigger',
      JSON.stringify(escalateData)
    );

    // -------------------------------------------------------------------------
    // Scenario 9: User mencoba membaca data transaksi pengguna lain -> ditolak RLS
    // -------------------------------------------------------------------------
    const rlsTestRes = await fetch(`${BASE_URL}/api/transactions?userId=usr_tatadana_demo_01`, {
      headers: { Cookie: userCookie },
    });
    const rlsTestData = await rlsTestRes.json();

    assert(
      rlsTestRes.status === 403 && rlsTestData.error?.includes('RLS Enforced'),
      'User membaca transaksi user lain dicegat oleh Row Level Security (403)',
      JSON.stringify(rlsTestData)
    );

    // -------------------------------------------------------------------------
    // Scenario 10: Membuka URL internal secara langsung tanpa sesi -> diarahkan ke login
    // -------------------------------------------------------------------------
    const noSessionTxRes = await fetch(`${BASE_URL}/api/transactions`);
    assert(
      noSessionTxRes.status === 401,
      'Request API tanpa cookie/sesi ditolak 401 Unauthorized',
      `Status: ${noSessionTxRes.status}`
    );

    const noSessionDashRes = await fetch(`${BASE_URL}/dashboard`, {
      redirect: 'manual',
    });
    const location = noSessionDashRes.headers.get('location') || '';
    assert(
      noSessionDashRes.status === 307 || noSessionDashRes.status === 302 || location.includes('/login'),
      'Membuka /dashboard langsung tanpa sesi diarahkan ke /login oleh middleware',
      `Status: ${noSessionDashRes.status}, Location: ${location}`
    );

    // -------------------------------------------------------------------------
    // Scenario 11: Admin akses di luar kewenangan (impersonasi admin lain) -> ditolak
    // -------------------------------------------------------------------------
    const illegalImpersonateRes = await fetch(`${BASE_URL}/api/admin/impersonate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        targetUserId: 'usr_tatadana_demo_01', // impersonating superadmin
      }),
    });
    assert(
      illegalImpersonateRes.status === 403,
      'Admin mencoba impersonasi sesama administrator ditolak 403 Forbidden',
      `Status: ${illegalImpersonateRes.status}`
    );

    // Non-admin impersonate attempt
    const nonAdminImpersonate = await fetch(`${BASE_URL}/api/admin/impersonate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: userCookie,
      },
      body: JSON.stringify({ targetUserId: pendingUserId }),
    });
    assert(
      nonAdminImpersonate.status === 403,
      'User non-admin memanggil endpoint impersonate ditolak 403 Forbidden',
      `Status: ${nonAdminImpersonate.status}`
    );

    // -------------------------------------------------------------------------
    // Scenario 12: Logout dan login kembali mempertahankan status serta role yang benar
    // -------------------------------------------------------------------------
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: adminCookie },
    });
    assert(
      logoutRes.status === 200,
      'Logout berhasil dan menghapus cookie sesi',
      `Status: ${logoutRes.status}`
    );

    const reLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        method: 'email',
        email: 'admin@tatadana.id',
        password: 'admin123',
      }),
    });
    const reLoginData = await reLoginRes.json();
    assert(
      reLoginRes.status === 200 && reLoginData.role === 'superadmin' && reLoginData.status === 'approved',
      'Login kembali mempertahankan status approved dan role superadmin secara utuh',
      JSON.stringify(reLoginData)
    );

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('\n===============================================================');
  console.log(` HASIL PENGUJIAN KEAMANAN: ${passedTests}/${totalTests} SKENARIO LOLOS`);
  console.log('===============================================================\n');

  if (passedTests === totalTests) {
    console.log(' [SUCCESS] Seluruh 12 skenario pengujian autentikasi & otorisasi BERHASIL 100%!\n');
    process.exit(0);
  } else {
    console.error(` [FAIL] Ada ${totalTests - passedTests} pengujian yang gagal.\n`);
    process.exit(1);
  }
}

runTests();
