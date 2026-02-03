import { useState } from 'react';

interface QuestionCardProps {
  question: {
    id: string;
    question: string;
    questionType: string;
    options?: string[] | null;
    imageUrl?: string | null;
  };
  onAnswer: (answer: string) => void;
  disabled?: boolean;
  result?: {
    isCorrect: boolean;
    correctAnswer: string;
    explanation?: string | null;
  } | null;
}

export function QuestionCard({ question, onAnswer, disabled, result }: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  const handleSubmit = () => {
    if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
      if (selectedAnswer) {
        onAnswer(selectedAnswer);
      }
    } else {
      if (textAnswer.trim()) {
        onAnswer(textAnswer.trim());
      }
    }
  };

  const getOptionClass = (option: string) => {
    if (!result) {
      return selectedAnswer === option
        ? 'border-blue-500 bg-blue-50'
        : 'border-gray-200 hover:border-gray-300';
    }

    if (option === result.correctAnswer) {
      return 'border-green-500 bg-green-50';
    }
    if (selectedAnswer === option && !result.isCorrect) {
      return 'border-red-500 bg-red-50';
    }
    return 'border-gray-200 opacity-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {question.imageUrl && (
        <img
          src={question.imageUrl}
          alt="Question illustration"
          className="mb-4 max-h-48 mx-auto rounded"
        />
      )}

      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {question.question}
      </h3>

      {(question.questionType === 'multiple_choice' || question.questionType === 'true_false') && question.options && (
        <div className="space-y-2">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => !disabled && !result && setSelectedAnswer(option)}
              disabled={disabled || !!result}
              className={`w-full p-3 text-left rounded-lg border-2 transition-colors ${getOptionClass(option)}`}
            >
              <span className="font-medium mr-2">
                {String.fromCharCode(65 + idx)}.
              </span>
              {option}
              {result && option === result.correctAnswer && (
                <span className="float-right text-green-600">✓</span>
              )}
              {result && selectedAnswer === option && !result.isCorrect && (
                <span className="float-right text-red-600">✗</span>
              )}
            </button>
          ))}
        </div>
      )}

      {(question.questionType === 'fill_blank' || question.questionType === 'short_answer') && (
        <input
          type="text"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          disabled={disabled || !!result}
          placeholder="Type your answer..."
          className={`w-full p-3 border-2 rounded-lg ${
            result
              ? result.isCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
              : 'border-gray-200'
          }`}
        />
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`font-semibold ${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {result.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
          </p>
          {!result.isCorrect && (
            <p className="text-sm text-gray-700 mt-1">
              Correct answer: <strong>{result.correctAnswer}</strong>
            </p>
          )}
          {result.explanation && (
            <p className="text-sm text-gray-600 mt-2">{result.explanation}</p>
          )}
        </div>
      )}

      {!result && (
        <button
          onClick={handleSubmit}
          disabled={disabled || (!selectedAnswer && !textAnswer.trim())}
          className="mt-4 w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}
