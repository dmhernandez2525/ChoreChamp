import 'dotenv/config';
import { db } from './index';
import { choreTemplates as choreTemplatesTable } from './schema';
import { choreTemplates as templateData } from './seed/templates';

async function seed() {
  console.log('🌱 Starting database seed...');

  // Clear existing templates
  console.log('Clearing existing chore templates...');
  await db.delete(choreTemplatesTable);

  // Insert templates
  console.log(`Inserting ${templateData.length} chore templates...`);

  for (let i = 0; i < templateData.length; i++) {
    const template = templateData[i];
    await db.insert(choreTemplatesTable).values({
      title: template.title,
      description: template.description,
      icon: template.icon,
      category: template.category,
      pointValue: template.pointValue,
      difficulty: template.difficulty,
      estimatedMinutes: template.estimatedMinutes,
      minAge: template.minAge,
      steps: template.steps as string[] | undefined,
      sortOrder: i,
      isActive: true,
    });
  }

  console.log('✅ Seed complete!');
  console.log(`   - ${templateData.length} chore templates inserted`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
