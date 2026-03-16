"use client";

import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect, useState, FormEvent } from "react";

interface Question {
  id: number;
  examId: number;
  type: string;
  content: string;
  options: string | null;
  correctAnswer: string | null;
  testCases: string | null;
  marks: number;
  difficulty: string;
  language: string | null;
  bannedKeywords: string | null;
}

interface QRow {
  examId: number;
  type: string;
  content: string;
  options: string | null;
  correctAnswer: string | null;
  testCases: string | null;
  marks: number;
  difficulty: string;
  language: string | null;
  bannedKeywords: string | null;
}

interface Submission {
  id: number;
  userId: number;
  userName: string;
  registerNumber: string | null;
  examId: number;
  examTitle: string;
  score: number;
  submittedAt: string;
}

interface MalpracticeLog {
  id: number;
  userId: number;
  userName: string;
  examId: number;
  violationType: string;
  timestamp: string;
  totalViolations: number;
}

type Tab = "questions" | "submissions" | "malpractice";

export default function ExamDetailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [activeTab, setActiveTab] = useState<Tab>("questions");
  const [error, setError] = useState("");

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [qMode, setQMode] = useState<"single" | "csv" | "paste" | null>(null);
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [qType, setQType] = useState<"MCQ" | "CODING">("MCQ");
  const [qContent, setQContent] = useState("");
  const [qOptions, setQOptions] = useState('{"A":"","B":"","C":"","D":""}');
  const [qCorrectAnswer, setQCorrectAnswer] = useState("");
  const [qTestCases, setQTestCases] = useState('[{"input":"","expectedOutput":""}]');
  const [qMarks, setQMarks] = useState(1);
  const [qDifficulty, setQDifficulty] = useState("MEDIUM");
  const [qLanguage, setQLanguage] = useState("");
  const [qBannedKeywords, setQBannedKeywords] = useState("");
  const [savingQ, setSavingQ] = useState(false);

  // Bulk import state
  const [bulkType, setBulkType] = useState<"MCQ" | "CODING" | "HYBRID">("HYBRID");
  const [csvPreview, setCsvPreview] = useState<QRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [pastePreview, setPastePreview] = useState<QRow[]>([]);
  const [pasteError, setPasteError] = useState("");
  const [importing, setImporting] = useState(false);

  // Exam meta
  const [examTitle, setExamTitle] = useState("");
  const [examType, setExamType] = useState<"MCQ" | "CODING" | "HYBRID" | null>(null);

  // Smart Phase
  const [smartPhase, setSmartPhase] = useState(false);

  // Submissions state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSub, setLoadingSub] = useState(false);

  // Malpractice state
  const [malpractice, setMalpractice] = useState<MalpracticeLog[]>([]);
  const [loadingMal, setLoadingMal] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!loading) {
      const role = user?.role?.toUpperCase();
      if (!user || (role !== "MEDIATOR" && role !== "MODERATOR")) {
        router.replace("/login");
      }
    }
  }, [user, loading, router]);

  // Load exam meta + questions on mount
  useEffect(() => {
    const role = user?.role?.toUpperCase();
    if (user && (role === "MEDIATOR" || role === "MODERATOR")) {
      loadExam();
      loadQuestions();
    }
  }, [user]);

  async function loadExam() {
    try {
      const data = await apiFetch<{ id: number; title: string; examType: string }>(`/mediator/exams/${examId}`);
      setExamTitle(data.title);
      const et = (data.examType || "HYBRID").toUpperCase() as "MCQ" | "CODING" | "HYBRID";
      setExamType(et);
      // Lock bulk-import type to the exam's type so mediator isn't confused
      setBulkType(et);
    } catch {
      // title stays empty — header falls back gracefully
    }
  }

  async function loadQuestions() {
    setLoadingQ(true);
    try {
      const data = await apiFetch<Question[]>(`/mediator/questions/exam/${examId}`);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoadingQ(false);
    }
  }

  async function loadSubmissions() {
    setLoadingSub(true);
    try {
      const data = await apiFetch<Submission[]>(`/mediator/reports/submissions/exam/${examId}`);
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load submissions");
    } finally {
      setLoadingSub(false);
    }
  }

  async function loadMalpractice() {
    setLoadingMal(true);
    try {
      const data = await apiFetch<MalpracticeLog[]>(`/mediator/reports/malpractice/exam/${examId}`);
      setMalpractice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load malpractice logs");
    } finally {
      setLoadingMal(false);
    }
  }

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    if (tab === "submissions" && submissions.length === 0) loadSubmissions();
    if (tab === "malpractice" && malpractice.length === 0) loadMalpractice();
  }

  async function handleExportScores() {
    setExporting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/mediator/reports/exams/${examId}/export`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error("Export failed");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `exam_${examId}_scores.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export scores");
    } finally {
      setExporting(false);
    }
  }

  // Question form helpers
  function resetQForm() {
    setQType("MCQ");
    setQContent("");
    setQOptions('{"A":"","B":"","C":"","D":""}');
    setQCorrectAnswer("");
    setQTestCases('[{"input":"","expectedOutput":""}]');
    setQMarks(1);
    setQDifficulty("MEDIUM");
    setQLanguage("");
    setQBannedKeywords("");
    setEditingQId(null);
  }

  function startEditQ(q: Question) {
    setEditingQId(q.id);
    setQType(q.type as "MCQ" | "CODING");
    setQContent(q.content);
    setQOptions(q.options || '{"A":"","B":"","C":"","D":""}');
    setQCorrectAnswer(q.correctAnswer || "");
    setQTestCases(q.testCases || '[{"input":"","expectedOutput":""}]');
    setQMarks(q.marks ?? 1);
    setQDifficulty(q.difficulty ?? "MEDIUM");
    setQLanguage(q.language || "");
    setQBannedKeywords(q.bannedKeywords || "");
    setQMode("single");
  }

  async function handleQSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSavingQ(true);

    const body = JSON.stringify({
      examId: Number(examId),
      type: qType,
      content: qContent,
      options: qType === "MCQ" ? qOptions : null,
      correctAnswer: qType === "MCQ" ? qCorrectAnswer : null,
      testCases: qType === "CODING" ? qTestCases : null,
      language: qType === "CODING" ? qLanguage : null,
      bannedKeywords: qType === "CODING" && qBannedKeywords.trim() ? qBannedKeywords.trim() : null,
      marks: qMarks,
      difficulty: qDifficulty,
    });

    try {
      if (editingQId !== null) {
        const updated = await apiFetch<Question>(`/mediator/questions/${editingQId}`, {
          method: "PUT",
          body,
        });
        setQuestions((prev) => prev.map((q) => (q.id === editingQId ? updated : q)));
      } else {
        const created = await apiFetch<Question>("/mediator/questions", {
          method: "POST",
          body,
        });
        setQuestions((prev) => [...prev, created]);
      }
      resetQForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingQ(false);
    }
  }

  async function handleDeleteQ(id: number) {
    if (!confirm("Delete this question?")) return;
    setError("");
    try {
      await apiFetch(`/mediator/questions/${id}`, { method: "DELETE" });
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  /* ── CSV template download ── */
  function downloadCsvTemplate() {
    let rows: string[];
    let filename: string;

    if (bulkType === "MCQ") {
      rows = [
        "type,content,optionA,optionB,optionC,optionD,correctAnswer,marks,difficulty",
        'MCQ,"What is 2+2?","1","2","3","4",D,1,EASY',
        'MCQ,"Which planet is closest to the sun?","Mercury","Venus","Earth","Mars",A,2,MEDIUM',
        'MCQ,"What is the time complexity of binary search?","O(n)","O(log n)","O(n^2)","O(1)",B,3,HARD',
      ];
      filename = "mcq_questions_template.csv";
    } else if (bulkType === "CODING") {
      rows = [
        "type,content,testCasesInput,testCasesExpected,marks,difficulty,allowedLanguages,bannedKeywords",
        'CODING,"Write a function to return the sum of two numbers.","1 2","3",5,EASY,"Java,Python","for,while"',
        'CODING,"Reverse a string.","hello","olleh",5,MEDIUM,Python,',
        'CODING,"Find the nth Fibonacci number.","10","55",10,HARD,"C++,Java,Python",',

      ];
      filename = "coding_questions_template.csv";
    } else {
      // HYBRID — all columns
      rows = [
        "type,content,optionA,optionB,optionC,optionD,correctAnswer,testCasesInput,testCasesExpected,marks,difficulty,allowedLanguages,bannedKeywords",
        'MCQ,"What is 2+2?","1","2","3","4",D,,,1,EASY,,',
        'MCQ,"Which planet is closest to the sun?","Mercury","Venus","Earth","Mars",A,,,2,MEDIUM,,',
        'CODING,"Write a function to return the sum of two numbers.",,,,,, "1 2","3",5,EASY,"Java,Python","for,while"',
        'CODING,"Reverse a string.",,,,,, "hello","olleh",5,MEDIUM,Python,',

      ];
      filename = "hybrid_questions_template.csv";
    }

    const csv = rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ── CSV parse ── */
  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    setCsvError("");
    setCsvPreview([]);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length < 2) { setCsvError("File is empty or has no data rows."); return; }

        // Parse header to get column indices dynamically
        const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
        const col = (name: string) => headers.indexOf(name);

        const iType        = col("type");
        const iContent     = col("content");
        const iOptA        = col("optiona");
        const iOptB        = col("optionb");
        const iOptC        = col("optionc");
        const iOptD        = col("optiond");
        const iCorrect     = col("correctanswer");
        const iTcInput     = col("testcasesinput");
        const iTcExpected  = col("testcasesexpected");
        const iMarks       = col("marks");
        const iDifficulty  = col("difficulty");
        const iAllowedLang = col("allowedlanguages");
        const iLanguage    = iAllowedLang !== -1 ? iAllowedLang : col("language");
        const iBannedKw    = col("bannedkeywords");

        if (iType === -1 || iContent === -1) {
          setCsvError("CSV must have at least 'type' and 'content' columns.");
          return;
        }

        const rows: QRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          const rawType    = cols[iType]?.trim().toUpperCase() || "";
          const content    = cols[iContent]?.trim() || "";
          if (!rawType || !content) continue;

          const optA       = iOptA       !== -1 ? cols[iOptA]?.trim()      || "" : "";
          const optB       = iOptB       !== -1 ? cols[iOptB]?.trim()      || "" : "";
          const optC       = iOptC       !== -1 ? cols[iOptC]?.trim()      || "" : "";
          const optD       = iOptD       !== -1 ? cols[iOptD]?.trim()      || "" : "";
          const correct    = iCorrect    !== -1 ? cols[iCorrect]?.trim()   || "" : "";
          const tcInput    = iTcInput    !== -1 ? cols[iTcInput]?.trim()   || "" : "";
          const tcExpected = iTcExpected !== -1 ? cols[iTcExpected]?.trim()|| "" : "";
          const marksRaw   = iMarks      !== -1 ? cols[iMarks]?.trim()     || "1" : "1";
          const diff       = iDifficulty !== -1 ? cols[iDifficulty]?.trim().toUpperCase() || "MEDIUM" : "MEDIUM";

          rows.push({
            examId: Number(examId),
            type: rawType,
            content,
            options: rawType === "MCQ" ? JSON.stringify({ A: optA, B: optB, C: optC, D: optD }) : null,
            correctAnswer: rawType === "MCQ" ? correct || null : null,
            testCases: rawType === "CODING" && tcInput && tcExpected
              ? JSON.stringify([{ input: tcInput, expectedOutput: tcExpected }])
              : null,
            marks: parseInt(marksRaw) || 1,
            difficulty: diff,
            language: rawType === "CODING" && iLanguage !== -1 ? cols[iLanguage]?.trim() || null : null,
            bannedKeywords: rawType === "CODING" && iBannedKw !== -1 ? cols[iBannedKw]?.trim() || null : null,
          });
        }
        if (rows.length === 0) setCsvError("No valid rows found. Check the template format.");
        else setCsvPreview(rows);
      } catch {
        setCsvError("Failed to parse CSV. Make sure you downloaded the correct template.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === "," && !inQuotes) { result.push(cur); cur = ""; continue; }
      cur += ch;
    }
    result.push(cur);
    return result;
  }

  /* ── AI paste parse ── */
  function getAiPromptFormat(type: "MCQ" | "CODING" | "HYBRID") {
    if (type === "MCQ") {
      return `Generate MCQ questions in the following JSON array format:
[
  {
    "type": "MCQ",
    "content": "What is the time complexity of binary search?",
    "optionA": "O(n)",
    "optionB": "O(log n)",
    "optionC": "O(n^2)",
    "optionD": "O(1)",
    "correctAnswer": "B",
    "marks": 2,
    "difficulty": "MEDIUM"
  },
  {
    "type": "MCQ",
    "content": "Which data structure uses LIFO order?",
    "optionA": "Queue",
    "optionB": "Heap",
    "optionC": "Stack",
    "optionD": "Tree",
    "correctAnswer": "C",
    "marks": 1,
    "difficulty": "EASY"
  }
]
Generate only MCQ type. Do not include testCases.`;
    }
    if (type === "CODING") {
      return `Generate coding questions in the following JSON array format:
[
  {
    "type": "CODING",
    "content": "Write a function that returns the sum of two numbers.",
    "testCases": [
      { "input": "1 2", "expectedOutput": "3" },
      { "input": "10 20", "expectedOutput": "30" }
    ],
    "marks": 5,
    "difficulty": "EASY",
    "allowedLanguages": ["java","python"],
    "bannedKeywords": "for,while"
  },
  {
    "type": "CODING",
    "content": "Given a string, return its reverse.",
    "testCases": [
      { "input": "hello", "expectedOutput": "olleh" },
      { "input": "world", "expectedOutput": "dlrow" }
    ],
    "marks": 5,
    "difficulty": "MEDIUM",
    "allowedLanguages": ["python"],
    "bannedKeywords": ""
  }
]
Generate only CODING type. Do not include optionA/B/C/D or correctAnswer. Add an "allowedLanguages" field (array of allowed languages, e.g. ["java","python","cpp"] — use empty array [] to allow any language). Add a "bannedKeywords" field (comma-separated keywords students must NOT use, e.g. "for,while,sort") — leave empty string if no restriction.`;
    }
    // HYBRID
    return `Paste questions in the following JSON array format (mix of MCQ and CODING).

RULES:
- MCQ must have: type, content, optionA, optionB, optionC, optionD, correctAnswer (A/B/C/D), marks, difficulty
- CODING must have: type, content, testCases (array of {input, expectedOutput}), marks, difficulty, allowedLanguages, bannedKeywords
- difficulty must be: EASY | MEDIUM | HARD
- allowedLanguages (CODING only): array of allowed languages, e.g. ["java","python","cpp"] — use empty array [] to allow any language
- bannedKeywords (CODING only): comma-separated keywords students must NOT use (e.g. "for,while,sort") — use empty string if no restriction

[
  {
    "type": "MCQ",
    "content": "What is the output of: System.out.println(10 / 3); in Java?",
    "optionA": "3.33",
    "optionB": "3",
    "optionC": "3.0",
    "optionD": "Compilation error",
    "correctAnswer": "B",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "Which keyword is used to inherit a class in Java?",
    "optionA": "implements",
    "optionB": "super",
    "optionC": "extends",
    "optionD": "inherits",
    "correctAnswer": "C",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "In C, which function dynamically allocates a block of memory?",
    "optionA": "calloc",
    "optionB": "malloc",
    "optionC": "alloc",
    "optionD": "new",
    "correctAnswer": "B",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "What does the following C code print?\\n\\nint x = 5;\\nprintf(\\\"%d\\\", x++);",
    "optionA": "6",
    "optionB": "5",
    "optionC": "4",
    "optionD": "Undefined behavior",
    "correctAnswer": "B",
    "marks": 3,
    "difficulty": "MEDIUM"
  },
  {
    "type": "MCQ",
    "content": "Which declaration correctly creates a pointer to an integer in C?",
    "optionA": "int ptr;",
    "optionB": "int &ptr;",
    "optionC": "int *ptr;",
    "optionD": "pointer int ptr;",
    "correctAnswer": "C",
    "marks": 2,
    "difficulty": "MEDIUM"
  },
  {
    "type": "CODING",
    "content": "Write a program that reads a positive integer N and prints the Nth Fibonacci number (0-indexed).\\n\\nfib(0)=0, fib(1)=1, fib(6)=8\\n\\nInput: A single integer N (0 <= N <= 20)\\nOutput: The Nth Fibonacci number",
    "testCases": [
      { "input": "0", "expectedOutput": "0" },
      { "input": "1", "expectedOutput": "1" },
      { "input": "6", "expectedOutput": "8" },
      { "input": "10", "expectedOutput": "55" }
    ],
    "marks": 10,
    "difficulty": "EASY",
    "allowedLanguages": ["java","python"],
    "bannedKeywords": "for,while"
  },
  {
    "type": "CODING",
    "content": "Write a program that reads N integers and prints the maximum value.\\n\\nInput:\\n- First line: integer N (1 <= N <= 100)\\n- Second line: N space-separated integers\\nOutput: The maximum integer",
    "testCases": [
      { "input": "5\\n3 7 1 9 4", "expectedOutput": "9" },
      { "input": "3\\n-2 -5 -1", "expectedOutput": "-1" },
      { "input": "1\\n42", "expectedOutput": "42" },
      { "input": "4\\n10 10 10 10", "expectedOutput": "10" }
    ],
    "marks": 10,
    "difficulty": "MEDIUM",
    "allowedLanguages": ["python","cpp"],
    "bannedKeywords": ""
  }
]
MCQ questions must NOT include an allowedLanguages field. CODING questions must include "allowedLanguages" — an array of allowed languages (e.g. [\"java\",\"python\",\"cpp\"]), use empty array [] to allow any language. CODING questions must include "bannedKeywords" — comma-separated keywords students must NOT use (e.g. \"for,while,sort\"), use empty string if no restriction.`;
  }

  function copyAiPrompt() {
    navigator.clipboard.writeText(getAiPromptFormat(bulkType));
  }

  function parsePasteText() {
    setPasteError("");
    setPastePreview([]);
    try {
      const arr = JSON.parse(pasteText);
      if (!Array.isArray(arr)) throw new Error("Must be a JSON array");
      const rows: QRow[] = arr.map((item: Record<string, unknown>) => {
        const t = String(item.type || "").toUpperCase();
        const tcRaw = item.testCases;
        let testCasesJson: string | null = null;
        if (t === "CODING" && Array.isArray(tcRaw)) {
          testCasesJson = JSON.stringify(tcRaw.map((tc: Record<string, unknown>) => ({
            input: tc.input, expectedOutput: tc.expectedOutput ?? tc.expected
          })));
        }
        return {
          examId: Number(examId),
          type: t,
          content: String(item.content || ""),
          options: t === "MCQ" ? JSON.stringify({ A: item.optionA, B: item.optionB, C: item.optionC, D: item.optionD }) : null,
          correctAnswer: t === "MCQ" ? String(item.correctAnswer || "") : null,
          testCases: testCasesJson,
          marks: Number(item.marks) || 1,
          difficulty: String(item.difficulty || "MEDIUM").toUpperCase(),
          language: t === "CODING" ? (
            item.allowedLanguages
              ? (Array.isArray(item.allowedLanguages) ? item.allowedLanguages.join(',') : String(item.allowedLanguages))
              : item.language ? String(item.language) : null
          ) : null,
          bannedKeywords: t === "CODING" && item.bannedKeywords ? String(item.bannedKeywords) : null,
        };
      });
      if (rows.length === 0) setPasteError("Array is empty.");
      else setPastePreview(rows);
    } catch (err) {
      setPasteError(err instanceof Error ? err.message : "Invalid JSON");
    }
  }

  /* ── Apply forced question type to bulk rows ── */
  function applyBulkType(rows: QRow[]): QRow[] {
    if (bulkType === "HYBRID") return rows;
    return rows.map((r) => ({
      ...r,
      type: bulkType,
      options: bulkType === "MCQ" ? (r.options ?? '{"A":"","B":"","C":"","D":""}') : null,
      correctAnswer: bulkType === "MCQ" ? (r.correctAnswer ?? "") : null,
      testCases: bulkType === "CODING" ? (r.testCases ?? '[{"input":"","expectedOutput":""}]') : null,
    }));
  }

  /* ── Bulk import submit ── */
  async function handleBulkImport(rows: QRow[]) {
    setImporting(true);
    setError("");
    try {
      const created = await apiFetch<Question[]>("/mediator/questions/bulk", {
        method: "POST",
        body: JSON.stringify(rows),
      });
      setQuestions((prev) => [...prev, ...created]);
      setCsvPreview([]);
      setPastePreview([]);
      setPasteText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setImporting(false);
    }
  }

  /* ── Smart Phase sort helper ── */
  const DIFF_ORDER: Record<string, number> = { HARD: 0, MEDIUM: 1, EASY: 2 };
  function sortedQuestions(qs: Question[]) {
    if (!smartPhase) return qs;
    return [...qs].sort((a, b) =>
      (DIFF_ORDER[a.difficulty] ?? 1) - (DIFF_ORDER[b.difficulty] ?? 1)
    );
  }

  if (loading) return null;
  const userRole = user?.role?.toUpperCase();
  if (!user || (userRole !== "MEDIATOR" && userRole !== "MODERATOR")) return null;

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg cursor-pointer transition-colors ${
      activeTab === t
        ? "bg-gray-800 text-white"
        : "text-gray-400 hover:text-gray-200"
    }`;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back + header */}
        <button
          onClick={() => router.push("/mediator")}
          className="text-sm text-gray-400 hover:text-white mb-4 cursor-pointer"
        >
          ← Back to Exams
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">
            {examTitle || `Exam #${examId}`}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">ID: #{examId}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-900/50 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-0">
          <button onClick={() => switchTab("questions")} className={tabClass("questions")}>
            Questions ({questions.length})
          </button>
          <button onClick={() => switchTab("submissions")} className={tabClass("submissions")}>
            Submissions
          </button>
          <button onClick={() => switchTab("malpractice")} className={tabClass("malpractice")}>
            Malpractice
          </button>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-b-xl rounded-tr-xl p-6">
          {/* ====== QUESTIONS TAB ====== */}
          {activeTab === "questions" && (
            <div>
              {/* ── Section header ── */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-semibold text-white">
                    Questions <span className="text-gray-400 font-normal">({questions.length})</span>
                  </h2>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={smartPhase}
                      onChange={(e) => setSmartPhase(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-500"
                    />
                    <span className="text-xs text-gray-400">Smart Phase</span>
                  </label>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setQMode(qMode === "single" ? null : "single"); resetQForm(); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      qMode === "single"
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-transparent border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-400"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Question
                  </button>
                  <button
                    onClick={() => { setQMode(qMode === "csv" ? null : "csv"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      qMode === "csv"
                        ? "bg-emerald-700 border-emerald-500 text-white"
                        : "bg-transparent border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Upload Excel/CSV
                  </button>
                  <button
                    onClick={() => { setQMode(qMode === "paste" ? null : "paste"); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                      qMode === "paste"
                        ? "bg-violet-700 border-violet-500 text-white"
                        : "bg-transparent border-gray-600 text-gray-300 hover:border-violet-500 hover:text-violet-400"
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Smart Paste
                  </button>
                </div>
              </div>

              {/* ── Single Add panel ── */}
              {qMode === "single" && (
                <form onSubmit={handleQSubmit} className="mb-4 p-4 bg-gray-800/80 border border-gray-700 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-200">
                      {editingQId ? "✏️ Edit Question" : "➕ New Question"}
                    </h3>
                    <button type="button" onClick={() => { resetQForm(); setQMode(null); }}
                      className="text-gray-500 hover:text-gray-300 cursor-pointer text-xs">✕ Close</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Type</label>
                      <select value={qType} onChange={(e) => setQType(e.target.value as "MCQ" | "CODING")}
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="MCQ">MCQ</option>
                        <option value="CODING">CODING</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Marks</label>
                      <input type="number" min={1} value={qMarks}
                        onChange={(e) => setQMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-400 mb-1.5">Difficulty</label>
                      <div className="flex gap-2">
                        {[
                          { val: "EASY",   color: "emerald", emoji: "🟢" },
                          { val: "MEDIUM", color: "yellow",  emoji: "🟡" },
                          { val: "HARD",   color: "red",     emoji: "🔴" }
                        ].map((d) => (
                          <button
                            key={d.val}
                            type="button"
                            onClick={() => setQDifficulty(d.val)}
                            className={`flex-1 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border outline-none cursor-pointer flex items-center justify-center gap-1.5 ${
                              qDifficulty === d.val
                                ? d.color === "emerald" ? "bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                                  : d.color === "yellow" ? "bg-amber-500 text-white border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                                  : "bg-red-600 text-white border-red-500 shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                                : d.color === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/20"
                                  : d.color === "yellow" ? "bg-amber-500/10 text-amber-400 border-amber-500/40 hover:bg-amber-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/40 hover:bg-red-500/20"
                            }`}
                          >
                            <span>{d.emoji}</span>
                            <span>{d.val}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Question</label>
                    <textarea required rows={3} value={qContent}
                      onChange={(e) => setQContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the question text..." />
                  </div>
                  {qType === "MCQ" && (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Options (JSON)</label>
                        <textarea rows={2} value={qOptions} onChange={(e) => setQOptions(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Correct Answer (e.g. A)</label>
                        <input type="text" value={qCorrectAnswer} onChange={(e) => setQCorrectAnswer(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                  {qType === "CODING" && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-2">
                          Allowed Languages <span className="text-gray-600">(select one or more — leave all unselected for "Any")</span>
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {["Java", "Python", "C++", "C", "C#", "JavaScript"].map((lang) => {
                            const isSelected = qLanguage.split(',').map(l => l.trim().toLowerCase()).includes(lang.toLowerCase());
                            return (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => {
                                  const currentLangs = qLanguage.split(',').map(l => l.trim()).filter(Boolean);
                                  const index = currentLangs.findIndex(l => l.toLowerCase() === lang.toLowerCase());
                                  if (index > -1) {
                                    currentLangs.splice(index, 1);
                                  } else {
                                    currentLangs.push(lang);
                                  }
                                  setQLanguage(currentLangs.join(', '));
                                }}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border cursor-pointer ${
                                  isSelected
                                    ? "bg-purple-600 text-white border-purple-400 shadow-[0_0_8px_rgba(147,51,234,0.3)]"
                                    : "bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-500 hover:text-gray-300"
                                }`}
                              >
                                {lang}
                              </button>
                            );
                          })}
                          {qLanguage && (
                            <button
                              type="button"
                              onClick={() => setQLanguage("")}
                              className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase text-red-400 border border-red-900/50 bg-red-950/20 hover:bg-red-900/30 transition-colors cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                        </div>
                        {!qLanguage && (
                          <p className="text-[10px] text-gray-500 italic">No restriction: Students can use any supported language.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">
                          Banned Keywords{" "}
                          <span className="text-gray-600">(comma-separated, e.g. <span className="font-mono">for,while,import</span>)</span>
                        </label>
                        <input
                          type="text"
                          value={qBannedKeywords}
                          onChange={(e) => setQBannedKeywords(e.target.value)}
                          placeholder="e.g. for,while,sort  (leave blank for no question-level restriction)"
                          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                        />
                        {qBannedKeywords.trim() && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {qBannedKeywords.split(',').map(k => k.trim()).filter(Boolean).map(kw => (
                              <span key={kw} className="bg-red-700/60 text-red-200 text-xs px-2 py-0.5 rounded-full">🚫 {kw}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Test Cases (JSON array)</label>
                        <textarea rows={4} value={qTestCases} onChange={(e) => setQTestCases(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button type="submit" disabled={savingQ}
                      className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed">
                      {savingQ ? "Saving..." : editingQId ? "Update Question" : "Add Question"}
                    </button>
                    <button type="button" onClick={resetQForm}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer">
                      {editingQId ? "Cancel Edit" : "Clear"}
                    </button>
                  </div>
                </form>
              )}

              {/* ── Upload CSV/Excel panel ── */}
              {qMode === "csv" && (
                <div className="mb-4 p-4 bg-gray-800/80 border border-gray-700 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-200">Upload Excel / CSV</h3>
                    <button onClick={() => { setQMode(null); setCsvPreview([]); setCsvError(""); if (examType) setBulkType(examType); }}
                      className="text-gray-500 hover:text-gray-300 cursor-pointer text-xs">✕ Close</button>
                  </div>
                  {/* Type selector — locked to exam type */}
                  {examType === null ? (
                    <p className="text-xs text-gray-500">Loading exam type...</p>
                  ) : examType === "HYBRID" ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-medium">Sub-type:</span>
                      {(["MCQ", "CODING", "HYBRID"] as const).map((t) => (
                        <button key={t} onClick={() => setBulkType(t)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            bulkType === t
                              ? t === "MCQ" ? "bg-blue-700 border border-blue-500 text-white"
                                : t === "CODING" ? "bg-purple-700 border border-purple-500 text-white"
                                : "bg-gray-600 border border-gray-400 text-white"
                              : "bg-transparent border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                          }`}>
                          {t === "HYBRID" ? "HYBRID (mixed)" : t}
                        </button>
                      ))}
                      <span className="text-xs text-gray-600">
                        {bulkType === "HYBRID" ? "Keep type per row from file" : `All rows will be imported as ${bulkType}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">Question type:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        examType === "MCQ" ? "bg-blue-700 border-blue-500 text-white" : "bg-purple-700 border-purple-500 text-white"
                      }`}>{examType}</span>
                      <span className="text-xs text-gray-500">This exam only accepts {examType} questions</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 items-center">
                    <button onClick={downloadCsvTemplate}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600 text-sm font-medium transition-colors cursor-pointer">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download {bulkType === "MCQ" ? "MCQ" : bulkType === "CODING" ? "Coding" : "Hybrid"} Template
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium transition-colors cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Choose File
                      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleCsvFile} className="hidden" />
                    </label>
                    <span className="text-xs text-gray-500">
                      Download the <span className="text-gray-300 font-medium">{bulkType === "MCQ" ? "MCQ" : bulkType === "CODING" ? "Coding" : "Hybrid"} template</span>, fill it in, then upload here
                    </span>
                  </div>
                  {bulkType !== "MCQ" && (
                    <p className="text-xs text-gray-500 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2">
                      <span className="text-gray-400 font-medium">CODING columns:</span>{" "}
                      <span className="font-mono text-gray-400">type, content, testCasesInput, testCasesExpected, marks, difficulty, <span className="text-violet-400 font-semibold">language</span>, <span className="text-red-400 font-semibold">bannedKeywords</span></span>
                      <br />
                      <span className="text-gray-600">language: </span>
                      <span className="font-mono text-gray-500">java | python | cpp | javascript | c | csharp</span>
                      <span className="text-gray-600"> &nbsp;&middot;&nbsp; bannedKeywords: </span>
                      <span className="font-mono text-gray-500">comma-separated, e.g. <span className="text-red-400">for,while,import</span> (optional)</span>
                    </p>
                  )}
                  {csvError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{csvError}</p>}
                  {csvPreview.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-300 mb-2 font-medium">{csvPreview.length} question(s) ready to import</p>
                      <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-700/60 text-gray-400">
                            <tr>
                              <th className="px-3 py-2">#</th>
                              <th className="px-3 py-2">Type</th>
                              <th className="px-3 py-2">Question</th>
                              <th className="px-3 py-2">Marks</th>
                              <th className="px-3 py-2">Difficulty</th>
                              <th className="px-3 py-2">Language</th>
                              <th className="px-3 py-2">Banned KW</th>
                            </tr>
                          </thead>
                          <tbody>
                            {csvPreview.map((r, i) => (
                              <tr key={i} className="border-t border-gray-700/60 hover:bg-gray-700/20">
                                <td className="px-3 py-2 text-gray-500">{i+1}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    (bulkType !== "HYBRID" ? bulkType : r.type) === "CODING" ? "bg-purple-900/60 text-purple-300" : "bg-blue-900/60 text-blue-300"
                                  }`}>{bulkType !== "HYBRID" ? bulkType : r.type}</span>
                                </td>
                                <td className="px-3 py-2 max-w-xs truncate text-gray-200">{r.content}</td>
                                <td className="px-3 py-2 text-gray-300">{r.marks}</td>
                                <td className="px-3 py-2">
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    r.difficulty === "HARD"
                                      ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                      : r.difficulty === "EASY"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                      : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                                  }`}>{r.difficulty}</span>
                                </td>
                                <td className="px-3 py-2 text-gray-400">{r.language ?? <span className="text-gray-600">—</span>}</td>
                                <td className="px-3 py-2 text-red-400 font-mono text-xs">{r.bannedKeywords ?? <span className="text-gray-600">—</span>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button onClick={() => handleBulkImport(applyBulkType(csvPreview))} disabled={importing}
                        className="mt-3 px-5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed">
                        {importing ? "Importing..." : `Import All (${csvPreview.length} questions${bulkType !== "HYBRID" ? ` as ${bulkType}` : ""})`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── Smart Paste panel ── */}
              {qMode === "paste" && (
                <div className="mb-4 p-4 bg-gray-800/80 border border-gray-700 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-200">Smart Paste from AI</h3>
                    <button onClick={() => { setQMode(null); setPasteText(""); setPastePreview([]); setPasteError(""); if (examType) setBulkType(examType); }}
                      className="text-gray-500 hover:text-gray-300 cursor-pointer text-xs">✕ Close</button>
                  </div>
                  {/* Type selector — locked to exam type */}
                  {examType === null ? (
                    <p className="text-xs text-gray-500">Loading exam type...</p>
                  ) : examType === "HYBRID" ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-medium">Sub-type:</span>
                      {(["MCQ", "CODING", "HYBRID"] as const).map((t) => (
                        <button key={t} onClick={() => setBulkType(t)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                            bulkType === t
                              ? t === "MCQ" ? "bg-blue-700 border border-blue-500 text-white"
                                : t === "CODING" ? "bg-purple-700 border border-purple-500 text-white"
                                : "bg-gray-600 border border-gray-400 text-white"
                              : "bg-transparent border border-gray-600 text-gray-400 hover:border-gray-400 hover:text-gray-200"
                          }`}>
                          {t === "HYBRID" ? "HYBRID (mixed)" : t}
                        </button>
                      ))}
                      <span className="text-xs text-gray-600">
                        {bulkType === "HYBRID" ? "Keep type per item from JSON" : `All questions will be imported as ${bulkType}`}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">Question type:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        examType === "MCQ" ? "bg-blue-700 border-blue-500 text-white" : "bg-purple-700 border-purple-500 text-white"
                      }`}>{examType}</span>
                      <span className="text-xs text-gray-500">This exam only accepts {examType} questions</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 items-start">
                    <button onClick={copyAiPrompt}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 text-sm font-medium transition-colors cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy {bulkType === "MCQ" ? "MCQ" : bulkType === "CODING" ? "Coding" : "Hybrid"} Prompt
                    </button>
                    <p className="text-xs text-gray-500 leading-relaxed pt-1">
                      Copy the <span className="text-gray-300 font-medium">{bulkType === "MCQ" ? "MCQ" : bulkType === "CODING" ? "Coding" : "Hybrid"} prompt</span> to paste into ChatGPT/Claude to<br/>copy the JSON response and paste it below
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Paste JSON here</label>
                    <textarea rows={14} value={pasteText}
                      onChange={(e) => { setPasteText(e.target.value); setPastePreview([]); setPasteError(""); }}
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
                      placeholder={bulkType === "MCQ"
                        ? `[
  {
    "type": "MCQ",
    "content": "What is the output of: System.out.println(10 / 3); in Java?",
    "optionA": "3.33",
    "optionB": "3",
    "optionC": "3.0",
    "optionD": "Compilation error",
    "correctAnswer": "B",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "Which keyword is used to inherit a class in Java?",
    "optionA": "implements",
    "optionB": "super",
    "optionC": "extends",
    "optionD": "inherits",
    "correctAnswer": "C",
    "marks": 2,
    "difficulty": "EASY"
  }
]`
                        : bulkType === "CODING"
                        ? `[
  {
    "type": "CODING",
    "content": "Write a program that reads two integers and prints their sum.\\n\\nInput: Two space-separated integers\\nOutput: Their sum",
    "testCases": [
      { "input": "3 5", "expectedOutput": "8" },
      { "input": "10 20", "expectedOutput": "30" },
      { "input": "-4 4", "expectedOutput": "0" }
    ],
    "marks": 5,
    "difficulty": "EASY",
    "language": "java",
    "bannedKeywords": "for,while"
  },
  {
    "type": "CODING",
    "content": "Write a program that reads a string and prints its reverse.\\n\\nInput: A single string (no spaces)\\nOutput: The reversed string",
    "testCases": [
      { "input": "hello", "expectedOutput": "olleh" },
      { "input": "java", "expectedOutput": "avaj" },
      { "input": "abcd", "expectedOutput": "dcba" }
    ],
    "marks": 5,
    "difficulty": "MEDIUM",
    "language": "python",
    "bannedKeywords": ""
  }
]`
                        : `[
  {
    "type": "MCQ",
    "content": "What is the output of: System.out.println(10 / 3); in Java?",
    "optionA": "3.33",
    "optionB": "3",
    "optionC": "3.0",
    "optionD": "Compilation error",
    "correctAnswer": "B",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "Which keyword is used to inherit a class in Java?",
    "optionA": "implements",
    "optionB": "super",
    "optionC": "extends",
    "optionD": "inherits",
    "correctAnswer": "C",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "In C, which function is used to dynamically allocate a block of memory?",
    "optionA": "calloc",
    "optionB": "malloc",
    "optionC": "alloc",
    "optionD": "new",
    "correctAnswer": "B",
    "marks": 2,
    "difficulty": "EASY"
  },
  {
    "type": "MCQ",
    "content": "What does the following C code print?\\n  int x = 5; printf(\\\"%d\\\", x++);",
    "optionA": "6",
    "optionB": "5",
    "optionC": "4",
    "optionD": "Undefined behavior",
    "correctAnswer": "B",
    "marks": 3,
    "difficulty": "MEDIUM"
  },
  {
    "type": "MCQ",
    "content": "Which of the following correctly declares a pointer to an integer in C?",
    "optionA": "int ptr;",
    "optionB": "int &ptr;",
    "optionC": "int *ptr;",
    "optionD": "pointer int ptr;",
    "correctAnswer": "C",
    "marks": 2,
    "difficulty": "MEDIUM"
  },
  {
    "type": "CODING",
    "content": "Write a program that reads a positive integer N and prints the Nth Fibonacci number (0-indexed).\\nfib(0)=0, fib(1)=1, fib(6)=8\\n\\nInput: A single integer N (0 <= N <= 20)\\nOutput: The Nth Fibonacci number",
    "testCases": [
      { "input": "0", "expectedOutput": "0" },
      { "input": "1", "expectedOutput": "1" },
      { "input": "6", "expectedOutput": "8" },
      { "input": "10", "expectedOutput": "55" }
    ],
    "marks": 10,
    "difficulty": "EASY",
    "language": "java",
    "bannedKeywords": "for,while"
  },
  {
    "type": "CODING",
    "content": "Write a program that reads N integers and prints the maximum value.\\n\\nInput:\\n  Line 1: integer N (1 <= N <= 100)\\n  Line 2: N space-separated integers\\nOutput: The maximum integer",
    "testCases": [
      { "input": "5\\n3 7 1 9 4", "expectedOutput": "9" },
      { "input": "3\\n-2 -5 -1", "expectedOutput": "-1" },
      { "input": "1\\n42", "expectedOutput": "42" },
      { "input": "4\\n10 10 10 10", "expectedOutput": "10" }
    ],
    "marks": 10,
    "difficulty": "MEDIUM",
    "language": "python",
    "bannedKeywords": ""
  }
]`
                      } />
                  </div>
                  {bulkType !== "MCQ" && (
                    <p className="text-xs text-gray-500 bg-gray-900/60 border border-gray-700 rounded-lg px-3 py-2">
                      <span className="text-gray-400 font-medium">CODING questions must include:</span>{" "}
                      <span className="font-mono text-violet-400 font-semibold">"language"</span>
                      <span className="text-gray-500"> — one of: </span>
                      <span className="font-mono text-gray-400">java &nbsp;|&nbsp; python &nbsp;|&nbsp; cpp &nbsp;|&nbsp; javascript &nbsp;|&nbsp; c &nbsp;|&nbsp; csharp</span>
                      <span className="text-gray-600"> &nbsp;&middot;&nbsp; </span>
                      <span className="font-mono text-red-400 font-semibold">"bannedKeywords"</span>
                      <span className="text-gray-500"> — comma-separated (e.g. </span>
                      <span className="font-mono text-red-400">"for,while,sort"</span>
                      <span className="text-gray-500">) or empty string if no restriction</span>
                    </p>
                  )}
                  {pasteError && <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{pasteError}</p>}
                  <div className="flex gap-2">
                    <button onClick={parsePasteText}
                      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-medium transition-colors cursor-pointer">
                      Preview &amp; Validate
                    </button>
                    {pastePreview.length > 0 && (
                      <button onClick={() => handleBulkImport(applyBulkType(pastePreview))} disabled={importing}
                        className="px-5 py-2 rounded-lg bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed">
                        {importing ? "Importing..." : `Import All (${pastePreview.length} questions${bulkType !== "HYBRID" ? ` as ${bulkType}` : ""})`}
                      </button>
                    )}
                  </div>
                  {pastePreview.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-700/60 text-gray-400">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Question</th>
                            <th className="px-3 py-2">Marks</th>
                            <th className="px-3 py-2">Difficulty</th>
                            <th className="px-3 py-2">Language</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastePreview.map((r, i) => (
                            <tr key={i} className="border-t border-gray-700/60 hover:bg-gray-700/20">
                              <td className="px-3 py-2 text-gray-500">{i+1}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  (bulkType !== "HYBRID" ? bulkType : r.type) === "CODING" ? "bg-purple-900/60 text-purple-300" : "bg-blue-900/60 text-blue-300"
                                }`}>{bulkType !== "HYBRID" ? bulkType : r.type}</span>
                              </td>
                              <td className="px-3 py-2 max-w-xs truncate text-gray-200">{r.content}</td>
                              <td className="px-3 py-2 text-gray-300">{r.marks}</td>
                              <td className="px-3 py-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  r.difficulty === "HARD"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/50"
                                    : r.difficulty === "EASY"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50"
                                }`}>{r.difficulty}</span>
                              </td>
                              <td className="px-3 py-2 text-gray-400">{r.language ?? <span className="text-gray-600">—</span>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Questions list ── */}
              <div className="mt-2 border border-gray-800 rounded-xl overflow-hidden">
                {loadingQ ? (
                  <div className="flex items-center justify-center py-16 text-gray-500 text-sm">Loading questions...</div>
                ) : questions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                    <svg className="w-10 h-10 mb-3 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-sm">No questions added yet.</p>
                    <p className="text-xs text-gray-600 mt-1">Use the buttons above to add or import questions.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {sortedQuestions(questions).map((q, idx) => (
                      <div key={q.id} className="p-4 hover:bg-gray-800/40 transition-colors">
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">#{idx + 1}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              q.type === "CODING" ? "bg-purple-900/60 text-purple-300" : "bg-blue-900/60 text-blue-300"
                            }`}>{q.type}</span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              q.difficulty === "HARD" ? "bg-red-500/20 text-red-400 border border-red-500/50" :
                              q.difficulty === "MEDIUM" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" :
                              "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                            }`}>{q.difficulty ?? "MEDIUM"}</span>
                            <span className="text-xs text-gray-500">{q.marks ?? 1} mark{(q.marks ?? 1) !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => startEditQ(q)}
                              className="px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-xs font-medium transition-colors cursor-pointer">
                              Edit
                            </button>
                            <button onClick={() => handleDeleteQ(q.id)}
                              className="px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-700 text-red-300 text-xs font-medium transition-colors cursor-pointer">
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-200 leading-relaxed">{q.content}</p>
                        {q.type === "MCQ" && q.options && (
                          <p className="mt-1 text-xs text-gray-500">
                            Options: {q.options} &middot; Answer: <span className="text-green-400 font-medium">{q.correctAnswer}</span>
                          </p>
                        )}
                        {q.type === "CODING" && q.testCases && (
                          <p className="mt-1 text-xs text-gray-500 font-mono">Test cases: {q.testCases}</p>
                        )}
                        {q.type === "CODING" && q.bannedKeywords && (
                          <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                            <span className="text-xs text-gray-500">Banned:</span>
                            {q.bannedKeywords.split(",").map((kw) => kw.trim()).filter(Boolean).map((kw) => (
                              <span key={kw} className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-xs font-mono border border-red-800/60">
                                🚫 {kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ====== SUBMISSIONS TAB ====== */}
          {activeTab === "submissions" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-white">Exam Submissions</h2>
                <button
                  onClick={handleExportScores}
                  disabled={exporting || submissions.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {exporting ? "Exporting..." : "Download Excel Report"}
                </button>
              </div>

              {loadingSub ? (
                <p className="text-gray-500 text-sm">Loading submissions...</p>
              ) : submissions.length === 0 ? (
                <p className="text-gray-500 text-sm">No submissions yet.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-gray-400 text-sm font-medium">Student</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Register No</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Score</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-800/50">
                        <td className="py-3 text-gray-100">{s.userName}</td>
                        <td className="py-3 text-gray-400 text-sm">{s.registerNumber || "N/A"}</td>
                        <td className="py-3">
                          <span className={s.score >= 50 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                            {s.score}%
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-sm">
                          {new Date(s.submittedAt).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* ====== MALPRACTICE TAB ====== */}
          {activeTab === "malpractice" && (
            <div>
              {loadingMal ? (
                <p className="text-gray-500 text-sm">Loading malpractice logs...</p>
              ) : malpractice.length === 0 ? (
                <p className="text-gray-500 text-sm">No violations recorded.</p>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="pb-2 text-gray-400 text-sm font-medium">Student</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Violation</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Total</th>
                      <th className="pb-2 text-gray-400 text-sm font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {malpractice.map((m) => (
                      <tr key={m.id} className="border-b border-gray-800/50">
                        <td className="py-3">{m.userName}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded bg-yellow-900/50 text-yellow-300 text-xs font-medium">
                            {m.violationType}
                          </span>
                        </td>
                        <td className="py-3 text-red-400 font-medium">{m.totalViolations}</td>
                        <td className="py-3 text-gray-400 text-sm">
                          {new Date(m.timestamp).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
