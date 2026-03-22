import MetricCard from "@/components/dashboard/MetricCard";
import RecentLeadsTable from "@/components/dashboard/RecentLeadsTable";

// ── Mock data (replace with real Supabase queries) ─────────

const metrics = {
  totalCallsToday: 24,
  activeHotLeads: 12,
  conversionRate: 34.2,
};

const recentLeads = [
  {
    id: "1",
    companyName: "Acme Corp",
    contactPerson: "Sarah Chen",
    assignedTo: "James Miller",
    lastActivityType: "Call" as const,
    lastActivityNote: "Discussed Q3 renewal pricing options",
    lastActivityAt: "Today, 2:34 PM",
    status: "Qualified",
  },
  {
    id: "2",
    companyName: "TechNova Ltd",
    contactPerson: "Mark Robinson",
    assignedTo: "Emily Davis",
    lastActivityType: "Email" as const,
    lastActivityNote: "Sent proposal deck and ROI breakdown",
    lastActivityAt: "Today, 1:15 PM",
    status: "Proposal",
  },
  {
    id: "3",
    companyName: "GlobalEdge Inc",
    contactPerson: "Priya Patel",
    assignedTo: "James Miller",
    lastActivityType: "Call" as const,
    lastActivityNote: "Initial discovery call — strong buying signals",
    lastActivityAt: "Today, 11:40 AM",
    status: "Contacted",
  },
  {
    id: "4",
    companyName: "Bright Solutions",
    contactPerson: "Tom Baker",
    assignedTo: "Rachel Wong",
    lastActivityType: "Email" as const,
    lastActivityNote: "Follow-up on demo scheduling",
    lastActivityAt: "Yesterday, 4:50 PM",
    status: "New",
  },
  {
    id: "5",
    companyName: "Vertex Analytics",
    contactPerson: "Diana Osei",
    assignedTo: "Emily Davis",
    lastActivityType: "Call" as const,
    lastActivityNote: "Closed deal — signed annual contract",
    lastActivityAt: "Yesterday, 3:20 PM",
    status: "Won",
  },
];

// ── Page ───────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back — here&apos;s what&apos;s happening across your sales
          team today.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Calls Today"
          value={metrics.totalCallsToday}
          subtitle="Across all reps"
          trend={{ value: "12% vs yesterday", positive: true }}
          icon={<PhoneIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Active Hot Leads"
          value={metrics.activeHotLeads}
          subtitle="Qualified + Proposal"
          trend={{ value: "3 new this week", positive: true }}
          icon={<FireIcon className="h-5 w-5" />}
        />
        <MetricCard
          title="Lead Conversion Rate"
          value={`${metrics.conversionRate}%`}
          subtitle="Won / Total closed"
          trend={{ value: "2.1% vs last month", positive: false }}
          icon={<ChartIcon className="h-5 w-5" />}
        />
      </div>

      {/* Recent leads table */}
      <RecentLeadsTable leads={recentLeads} />
    </div>
  );
}

/* ── Metric card icons ──────────────────────────────────── */

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

function FireIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z"
      />
    </svg>
  );
}

function ChartIcon(props: React.SVGProps<SVGSVGElement>) {
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
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
      />
    </svg>
  );
}
