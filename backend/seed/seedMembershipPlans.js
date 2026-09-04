import MembershipPlan from '../models/MembershipPlan.js';

export const seedMembershipPlans = async () => {
  console.log('[Seed] Seeding membership plans...');
  await MembershipPlan.deleteMany({});

  const plans = [
    {
      name: 'Undergraduate & Graduate Student Plan',
      memberType: 'STUDENT',
      maxBooksAllowed: 3,
      loanDurationDays: 14,
      finePerDay: 5,
      maxFine: 500,
      isActive: true
    },
    {
      name: 'University Faculty & Researcher Plan',
      memberType: 'FACULTY',
      maxBooksAllowed: 5,
      loanDurationDays: 30,
      finePerDay: 2,
      maxFine: 500,
      isActive: true
    }
  ];

  await MembershipPlan.insertMany(plans);
  console.log(`[Seed] Successfully seeded ${plans.length} membership plans.`);
};
