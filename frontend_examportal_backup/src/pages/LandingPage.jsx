import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-extrabold text-white tracking-tight mb-4">
          Mock<span className="text-blue-500">Test</span>
        </h1>
        <p className="text-lg text-gray-400 mb-8 leading-relaxed">
          A secure, proctored online examination platform. Take MCQ and live
          coding challenges with real-time malpractice detection and
          role-based access control.
        </p>
        <Link
          to="/login"
          className="inline-block px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors"
        >
          Sign In
        </Link>
      </div>

      {/* Feature cards */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full">
        <FeatureCard
          title="MCQ & Coding"
          description="Auto-graded multiple-choice questions and sandboxed code execution with hidden test cases."
        />
        <FeatureCard
          title="Anti-Malpractice"
          description="Tab-switch detection, fullscreen enforcement, copy/paste blocking, and auto-lock after violations."
        />
        <FeatureCard
          title="Role-Based Access"
          description="Admins manage departments, Mediators create exams, Students take tests — all securely separated."
        />
      </div>

      <footer className="mt-20 text-gray-600 text-sm">
        &copy; {new Date().getFullYear()} MockTest Platform
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
