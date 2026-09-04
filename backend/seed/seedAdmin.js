import User from '../models/User.js';

export const seedUsers = async () => {
  console.log('[Seed] Seeding users (Admin, Librarians, Students, Faculty)...');
  await User.deleteMany({});

  const defaultPassword = 'Password123!';
  const passwordHash = await User.hashPassword(defaultPassword);

  const users = [
    // 1 Admin
    {
      name: 'Dr. Arthur Vance (Chief Admin)',
      email: 'admin@library.edu',
      passwordHash,
      role: 'ADMIN',
      phone: '+1 (555) 100-0001',
      isActive: true
    },
    // 2 Librarians
    {
      name: 'Eleanor Gray (Head Librarian)',
      email: 'librarian@library.edu',
      passwordHash,
      role: 'LIBRARIAN',
      phone: '+1 (555) 200-0001',
      isActive: true
    },
    {
      name: 'Marcus Cole (Associate Librarian)',
      email: 'marcus.cole@library.edu',
      passwordHash,
      role: 'LIBRARIAN',
      phone: '+1 (555) 200-0002',
      isActive: true
    },
    // 5 Students
    {
      name: 'Alice Johnson',
      email: 'alice.student@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'STUDENT',
      memberId: 'MEM-2025-1001',
      phone: '+1 (555) 300-0001',
      isActive: true
    },
    {
      name: 'Bob Smith',
      email: 'bob.student@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'STUDENT',
      memberId: 'MEM-2025-1002',
      phone: '+1 (555) 300-0002',
      isActive: true
    },
    {
      name: 'Charlie Davis',
      email: 'charlie.student@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'STUDENT',
      memberId: 'MEM-2025-1003',
      phone: '+1 (555) 300-0003',
      isActive: true
    },
    {
      name: 'Diana Prince',
      email: 'diana.student@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'STUDENT',
      memberId: 'MEM-2025-1004',
      phone: '+1 (555) 300-0004',
      isActive: true
    },
    {
      name: 'Evan Wright',
      email: 'evan.student@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'STUDENT',
      memberId: 'MEM-2025-1005',
      phone: '+1 (555) 300-0005',
      isActive: true
    },
    // 2 Faculty
    {
      name: 'Prof. Robert Langdon',
      email: 'robert.faculty@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'FACULTY',
      memberId: 'MEM-2025-2001',
      phone: '+1 (555) 400-0001',
      isActive: true
    },
    {
      name: 'Dr. Evelyn Reed',
      email: 'evelyn.faculty@library.edu',
      passwordHash,
      role: 'MEMBER',
      memberType: 'FACULTY',
      memberId: 'MEM-2025-2002',
      phone: '+1 (555) 400-0002',
      isActive: true
    }
  ];

  await User.insertMany(users);
  console.log(`[Seed] Successfully seeded ${users.length} users (1 Admin, 2 Librarians, 5 Students, 2 Faculty).`);
};
