"use client";

import { useState } from "react";

interface Lead {
  companyName: string;
  contactPerson: string;
  status: string;
}

interface AiAssistantProps {
  lead: Lead;
}

type MessageType = "email" | "linkedin";

export default function AiAssistant({ lead }: AiAssistantProps) {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState<MessageType | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate(type: MessageType) {
    if (!notes.trim()) {
      setError("Please add some notes about the client first.");
      return;
    }

    setError("");
    setResult("");
    setLoading(type);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, notes, lead }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data.message);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-snapes-blue/10">
          <SparklesIcon className="h-5 w-5 text-snapes-blue" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            AI Assistant
          </h2>
          <p className="text-sm text-gray-500">
            Generate personalized outreach from your notes
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Notes input */}
        <label
          htmlFor="ai-notes"
          className="block text-sm font-medium text-gray-700"
        >
          Client notes
        </label>
        <textarea
          id="ai-notes"
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Spoke with Sarah about their rising ocean freight costs on the Asia-Europe lane. They're evaluating new 3PL partners for Q4. Interested in our consolidation service and real-time tracking dashboard."
          className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-snapes-blue focus:outline-none focus:ring-2 focus:ring-snapes-blue/20"
        />

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={() => generate("email")}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-snapes-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-snapes-blue/40 focus:ring-offset-2 disabled:opacity-50 disabled:hover:brightness-100"
          >
            {loading === "email" ? (
              <Spinner />
            ) : (
              <EmailIcon className="h-4 w-4" />
            )}
            Generate Email Draft
          </button>

          <button
            onClick={() => generate("linkedin")}
            disabled={loading !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-snapes-blue px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-snapes-blue/40 focus:ring-offset-2 disabled:opacity-50 disabled:hover:brightness-100"
          >
            {loading === "linkedin" ? (
              <Spinner />
            ) : (
              <LinkedInIcon className="h-4 w-4" />
            )}
            Generate LinkedIn Message
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-snapes-red">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                Generated message
              </h3>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-snapes-blue transition-colors hover:bg-snapes-blue/10"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 whitespace-pre-wrap rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800">
              {result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Inline icons & spinner ──────────────────────────────── */

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  );
}

function EmailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
      />
    </svg>
  );
}

function LinkedInIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CopyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
      />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m4.5 12.75 6 6 9-13.5"
      />
    </svg>
  );
}
