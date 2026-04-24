import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useCreateJob, useListProjects, useListCustomers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CalendarPlus } from "lucide-react";

export default function NewJob() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedProjectId = params.get("projectId");

  const { toast } = useToast();
  const createJob = useCreateJob();
  const { data: projects } = useListProjects({});
  const { data: customers } = useListCustomers({});

  const [form, setForm] = useState({
    jobName: "", jobType: "application", status: "scheduled",
    projectId: preselectedProjectId || "", customerId: "",
    scheduledDate: "", scheduledTimeStart: "07:30", scheduledTimeEnd: "14:00",
    estimatedHours: "", crewSize: "2", notes: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const job = await createJob.mutateAsync({ data: {
        jobName: form.jobName,
        jobType: form.jobType as any,
        status: form.status as any,
        projectId: form.projectId ? Number(form.projectId) : 0,
        customerId: form.customerId ? Number(form.customerId) : 0,
        scheduledDate: form.scheduledDate || undefined,
        scheduledTimeStart: form.scheduledTimeStart || undefined,
        scheduledTimeEnd: form.scheduledTimeEnd || undefined,
        estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : undefined,
        crewSize: form.crewSize ? Number(form.crewSize) : undefined,
        notes: form.notes || undefined,
      } });
      toast({ title: "Job created", description: `${form.jobName} scheduled successfully.` });
      navigate(`/ops/jobs/${job.id}`);
    } catch {
      toast({ title: "Failed to create job", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/schedule"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Job</h1>
          <p className="text-muted-foreground text-sm">Schedule a new job or work order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Job Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobName">Job Name *</Label>
              <Input id="jobName" required value={form.jobName} onChange={e => set("jobName", e.target.value)} placeholder="Prep & First Coat — Oak Hollow" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Type</Label>
                <Select value={form.jobType} onValueChange={v => set("jobType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Stain Application</SelectItem>
                    <SelectItem value="prep">Prep / Power Wash</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Link to a project..." /></SelectTrigger>
                <SelectContent>
                  {projects?.filter(p => p.status !== "completed").map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={v => set("customerId", v)}>
                <SelectTrigger><SelectValue placeholder="Select customer..." /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Date *</Label>
              <Input id="scheduledDate" type="date" required value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledTimeStart">Start Time</Label>
                <Input id="scheduledTimeStart" type="time" value={form.scheduledTimeStart} onChange={e => set("scheduledTimeStart", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledTimeEnd">End Time</Label>
                <Input id="scheduledTimeEnd" type="time" value={form.scheduledTimeEnd} onChange={e => set("scheduledTimeEnd", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input id="estimatedHours" type="number" step="0.5" value={form.estimatedHours} onChange={e => set("estimatedHours", e.target.value)} placeholder="5.5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crewSize">Crew Size</Label>
                <Input id="crewSize" type="number" min="1" max="10" value={form.crewSize} onChange={e => set("crewSize", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes / Instructions</Label>
              <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Special instructions, access codes, customer requests..." rows={4} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createJob.isPending}>
            <CalendarPlus className="w-4 h-4 mr-2" />
            {createJob.isPending ? "Creating..." : "Create Job"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/schedule">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
