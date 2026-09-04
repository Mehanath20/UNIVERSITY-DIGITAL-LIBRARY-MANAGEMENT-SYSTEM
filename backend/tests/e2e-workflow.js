import assert from 'node:assert';
import { connectDB, disconnectDB } from '../config/db.js';
import { AuthService } from '../services/authService.js';
import { BookService } from '../services/bookService.js';
import { TransactionService } from '../services/transactionService.js';
import { FineService } from '../services/fineService.js';
import { ReportService } from '../services/reportService.js';
import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import InventoryLog from '../models/InventoryLog.js';
import { seedMembershipPlans } from '../seed/seedMembershipPlans.js';

const runE2EWorkflow = async () => {
  console.log('================================================================');
  console.log('  EXECUTING 18-STEP COMPLETE END-TO-END DEMONSTRATION SCENARIO  ');
  console.log('================================================================\n');

  await connectDB();
  await seedMembershipPlans();

  // Create a clean book and librarian
  const libPass = await AuthService.createLibrarian({
    name: 'Chief Circulation Officer',
    email: 'circulation.officer@library.edu',
    password: 'Password123!'
  });
  const librarianUser = await AuthService.getMe(libPass._id);

  const demoBook = await BookService.createBook({
    title: 'Distributed Systems: Principles and Paradigms',
    author: 'Andrew S. Tanenbaum, Maarten van Steen',
    isbn: `978-0132392273-${Date.now()}`,
    category: 'Computer Science',
    description: 'Foundational distributed systems architectures, RPC, consensus, and fault tolerance.',
    publisher: 'Pearson',
    publicationYear: 2023,
    totalCopies: 2
  }, librarianUser._id);

  console.log(`[Setup] Created demo catalog book: "${demoBook.title}" (Available: ${demoBook.availableCopies})`);

  // Step 1: Register member
  console.log('\n[Step 1] Registering student member...');
  const memberReg = await AuthService.register({
    name: 'Samantha Vance',
    email: `samantha.vance.${Date.now()}@library.edu`,
    password: 'Password123!',
    memberType: 'STUDENT',
    phone: '+1 (555) 888-2025'
  });
  assert(memberReg.user.memberId, 'Member ID should be generated');
  console.log(`✓ Member registered successfully. Name: ${memberReg.user.name}, ID: ${memberReg.user.memberId}`);

  // Step 2 & 3: Login member & Receive JWT
  console.log('\n[Step 2 & 3] Logging in member and verifying JWT token...');
  const loginRes = await AuthService.login({
    email: memberReg.user.email,
    password: 'Password123!'
  });
  assert(loginRes.token, 'JWT token required');
  console.log(`✓ JWT Authentication validated. Token length: ${loginRes.token.length} chars.`);

  // Step 4: Search books
  console.log('\n[Step 4] Searching book catalog by keyword "Distributed"...');
  const searchRes = await BookService.searchBooks({ title: 'Distributed', page: 1, limit: 5 });
  assert(searchRes.data.length >= 1, 'Book should be discovered in search');
  console.log(`✓ Discovered ${searchRes.data.length} match: "${searchRes.data[0].title}"`);

  // Step 5: View availability
  console.log('\n[Step 5] Checking book copy availability...');
  const bookCheck = await BookService.getBookById(demoBook._id);
  assert.strictEqual(bookCheck.availableCopies, 2);
  console.log(`✓ Book is AVAILABLE with ${bookCheck.availableCopies} copy/copies in library stock.`);

  // Step 6: Librarian logs in
  console.log('\n[Step 6] Authenticating Librarian user...');
  const libLogin = await AuthService.login({
    email: 'circulation.officer@library.edu',
    password: 'Password123!'
  });
  assert(libLogin.token, 'Librarian token granted');
  console.log(`✓ Librarian authenticated: ${libLogin.user.name} (${libLogin.user.role})`);

  // Step 7, 8 & 9: Issue book, decrease availableCopies, create Transaction
  console.log('\n[Step 7, 8 & 9] Librarian issues book to member...');
  const issueRes = await TransactionService.issueBook({
    bookId: demoBook._id.toString(),
    memberId: memberReg.user._id.toString(),
    notes: 'Semester checkout'
  }, librarianUser);

  const bookAfterIssue = await Book.findById(demoBook._id);
  assert.strictEqual(bookAfterIssue.availableCopies, 1, 'availableCopies should decrement from 2 to 1');
  assert(issueRes.transactionId, 'Transaction record generated');
  console.log(`✓ Transaction created: ID ${issueRes.transactionId}`);
  console.log(`✓ Book available copies updated: ${bookAfterIssue.availableCopies} remaining in stock.`);

  // Step 10: Simulate overdue date
  console.log('\n[Step 10] Simulating overdue scenario (due date set 5 days in past)...');
  const txRecord = await Transaction.findById(issueRes.transactionId);
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  txRecord.dueDate = fiveDaysAgo;
  await txRecord.save();
  console.log(`✓ Due date backdated to: ${fiveDaysAgo.toLocaleDateString()}`);

  // Step 11 & 12: Return book & Calculate fine
  console.log('\n[Step 11 & 12] Processing return and calculating overdue fine...');
  const returnRes = await TransactionService.returnBook(txRecord._id, {
    returnDate: new Date(),
    notes: 'Returned at central desk'
  }, librarianUser);

  assert.strictEqual(returnRes.transaction.status, 'RETURNED');
  assert.strictEqual(returnRes.overdueDays, 5);
  assert.strictEqual(returnRes.fine, 25); // $5/day * 5 days = $25
  assert.strictEqual(returnRes.fineStatus, 'UNPAID');
  console.log(`✓ Book returned. Overdue: ${returnRes.overdueDays} days. Calculated Fine: $${returnRes.fine.toFixed(2)} (Status: ${returnRes.fineStatus})`);

  // Step 13: Fine appears in member account
  console.log('\n[Step 13] Verifying fine appears in student member account...');
  const memberFines = await FineService.getMyFines(memberReg.user._id);
  assert.strictEqual(memberFines.summary.unpaidFines, 25);
  console.log(`✓ Member fine ledger reflects outstanding balance: $${memberFines.summary.unpaidFines.toFixed(2)}`);

  // Step 14 & 15: Member makes mock payment & fine becomes PAID
  console.log('\n[Step 14 & 15] Student submits mock fine payment...');
  const payRes = await FineService.payFine(txRecord._id, {
    amount: 25,
    paymentMethod: 'MOCK',
    notes: 'Online university portal mock payment'
  }, memberReg.user);

  assert.strictEqual(payRes.transaction.fineStatus, 'PAID');
  assert.strictEqual(payRes.payment.paymentStatus, 'PAID');
  console.log(`✓ Payment recorded! Reference: ${payRes.payment.referenceNumber}`);
  console.log(`✓ Transaction fineStatus updated to: ${payRes.transaction.fineStatus}`);

  // Step 16 & 17: Inventory updated & Inventory log generated
  console.log('\n[Step 16 & 17] Verifying inventory restoration and audit logs...');
  const finalBook = await Book.findById(demoBook._id);
  assert.strictEqual(finalBook.availableCopies, 2, 'Available copies restored to 2');

  const logs = await InventoryLog.find({ bookId: demoBook._id }).sort({ createdAt: -1 });
  assert(logs.length >= 2, 'Should have BOOK_ADDED, BOOK_ISSUED, BOOK_RETURNED logs');
  const returnLog = logs.find(l => l.action === 'BOOK_RETURNED');
  assert(returnLog, 'BOOK_RETURNED log must exist');
  console.log(`✓ Inventory restored: ${finalBook.availableCopies} available.`);
  console.log(`✓ Audit log verified: Action "${returnLog.action}", Reason: "${returnLog.reason}"`);

  // Step 18: Reports display the transaction
  console.log('\n[Step 18] Inspecting institutional reports...');
  const overviewReport = await ReportService.getOverview();
  const fineReport = await ReportService.getFineReport();
  assert(overviewReport.totalBooks >= 1);
  assert(fineReport.paidFines >= 25);
  console.log(`✓ Overview Report: ${overviewReport.totalBooks} titles, ${overviewReport.totalCopies} copies.`);
  console.log(`✓ Financial Report: Collected Fines: $${fineReport.paidFines.toFixed(2)}.`);

  console.log('\n================================================================');
  console.log('  SUCCESS! ALL 18 DEMO STEPS VERIFIED FLAWLESSLY END-TO-END!    ');
  console.log('================================================================\n');

  await disconnectDB();
  process.exit(0);
};

runE2EWorkflow().catch(async (err) => {
  console.error('[E2E Error]:', err);
  await disconnectDB();
  process.exit(1);
});
