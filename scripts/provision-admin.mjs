#!/usr/bin/env node
/**
 * TataDana Secure Admin Provisioning Utility
 * CLI tool for system owner to safely bootstrap or promote admin accounts.
 *
 * Usage:
 *   node scripts/provision-admin.mjs <fullName> <email> <password> [phoneNumber]
 *
 * Example:
 *   node scripts/provision-admin.mjs "System Admin" "admin@tatadana.id" "admin123" "081234567890"
 */

import { db } from '../src/lib/data/storage.js';

const [,, fullName, email, password, phoneNumber] = process.argv;

if (!fullName || !email || !password) {
  console.log(`
======================================================
 TataDana Secure Admin Provisioning CLI
======================================================
Usage:
  node scripts/provision-admin.mjs <fullName> <email> <password> [phoneNumber]

Example:
  node scripts/provision-admin.mjs "Super Admin" "admin@tatadana.id" "admin123" "081234567890"
`);
  process.exit(1);
}

console.log(`[*] Memproses provisioning admin untuk email: ${email}...`);

// Check if user already exists
const existing = db.getProfileByEmail(email);

if (existing) {
  existing.role = 'superadmin';
  existing.approval_status = 'approved';
  existing.approved_by = 'system_cli_provision';
  existing.approved_at = new Date().toISOString();
  existing.password_hash = password;
  if (phoneNumber) existing.phone_number = phoneNumber;
  console.log(`[+] Akun ${email} berhasil dipromosikan menjadi SUPERADMIN.`);
  console.log(`    ID: ${existing.id}`);
  console.log(`    Status: ${existing.approval_status}`);
  console.log(`    Role: ${existing.role}`);
} else {
  const newAdmin = db.provisionAdmin({
    fullName,
    email,
    password,
    phoneNumber: phoneNumber || '081234567890',
  });
  console.log(`[+] Akun SUPERADMIN baru berhasil dibuat melalui provisioning aman.`);
  console.log(`    ID: ${newAdmin.id}`);
  console.log(`    Nama: ${newAdmin.full_name}`);
  console.log(`    Email: ${newAdmin.email}`);
  console.log(`    Status: ${newAdmin.approval_status}`);
  console.log(`    Role: ${newAdmin.role}`);
}

console.log(`[✓] Provisioning selesai. Akun siap digunakan untuk login ke /admin.`);
