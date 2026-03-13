"use client";

import React from "react";
import * as diff from "diff";

interface DiffViewerProps {
  expected: string;
  actual: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ expected, actual }) => {
  // Use character-level diffing for precise feedback
  const diffResult = diff.diffChars(expected, actual);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Expected Side */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Expected Output:</p>
        <div className="p-2 rounded bg-gray-900 border border-gray-700 text-xs text-gray-300 font-mono overflow-x-auto min-h-[3rem] leading-relaxed">
          {diffResult.map((part, index) => {
            if (part.added) return null; // Don't show added parts on the expected side
            return (
              <span
                key={index}
                className={part.removed ? "bg-red-500/20 text-red-100 line-through decoration-red-500/50" : ""}
                title={part.removed ? "Missing in your output" : ""}
              >
                {part.value === " " ? "\u00A0" : part.value}
              </span>
            );
          })}
        </div>
      </div>

      {/* Actual Side */}
      <div className="space-y-1">
        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Your Output:</p>
        <div className="p-2 rounded bg-gray-900 border border-gray-700 text-xs text-gray-300 font-mono overflow-x-auto min-h-[3rem] leading-relaxed">
          {diffResult.map((part, index) => {
            if (part.removed) return null; // Don't show removed parts on the actual side
            return (
              <span
                key={index}
                className={part.added ? "bg-green-500/20 text-green-100 font-bold" : ""}
                title={part.added ? "Unexpected character" : ""}
              >
                {part.value === " " ? "\u00A0" : part.value}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DiffViewer;
