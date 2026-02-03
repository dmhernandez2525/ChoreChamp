import { SkillTree, SKILL_CATEGORIES, SkillCategory } from '@chorechamp/types';

interface SkillTreeCardProps {
  tree: SkillTree;
  skillsCompleted?: number;
  totalSkills?: number;
  onSelect?: () => void;
}

export function SkillTreeCard({ tree, skillsCompleted = 0, totalSkills, onSelect }: SkillTreeCardProps) {
  const category = SKILL_CATEGORIES[tree.category as SkillCategory] || { label: tree.category, icon: '?', color: '#gray' };
  const total = totalSkills ?? tree.totalSkills;
  const progressPercent = total > 0 ? Math.round((skillsCompleted / total) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      className={`bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-all cursor-pointer border-l-4`}
      style={{ borderLeftColor: tree.colorTheme }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${tree.colorTheme}20` }}
        >
          {category.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{tree.name}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{tree.description}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">{skillsCompleted} / {total} skills</span>
          <span className="text-gray-600 font-medium">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${progressPercent}%`, backgroundColor: tree.colorTheme }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t">
        <span className="text-sm text-gray-500">
          {tree.totalXp.toLocaleString()} total XP
        </span>
      </div>
    </div>
  );
}
