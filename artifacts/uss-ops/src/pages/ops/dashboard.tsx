import { Link } from "wouter";
import {
  useGetMe,
  useGetDashboardSummary,
  useListCustomers,
  useListProjects,
  useListInvoices,
  useListJobs,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  CalendarPlus,
  FileText,
  Briefcase,
  ReceiptText,
  Users,
  CalendarCheck2,
  ClipboardList,
  FileSignature,
  CircleDollarSign,
  Phone,
  Globe,
  UserCheck,
  RotateCcw,
  Footprints,
  MapPin,
  ExternalLink,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  Compass,
  ListChecks,
  BookOpen,
  Plus,
  MoreHorizontal,
  ArrowRight,
  Star,
  TrendingUp,
  Heart,
  Bot,
  ChevronRight,
  ChevronLeft,
  Megaphone,
  Handshake,
  Hammer,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

// =============================================================================
// Stat card
// =============================================================================
type StatTone = "green" | "blue" | "orange" | "purple" | "teal" | "rose";

const TONE_CLASS: Record<
  StatTone,
  { iconBg: string; iconColor: string; deltaUp: string; deltaDown: string }
> = {
  green: {
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    deltaUp: "text-emerald-600",
    deltaDown: "text-rose-600",
  },
  blue: {
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    deltaUp: "text-emerald-600",
    deltaDown: "text-rose-600",
  },
  orange: {
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    deltaUp: "text-emerald-600",
    deltaDown: "text-rose-600",
  },
  purple: {
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    deltaUp: "text-emerald-600",
    deltaDown: "text-rose-600",
  },
  teal: {
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    deltaUp: "text-emerald-600",
    deltaDown: "text-rose-600",
  },
  rose: {
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    deltaUp: "text-emerald-600",
    deltaDown: "text-rose-600",
  },
};

function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  delta,
  deltaLabel,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  tone: StatTone;
  delta?: number;
  deltaLabel?: string;
  sub?: string;
}) {
  const t = TONE_CLASS[tone];
  const isUp = delta !== undefined && delta >= 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div
            className={`h-9 w-9 rounded-full flex items-center justify-center ${t.iconBg}`}
          >
            <Icon className={`h-4 w-4 ${t.iconColor}`} />
          </div>
          <div className="text-[11px] text-muted-foreground text-right leading-tight">
            {title}
          </div>
        </div>
        <div className="mt-2 text-3xl font-bold text-foreground leading-none">
          {value}
        </div>
        {delta !== undefined && (
          <div
            className={`mt-2 flex items-center gap-1 text-xs ${
              isUp ? t.deltaUp : t.deltaDown
            }`}
          >
            <DeltaIcon className="h-3 w-3" />
            <span className="font-medium">
              {Math.abs(delta)} {deltaLabel ?? "from last week"}
            </span>
          </div>
        )}
        {sub && (
          <div className="mt-1 text-[11px] text-muted-foreground leading-snug">
            {sub}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Quick actions
// =============================================================================
const QUICK_ACTIONS = [
  { label: "New Lead", icon: UserPlus, href: "/ops/customers/new" },
  { label: "Schedule Visit", icon: CalendarPlus, href: "/ops/jobsheets/new" },
  { label: "Create Estimate", icon: FileText, href: "/ops/diagnosis/new" },
  { label: "Start Project", icon: Briefcase, href: "/ops/projects/new" },
  { label: "New Invoice", icon: ReceiptText, href: "/ops/invoices/new" },
];

function QuickActionsBar() {
  return (
    <Card className="bg-card">
      <CardContent className="p-3">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 px-1">
          Quick Actions
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} href={a.href}>
              <button
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-muted transition-colors text-left group"
                data-testid={`button-quick-${a.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10">
                  <a.icon className="h-3.5 w-3.5 text-primary" />
                </span>
                <span className="text-xs font-medium text-foreground leading-tight">
                  {a.label}
                </span>
              </button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Lead Sources & Geography
// =============================================================================
const LEAD_SOURCES = [
  { label: "Phone Calls", count: 19, icon: Phone },
  { label: "Website Form", count: 14, icon: Globe },
  { label: "Referral", count: 9, icon: Handshake },
  { label: "Repeat Customer", count: 7, icon: RotateCcw },
  { label: "Walk-in / Site Visit", count: 3, icon: Footprints },
];

const TOP_AREAS = [
  { name: "Your City, ST", count: 28 },
  { name: "Northside", count: 12 },
  { name: "Riverside", count: 9 },
  { name: "Oak Valley", count: 7 },
  { name: "Lakeside", count: 5 },
];

function LeadSourcesCard() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-primary mt-0.5" />
          <div>
            <CardTitle className="text-sm font-semibold">
              Lead Sources & Geography
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Where your leads come from
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="space-y-2">
          {LEAD_SOURCES.map((s) => (
            <div
              key={s.label}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2 text-foreground">
                <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{s.label}</span>
              </div>
              <span className="font-semibold text-foreground tabular-nums">
                {s.count}
              </span>
            </div>
          ))}
        </div>

        {/* Map thumbnail (placeholder) */}
        <div className="relative rounded-md overflow-hidden border border-border h-28 bg-gradient-to-br from-emerald-50 via-amber-50 to-sky-50">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_30%_40%,white_1px,transparent_1px),radial-gradient(circle_at_70%_70%,white_1px,transparent_1px)] [background-size:24px_24px]" />
          <MapPin className="absolute top-3 left-6 h-5 w-5 text-rose-500 fill-rose-500/40" />
          <MapPin className="absolute top-8 left-20 h-5 w-5 text-rose-500 fill-rose-500/40" />
          <MapPin className="absolute top-5 right-10 h-5 w-5 text-rose-500 fill-rose-500/40" />
          <MapPin className="absolute bottom-5 left-12 h-5 w-5 text-rose-500 fill-rose-500/40" />
          <div className="absolute bottom-2 left-2 right-2 text-[10px] text-foreground/80 bg-background/80 backdrop-blur-sm rounded px-2 py-1 leading-tight">
            <span className="font-semibold">Service Area Overview</span>
            <br />
            Leads are strong in Your City and surrounding areas.
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Top Areas This Month
          </div>
          <div className="space-y-1.5">
            {TOP_AREAS.map((a, i) => (
              <div
                key={a.name}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground tabular-nums w-3">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{a.name}</span>
                </div>
                <span className="text-muted-foreground">{a.count} leads</span>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-3 h-7 text-xs"
          >
            View All Areas
          </Button>
        </div>

        <Button
          variant="default"
          size="sm"
          className="w-full h-8 text-xs gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View Full Map
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Ultimate Highlights notebook
// =============================================================================
type StickyNote = {
  title: string;
  bg: string;
  border: string;
  body: React.ReactNode;
  signature?: string;
};

function HighlightsCard() {
  const notes: StickyNote[] = [
    {
      title: "Today's Goals",
      bg: "bg-amber-50",
      border: "border-amber-200",
      signature: "John",
      body: (
        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-3 w-3 accent-primary"
            />
            <span>Follow up on 5 estimates</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="h-3 w-3 accent-primary" />
            <span>Schedule 2 site visits</span>
          </li>
          <li className="flex items-center gap-2">
            <input type="checkbox" className="h-3 w-3 accent-primary" />
            <span>Send 3 proposals</span>
          </li>
        </ul>
      ),
    },
    {
      title: "Important Updates",
      bg: "bg-rose-50",
      border: "border-rose-200",
      signature: "Admin",
      body: (
        <ul className="space-y-1.5 text-xs list-disc list-inside marker:text-rose-400">
          <li>New sealer product arriving Friday</li>
          <li>Price update on materials starting next week</li>
        </ul>
      ),
    },
    {
      title: "Customer Reminders",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      body: (
        <ul className="space-y-1.5 text-xs list-disc list-inside marker:text-emerald-400">
          <li>Thompson Deck — follow up</li>
          <li>Martinez Patio — waiting on approval</li>
          <li>Johnson Pavers — needs estimate</li>
        </ul>
      ),
    },
    {
      title: "Next Steps",
      bg: "bg-sky-50",
      border: "border-sky-200",
      signature: "John",
      body: (
        <ul className="space-y-1.5 text-xs list-disc list-inside marker:text-sky-400">
          <li>Finish Martinez job</li>
          <li>Order materials</li>
          <li>Confirm Friday crew schedule</li>
        </ul>
      ),
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-sm font-semibold">
                Ultimate Highlights
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Your shared team notebook
              </p>
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs gap-1">
            <Plus className="h-3 w-3" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-3">
          {notes.map((n) => (
            <div
              key={n.title}
              className={`${n.bg} ${n.border} border rounded-md p-3 shadow-sm relative`}
            >
              <div className="text-xs font-semibold text-foreground mb-2">
                {n.title}
              </div>
              {n.body}
              {n.signature && (
                <div className="text-[10px] text-muted-foreground italic mt-2 text-right">
                  — {n.signature}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Team note */}
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-md p-3 flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-semibold shrink-0">
            MB
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold text-foreground">
                Maria's Note
              </div>
              <div className="text-[10px] text-muted-foreground">
                Yesterday, 3:45 PM
              </div>
            </div>
            <p className="text-xs text-foreground/90 mt-1 leading-relaxed">
              Great job on the Riverside project! ⭐ Let's get those follow-ups
              done today.
            </p>
          </div>
          <Heart className="h-3.5 w-3.5 text-rose-400 shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// AI Assistant
// =============================================================================
function AIAssistantCard() {
  const actions = [
    { label: "Need ideas?", sub: "Get suggestions to grow your business", icon: Lightbulb, color: "bg-amber-100 text-amber-700" },
    { label: "Ways to handle this?", sub: "Advice for customer situations", icon: Compass, color: "bg-violet-100 text-violet-700" },
    { label: "Possible choices", sub: "See your best options", icon: ListChecks, color: "bg-sky-100 text-sky-700" },
    { label: "Research says", sub: "Facts & insights that help", icon: Sparkles, color: "bg-emerald-100 text-emerald-700" },
  ];

  return (
    <Card className="h-full bg-gradient-to-br from-violet-50 via-background to-sky-50/50 border-violet-200/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                AI Assistant
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Your smart helper for ideas & guidance
              </p>
            </div>
          </div>
          <Bot className="h-7 w-7 text-violet-500/70" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="text-xs font-semibold text-foreground/80">
          How can I help you today?
        </div>
        <div className="space-y-2">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className="w-full flex items-start gap-3 text-left p-2.5 rounded-md bg-background/70 hover:bg-background border border-border/50 transition-colors"
            >
              <span
                className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${a.color}`}
              >
                <a.icon className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-foreground">
                  {a.label}
                </span>
                <span className="block text-[11px] text-muted-foreground leading-tight">
                  {a.sub}
                </span>
              </span>
            </button>
          ))}
        </div>
        <Button
          className="w-full h-9 bg-gradient-to-r from-violet-500 to-sky-500 hover:from-violet-600 hover:to-sky-600 text-white border-0 gap-1.5"
          size="sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Ask AI for help
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Recent Projects
// =============================================================================
const STATUS_BADGE: Record<string, string> = {
  in_progress: "bg-sky-100 text-sky-700 border-sky-200",
  scheduled: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  approved: "bg-violet-100 text-violet-700 border-violet-200",
  diagnosed: "bg-orange-100 text-orange-700 border-orange-200",
  inquiry: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-rose-100 text-rose-700 border-rose-200",
  on_hold: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

function statusLabel(s: string) {
  return s
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function nextStepFor(status: string): string {
  const map: Record<string, string> = {
    inquiry: "Schedule visit",
    diagnosed: "Send estimate",
    approved: "Schedule job",
    scheduled: "Site Prep",
    in_progress: "Continue Deck Repair",
    completed: "Final Walkthrough",
    on_hold: "Customer follow-up",
    cancelled: "Archive",
  };
  return map[status] ?? "Review project";
}

function customerInitials(c?: { firstName?: string; lastName?: string }) {
  if (!c) return "??";
  return `${c.firstName?.[0] ?? ""}${c.lastName?.[0] ?? ""}`.toUpperCase() || "??";
}

function RecentProjectsCard() {
  const PAGE_SIZE = 5;
  const [page, setPage] = useState(1);
  const { data: projects } = useListProjects();
  const { data: customers } = useListCustomers();

  const customerById = new Map(customers?.map((c) => [c.id, c]) ?? []);
  const sorted = (projects ?? [])
    .slice()
    .sort((a, b) => {
      const aDate = a.scheduledDate ?? a.createdAt ?? "";
      const bDate = b.scheduledDate ?? b.createdAt ?? "";
      return bDate.localeCompare(aDate);
    });
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">Recent Projects</CardTitle>
        <Link href="/ops/projects">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-0.5">
            View All Projects
            <ChevronRight className="h-3 w-3" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wide text-muted-foreground border-b border-border">
                <th className="text-left font-semibold py-2 px-1">
                  Proj / Customer
                </th>
                <th className="text-left font-semibold py-2 px-1">Status</th>
                <th className="text-left font-semibold py-2 px-1">Location</th>
                <th className="text-left font-semibold py-2 px-1">
                  Start Date
                </th>
                <th className="text-right font-semibold py-2 px-1">Value</th>
                <th className="text-left font-semibold py-2 px-1">Next Step</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-6 text-muted-foreground"
                  >
                    No projects yet.
                  </td>
                </tr>
              ) : (
                pageRows.map((p) => {
                  const customer = customerById.get(p.customerId);
                  const initials = customerInitials(customer);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-border/50 hover:bg-muted/40"
                    >
                      <td className="py-2.5 px-1">
                        <Link href={`/ops/projects/${p.id}`}>
                          <div className="flex items-center gap-2 cursor-pointer">
                            <span className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">
                              {initials}
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {p.projectName}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">
                                {customer
                                  ? `${customer.firstName} ${customer.lastName}`
                                  : "—"}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="py-2.5 px-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${STATUS_BADGE[p.status] ?? "bg-muted"}`}
                        >
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      <td className="py-2.5 px-1 text-muted-foreground">
                        Your City, ST
                      </td>
                      <td className="py-2.5 px-1 text-muted-foreground">
                        {p.scheduledDate
                          ? format(new Date(p.scheduledDate), "MMM d, yyyy")
                          : "—"}
                      </td>
                      <td className="py-2.5 px-1 text-right font-medium text-foreground tabular-nums">
                        {p.totalAmount
                          ? `$${parseFloat(p.totalAmount.toString()).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                          : "—"}
                      </td>
                      <td className="py-2.5 px-1 text-muted-foreground">
                        {nextStepFor(p.status)}
                      </td>
                      <td className="py-2.5 px-1">
                        <button
                          type="button"
                          className="h-6 w-6 rounded-md hover:bg-muted flex items-center justify-center"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {sorted.length > 0 && (
          <div className="flex items-center justify-between mt-3 text-xs">
            <div className="text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}{" "}
              projects
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map(
                (n) => (
                  <Button
                    key={n}
                    variant={n === page ? "default" : "outline"}
                    size="sm"
                    className="h-7 w-7 p-0 text-xs"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ),
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Business workflow strip
// =============================================================================
const WORKFLOW_STEPS = [
  {
    n: 1,
    label: "Lead",
    desc: "New inquiry comes in",
    icon: Megaphone,
    color: "bg-amber-100 text-amber-700",
  },
  {
    n: 2,
    label: "Site Visit",
    desc: "Visit & assess the job",
    icon: MapPin,
    color: "bg-orange-100 text-orange-700",
  },
  {
    n: 3,
    label: "Estimate",
    desc: "Create & send estimate",
    icon: FileText,
    color: "bg-violet-100 text-violet-700",
  },
  {
    n: 4,
    label: "Approval",
    desc: "Customer approves",
    icon: CheckCircle2,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    n: 5,
    label: "Job",
    desc: "Do the work",
    icon: Hammer,
    color: "bg-sky-100 text-sky-700",
  },
];

function WorkflowStrip() {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-semibold">
            Your Business Workflow
          </CardTitle>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            From first contact to paid — the full journey
          </p>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
          {WORKFLOW_STEPS.map((s, idx) => (
            <div key={s.n} className="flex items-center gap-2 shrink-0">
              <div className="flex flex-col items-center text-center min-w-[110px]">
                <div
                  className={`h-10 w-10 rounded-full ${s.color} flex items-center justify-center mb-1.5`}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {s.n}. {s.label}
                </div>
                <div className="text-[10px] text-muted-foreground leading-tight">
                  {s.desc}
                </div>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-muted-foreground/60 mt-0" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Reviews & At-a-Glance
// =============================================================================
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(value)
              ? "text-amber-500 fill-amber-500"
              : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );
}

function ReviewsCard() {
  const reviews = [
    {
      label: "Google Reviews",
      rating: 4.8,
      count: 156,
      quote:
        "Excellent service and beautiful results! Highly recommend USS!!",
      author: "Sarah M.",
      color: "text-sky-600",
    },
    {
      label: "Website Reviews",
      rating: 4.7,
      count: 89,
      quote: "Professional, on time, and great quality. Will use again!",
      author: "Mike P.",
      color: "text-emerald-600",
    },
    {
      label: "Facebook Reviews",
      rating: 4.6,
      count: 62,
      quote: "Great experience from start to finish. Very pleased!",
      author: "Linda T.",
      color: "text-violet-600",
    },
  ];
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          Reviews
        </CardTitle>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          View All Reviews
        </Button>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <p className="text-[11px] text-muted-foreground">
          See what customers are saying
        </p>
        {reviews.map((r) => (
          <div
            key={r.label}
            className="border border-border rounded-md p-2.5 bg-background"
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-semibold ${r.color}`}>
                {r.label}
              </span>
              <span className="text-xs font-semibold text-foreground tabular-nums">
                {r.rating}
              </span>
            </div>
            <div className="flex items-center justify-between mb-1.5">
              <StarRating value={r.rating} />
              <span className="text-[10px] text-muted-foreground">
                ({r.count})
              </span>
            </div>
            <p className="text-[11px] text-foreground/80 italic leading-snug">
              "{r.quote}"
            </p>
            <p className="text-[10px] text-muted-foreground mt-1 text-right">
              — {r.author}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function AtAGlanceCard({
  avgJobValue,
  conversion,
  thisMonthRevenue,
  jobsCompleted,
}: {
  avgJobValue: number | string;
  conversion: number | string;
  thisMonthRevenue: number | string;
  jobsCompleted: number | string;
}) {
  const fmtMoney = (v: number | string) =>
    typeof v === "number"
      ? `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : v;
  const items = [
    {
      label: "Average Job Value",
      value: fmtMoney(avgJobValue),
      delta: 8,
      icon: CircleDollarSign,
    },
    {
      label: "Conversion Rate",
      value: typeof conversion === "number" ? `${conversion}%` : conversion,
      delta: 5,
      icon: TrendingUp,
    },
    {
      label: "Revenue This Month",
      value: fmtMoney(thisMonthRevenue),
      delta: 12,
      icon: CircleDollarSign,
    },
    {
      label: "Jobs Completed",
      value: typeof jobsCompleted === "number" ? jobsCompleted.toString() : jobsCompleted,
      delta: 4,
      icon: CheckCircle2,
    },
  ];
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-semibold">At a Glance</CardTitle>
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs gap-1 bg-primary"
        >
          View Full Workflow
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-b-0"
          >
            <div className="flex items-center gap-2">
              <it.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-foreground">{it.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground tabular-nums">
                {it.value}
              </span>
              <span className="inline-flex items-center text-[10px] text-emerald-600 gap-0.5">
                <ArrowUpRight className="h-2.5 w-2.5" />
                {it.delta}%
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Dashboard Page
// =============================================================================
export default function OpsDashboard() {
  const { data: user } = useGetMe();
  const { data: summary } = useGetDashboardSummary();
  const { data: customers } = useListCustomers();
  const { data: projects } = useListProjects();
  const { data: invoices } = useListInvoices();
  const { data: jobs } = useListJobs();

  const firstName = user?.firstName || "John";
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  // Real metrics — show "--" when data hasn't loaded; preserve real 0 values.
  const newLeads: number | string = customers
    ? customers.filter((c) => c.status === "lead").length
    : "--";
  const visitsScheduled: number | string =
    summary?.pendingJobsheets ?? (summary ? 0 : "--");
  const visitsNoEstimate: number | string =
    customers && projects
      ? Math.max(
          0,
          customers.filter(
            (c) => c.status === "lead" || c.status === "active",
          ).length - projects.length,
        )
      : "--";
  const pendingEstimates: number | string = projects
    ? projects.filter((p) => p.status === "diagnosed").length
    : "--";
  const activeProjects: number | string =
    summary?.activeProjects ?? (summary ? 0 : "--");
  const unpaidInvoicesCount: number | string = invoices
    ? invoices.filter((i) => i.status !== "paid" && i.status !== "void").length
    : "--";
  const unpaidBalance = summary?.unpaidBalance ?? 0;

  const completedProjects =
    projects?.filter((p) => p.status === "completed").length ?? 0;
  const totalProjectsForRate =
    (projects?.length ?? 0) +
    (customers?.filter((c) => c.status === "lead").length ?? 0);
  const conversionRate: number | string =
    projects && customers
      ? totalProjectsForRate > 0
        ? Math.round((completedProjects / totalProjectsForRate) * 100)
        : 0
      : "--";

  const avgJobValue: number | string = projects
    ? projects.length > 0
      ? Math.round(
          projects.reduce(
            (acc, p) => acc + parseFloat(p.totalAmount?.toString() ?? "0"),
            0,
          ) / projects.length,
        )
      : 0
    : "--";

  const jobsCompleted: number | string = jobs
    ? jobs.filter((j) => j.status === "completed").length
    : "--";

  const thisMonthRevenue: number | string =
    summary?.thisMonthRevenue ?? (summary ? 0 : "--");

  return (
    <div className="space-y-5">
      {/* Greeting + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your business today.
          </p>
        </div>
        <QuickActionsBar />
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <StatCard
          title="New Leads"
          value={newLeads}
          icon={UserCheck}
          tone="green"
          delta={4}
          sub="People interested in your services"
        />
        <StatCard
          title="Site Visits Scheduled"
          value={visitsScheduled}
          icon={CalendarCheck2}
          tone="blue"
          delta={2}
          sub="Visits planned this week"
        />
        <StatCard
          title="Visits Done No Estimate Yet"
          value={visitsNoEstimate}
          icon={ClipboardList}
          tone="orange"
          delta={-1}
          sub="Follow up & send an estimate"
        />
        <StatCard
          title="Pending Estimates"
          value={pendingEstimates}
          icon={FileSignature}
          tone="purple"
          delta={3}
          sub="Estimates waiting for approval"
        />
        <StatCard
          title="Active Projects"
          value={activeProjects}
          icon={Briefcase}
          tone="teal"
          delta={2}
          sub="Jobs in progress right now"
        />
        <StatCard
          title="Unpaid Invoices"
          value={unpaidInvoicesCount}
          icon={CircleDollarSign}
          tone="rose"
          delta={-2}
          sub={`$${unpaidBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} outstanding`}
        />
      </div>

      {/* Lead sources / Highlights / AI */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <LeadSourcesCard />
        <HighlightsCard />
        <AIAssistantCard />
      </div>

      {/* Recent Projects + Reviews */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <RecentProjectsCard />
          <WorkflowStrip />
        </div>
        <div className="space-y-4">
          <ReviewsCard />
          <AtAGlanceCard
            avgJobValue={avgJobValue}
            conversion={conversionRate}
            thisMonthRevenue={thisMonthRevenue}
            jobsCompleted={jobsCompleted}
          />
        </div>
      </div>
    </div>
  );
}
