"use client";

import { Question } from "@/lib/types";

interface QuestionPanelProps {
  question: Question;
  selectedAnswer: number | null;
  isSubmitted: boolean;
  isCorrect: boolean | null;
  onSelectAnswer: (index: number) => void;
  onSubmit: () => void;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E"];

export function QuestionPanel({
  question,
  selectedAnswer,
  isSubmitted,
  isCorrect,
  onSelectAnswer,
  onSubmit,
}: QuestionPanelProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Question
      </h3>
      <p className="text-base text-gray-900 font-medium leading-relaxed mb-4">
        {question.text}
      </p>

      <div className="flex flex-col gap-2 mb-4">
        {question.options.map((option, i) => {
          let borderColor = "border-gray-200";
          let bgColor = "bg-white hover:bg-gray-50";
          let textColor = "text-gray-800";

          if (isSubmitted) {
            if (i === question.correctIndex) {
              borderColor = "border-green-500";
              bgColor = "bg-green-50";
              textColor = "text-green-800";
            } else if (i === selectedAnswer && !isCorrect) {
              borderColor = "border-red-500";
              bgColor = "bg-red-50";
              textColor = "text-red-800";
            }
          } else if (i === selectedAnswer) {
            borderColor = "border-indigo-500";
            bgColor = "bg-indigo-50";
            textColor = "text-indigo-800";
          }

          return (
            <button
              key={i}
              onClick={() => !isSubmitted && onSelectAnswer(i)}
              disabled={isSubmitted}
              className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${borderColor} ${bgColor} ${textColor} ${
                isSubmitted ? "cursor-default" : "cursor-pointer"
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  i === selectedAnswer
                    ? isSubmitted
                      ? i === question.correctIndex
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {OPTION_LETTERS[i]}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{option}</span>
            </button>
          );
        })}
      </div>

      {!isSubmitted && (
        <button
          onClick={onSubmit}
          disabled={selectedAnswer === null}
          className={`w-full py-3 rounded-lg font-semibold text-sm transition-all ${
            selectedAnswer !== null
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
