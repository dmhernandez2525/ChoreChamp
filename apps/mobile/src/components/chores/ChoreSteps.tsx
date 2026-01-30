import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

interface ChoreStepsProps {
  steps: string[];
  onStepComplete?: (stepIndex: number, completedSteps: number[]) => void;
  onAllStepsComplete?: () => void;
  initialCompletedSteps?: number[];
}

export function ChoreSteps({
  steps,
  onStepComplete,
  onAllStepsComplete,
  initialCompletedSteps = [],
}: ChoreStepsProps) {
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(initialCompletedSteps)
  );

  const progress = steps.length > 0 ? completedSteps.size / steps.length : 0;
  const allComplete = completedSteps.size === steps.length;

  const toggleStep = useCallback((index: number) => {
    setCompletedSteps((prev: Set<number>) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        next.add(index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Check if all steps are now complete
        if (next.size === steps.length) {
          setTimeout(() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAllStepsComplete?.();
          }, 200);
        }
      }

      onStepComplete?.(index, Array.from(next) as number[]);
      return next;
    });
  }, [steps.length, onStepComplete, onAllStepsComplete]);

  if (steps.length === 0) {
    return null;
  }

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className="text-lg font-semibold text-gray-900">Steps</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-500 mr-2">
            {completedSteps.size}/{steps.length}
          </Text>
          {allComplete && (
            <View className="bg-success-100 px-2 py-1 rounded-full">
              <Text className="text-success-700 text-xs font-medium">Done!</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
        <View
          className="h-full bg-success-500 rounded-full transition-all"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      {/* Steps list */}
      <View className="space-y-2">
        {steps.map((step, index) => {
          const isComplete = completedSteps.has(index);
          const isNext = !isComplete && completedSteps.size === index;

          return (
            <TouchableOpacity
              key={index}
              className={`flex-row items-start p-3 rounded-xl ${
                isComplete
                  ? 'bg-success-50'
                  : isNext
                  ? 'bg-primary-50 border-2 border-primary-200'
                  : 'bg-gray-50'
              }`}
              onPress={() => toggleStep(index)}
              activeOpacity={0.7}
            >
              {/* Checkbox */}
              <View
                className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${
                  isComplete
                    ? 'bg-success-500'
                    : isNext
                    ? 'bg-primary-100 border-2 border-primary-300'
                    : 'bg-gray-200'
                }`}
              >
                {isComplete ? (
                  <Text className="text-white text-sm font-bold">✓</Text>
                ) : (
                  <Text className="text-gray-500 text-xs font-medium">
                    {index + 1}
                  </Text>
                )}
              </View>

              {/* Step text */}
              <Text
                className={`flex-1 text-base ${
                  isComplete
                    ? 'text-success-700 line-through'
                    : isNext
                    ? 'text-primary-700 font-medium'
                    : 'text-gray-600'
                }`}
              >
                {step}
              </Text>

              {/* Current indicator */}
              {isNext && (
                <View className="bg-primary-500 px-2 py-1 rounded-full">
                  <Text className="text-white text-xs font-medium">Next</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Complete all button when not all done */}
      {!allComplete && completedSteps.size > 0 && (
        <TouchableOpacity
          className="mt-4 bg-gray-100 rounded-xl py-3 items-center"
          onPress={() => {
            const allIndices = steps.map((_, i) => i);
            setCompletedSteps(new Set(allIndices));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onAllStepsComplete?.();
          }}
        >
          <Text className="text-gray-600 font-medium">Mark All Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
