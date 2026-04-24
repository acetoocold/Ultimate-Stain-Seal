import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useCreateJobsheet, useListJobs, useListProjects } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function NewJobsheet() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedJobId = params.get("jobId");

  const { toast } = useToast();
  const createJobsheet = useCreateJobsheet();
  const { data: jobs } = useListJobs();
  const { data: projects } = useListProjects({});

  const [form, setForm] = useState({
    jobId: preselectedJobId || "", projectId: "", status: "active",
    crewLead: "", crewMembers: "",
    workDate: new Date().toISOString().split("T")[0],
    startTime: "07:30", endTime: "14:00",
    weatherConditions: "", temperature: "", humidity: "",
    surfaceMoisture: "dry",
    areasCompleted: "", productsApplied: "", coatsApplied: "1",
    applicationMethod: "brush", issuesEncountered: "", fieldNotes: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId) { toast({ title: "Please select a project", variant: "destructive" }); return; }
    try {
      const jobsheet = await createJobsheet.mutateAsync({ data: {
        projectId: Number(form.projectId),
        jobId: form.jobId ? Number(form.jobId) : undefined,
        status: form.status as any,
        crewLead: form.crewLead || undefined,
        crewMembers: form.crewMembers || undefined,
        workDate: form.workDate || undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        weatherConditions: form.weatherConditions || undefined,
        temperature: form.temperature ? Number(form.temperature) : undefined,
        humidity: form.humidity ? Number(form.humidity) : undefined,
        surfaceMoisture: form.surfaceMoisture || undefined,
        areasCompleted: form.areasCompleted || undefined,
        productsApplied: form.productsApplied || undefined,
        coatsApplied: form.coatsApplied ? Number(form.coatsApplied) : undefined,
        applicationMethod: form.applicationMethod || undefined,
        issuesEncountered: form.issuesEncountered || undefined,
        fieldNotes: form.fieldNotes || undefined,
      } });
      toast({ title: "Work order created", description: "Jobsheet created successfully." });
      navigate(`/ops/jobsheets/${jobsheet.id}`);
    } catch {
      toast({ title: "Failed to create work order", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/jobsheets"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Work Order</h1>
          <p className="text-muted-foreground text-sm">Create a jobsheet / work order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Work Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select project..." /></SelectTrigger>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Link to Job</Label>
              <Select value={form.jobId} onValueChange={v => set("jobId", v)}>
                <SelectTrigger><SelectValue placeholder="Select job (optional)..." /></SelectTrigger>
                <SelectContent>
                  {jobs?.map(j => (
                    <SelectItem key={j.id} value={String(j.id)}>{j.jobName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="workDate">Work Date</Label>
                <Input id="workDate" type="date" value={form.workDate} onChange={e => set("workDate", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Crew</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="crewLead">Crew Lead</Label>
              <Input id="crewLead" value={form.crewLead} onChange={e => set("crewLead", e.target.value)} placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="crewMembers">Crew Members</Label>
              <Input id="crewMembers" value={form.crewMembers} onChange={e => set("crewMembers", e.target.value)} placeholder="Mike, Carlos, Dana" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Conditions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weatherConditions">Weather</Label>
                <Input id="weatherConditions" value={form.weatherConditions} onChange={e => set("weatherConditions", e.target.value)} placeholder="Sunny, clear" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temp (°F)</Label>
                <Input id="temperature" type="number" value={form.temperature} onChange={e => set("temperature", e.target.value)} placeholder="78" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input id="humidity" type="number" value={form.humidity} onChange={e => set("humidity", e.target.value)} placeholder="45" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Surface Moisture</Label>
              <Select value={form.surfaceMoisture} onValueChange={v => set("surfaceMoisture", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry">Dry</SelectItem>
                  <SelectItem value="damp">Damp</SelectItem>
                  <SelectItem value="wet">Wet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Work Performed</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="areasCompleted">Areas Completed</Label>
              <Textarea id="areasCompleted" value={form.areasCompleted} onChange={e => set("areasCompleted", e.target.value)} placeholder="Back fence, left side, gate posts..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productsApplied">Products Applied</Label>
              <Input id="productsApplied" value={form.productsApplied} onChange={e => set("productsApplied", e.target.value)} placeholder="TWP 100 Series Cedar" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coatsApplied">Coats Applied</Label>
                <Input id="coatsApplied" type="number" min="1" max="3" value={form.coatsApplied} onChange={e => set("coatsApplied", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Application Method</Label>
                <Select value={form.applicationMethod} onValueChange={v => set("applicationMethod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brush">Brush</SelectItem>
                    <SelectItem value="roller">Roller</SelectItem>
                    <SelectItem value="spray">Spray</SelectItem>
                    <SelectItem value="pad">Pad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuesEncountered">Issues Encountered</Label>
              <Textarea id="issuesEncountered" value={form.issuesEncountered} onChange={e => set("issuesEncountered", e.target.value)} placeholder="Any issues during the job..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fieldNotes">Field Notes</Label>
              <Textarea id="fieldNotes" value={form.fieldNotes} onChange={e => set("fieldNotes", e.target.value)} placeholder="General notes from the field..." rows={2} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createJobsheet.isPending}>
            <ClipboardList className="w-4 h-4 mr-2" />
            {createJobsheet.isPending ? "Creating..." : "Create Work Order"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/jobsheets">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
