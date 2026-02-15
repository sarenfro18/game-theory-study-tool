"use client";

import { useState } from "react";
import { glossaryTerms } from "@/lib/glossary-data";

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlossaryModal({ isOpen, onClose }: GlossaryModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = glossaryTerms.filter(
    (term) =>
      term.term.toLowerCase().includes(search.toLowerCase()) ||
      term.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Game Theory Glossary
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Terms */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex flex-col gap-4">
            {filtered.map((item) => (
              <div key={item.term}>
                <h3 className="text-sm font-bold text-indigo-700 mb-1">
                  {item.term}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.definition}
                </p>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">
                No matching terms found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
