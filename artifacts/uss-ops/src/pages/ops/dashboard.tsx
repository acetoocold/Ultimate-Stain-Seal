import { Link } from "wouter";
import { useGetDashboardSummary, useGetDashboardRecentActivity, useGetDashboardUpcomingJobs, useGetDashboardOverdueInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, DollarSign, AlertCircle, CalendarClock, Activity, Users, TrendingUp, ChevronRight } from "lucide-react";
import { format } from "date-fns";

function StatCard({ title, value, sub, icon: Icon, accent }: { title: string; value: string | number; sub: string; icon: React.ElementType; accent?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${accent ?? "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}

export default function OpsDashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();
  const { data: recentActivity } = useGetDashboardRecentActivity({ limit: 8 });
  const { data: upcomingJobs } = useGetDashboardUpcomingJobs({ limit: 5 });
  const { data: overdueInvoices } = useGetDashboardOverdueInvoices();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
        <p className="text-muted-foreground mt-1">Ultimate Stain & Seal — Operations Overview</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-24" /></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Projects"
            value={summary?.activeProjects ?? 0}
            sub={`${summary?.pendingProjects ?? 0} pending`}
            icon={Briefcase}
          />
          <StatCard
            title="Revenue This Month"
            value={`$${((summary?.monthRevenue ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            sub={`$${((summary?.ytdRevenue ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })} YTD`}
            icon={TrendingUp}
          />
          <StatCard
            title="Outstanding Balance"
            value={`$${((summary?.totalOutstanding ?? 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            sub="Unpaid invoices"
            icon={DollarSign}
          />
          <StatCard
            title="Overdue Invoices"
            value={overdueInvoices?.length ?? 0}
            sub="Requires follow-up"
            icon={AlertCircle}
            accent={overdueInvoices && overdueInvoices.length > 0 ? "text-destructive" : "text-muted-foreground"}
          />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Jobs</CardTitle>
              <CardDescription>Scheduled work this week</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ops/schedule">View All <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!upcomingJobs?.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No upcoming jobs scheduled.</div>
            ) : (
              <div className="space-y-3">
                {upcomingJobs.map((job) => (
                  <Link key={job.id} href={`/ops/jobs/${job.id}`}>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-border cursor-pointer">
                      <div>
                        <p className="font-medium text-sm">{job.jobName}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <CalendarClock className="w-3 h-3 mr-1" />
                          {job.scheduledDate ? format(new Date(job.scheduledDate), "EEE, MMM d") : "Unscheduled"}
                          {job.scheduledTimeStart && ` · ${job.scheduledTimeStart}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{job.status}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest operations events</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/ops/activity">View All <ChevronRight className="w-3.5 h-3.5 ml-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {!recentActivity?.length ? (
              <div className="text-center py-6 text-muted-foreground text-sm">No recent activity.</div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-1.5 h-1.5 mt-2 rounded-full bg-primary shrink-0" />
                    <div>
                      <p className="text-sm leading-snug">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {overdueInvoices && overdueInvoices.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Overdue Invoices ({overdueInvoices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueInvoices.map(inv => (
                <Link key={inv.id} href={`/ops/invoices/${inv.id}`}>
                  <div className="flex items-center justify-between p-2.5 border border-destructive/20 rounded-lg hover:bg-destructive/10 cursor-pointer">
                    <div>
                      <p className="font-mono text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">Due {inv.dueDate ? format(new Date(inv.dueDate), "MMM d, yyyy") : "—"}</p>
                    </div>
                    <span className="font-semibold text-destructive text-sm">${parseFloat(inv.balanceDue?.toString() ?? "0").toFixed(2)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
