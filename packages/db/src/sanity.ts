import { prisma } from './index';

async function main() {
  const row = await prisma.sanityCheck.create({
    data: { message: 'it works' },
  });

  const all = await prisma.sanityCheck.findMany();

  console.log('Inserted:', row);
  console.log('All rows:', all);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
