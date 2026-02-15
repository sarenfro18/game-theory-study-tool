"use client";

import { Question } from "@/lib/types";

interface QuestionPanelProps {
  question: Question;
  selectedAnswer: number | null;
  selectedAnswers: number[];
  isSubmitted: boolean;
  isCorrect: boolean | null;
  onSelectAnswer: (index: number) => void;
  onToggleAnswer: (index: number) => void;
  onSubmit: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function QuestionPanel({
  question,
  selectedAnswer,
  selectedAnswers,
  isSubmitted,
  onSelectAnswer,
  onToggleAnswer,
  onSubmit,
}: QuestionPanelProps) {
  const isMultiSelect = question.multiSelect === true;
  const hasSelection = isMultiSelect
    ? selectedAnswers.length > 0
    : selectedAnswer !== null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Question
        {isMultiSelect && (
          <span className="ml-2 text-xs font-normal normal-case text-indigo-500">
            (Select all that apply)
          </span>
        )}
      </h3>
      <p className="text-base text-gray-900 font-medium leading-relaxed mb-4">
        {question.text}
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {question.options.map((option, i) => {
          const isSelected = isMultiSelect
            ? selectedAnswers.includes(i)
            : i === selectedAnswer;
          const isCorrectOption = isMultiSelect
            ? question.correctIndices?.includes(i)
            : i === question.correctIndex;
          const isWrongSelection = isSelected && isSubmitted && !isCorrectOption;

          let borderColor = "border-gray-200";
          let bgColor = "bg-white hover:bg-gray-50";
          let textColor = "text-gray-800";

          if (isSubmitted) {
            if (isCorrectOption) {
              borderColor = "border-green-500";
              bgColor = "bg-green-50";
              textColor = "text-green-800";
            } else if (isWrongSelection) {
              borderColor = "border-red-500";
              bgColor = "bg-red-50";
              textColor = "text-red-800";
            }
          } else if (isSelected) {
            borderColor = "border-indigo-500";
            bgColor = "bg-indigo-50";
            textColor = "text-indigo-800";
          }

          return (
            <button
              key={i}
              onClick={() => {
                if (isSubmitted) return;
                if (isMultiSelect) {
                  onToggleAnswer(i);
                } else {
                  onSelectAnswer(i);
                }
              }}
              disabled={isSubmitted}
              className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${borderColor} ${bgColor} ${textColor} ${
                isSubmitted ? "cursor-default" : "cursor-pointer"
              }`}
            >
              {isMultiSelect ? (
                <span
                  className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-all ${
                    isSelected
                      ? isSubmitted
                        ? isCorrectOption
                          ? "bg-green-500 border-green-500 text-white"
                          : "bg-red-500 border-red-500 text-white"
                        : "bg-indigo-500 border-indigo-500 text-white"
                      : isSubmitted && isCorrectOption
                        ? "border-green-500 bg-green-50"
                        : "border-gray-300 bg-white"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
              ) : (
                <span
                  className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    isSelected
                      ? isSubmitted
                        ? isCorrectOption
                          ? "bg-green-500 text-white"
                          : "bg-red-500 text-white"
                        : "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {OPTION_LETTERS[i]}
                </span>
              )}
              <span className="text-sm leading-relaxed pt-0.5">{option}</span>
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <button
          onClick={onSubmit}
          disabled={!hasSelection}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
            hasSelection
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          }`}
        >
          Submit Answer
        </button>
      )}
    </div>
  );
}
