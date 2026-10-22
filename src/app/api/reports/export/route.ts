import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/storage';
import { getServerSession } from '@/lib/auth/server';
import { generateExcelReport, generatePdfReport } from '@/lib/utils/export';

export async function POST(req: NextRequest) {
  try {
    const session = getServerSession(req);

    if (!session.isAuthenticated || !session.effectiveUser) {
      return NextResponse.json({ error: 'Sesi tidak valid atau belum login' }, { status: 401 });
    }

    if (!session.isApproved) {
      return NextResponse.json({ error: 'Akun Anda belum disetujui untuk mengekspor laporan.' }, { status: 403 });
    }

    const { format, startDate, endDate } = await req.json();
    const profile = session.effectiveUser;

    // Check Plan: Starter cannot export reports
    if (profile.plan === 'starter') {
      return NextResponse.json(
        { error: 'Fitur export laporan PDF/Excel hanya tersedia untuk pengguna paket Pro.' },
        { status: 403 }
      );
    }

    const allTrxs = db.getTransactions(profile.id);
    const wallets = db.getWallets(profile.id);
    const categories = db.getCategories(profile.id);

    // Filter by date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const filtered = allTrxs.filter((t) => {
      const d = new Date(t.date);
      return d >= start && d <= end;
    });

    const fileName = `TataDana_Laporan_${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    let buffer: Uint8Array;
    let contentType = '';

    if (format === 'pdf') {
      buffer = generatePdfReport({
        transactions: filtered,
        wallets,
        categories,
        startDate: start.toLocaleDateString('id-ID'),
        endDate: end.toLocaleDateString('id-ID'),
        userName: profile.full_name,
      });
      contentType = 'application/pdf';
    } else {
      buffer = generateExcelReport({
        transactions: filtered,
        wallets,
        categories,
        startDate: start.toLocaleDateString('id-ID'),
        endDate: end.toLocaleDateString('id-ID'),
        userName: profile.full_name,
      });
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    }

    // Record into export history
    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach((t) => {
      if (t.type === 'income') totalIncome += t.amount;
      if (t.type === 'expense') totalExpense += t.amount;
    });

    db.addExportReport({
      user_id: profile.id,
      format,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
      file_name: fileName,
      file_url: `/api/reports/download/${fileName}`,
      total_income: totalIncome,
      total_expense: totalExpense,
      status: 'completed',
    });

    return new NextResponse(Buffer.from(buffer) as any, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
