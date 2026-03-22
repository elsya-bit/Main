interface RecentLead {
  id: string;
  companyName: string;
  contactPerson: string;
  assignedTo: string;
  lastActivityType: "Call" | "Email";
  lastActivityNote: string;
  lastActivityAt: string;
  status: string;
}

interface RecentLeadsTableProps {
  leads: RecentLead[];
}

const statusColors: Record<string, string> = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-amber-50 text-amber-700",
  Qualified: "bg-snapes-blue/10 text-snapes-blue",
  Proposal: "bg-purple-50 text-purple-700",
  Won: "bg-emerald-50 text-emerald-700",
  Lost: "bg-red-50 text-snapes-red",
};

export default function RecentLeadsTable({ leads }: RecentLeadsTableProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Recent Conversation Leads
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Latest activities from the sales team
          </p>
        </div>
        <span className="rounded-full bg-snapes-blue/10 px-3 py-1 text-xs font-medium text-snapes-blue">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-medium uppercase tracking-wider text-gray-400">
              <th className="px-6 py-3">Company</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Assigned To</th>
              <th className="px-6 py-3">Last Activity</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="transition-colors hover:bg-gray-50/60"
              >
                {/* Company */}
                <td className="px-6 py-4 font-medium text-gray-900">
                  {lead.companyName}
                </td>

                {/* Contact */}
                <td className="px-6 py-4 text-gray-600">
                  {lead.contactPerson}
                </td>

                {/* Assigned To */}
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-snapes-blue" />
                    <span className="text-gray-700">{lead.assignedTo}</span>
                  </span>
                </td>

                {/* Last Activity */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {lead.lastActivityType === "Call" ? (
                      <PhoneIcon className="h-4 w-4 text-snapes-blue" />
                    ) : (
                      <EmailIcon className="h-4 w-4 text-snapes-blue" />
                    )}
                    <span className="max-w-[200px] truncate text-gray-600">
                      {lead.lastActivityNote}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      statusColors[lead.status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {lead.status}
                  </span>
                </td>

                {/* Date */}
                <td className="whitespace-nowrap px-6 py-4 text-gray-400">
                  {lead.lastActivityAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {leads.length === 0 && (
        <div className="px-6 py-12 text-center text-sm text-gray-400">
          No recent activity to display.
        </div>
      )}
    </div>
  );
}

/* ---- Inline icons ---- */

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
