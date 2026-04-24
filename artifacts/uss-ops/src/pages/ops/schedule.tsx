import { useState } from "react";
import { Link } from "wouter";
import { useListJobs } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, CalendarDays, Clock, Users, ChevronRight } from "lucide-react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-600 border-blue-200",
  in_progress: "bg-amber-500/10 text-amber-700 border-amber-200",
  completed: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-600 border-red-200",
};

export default function SchedulePage() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { data: jobs, isLoading } = useListJobs();

  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const jobsByDay = (day: Date) =>
    jobs?.filter(j => j.scheduledDate && isSameDay(new Date(j.scheduledDate), day)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Weekly job calendar</p>
        </div>
        <Button asChild>
          <Link href="/ops/jobs/new">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}>
          &larr; Prev Week
        </Button>
        <div className="font-medium text-sm">
          {format(currentWeekStart, "MMM d")} – {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
        </div>
        <Button variant="outline" size="sm" onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}>
          Next Week &rarr;
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
          Today
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading schedule...</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayJobs = jobsByDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <div key={day.toISOString()} className={`border rounded-lg overflow-hidden ${isToday ? "border-primary" : "border-border"}`}>
                <div className={`p-2 text-center text-xs font-semibold ${isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <div>{format(day, "EEE")}</div>
                  <div className="text-base">{format(day, "d")}</div>
                </div>
                <div className="p-2 min-h-[120px] space-y-1 bg-background">
                  {dayJobs.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center pt-4">–</div>
                  ) : (
                    dayJobs.map((job) => (
                      <Link key={job.id} href={`/ops/jobs/${job.id}`}>
                        <div className={`text-xs p-1.5 rounded border cursor-pointer hover:opacity-80 ${STATUS_COLORS[job.status] ?? "bg-muted"}`}>
                          <div className="font-medium truncate">{job.jobName}</div>
                          {job.scheduledTimeStart && (
                            <div className="flex items-center gap-0.5 mt-0.5 opacity-80">
                              <Clock className="w-2.5 h-2.5" />
                              {job.scheduledTimeStart}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Upcoming Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {jobs?.filter(j => j.status === "scheduled").slice(0, 10).map(job => (
              <Link key={job.id} href={`/ops/jobs/${job.id}`}>
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div>
                    <p className="font-medium text-sm">{job.jobName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {job.scheduledDate ? format(new Date(job.scheduledDate), "MMM d, yyyy") : "Unscheduled"}
                      </span>
                      {job.scheduledTimeStart && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {job.scheduledTimeStart}
                        </span>
                      )}
                      {job.crewSize && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {job.crewSize} crew
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
            {!jobs?.some(j => j.status === "scheduled") && (
              <div className="text-center py-6 text-muted-foreground text-sm">No upcoming jobs scheduled.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
