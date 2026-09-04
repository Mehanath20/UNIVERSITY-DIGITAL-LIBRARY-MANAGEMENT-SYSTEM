import { connectDB, disconnectDB } from '../config/db.js';
import { seedMembershipPlans } from './seedMembershipPlans.js';
import { seedUsers } from './seedAdmin.js';
import { seedBooks } from './seedBooks.js';

const runSeeder = async () => {
  try {
    console.log('====================================================');
    console.log('   STARTING DIGITAL LIBRARY SYSTEM DATABASE SEEDER   ');
    console.log('====================================================');

    await connectDB();

    await seedMembershipPlans();
    await seedUsers();
    await seedBooks();

    console.log('====================================================');
    console.log('   ALL SEED DATA INSERTED SUCCESSFULLY!             ');
    console.log('   Demo Logins:                                     ');
    console.log('   - Admin:     admin@library.edu / Password123!    ');
    console.log('   - Librarian: librarian@library.edu / Password123!');
    console.log('   - Student:   alice.student@library.edu / Password123!');
    console.log('   - Faculty:   robert.faculty@library.edu / Password123!');
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
    await disconnectDB();
    process.exit(1);
  }
};

runSeeder();
