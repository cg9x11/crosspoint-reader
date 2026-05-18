import { config as loadDotEnv } from 'dotenv';
import { PrismaClient } from '../src/generated/prisma/index.js';

loadDotEnv();

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.translationProject.findMany({
    select: { id: true, provider: true, model: true }
  });

  let changed = 0;
  for (const project of projects) {
    const currentProvider = String(project.provider || '').trim().toLowerCase();
    const currentModel = String(project.model || '').trim();
    const provider = currentProvider === 'gemini' ? 'gemini' : 'openai';
    const model = provider === 'gemini'
      ? (currentModel && currentModel !== 'mock-vi' ? currentModel : 'gemini-2.0-flash')
      : (currentModel && currentModel !== 'mock-vi' ? currentModel : 'gpt-4.1-mini');

    if (provider !== project.provider || model !== project.model) {
      await prisma.translationProject.update({
        where: { id: project.id },
        data: { provider, model }
      });
      changed += 1;
    }
  }

  console.log(`normalize-translation-providers: scanned=${projects.length} changed=${changed}`);
}

main()
  .catch((error) => {
    console.error('normalize-translation-providers failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
