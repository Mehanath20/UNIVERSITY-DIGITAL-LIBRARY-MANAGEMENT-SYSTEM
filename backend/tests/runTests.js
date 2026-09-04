import assert from 'node:assert';
import { connectDB, disconnectDB } from '../config/db.js';
import { AuthService } from '../services/authService.js';
import { BookService } from '../services/bookService.js';
import { TransactionService } from '../services/transactionService.js';
import { HoldService } from '../services/holdService.js';
import { FineService } from '../services/fineService.js';
import { InventoryService } from '../services/inventoryService.js';
import { NotificationService } from '../services/notificationService.js';
import { ReportService } from '../services/reportService.js';
import { seedMembershipPlans } from '../seed/seedMembershipPlans.js';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Transaction from '../models/Transaction.js';
import Hold from '../models/Hold.js';
import FinePayment from '../models/FinePayment.js';
import Notification from '../models/Notification.js';
import InventoryLog from '../models/InventoryLog.js';

let passed = 0;
let failed = 0;

const test = async (name, fn) => {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    -> ${err.message}`);
    failed++;
  }
};

const runAllTests = async () => {
  console.log('\n====================================================');
  console.log('   RUNNING COMPREHENSIVE DLMS INTEGRATION TESTS     ');
  console.log('====================================================\n');

  await connectDB();

  // Reset collections for clean test run
  await User.deleteMany({});
  await Book.deleteMany({});
  await Transaction.deleteMany({});
  await Hold.deleteMany({});
  await FinePayment.deleteMany({});
  await Notification.deleteMany({});
  await InventoryLog.deleteMany({});

  // Seed plans
  await seedMembershipPlans();

  let adminUser, librarianUser, studentUser, facultyUser;
  let testBook1, testBook2;

  // 1. AUTHENTICATION & RBAC TESTS
  console.log('[Suite 1: Authentication & User Registration]');
  await test('Registers a new student member with hashed password & memberId', async () => {
    const res = await AuthService.register({
      name: 'Test Student',
      email: 'student.test@library.edu',
      password: 'Password123!',
      memberType: 'STUDENT',
      phone: '+1 555-0199'
    });
    assert(res.user._id, 'User ID should exist');
    assert.strictEqual(res.user.role, 'MEMBER');
    assert.strictEqual(res.user.memberType, 'STUDENT');
    assert(res.user.memberId.startsWith('MEM-'), 'Member ID should follow MEM- pattern');
    assert(res.token, 'JWT token should be generated');
    studentUser = res.user;
  });

  await test('Rejects duplicate email registration with 409 conflict', async () => {
    await assert.rejects(
      async () => {
        await AuthService.register({
          name: 'Duplicate Student',
          email: 'student.test@library.edu',
          password: 'Password123!'
        });
      },
      (err) => err.statusCode === 409 && err.errorCode === 'EMAIL_EXISTS'
    );
  });

  await test('Authenticates member with valid credentials', async () => {
    const res = await AuthService.login({
      email: 'student.test@library.edu',
      password: 'Password123!'
    });
    assert.strictEqual(res.user.email, 'student.test@library.edu');
    assert(res.token, 'Token returned on successful login');
  });

  await test('Rejects invalid password with 401', async () => {
    await assert.rejects(
      async () => {
        await AuthService.login({
          email: 'student.test@library.edu',
          password: 'WrongPassword!'
        });
      },
      (err) => err.statusCode === 401 && err.errorCode === 'INVALID_CREDENTIALS'
    );
  });

  await test('Creates Admin and Librarian accounts', async () => {
    const adminPass = await User.hashPassword('Admin123!');
    adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin.test@library.edu',
      passwordHash: adminPass,
      role: 'ADMIN',
      isActive: true
    });

    librarianUser = await AuthService.createLibrarian({
      name: 'Library Officer',
      email: 'librarian.test@library.edu',
      password: 'Librarian123!'
    });
    assert.strictEqual(librarianUser.role, 'LIBRARIAN');
  });

  // 2. BOOK CATALOG & SEARCH TESTS
  console.log('\n[Suite 2: Book Catalog & Inventory Management]');
  await test('Creates new books with initial available copies and inventory log', async () => {
    testBook1 = await BookService.createBook({
      title: 'Database Systems Architecture',
      author: 'Hector Garcia-Molina',
      isbn: '978-0131873254',
      category: 'Database',
      totalCopies: 2
    }, librarianUser._id);

    assert.strictEqual(testBook1.availableCopies, 2);
    assert.strictEqual(testBook1.status, 'AVAILABLE');

    testBook2 = await BookService.createBook({
      title: 'Operating Systems: Three Easy Pieces',
      author: 'Remzi Arpaci-Dusseau',
      isbn: '978-1985086593',
      category: 'Operating Systems',
      totalCopies: 1
    }, librarianUser._id);

    const logs = await InventoryLog.find({ bookId: testBook1._id });
    assert(logs.length >= 1, 'Inventory log should be created on book addition');
  });

  await test('Enforces unique ISBN constraint across books', async () => {
    await assert.rejects(
      async () => {
        await BookService.createBook({
          title: 'Duplicate ISBN Book',
          author: 'Unknown Author',
          isbn: '978-0131873254',
          category: 'Database',
          totalCopies: 1
        }, librarianUser._id);
      },
      (err) => err.statusCode === 409 && err.errorCode === 'DUPLICATE_ISBN'
    );
  });

  await test('Searches books case-insensitively with pagination metadata', async () => {
    const results = await BookService.searchBooks({ title: 'database', page: 1, limit: 10 });
    assert(results.data.length >= 1, 'Search should find the book matching title');
    assert.strictEqual(results.pagination.page, 1);
    assert.strictEqual(results.pagination.total, 1);
  });

  // 3. TRANSACTION WORKFLOW (ISSUE & RETURN)
  console.log('\n[Suite 3: Book Issue & Return Workflow]');
  let tx1;
  await test('Issues a book successfully: decrements availableCopies & creates Transaction', async () => {
    const issueRes = await TransactionService.issueBook({
      bookId: testBook2._id.toString(),
      memberId: studentUser._id.toString()
    }, librarianUser);

    assert(issueRes.transactionId, 'Transaction should have an ID');
    assert.strictEqual(issueRes.book.availableCopies, 0);

    const updatedBook = await Book.findById(testBook2._id);
    assert.strictEqual(updatedBook.availableCopies, 0);
    assert.strictEqual(updatedBook.status, 'UNAVAILABLE');

    tx1 = await Transaction.findById(issueRes.transactionId);
    assert.strictEqual(tx1.status, 'ISSUED');
  });

  await test('Disallows issuing the same book twice to the same member', async () => {
    await assert.rejects(
      async () => {
        await TransactionService.issueBook({
          bookId: testBook2._id.toString(),
          memberId: studentUser._id.toString()
        }, librarianUser);
      },
      (err) => err.statusCode === 409
    );
  });

  await test('Disallows issuing a book with 0 available copies to another member', async () => {
    const regOther = await AuthService.register({
      name: 'Second Student',
      email: 'second.student@library.edu',
      password: 'Password123!',
      memberType: 'STUDENT'
    });

    await assert.rejects(
      async () => {
        await TransactionService.issueBook({
          bookId: testBook2._id.toString(),
          memberId: regOther.user._id.toString()
        }, librarianUser);
      },
      (err) => err.statusCode === 409 && err.errorCode === 'BOOK_UNAVAILABLE'
    );
  });

  // 4. HOLD QUEUE TESTS
  console.log('\n[Suite 4: Hold Queue & Reservation FIFO]');
  let secondStudent;
  await test('Allows member to place a hold on an unavailable book (copies = 0)', async () => {
    secondStudent = await User.findOne({ email: 'second.student@library.edu' });
    const hold = await HoldService.createHold(testBook2._id.toString(), secondStudent._id);
    assert.strictEqual(hold.status, 'WAITING');
    assert.strictEqual(hold.queuePosition, 1);
  });

  await test('Prevents duplicate active holds by the same member on same book', async () => {
    await assert.rejects(
      async () => {
        await HoldService.createHold(testBook2._id.toString(), secondStudent._id);
      },
      (err) => err.statusCode === 409 && err.errorCode === 'DUPLICATE_HOLD'
    );
  });

  await test('Disallows placing hold on an available book (testBook1)', async () => {
    await assert.rejects(
      async () => {
        await HoldService.createHold(testBook1._id.toString(), secondStudent._id);
      },
      (err) => err.statusCode === 400 && err.errorCode === 'COPIES_AVAILABLE'
    );
  });

  // 5. RETURN, OVERDUE FINE CALCULATION & HOLD NOTIFICATION
  console.log('\n[Suite 5: Return, Fine Calculation & Hold Auto-Notification]');
  await test('Returns book with simulated overdue date: calculates fine & notifies waiting hold', async () => {
    // Simulate dueDate 4 days ago
    const simulatedDue = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    tx1.dueDate = simulatedDue;
    await tx1.save();

    const returnRes = await TransactionService.returnBook(tx1._id, {
      returnDate: new Date()
    }, librarianUser);

    assert.strictEqual(returnRes.transaction.status, 'RETURNED');
    assert(returnRes.overdueDays >= 4, `Overdue days should be at least 4 (got ${returnRes.overdueDays})`);
    assert(returnRes.fine >= 20, `Fine should be calculated ($5/day * 4 days = $20, got ${returnRes.fine})`);
    assert.strictEqual(returnRes.fineStatus, 'UNPAID');

    // Verify book copies incremented
    const refreshedBook = await Book.findById(testBook2._id);
    assert.strictEqual(refreshedBook.availableCopies, 1);
    assert.strictEqual(refreshedBook.status, 'AVAILABLE');

    // Verify hold was notified
    const notifiedHold = await Hold.findOne({ memberId: secondStudent._id, bookId: testBook2._id });
    assert.strictEqual(notifiedHold.status, 'NOTIFIED');

    // Verify notification record was created for the reserved member
    const notices = await Notification.find({ memberId: secondStudent._id });
    assert(notices.length >= 1, 'Member should have received a BOOK_AVAILABLE notification');
  });

  await test('Prevents duplicate return of already returned book', async () => {
    await assert.rejects(
      async () => {
        await TransactionService.returnBook(tx1._id, {}, librarianUser);
      },
      (err) => err.statusCode === 409 && err.errorCode === 'ALREADY_RETURNED'
    );
  });

  // 6. FINE PAYMENTS & WAIVERS
  console.log('\n[Suite 6: Fine Payments & Waivers]');
  await test('Member views own fine summary with unpaid balance', async () => {
    const fines = await FineService.getMyFines(studentUser._id);
    assert(fines.summary.unpaidFines > 0, 'Unpaid fines should be greater than 0');
  });

  await test('Member performs mock payment to clear fine: transaction.fineStatus becomes PAID', async () => {
    const payRes = await FineService.payFine(tx1._id, {
      amount: tx1.fine,
      paymentMethod: 'MOCK',
      notes: 'Test mock payment'
    }, studentUser);

    assert.strictEqual(payRes.transaction.fineStatus, 'PAID');
    assert.strictEqual(payRes.payment.paymentStatus, 'PAID');
  });

  // 7. INVENTORY ADJUSTMENTS
  console.log('\n[Suite 7: Inventory Adjustments & Copy Auditing]');
  await test('Librarian adjusts copies and marks lost copy', async () => {
    const adjustRes = await InventoryService.adjustCopies(testBook1._id, {
      quantity: 2,
      action: 'COPY_ADJUSTED',
      reason: 'Purchased extra lab copies'
    }, librarianUser);
    assert.strictEqual(adjustRes.book.totalCopies, 4);

    const lostRes = await InventoryService.markLost(testBook1._id, {
      quantity: 1,
      reason: 'Reported missing in audit'
    }, librarianUser);
    assert.strictEqual(lostRes.book.lostCopies, 1);
  });

  // 8. REPORTS & ANALYTICS
  console.log('\n[Suite 8: Reporting & Analytics]');
  await test('Generates overview, most-borrowed, inventory health and fine reports', async () => {
    const overview = await ReportService.getOverview();
    assert(typeof overview.totalBooks === 'number');
    assert(typeof overview.totalCopies === 'number');

    const mostBorrowed = await ReportService.getMostBorrowed(5);
    assert(Array.isArray(mostBorrowed));

    const health = await ReportService.getInventoryHealth();
    assert(health.availabilityPercentage);

    const fineReport = await ReportService.getFineReport();
    assert(typeof fineReport.totalFines === 'number');
  });

  console.log('\n====================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED, ${failed} FAILED  `);
  console.log('====================================================\n');

  await disconnectDB();

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runAllTests().catch(async (err) => {
  console.error('[Tests] Unexpected test suite crash:', err);
  await disconnectDB();
  process.exit(1);
});
