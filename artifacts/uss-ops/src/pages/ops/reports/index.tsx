import { useGetReportSummary, useGetProjectsByStatus, useGetLeadSources } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { TrendingUp, Briefcase, DollarSign, Users, AlertCircle, Package, CalendarDays, Award } from "lucide-react";

const COLORS = ["hsl(150, 40%, 30%)", "hsl(35, 90%, 50%)", "hsl(150, 10%, 40%)", "hsl(200, 40%, 40%)", "hsl(0, 40%, 50%)"];

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: React.ElementType }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function ReportsDashboard() {
  const { data: summary } = useGetReportSummary();
  const { data: projectsByStatus } = useGetProjectsByStatus();
  const { data: leadSources } = useGetLeadSources();

  const projectStatusData = projectsByStatus?.map(item => ({
    name: item.status?.replace("_", " ") ?? "Unknown",
    count: item.count,
  })) ?? [];

  const leadSourceData = leadSources?.map(item => ({
    name: item.source?.replace("_", " ") ?? "Unknown",
    count: item.count,
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Performance and operational metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue (YTD)"
          value={`$${(summary?.totalRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`$${(summary?.thisMonthRevenue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} this month`}
          icon={TrendingUp}
        />
        <StatCard
          title="Completed Projects"
          value={summary?.completedProjects ?? 0}
          sub={`${summary?.activeProjects ?? 0} active`}
          icon={Briefcase}
        />
        <StatCard
          title="Avg. Project Value"
          value={`$${(summary?.averageProjectValue ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub="Paid invoices"
          icon={Award}
        />
        <StatCard
          title="Active Customers"
          value={summary?.activeCustomers ?? 0}
          sub={`${summary?.totalCustomers ?? 0} total`}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Outstanding Balance"
          value={`$${(summary?.outstandingBalance ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
        />
        <StatCard
          title="Overdue Invoices"
          value={summary?.overdueInvoices ?? 0}
          icon={AlertCircle}
        />
        <StatCard
          title="Jobs This Week"
          value={summary?.scheduledJobsThisWeek ?? 0}
          icon={CalendarDays}
        />
        <StatCard
          title="Low Stock Items"
          value={summary?.lowStockItems ?? 0}
          icon={Package}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects by Status</CardTitle>
            <CardDescription>Current project pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {projectStatusData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="name"
                  >
                    {projectStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where customers come from</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] flex items-center justify-center">
            {leadSourceData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadSourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} />
                  <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px" }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
