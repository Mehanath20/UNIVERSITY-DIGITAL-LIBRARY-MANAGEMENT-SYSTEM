/**
 * Generates a standard sequential/randomized Member ID (e.g., MEM-202501)
 */
export const generateMemberId = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MEM-${year}-${randomSuffix}`;
};
