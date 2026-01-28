import 'dotenv/config';
import { db } from './index';
import { choreTemplates as choreTemplatesTable, badges as badgesTable } from './schema';
import { choreTemplates as templateData } from './seed/templates';
import { badgeData } from './seed/badges';

async function seed() {
  console.log('Starting database seed...\n');

  // Seed chore templates
  console.log('Seeding chore templates...');
  try {
    await db.delete(choreTemplatesTable);
    console.log('  Cleared existing templates');

    // Batch insert for performance
    const templateValues = templateData.map((template, i) => ({
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
    }));

    await db.insert(choreTemplatesTable).values(templateValues);
    console.log(`  Inserted ${templateData.length} chore templates`);
  } catch (error) {
    console.error('  Failed to seed templates:', error);
    throw error;
  }

  // Seed badges
  console.log('\nSeeding badges...');
  try {
    await db.delete(badgesTable);
    console.log('  Cleared existing badges');

    const badgeValues = badgeData.map((badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      category: badge.category,
      rarity: badge.rarity,
      criteriaType: badge.criteriaType,
      criteriaThreshold: badge.criteriaThreshold,
      criteriaTimeframe: null,
      isHidden: badge.isHidden,
      sortOrder: badge.sortOrder,
    }));

    await db.insert(badgesTable).values(badgeValues);
    console.log(`  Inserted ${badgeData.length} badges`);
  } catch (error) {
    console.error('  Failed to seed badges:', error);
    throw error;
  }

  // Summary
  console.log('\n' + '='.repeat(40));
  console.log('Seed complete!');
  console.log(`  - ${templateData.length} chore templates`);
  console.log(`  - ${badgeData.length} badges`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('\nSeed failed:', err);
  process.exit(1);
});
