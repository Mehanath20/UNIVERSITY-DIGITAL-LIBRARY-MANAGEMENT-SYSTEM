import Book from '../models/Book.js';
import User from '../models/User.js';
import InventoryLog from '../models/InventoryLog.js';

export const seedBooks = async () => {
  console.log('[Seed] Seeding book catalog across 8 academic technical categories...');
  await Book.deleteMany({});
  await InventoryLog.deleteMany({});

  const librarian = await User.findOne({ role: 'LIBRARIAN' });
  const admin = await User.findOne({ role: 'ADMIN' });
  const actorId = librarian ? librarian._id : (admin ? admin._id : null);

  const booksData = [
    // Computer Science
    {
      title: 'Introduction to the Theory of Computation',
      author: 'Michael Sipser',
      isbn: '978-1133187790',
      category: 'Computer Science',
      description: 'The standard classic text covering formal languages, automata theory, and computational complexity.',
      publisher: 'Cengage Learning',
      publicationYear: 2012,
      totalCopies: 6,
      availableCopies: 6
    },
    {
      title: 'Structure and Interpretation of Computer Programs',
      author: 'Harold Abelson, Gerald Jay Sussman',
      isbn: '978-0262510875',
      category: 'Computer Science',
      description: 'Foundational computer science principles exploring abstraction, recursion, interpreters, and metalinguistic abstraction.',
      publisher: 'MIT Press',
      publicationYear: 1996,
      totalCopies: 4,
      availableCopies: 4
    },
    // Artificial Intelligence
    {
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell, Peter Norvig',
      isbn: '978-0134610993',
      category: 'Artificial Intelligence',
      description: 'The definitive textbook on modern artificial intelligence covering agents, probabilistic reasoning, and deep learning.',
      publisher: 'Pearson',
      publicationYear: 2020,
      totalCopies: 8,
      availableCopies: 8
    },
    {
      title: 'Deep Learning',
      author: 'Ian Goodfellow, Yoshua Bengio, Aaron Courville',
      isbn: '978-0262035613',
      category: 'Artificial Intelligence',
      description: 'Comprehensive coverage of mathematical foundations, deep feedforward networks, optimization algorithms, and representation learning.',
      publisher: 'MIT Press',
      publicationYear: 2016,
      totalCopies: 5,
      availableCopies: 5
    },
    // Data Science
    {
      title: 'Python for Data Analysis',
      author: 'Wes McKinney',
      isbn: '978-1098104030',
      category: 'Data Science',
      description: 'Practical data manipulation, cleaning, aggregation, and time-series analysis using pandas, NumPy, and IPython.',
      publisher: "O'Reilly Media",
      publicationYear: 2022,
      totalCopies: 7,
      availableCopies: 7
    },
    {
      title: 'The Elements of Statistical Learning',
      author: 'Trevor Hastie, Robert Tibshirani, Jerome Friedman',
      isbn: '978-0387848570',
      category: 'Data Science',
      description: 'Essential mathematical framework for data mining, inference, unsupervised clustering, and classification.',
      publisher: 'Springer',
      publicationYear: 2017,
      totalCopies: 3,
      availableCopies: 3
    },
    // Database
    {
      title: 'Database System Concepts',
      author: 'Abraham Silberschatz, Henry F. Korth, S. Sudarshan',
      isbn: '978-0078022159',
      category: 'Database',
      description: 'Core concepts of relational database architecture, SQL, storage engine internals, indexing, transactions, and concurrency.',
      publisher: 'McGraw-Hill',
      publicationYear: 2019,
      totalCopies: 10,
      availableCopies: 10
    },
    {
      title: 'Designing Data-Intensive Applications',
      author: 'Martin Kleppmann',
      isbn: '978-1449373320',
      category: 'Database',
      description: 'Deep dive into storage engines, distributed consensus, stream processing, partitioning, and replication trade-offs.',
      publisher: "O'Reilly Media",
      publicationYear: 2017,
      totalCopies: 9,
      availableCopies: 9
    },
    // Networking
    {
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James F. Kurose, Keith W. Ross',
      isbn: '978-0136681557',
      category: 'Networking',
      description: 'Network layering, HTTP/3, DNS, transport protocols (TCP/UDP), routing algorithms, and network security.',
      publisher: 'Pearson',
      publicationYear: 2021,
      totalCopies: 6,
      availableCopies: 6
    },
    {
      title: 'TCP/IP Illustrated, Volume 1',
      author: 'W. Richard Stevens, Kevin R. Fall',
      isbn: '978-0321336316',
      category: 'Networking',
      description: 'Detailed exploration of the protocols that drive the global Internet infrastructure.',
      publisher: 'Addison-Wesley',
      publicationYear: 2011,
      totalCopies: 4,
      availableCopies: 4
    },
    // Operating Systems
    {
      title: 'Operating System Concepts (Dinosaur Book)',
      author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne',
      isbn: '978-1119800361',
      category: 'Operating Systems',
      description: 'Fundamental operating systems architecture: processes, threads, CPU scheduling, deadlocks, and virtual memory.',
      publisher: 'Wiley',
      publicationYear: 2021,
      totalCopies: 8,
      availableCopies: 8
    },
    {
      title: 'Modern Operating Systems',
      author: 'Andrew S. Tanenbaum, Herbert Bos',
      isbn: '978-0133591620',
      category: 'Operating Systems',
      description: 'In-depth analysis of system virtualization, multiprocessor scheduling, distributed systems, and kernel security.',
      publisher: 'Pearson',
      publicationYear: 2014,
      totalCopies: 5,
      availableCopies: 5
    },
    // Programming
    {
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      isbn: '978-0132350884',
      category: 'Programming',
      description: 'Best software engineering practices for writing readable, maintainable, testable, and resilient code.',
      publisher: 'Prentice Hall',
      publicationYear: 2008,
      totalCopies: 8,
      availableCopies: 8
    },
    {
      title: 'The Pragmatic Programmer: Your Journey To Mastery',
      author: 'David Thomas, Andrew Hunt',
      isbn: '978-0135957059',
      category: 'Programming',
      description: 'Timeless career insights covering software architecture, orthogonality, debugging, and continuous improvement.',
      publisher: 'Addison-Wesley',
      publicationYear: 2019,
      totalCopies: 6,
      availableCopies: 6
    },
    // Mathematics
    {
      title: 'Discrete Mathematics and Its Applications',
      author: 'Kenneth H. Rosen',
      isbn: '978-1259676512',
      category: 'Mathematics',
      description: 'Logic, propositional calculus, mathematical induction, graph theory, combinatorics, and boolean algebra.',
      publisher: 'McGraw-Hill',
      publicationYear: 2018,
      totalCopies: 6,
      availableCopies: 6
    },
    {
      title: 'Linear Algebra and Its Applications',
      author: 'David C. Lay, Steven R. Lay, Judi J. McDonald',
      isbn: '978-0321982384',
      category: 'Mathematics',
      description: 'Vector spaces, matrix transformations, eigenvalues, eigenvectors, and singular value decomposition for engineering.',
      publisher: 'Pearson',
      publicationYear: 2015,
      totalCopies: 5,
      availableCopies: 5
    }
  ];

  const createdBooks = await Book.insertMany(booksData);

  // Generate initial inventory log for each
  if (actorId) {
    const logs = createdBooks.map(b => ({
      bookId: b._id,
      action: 'BOOK_ADDED',
      quantity: b.totalCopies,
      previousAvailableCopies: 0,
      newAvailableCopies: b.availableCopies,
      performedBy: actorId,
      reason: 'Initial technical catalog seed batch'
    }));
    await InventoryLog.insertMany(logs);
  }

  console.log(`[Seed] Successfully seeded ${createdBooks.length} books with inventory audit logs.`);
};
