import { useState } from 'react';
import type {
  EducationalChoreTemplate,
  EducationalContentType,
} from '@chorechamp/types';
import { CONTENT_TYPE_CONFIG } from '@chorechamp/types';
import { QuestionCard } from '../components/educational/QuestionCard';

type TabType = 'overview' | 'practice' | 'templates' | 'progress' | 'paths';

// Mock progress type
interface MockProgress {
  id: string;
  memberId: string;
  householdId: string;
  progressByType: Partial<Record<EducationalContentType, {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    currentStreak: number;
    bestStreak: number;
    averageTimeSeconds: number;
    masteryLevel: number;
  }>>;
  totalSessions: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  currentDayStreak: number;
  longestDayStreak: number;
  lastActivityDate: Date | null;
  totalPointsEarned: number;
  totalBonusEarned: number;
  overallLevel: number;
  experiencePoints: number;
  nextLevelXp: number;
  updatedAt: Date;
}

// Mock data
const mockProgress: MockProgress = {
  id: 'p1',
  memberId: 'm1',
  householdId: 'h1',
  progressByType: {
    math_facts: {
      totalQuestions: 150,
      correctAnswers: 128,
      accuracy: 85,
      currentStreak: 5,
      bestStreak: 12,
      averageTimeSeconds: 8,
      masteryLevel: 75,
    },
    spelling: {
      totalQuestions: 80,
      correctAnswers: 72,
      accuracy: 90,
      currentStreak: 3,
      bestStreak: 8,
      averageTimeSeconds: 12,
      masteryLevel: 65,
    },
    science: {
      totalQuestions: 45,
      correctAnswers: 38,
      accuracy: 84,
      currentStreak: 2,
      bestStreak: 5,
      averageTimeSeconds: 15,
      masteryLevel: 40,
    },
  },
  totalSessions: 42,
  totalQuestionsAnswered: 275,
  totalCorrect: 238,
  overallAccuracy: 87,
  currentDayStreak: 7,
  longestDayStreak: 14,
  lastActivityDate: new Date(),
  totalPointsEarned: 580,
  totalBonusEarned: 85,
  overallLevel: 8,
  experiencePoints: 665,
  nextLevelXp: 800,
  updatedAt: new Date(),
};

