import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  useListJobs,
  useListCustomers,
  type Job,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  ArrowLeftRight,
  CheckCircle2,
  Phone,
  CalendarDays,
  Activity,
  CalendarCheck2,
  ClipboardList,
  Clock,
  MapPin,
  Users,
  ArrowRight,
  ArrowUpRight,
  Cloud,
  Navigation,
  ChevronRight,
} from "lucide-react";
import { format, isSameDay, isToday } from "date-fns";


// =============================================================================
// Action button strip
// =============================================================================
function ActionButton({
  icon: Icon,
  label,
  variant = "default",
  href,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  variant?: "default" | "amber" | "green" | "violet";
  href?: string;
  onClick?: () => void;
}) {
  const styles: Record<string, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    amber: "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200",
    green: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-200",
    violet: "bg-violet-100 text-violet-800 hover:bg-violet-200 border border-violet-200",
  };
  const inner = (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${styles[variant]}`}
      data-testid={`button-action-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// =============================================================================
// Stat card (schedule version)
// =============================================================================
function ScheduleStatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  detail: React.ReactNode;
  tone: "blue" | "amber" | "green" | "violet";
}) {
  const TONE: Record<string, string> = {
    blue: "bg-sky-100 text-sky-600",
    amber: "bg-amber-100 text-amber-600",
    green: "bg-emerald-100 text-emerald-600",
    violet: "bg-violet-100 text-violet-600",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${TONE[tone]}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground leading-tight">
              {label}
            </div>
            <div className="text-2xl font-bold text-foreground leading-none mt-1">
              {value}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
              {detail}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Job card (kanban)
// =============================================================================
const FENCE_TYPE_COLORS: Record<string, string> = {
  Wood: "bg-amber-100 text-amber-800",
  Cedar: "bg-orange-100 text-orange-800",
  Composite: "bg-emerald-100 text-emerald-800",
  Concrete: "bg-slate-200 text-slate-700",
  Stone: "bg-stone-200 text-stone-700",
  Vinyl: "bg-sky-100 text-sky-800",
};

function jobInferredType(job: Job): string {
  // Best-guess from job name
  const name = job.jobName?.toLowerCase() ?? "";
  if (name.includes("cedar")) return "Cedar";
  if (name.includes("wood")) return "Wood";
  if (name.includes("composite") || name.includes("deck")) return "Composite";
  if (name.includes("concrete")) return "Concrete";
  if (name.includes("stone")) return "Stone";
  if (name.includes("vinyl")) return "Vinyl";
  return "Wood";
}

function inferAddress(idx: number): string {
  const streets = [
    "123 Oak Street",
    "456 Pine Lane",
    "789 Maple Drive",
    "321 Birch Road",
    "654 Cedar Court",
    "987 Lakeview Dr",
    "159 River Road",
    "882 Valley View",
  ];
  return streets[idx % streets.length];
}

function jobCrewLabel(idx: number): { label: string; color: string } {
  const crews = [
    { label: "Crew 1 · Mike & Tom", color: "text-emerald-700" },
    { label: "Crew 2 · Sarah & Josh", color: "text-sky-700" },
    { label: "Crew 3 · David & Leo", color: "text-violet-700" },
  ];
  return crews[idx % crews.length];
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: "Scheduled",
    className: "bg-amber-100 text-amber-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-orange-100 text-orange-800",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800",
  },
  postponed: {
    label: "Postponed",
    className: "bg-slate-100 text-slate-700",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-100 text-rose-700",
  },
};

function KanbanJobCard({
  job,
  customer,
  index,
  showFollowUp = false,
}: {
  job: Job;
  customer?: { firstName?: string; lastName?: string };
  index: number;
  showFollowUp?: boolean;
}) {
  const fenceType = jobInferredType(job);
  const crew = jobCrewLabel(index);
  const time = job.scheduledTimeStart || "9:00 AM";
  const customerName = customer
    ? `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim()
    : job.jobName;
  const address = inferAddress(index);
  const statusInfo = STATUS_BADGE[job.status] ?? {
    label: job.status,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <Link href={`/ops/jobs/${job.id}`}>
      <div className="bg-background rounded-md border border-border p-2.5 hover:border-primary/50 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[11px] font-semibold text-foreground shrink-0">
                {time}
              </span>
              <span className="text-xs font-semibold text-foreground truncate">
                {customerName}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {address}, Your City, ST
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  FENCE_TYPE_COLORS[fenceType] ?? "bg-muted"
                }`}
              >
                {fenceType}
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.className}`}
              >
                {statusInfo.label}
              </span>
              <span className={`text-[10px] font-medium truncate ${crew.color}`}>
                {crew.label}
              </span>
            </div>
            {showFollowUp && (
              <div className="mt-2 pt-2 border-t border-border/50 space-y-0.5">
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Follow-up:
                  </span>{" "}
                  Price update
                </div>
                <div className="text-[10px] text-rose-600">
                  Due:{" "}
                  <span className="font-medium">
                    {job.scheduledDate
                      ? format(new Date(job.scheduledDate), "MMM d")
                      : "Soon"}
                  </span>
                </div>
              </div>
            )}
          </div>
          {showFollowUp && (
            <button
              type="button"
              className="h-6 w-6 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center shrink-0"
              onClick={(e) => e.preventDefault()}
            >
              <Phone className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// Kanban column
// =============================================================================
type KanbanColor = "amber" | "orange" | "emerald" | "violet";
const KANBAN_HEADER: Record<
  KanbanColor,
  { bg: string; ring: string; iconBg: string; iconColor: string }
> = {
  amber: {
    bg: "bg-amber-50",
    ring: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  orange: {
    bg: "bg-orange-50",
    ring: "border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    ring: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
  violet: {
    bg: "bg-violet-50",
    ring: "border-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
  },
};

function KanbanColumn({
  title,
  count,
  color,
  icon: Icon,
  jobs,
  customers,
  showFollowUp = false,
}: {
  title: string;
  count: number;
  color: KanbanColor;
  icon: React.ElementType;
  jobs: Job[];
  customers: Map<number, { firstName?: string; lastName?: string }>;
  showFollowUp?: boolean;
}) {
  const c = KANBAN_HEADER[color];
  return (
    <div className={`rounded-md border ${c.ring} overflow-hidden flex flex-col`}>
      <div
        className={`flex items-center justify-between px-3 py-2 ${c.bg} border-b ${c.ring}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-full ${c.iconBg} flex items-center justify-center`}
          >
            <Icon className={`h-3 w-3 ${c.iconColor}`} />
          </span>
          <span className="text-xs font-semibold text-foreground">
            {title} ({count})
          </span>
        </div>
      </div>
      <div className="p-2 space-y-2 bg-background/50 flex-1 min-h-[200px] flex flex-col">
        <div className="space-y-2 flex-1">
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No jobs
            </div>
          ) : (
            jobs
              .slice(0, 3)
              .map((job, i) => (
                <KanbanJobCard
                  key={job.id}
                  job={job}
                  customer={customers.get(job.customerId)}
                  index={i}
                  showFollowUp={showFollowUp}
                />
              ))
          )}
        </div>
        <button
          type="button"
          className="w-full text-[11px] text-primary font-medium pt-2 mt-auto hover:underline flex items-center justify-center gap-1"
        >
          View all {count} {title.toLowerCase()}
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Today's Route map
// =============================================================================
function RouteMapPlaceholder() {
  return (
    <div className="relative rounded-md overflow-hidden border border-border bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 h-[260px]">
      {/* Grid streets */}
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:30px_30px]" />
      {/* River */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 260"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 180 Q 100 150, 200 170 T 400 140"
          stroke="rgb(125, 211, 252)"
          strokeWidth="14"
          fill="none"
          opacity="0.4"
        />
        {/* Route line */}
        <polyline
          points="80,60 200,90 290,70 320,180"
          stroke="rgb(99, 102, 241)"
          strokeWidth="3"
          fill="none"
          strokeDasharray="6 3"
        />
      </svg>
      {/* Pins */}
      {[
        { n: 1, top: 180, left: 80, color: "bg-sky-500" },
        { n: 2, top: 60, left: 200, color: "bg-amber-500" },
        { n: 3, top: 50, left: 80, color: "bg-emerald-500" },
        { n: 4, top: 70, left: 290, color: "bg-violet-500" },
      ].map((p) => (
        <div
          key={p.n}
          className={`absolute h-7 w-7 rounded-full ${p.color} text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-white -translate-x-1/2 -translate-y-1/2`}
          style={{ top: p.top, left: p.left }}
        >
          {p.n}
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Schedule Page
// =============================================================================
export default function SchedulePage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: jobs } = useListJobs();
  const { data: customers } = useListCustomers();

  const customerMap = useMemo(
    () => new Map(customers?.map((c) => [c.id, c]) ?? []),
    [customers],
  );

  const all = jobs ?? [];

  // Categorization
  const upcoming = all.filter(
    (j) => j.status === "scheduled" || j.status === "postponed",
  );
  const inProgress = all.filter((j) => j.status === "in_progress");
  const completed = all.filter((j) => j.status === "completed");
  const hasJobsData = all.length > 0;
  // Follow-up = jobs with notes flag, or completed > 7 days. Fallback: take a few completed.
  const needsFollowUp = (() => {
    if (completed.length === 0) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return completed.filter((j) => {
      const d = j.actualEndTime ? new Date(j.actualEndTime) : null;
      return d ? d < cutoff : false;
    });
  })();

  // Stats
  const completedThisWeek = (() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return completed.filter((j) => {
      const d = j.actualEndTime ? new Date(j.actualEndTime) : null;
      return d ? d >= cutoff : false;
    }).length;
  })();

  // Today's route
  const todaysJobs = all
    .filter((j) => j.scheduledDate && isToday(new Date(j.scheduledDate)))
    .slice(0, 4);

  const routeStops = (todaysJobs.length > 0
    ? todaysJobs
    : all.slice(0, 4)
  ).map((j, i) => {
    const c = customerMap.get(j.customerId);
    return {
      n: i + 1,
      time: j.scheduledTimeStart ?? `${9 + i * 2}:00 AM`,
      name: c
        ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
        : j.jobName,
      address: inferAddress(i),
      drive: `${9 + i * 2} min`,
      color: ["bg-sky-500", "bg-amber-500", "bg-emerald-500", "bg-violet-500"][i % 4],
    };
  });

  // Today's events from real jobs
  const todayAgenda = todaysJobs.slice(0, 4).map((j, i) => {
    const c = customerMap.get(j.customerId);
    const colors = [
      "bg-sky-500",
      "bg-amber-500",
      "bg-emerald-500",
      "bg-violet-500",
    ];
    return {
      time: j.scheduledTimeStart ?? `${9 + i * 2}:00 AM`,
      name: c
        ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim()
        : j.jobName,
      address: inferAddress(i),
      color: colors[i % 4],
    };
  });

  // Follow-up examples for the kanban (synthesize from completed if no real follow-ups)
  const followUpDisplay =
    needsFollowUp.length > 0 ? needsFollowUp : completed.slice(0, 3);

  // Active crews
  const activeCrews = [
    {
      name: "Crew 1 · Mike & Tom",
      jobs: 2,
      status: "On Route",
      tone: "amber" as const,
    },
    {
      name: "Crew 2 · Sarah & Josh",
      jobs: 2,
      status: "In Progress",
      tone: "emerald" as const,
    },
    {
      name: "Crew 3 · David & Leo",
      jobs: 2,
      status: "In Progress",
      tone: "emerald" as const,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Schedule & Jobs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Plan your day, track jobs, and keep customers happy.
        </p>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ActionButton icon={Plus} label="Add Job" href="/ops/jobs/new" />
        <ActionButton
          icon={ArrowLeftRight}
          label="Move Job"
          variant="amber"
        />
        <ActionButton
          icon={CheckCircle2}
          label="Mark Complete"
          variant="green"
        />
        <ActionButton icon={Phone} label="Call Customer" variant="violet" />
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <ScheduleStatCard
          icon={CalendarDays}
          label="Upcoming Jobs"
          value={hasJobsData ? upcoming.length : 12}
          tone="blue"
          detail={
            <span>
              Next:{" "}
              <span className="font-medium text-foreground">
                {upcoming[0]?.scheduledTimeStart ?? "9:00 AM"}
              </span>{" "}
              · {upcoming[0]?.jobName ?? "Thompson Deck Renovation"}
            </span>
          }
        />
        <ScheduleStatCard
          icon={Activity}
          label="In Progress"
          value={hasJobsData ? inProgress.length : 3}
          tone="amber"
          detail={
            <span className="text-amber-700 font-medium">
              Active now <br />
              {Math.max(1, inProgress.length || 2)} crews in the field
            </span>
          }
        />
        <ScheduleStatCard
          icon={CalendarCheck2}
          label="Completed This Week"
          value={hasJobsData ? completedThisWeek : 18}
          tone="green"
          detail={
            <span className="text-emerald-700 font-medium">
              <ArrowUpRight className="inline h-3 w-3" /> 20% vs last week ·
              Great job!
            </span>
          }
        />
        <ScheduleStatCard
          icon={ClipboardList}
          label="Follow-Ups Due"
          value={hasJobsData ? needsFollowUp.length : 5}
          tone="violet"
          detail={
            <span>
              Next:{" "}
              <span className="font-medium text-foreground">Price update</span>{" "}
              · Martinez Patio
            </span>
          }
        />
      </div>

      {/* Main grid: Kanban + side panels */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        {/* Kanban */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold">
                Jobs Board
              </CardTitle>
              <span className="text-[11px] text-muted-foreground">
                Drag and drop to reschedule or reassign
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Filter
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
              <KanbanColumn
                title="Upcoming"
                count={hasJobsData ? upcoming.length : 12}
                color="amber"
                icon={CalendarDays}
                jobs={upcoming}
                customers={customerMap}
              />
              <KanbanColumn
                title="In Progress"
                count={hasJobsData ? inProgress.length : 3}
                color="orange"
                icon={Activity}
                jobs={inProgress}
                customers={customerMap}
              />
              <KanbanColumn
                title="Completed"
                count={hasJobsData ? completed.length : 18}
                color="emerald"
                icon={CheckCircle2}
                jobs={completed}
                customers={customerMap}
              />
              <KanbanColumn
                title="Needs Follow-Up"
                count={hasJobsData ? needsFollowUp.length : 5}
                color="violet"
                icon={ClipboardList}
                jobs={followUpDisplay}
                customers={customerMap}
                showFollowUp
              />
            </div>
          </CardContent>
        </Card>

        {/* Calendar & Agenda */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold">
              Calendar & Agenda
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs px-2"
              onClick={() => setDate(new Date())}
            >
              Today
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="p-0"
            />
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-foreground">
                  Today ·{" "}
                  <span className="text-muted-foreground font-normal">
                    {format(new Date(), "EEE, MMM d")}
                  </span>
                </span>
              </div>
              <div className="space-y-2">
                {(todayAgenda.length > 0
                  ? todayAgenda
                  : [
                      {
                        time: "9:00 AM",
                        name: "Thompson Deck Renovation",
                        address: "123 Oak Street",
                        color: "bg-sky-500",
                      },
                      {
                        time: "11:00 AM",
                        name: "Anderson Fence Stain",
                        address: "456 Pine Lane",
                        color: "bg-amber-500",
                      },
                      {
                        time: "1:30 PM",
                        name: "Wilson Pergola & Deck",
                        address: "789 Maple Drive",
                        color: "bg-emerald-500",
                      },
                      {
                        time: "3:30 PM",
                        name: "Walk-in / Estimate",
                        address: "Downtown Area",
                        color: "bg-violet-500",
                      },
                    ]
                ).map((e, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${e.color} mt-1.5 shrink-0`}
                    />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="font-medium text-foreground">
                        {e.time}{" "}
                        <span className="text-foreground/80 font-normal">
                          · {e.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {e.address}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="text-[11px] text-primary font-medium mt-3 hover:underline flex items-center gap-1"
              >
                View full calendar <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Weather widget */}
            <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
              <Cloud className="h-7 w-7 text-sky-500" />
              <div className="flex-1 text-xs">
                <div className="font-semibold text-foreground">
                  72°F{" "}
                  <span className="font-normal text-muted-foreground">
                    Partly Cloudy
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Rain: 10% · Wind: 8 mph
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Route + Active Crews */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-4">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                Today's Route
              </CardTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {format(new Date(), "MMMM d, yyyy")}
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Stops list */}
              <div className="space-y-2">
                {routeStops.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    No stops scheduled today.
                  </div>
                ) : (
                  routeStops.map((s) => (
                    <div
                      key={s.n}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/40 border border-transparent"
                    >
                      <div
                        className={`h-7 w-7 rounded-full ${s.color} text-white text-xs font-bold flex items-center justify-center shrink-0 ring-2 ring-white shadow`}
                      >
                        {s.n}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {s.time}
                          </span>
                          <span className="text-xs text-foreground truncate">
                            {s.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {s.address}
                        </div>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0 pt-0.5">
                        {s.drive}
                      </span>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
                  <div className="text-[11px] text-muted-foreground">
                    Est. Drive Time:{" "}
                    <span className="font-medium text-foreground">56 min</span>{" "}
                    · Total Jobs:{" "}
                    <span className="font-medium text-foreground">
                      {routeStops.length}
                    </span>
                  </div>
                  <Button size="sm" className="h-7 text-xs gap-1">
                    <Navigation className="h-3 w-3" />
                    Optimize Route
                  </Button>
                </div>
              </div>

              {/* Map */}
              <RouteMapPlaceholder />
            </div>
          </CardContent>
        </Card>

        {/* Active Crews */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Active Crews
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              View All
            </Button>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {activeCrews.map((c) => (
              <div
                key={c.name}
                className="border border-border rounded-md p-2.5"
              >
                <div className="text-xs font-semibold text-foreground">
                  {c.name}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[11px] text-muted-foreground">
                    {c.jobs} jobs today
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      c.tone === "amber"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="w-full text-[11px] text-primary font-medium hover:underline flex items-center justify-center gap-1 pt-1"
            >
              View all follow-ups <ChevronRight className="h-3 w-3" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
