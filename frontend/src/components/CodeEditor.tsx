"use client";

import Editor from "@monaco-editor/react";

interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const LANGUAGE_MAP: Record<string, string> = {
  java: "java",
  python: "python",
  cpp: "cpp",
};

export default function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
}: CodeEditorProps) {
  return (
    <div className="rounded-lg overflow-hidden border border-gray-700">
      <Editor
        height="300px"
        language={LANGUAGE_MAP[language] || "plaintext"}
        value={value}
        onChange={(val) => onChange(val ?? "")}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          readOnly,
          domReadOnly: readOnly,
          tabSize: 4,
          wordWrap: "on",
        }}
      />
    </div>
  );
}