const mockTemplates: EducationalChoreTemplate[] = [
  {
    id: 't1',
    householdId: 'h1',
    name: 'Math Facts After Chores',
    description: '5 quick math problems after completing a chore',
    category: 'Standard',
    contentType: 'math_facts',
    difficulty: 'adaptive',
    timing: 'after_chore',
    questionsRequired: 5,
    minimumCorrectPercent: 70,
    timeLimit: 5,
    allowRetry: true,
    maxRetries: 3,
    retryDelay: 5,
    bonusPointsForPerfect: 10,
    bonusScreenTimeMinutes: 5,
    minAge: 6,
    maxAge: 12,
    gradeLevel: '1st-5th',
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 't2',
    householdId: 'h1',
    name: 'Spelling Practice',
    description: 'Practice spelling words before screen time',
    category: 'Language',
    contentType: 'spelling',
    difficulty: 'medium',
    timing: 'before_chore',
    questionsRequired: 10,
    minimumCorrectPercent: 80,
    timeLimit: 10,
    allowRetry: true,
    maxRetries: 2,
    retryDelay: 10,
    bonusPointsForPerfect: 15,
    bonusScreenTimeMinutes: 10,
    minAge: 7,
    maxAge: 12,
    gradeLevel: '2nd-6th',
    isEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockQuestions = [
  { id: 'q1', question: '7 × 8 = ?', questionType: 'multiple_choice', options: ['54', '56', '63', '48'], imageUrl: null },
  { id: 'q2', question: '144 ÷ 12 = ?', questionType: 'multiple_choice', options: ['10', '11', '12', '13'], imageUrl: null },
  { id: 'q3', question: '25 + 37 = ?', questionType: 'multiple_choice', options: ['52', '62', '72', '82'], imageUrl: null },
  { id: 'q4', question: '100 - 45 = ?', questionType: 'multiple_choice', options: ['45', '55', '65', '75'], imageUrl: null },
  { id: 'q5', question: '9 × 9 = ?', questionType: 'multiple_choice', options: ['72', '81', '90', '99'], imageUrl: null },
];

const correctAnswers: Record<string, string> = {
  q1: '56',
  q2: '12',
  q3: '62',
  q4: '55',
  q5: '81',
};

export function EducationalChores() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedContentType, setSelectedContentType] = useState<EducationalContentType>('math_facts');
  const [isPracticing, setIsPracticing] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ isCorrect: boolean; correctAnswer: string }[]>([]);
  const [currentResult, setCurrentResult] = useState<{ isCorrect: boolean; correctAnswer: string; explanation?: string } | null>(null);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'practice', label: 'Practice', icon: '✏️' },
    { id: 'templates', label: 'Templates', icon: '📋' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'paths', label: 'Learning Paths', icon: '🛤️' },
  ];

  const contentTypes = Object.entries(CONTENT_TYPE_CONFIG).map(([key, config]) => ({
    type: key as EducationalContentType,
    ...config,
  }));

  const startPractice = () => {
    setIsPracticing(true);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentResult(null);
  };

  const handleAnswer = (answer: string) => {
    const question = mockQuestions[currentQuestionIndex];
    const isCorrect = answer === correctAnswers[question.id];
    const result = { isCorrect, correctAnswer: correctAnswers[question.id] };
    setCurrentResult(result);
    setAnswers([...answers, result]);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < mockQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentResult(null);
    } else {
      setIsPracticing(false);
    }
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const scorePercent = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Educational Chore Tasks</h1>
          <p className="text-gray-500 mt-1">
            Learn while you do chores - earn bonus points for correct answers
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-blue-600">{mockProgress.overallLevel}</p>
                  <p className="text-sm text-gray-500">Level</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{mockProgress.overallAccuracy}%</p>
                  <p className="text-sm text-gray-500">Accuracy</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-orange-600">{mockProgress.currentDayStreak}</p>
                  <p className="text-sm text-gray-500">Day Streak</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4 text-center">
                  <p className="text-3xl font-bold text-purple-600">{mockProgress.totalPointsEarned}</p>
                  <p className="text-sm text-gray-500">Points Earned</p>
                </div>
              </div>

              {/* XP Progress */}
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Level {mockProgress.overallLevel}</span>
                  <span className="text-sm text-gray-500">
                    {mockProgress.experiencePoints} / {mockProgress.nextLevelXp} XP
                  </span>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                    style={{ width: `${(mockProgress.experiencePoints / mockProgress.nextLevelXp) * 100}%` }}
                  />
                </div>
              </div>

              {/* Content type progress */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Progress by Subject</h3>
                <div className="space-y-4">
                  {Object.entries(mockProgress.progressByType).map(([type, progress]) => {
                    const config = CONTENT_TYPE_CONFIG[type as EducationalContentType];
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-2">
                            <span>{config.icon}</span>
                            <span className="font-medium">{config.name}</span>
                          </span>
                          <span className="text-sm text-gray-500">
                            {progress.accuracy}% accuracy
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              backgroundColor: config.color,
                              width: `${progress.masteryLevel}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{progress.totalQuestions} questions</span>
                          <span>Mastery: {progress.masteryLevel}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick practice button */}
              <button
                onClick={() => {
                  setActiveTab('practice');
                  startPractice();
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold text-lg hover:opacity-90 transition-opacity"
              >
                Start Quick Practice
              </button>
            </>
          )}

          {activeTab === 'practice' && (
            <>
              {!isPracticing ? (
                <>
                  {/* Content type selector */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Choose a Subject</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {contentTypes.slice(0, 8).map(({ type, name, icon }) => (
                        <button
                          key={type}
                          onClick={() => setSelectedContentType(type)}
                          className={`p-4 rounded-lg border-2 text-center transition-all ${
                            selectedContentType === type
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-2xl block mb-1">{icon}</span>
                          <span className="text-sm font-medium">{name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Difficulty selector */}
                  <div className="bg-white rounded-lg shadow p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Select Difficulty</h3>
                    <div className="flex gap-3">
                      {['easy', 'medium', 'hard'].map((diff) => (
                        <button
                          key={diff}
                          className="flex-1 py-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 capitalize"
                        >
                          {diff === 'easy' && '🌱'} {diff === 'medium' && '🌿'} {diff === 'hard' && '🌳'} {diff}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={startPractice}
                    className="w-full py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700"
                  >
                    Start Practice (5 Questions)
                  </button>

                  {/* Recent results */}
                  {answers.length > 0 && (
                    <div className="bg-white rounded-lg shadow p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Last Session Results</h3>
                      <div className="flex items-center gap-4">
                        <div className={`text-4xl font-bold ${scorePercent >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                          {scorePercent}%
                        </div>
                        <div>
                          <p className="text-gray-600">
                            {correctCount} of {answers.length} correct
                          </p>
                          <p className="text-sm text-gray-500">
                            {scorePercent >= 70 ? 'Great job!' : 'Keep practicing!'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Practice session */}
                  <div className="flex justify-between items-center bg-white rounded-lg shadow p-4">
                    <span className="font-semibold">
                      Question {currentQuestionIndex + 1} of {mockQuestions.length}
                    </span>
                    <div className="flex gap-1">
                      {mockQuestions.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-3 h-3 rounded-full ${
                            idx < answers.length
                              ? answers[idx].isCorrect
                                ? 'bg-green-500'
                                : 'bg-red-500'
                              : idx === currentQuestionIndex
                                ? 'bg-blue-500'
                                : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      Score: {correctCount}/{answers.length}
                    </span>
                  </div>

                  <QuestionCard
                    question={mockQuestions[currentQuestionIndex]}
                    onAnswer={handleAnswer}
                    result={currentResult}
                  />

                  {currentResult && (
                    <button
                      onClick={nextQuestion}
                      className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      {currentQuestionIndex < mockQuestions.length - 1 ? 'Next Question' : 'Finish'}
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {activeTab === 'templates' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Educational Templates</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Create Template
                </button>
              </div>

              <div className="space-y-4">
                {mockTemplates.map((template) => {
                  const config = CONTENT_TYPE_CONFIG[template.contentType];
                  return (
                    <div key={template.id} className="bg-white rounded-lg shadow p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${config.color}20` }}
                          >
                            {config.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-500">{template.description}</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={template.isEnabled} readOnly className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                        </label>
                      </div>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Questions:</span>
                          <span className="ml-1 font-medium">{template.questionsRequired}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pass:</span>
                          <span className="ml-1 font-medium">{template.minimumCorrectPercent}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Time Limit:</span>
                          <span className="ml-1 font-medium">{template.timeLimit || 'None'}m</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Timing:</span>
                          <span className="ml-1 font-medium capitalize">{template.timing.replace('_', ' ')}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          +{template.bonusPointsForPerfect} pts for perfect
                        </span>
                        {template.bonusScreenTimeMinutes && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs">
                            +{template.bonusScreenTimeMinutes}m screen time
                          </span>
                        )}
                        {template.gradeLevel && (
                          <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                            Grades: {template.gradeLevel}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {activeTab === 'progress' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Detailed Progress</h2>

              {Object.entries(mockProgress.progressByType).map(([type, progress]) => {
                const config = CONTENT_TYPE_CONFIG[type as EducationalContentType];
                return (
                  <div key={type} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{config.name}</h3>
                        <p className="text-sm text-gray-500">{config.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold" style={{ color: config.color }}>
                          {progress.accuracy}%
                        </p>
                        <p className="text-xs text-gray-500">Accuracy</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900">{progress.totalQuestions}</p>
                        <p className="text-xs text-gray-500">Questions</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">{progress.currentStreak}</p>
                        <p className="text-xs text-gray-500">Current Streak</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{progress.masteryLevel}%</p>
                        <p className="text-xs text-gray-500">Mastery</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Mastery Level</span>
                        <span>{progress.masteryLevel}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full"
                          style={{ backgroundColor: config.color, width: `${progress.masteryLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeTab === 'paths' && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Learning Paths</h2>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  + Create Path
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Math Mastery', icon: '🔢', levels: 10, completed: 4, color: '#3B82F6' },
                  { name: 'Spelling Champ', icon: '📝', levels: 8, completed: 6, color: '#10B981' },
                  { name: 'Science Explorer', icon: '🔬', levels: 6, completed: 2, color: '#8B5CF6' },
                ].map((path) => (
                  <div key={path.name} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{path.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{path.name}</h3>
                        <p className="text-sm text-gray-500">
                          {path.completed} of {path.levels} levels complete
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: path.levels }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`flex-1 h-2 rounded ${
                            idx < path.completed ? '' : 'bg-gray-200'
                          }`}
                          style={{
                            backgroundColor: idx < path.completed ? path.color : undefined,
                          }}
                        />
                      ))}
                    </div>

                    <button className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                      Continue Learning
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
