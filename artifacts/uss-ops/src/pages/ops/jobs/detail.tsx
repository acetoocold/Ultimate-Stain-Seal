import { useParams, Link } from "wouter";
import { useGetJob, useUpdateJobStatus } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, Users, CheckCircle2, Play, MapPin } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-600 border-red-200",
};

const JOB_TYPE_LABEL: Record<string, string> = {
  application: "Stain Application",
  prep: "Prep / Power Wash",
  inspection: "Inspection",
  repair: "Repair",
  other: "Other",
};

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const jobId = Number(id);
  const { data: job, isLoading } = useGetJob(jobId);
  const updateStatus = useUpdateJobStatus();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading job...</div>;
  if (!job) return <div className="p-8 text-destructive">Job not found.</div>;

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: jobId, data: { status: newStatus } });
      queryClient.invalidateQueries({ queryKey: ["getJob", jobId] });
      toast({ title: `Job marked as ${newStatus.replace("_", " ")}` });
    } catch {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/ops/schedule"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{job.jobName}</h1>
              <Badge variant="outline" className={`capitalize ${STATUS_STYLES[job.status] ?? ""}`}>{job.status.replace("_", " ")}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {JOB_TYPE_LABEL[job.jobType ?? ""] ?? job.jobType} ·{" "}
              {job.scheduledDate ? format(new Date(job.scheduledDate), "EEEE, MMM d, yyyy") : "Unscheduled"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {job.status === "scheduled" && (
            <Button size="sm" onClick={() => handleStatusChange("in_progress")} disabled={updateStatus.isPending}>
              <Play className="w-4 h-4 mr-2" />
              Start Job
            </Button>
          )}
          {job.status === "in_progress" && (
            <Button size="sm" onClick={() => handleStatusChange("completed")} disabled={updateStatus.isPending}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          )}
          {job.projectId && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/ops/projects/${job.projectId}`}>View Project</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Schedule Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{job.scheduledDate ? format(new Date(job.scheduledDate), "EEEE, MMMM d, yyyy") : "Not scheduled"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Time Window</p>
                  <p className="text-sm font-medium">
                    {job.scheduledTimeStart ? `${job.scheduledTimeStart} – ${job.scheduledTimeEnd ?? "TBD"}` : "Not set"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Crew Size</p>
                  <p className="text-sm font-medium">{job.crewSize ?? "—"} crew</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Est. Hours</p>
                  <p className="text-sm font-medium">{job.estimatedHours ?? "—"} hrs</p>
                </div>
              </div>
              {job.actualHours && (
                <div className="flex items-start gap-3 col-span-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Actual Hours Worked</p>
                    <p className="text-sm font-medium text-green-700">{job.actualHours} hrs</p>
                  </div>
                </div>
              )}
              {job.actualEndTime && (
                <div className="col-span-2 pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Actual End Time</p>
                  <p className="text-sm font-medium text-green-700">{job.actualEndTime}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {job.notes && (
            <Card>
              <CardHeader><CardTitle>Job Notes & Instructions</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{job.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Linked</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {job.projectId && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Project</p>
                  <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                    <Link href={`/ops/projects/${job.projectId}`}>
                      <MapPin className="w-3 h-3 mr-2" />
                      View Project
                    </Link>
                  </Button>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Job Type</p>
                <Badge variant="secondary" className="capitalize">{JOB_TYPE_LABEL[job.jobType ?? ""] ?? job.jobType}</Badge>
              </div>
              <Separator />
              <Button variant="outline" size="sm" className="w-full justify-start" asChild>
                <Link href={`/ops/jobsheets/new?jobId=${job.id}`}>Create Work Order</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
