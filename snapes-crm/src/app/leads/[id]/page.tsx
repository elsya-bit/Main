import AiAssistant from "@/components/AiAssistant";

// ── Mock lead data (replace with Supabase query by id) ─────

const MOCK_LEADS: Record<
  string,
  {
    companyName: string;
    contactPerson: string;
    status: string;
    email: string;
    activities: {
      type: "Call" | "Email";
      notes: string;
      createdAt: string;
    }[];
  }
> = {
  "1": {
    companyName: "Acme Corp",
    contactPerson: "Sarah Chen",
    status: "Qualified",
    email: "sarah.chen@acmecorp.com",
    activities: [
      {
        type: "Call",
        notes: "Discussed Q3 renewal pricing options",
        createdAt: "Today, 2:34 PM",
      },
      {
        type: "Email",
        notes: "Sent rate card for FCL Asia-Europe",
        createdAt: "Yesterday, 10:15 AM",
      },
    ],
  },
  "2": {
    companyName: "TechNova Ltd",
    contactPerson: "Mark Robinson",
    status: "Proposal",
    email: "m.robinson@technova.co",
    activities: [
      {
        type: "Email",
        notes: "Sent proposal deck and ROI breakdown",
        createdAt: "Today, 1:15 PM",
      },
    ],
  },
};

const statusColors: Record<string, string> = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-amber-50 text-amber-700",
  Qualified: "bg-snapes-blue/10 text-snapes-blue",
  Proposal: "bg-purple-50 text-purple-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-snapes-red",
};

// ── Page ───────────────────────────────────────────────────

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = MOCK_LEADS[id];

  if (!lead) {
    return (
      <div className="mx-auto max-w-4xl py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Lead not found</h1>
        <p className="mt-2 text-gray-500">
          No lead exists with this ID. Check the URL and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* ── Lead header ─────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {lead.companyName}
            </h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[lead.status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {lead.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {lead.contactPerson} &middot; {lead.email}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* ── Activity timeline (left 3 cols) ────────── */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <h2 className="text-base font-semibold text-gray-900">
                Activity Timeline
              </h2>
            </div>

            <ul className="divide-y divide-gray-50">
              {lead.activities.map((activity, i) => (
                <li key={i} className="flex gap-4 px-6 py-4">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      activity.type === "Call"
                        ? "bg-snapes-blue/10 text-snapes-blue"
                        : "bg-purple-50 text-purple-600"
                    }`}
                  >
                    {activity.type === "Call" ? (
                      <PhoneIcon className="h-4 w-4" />
                    ) : (
                      <MailIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {activity.notes}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {activity.createdAt}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── AI Assistant (right 2 cols) ─────────────── */}
        <div className="lg:col-span-2">
          <AiAssistant
            lead={{
              companyName: lead.companyName,
              contactPerson: lead.contactPerson,
              status: lead.status,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Inline icons ──────────────────────────────────────── */

function PhoneIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
      />
    </svg>
  );
}

function MailIcon(props: React.SVGProps<SVGSVGElement>) {
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
