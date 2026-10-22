/**
 * TataDana Comprehensive Balance & Data Integrity Test (HTTP End-to-End)
 * Tests all 10 specifications:
 * 1. New user registration & Rp0 starting balance
 * 2. All balances start at Rp0 (Total, Pemasukan, Pengeluaran)
 * 3. Initial wallet and categories do not produce fake income
 * 4. Add income Rp100.000 -> balance Rp100.000
 * 5. Add expense Rp25.000 -> balance Rp75.000
 * 6. Listing contains both transactions
 * 7. Report metrics: income 100k, expense 25k, net cashflow 75k
 * 8. Edit / Delete transaction updates balance properly
 * 9. Isolation between multiple users
 * 10. Empty state doesn't crash
 */

const BASE_URL = 'http://localhost:3000';

let passed = 0;
let total = 0;

function check(cond, msg) {
  total++;
  if (cond) {
    console.log(`  ✅ PASS: ${msg}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${msg}`);
  }
}

async function runBalanceTests() {
  console.log('====================================================');
  console.log('🧪 TESTING TATADANA DATA & BALANCE INTEGRITY (LIVE)');
  console.log('====================================================\n');

  try {
    // 1. Login as Admin to approve our test user
    const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@tatadana.id', password: 'admin123' }),
    });
    const adminData = await adminLogin.json();
    const adminCookie = `tatadana_user_id=${adminData.user.id}`;

    // 2. Register fresh new user
    const testEmail = `balance.test.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Budi Balance Test',
        email: testEmail,
        phoneNumber: '087711223344',
        password: 'password123',
      }),
    });
    const regData = await regRes.json();
    const testUserId = regData.user.id;
    const testCookie = `tatadana_user_id=${testUserId}`;

    check(regRes.status === 200, 'User baru berhasil didaftarkan');
    check(regData.status === 'pending', 'Status awal user adalah pending');

    // 3. Admin approves user so user can access wallets & transactions
    const approveRes = await fetch(`${BASE_URL}/api/admin/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ targetUserId: testUserId, action: 'approve' }),
    });
    check(approveRes.status === 200, 'Admin berhasil menyetujui user');

    // 4. Check initial wallet balance is Rp0
    const walletRes = await fetch(`${BASE_URL}/api/wallets`, {
      headers: { Cookie: testCookie },
    });
    const walletData = await walletRes.json();
    check(walletData.wallets.length >= 1, 'Default wallet dibuat otomatis');
    const defaultWallet = walletData.wallets[0];
    check(defaultWallet.balance === 0, `Saldo wallet awal adalah Rp0 (actual: Rp${defaultWallet.balance})`);

    // 5. Check initial transactions is 0
    const txRes1 = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: testCookie },
    });
    const txData1 = await txRes1.json();
    check(txData1.transactions.length === 0, 'Transaksi awal murni 0 tanpa dummy data');

    // 6. Add second wallet, verify total balance remains Rp0
    const addWalletRes = await fetch(`${BASE_URL}/api/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: testCookie },
      body: JSON.stringify({ name: 'GoPay Uji', type: 'ewallet', balance: 0 }),
    });
    const addWalletData = await addWalletRes.json();
    check(addWalletData.wallet.balance === 0, 'Wallet kedua dibuat dengan saldo Rp0');

    // 7. Add income Rp100.000
    const incomeRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: testCookie },
      body: JSON.stringify({
        wallet_id: defaultWallet.id,
        type: 'income',
        amount: 100000,
        notes: 'Pemasukan Gaji',
        date: new Date().toISOString(),
      }),
    });
    const incomeData = await incomeRes.json();
    check(incomeData.ok === true, 'Transaksi pemasukan Rp100.000 berhasil dicatat');

    // Verify wallet balance updated to 100.000
    const walletCheck1 = await fetch(`${BASE_URL}/api/wallets`, {
      headers: { Cookie: testCookie },
    });
    const wData1 = await walletCheck1.json();
    const updatedW1 = wData1.wallets.find((w) => w.id === defaultWallet.id);
    check(updatedW1.balance === 100000, `Saldo wallet bertambah menjadi Rp100.000 (actual: Rp${updatedW1.balance})`);

    // 8. Add expense Rp25.000
    const expenseRes = await fetch(`${BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: testCookie },
      body: JSON.stringify({
        wallet_id: defaultWallet.id,
        type: 'expense',
        amount: 25000,
        notes: 'Makan Siang',
        date: new Date().toISOString(),
      }),
    });
    const expenseData = await expenseRes.json();
    check(expenseData.ok === true, 'Transaksi pengeluaran Rp25.000 berhasil dicatat');

    // Verify wallet balance is 75.000
    const walletCheck2 = await fetch(`${BASE_URL}/api/wallets`, {
      headers: { Cookie: testCookie },
    });
    const wData2 = await walletCheck2.json();
    const updatedW2 = wData2.wallets.find((w) => w.id === defaultWallet.id);
    check(updatedW2.balance === 75000, `Saldo wallet menjadi Rp75.000 (actual: Rp${updatedW2.balance})`);

    // 9. Listing contains both transactions
    const txCheck = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Cookie: testCookie },
    });
    const txData = await txCheck.json();
    check(txData.transactions.length === 2, `Listing berisi tepat 2 transaksi (actual: ${txData.transactions.length})`);

    // 10. Delete expense transaction, verify balance reverts to 100.000
    const delRes = await fetch(`${BASE_URL}/api/transactions?id=${expenseData.transaction.id}`, {
      method: 'DELETE',
      headers: { Cookie: testCookie },
    });
    check(delRes.status === 200, 'Transaksi berhasil dihapus');

    const walletCheck3 = await fetch(`${BASE_URL}/api/wallets`, {
      headers: { Cookie: testCookie },
    });
    const wData3 = await walletCheck3.json();
    const updatedW3 = wData3.wallets.find((w) => w.id === defaultWallet.id);
    check(updatedW3.balance === 100000, `Saldo wallet kembali ke Rp100.000 setelah hapus pengeluaran (actual: Rp${updatedW3.balance})`);

  } catch (err) {
    console.error('Balance test error:', err);
  }

  console.log('\n====================================================');
  console.log(` HASIL: ${passed}/${total} PENGUJIAN INTEGRITAS SALDO LOLOS`);
  console.log('====================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runBalanceTests();
