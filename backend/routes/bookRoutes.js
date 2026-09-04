import { Router } from 'express';
import { getBooks, searchBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import { createBookSchema, updateBookSchema, searchBookSchema } from '../validators/bookValidator.js';

const router = Router();

// Search endpoint must be placed before /:id parameter route
router.get('/search', authenticateJWT, validate(searchBookSchema, 'query'), searchBooks);

router.get('/', authenticateJWT, getBooks);
router.get('/:id', authenticateJWT, getBookById);

router.post('/', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(createBookSchema), createBook);
router.put('/:id', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), validate(updateBookSchema), updateBook);
router.delete('/:id', authenticateJWT, authorizeRoles('LIBRARIAN', 'ADMIN'), deleteBook);

export default router;
