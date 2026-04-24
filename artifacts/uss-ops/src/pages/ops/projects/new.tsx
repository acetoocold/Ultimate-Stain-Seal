import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useCreateProject, useListCustomers, useListProperties } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, FolderPlus } from "lucide-react";

export default function NewProject() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedCustomerId = params.get("customerId");

  const { toast } = useToast();
  const createProject = useCreateProject();
  const { data: customers } = useListCustomers({});
  const [selectedCustomerId, setSelectedCustomerId] = useState(preselectedCustomerId || "");
  const { data: properties } = useListProperties({ customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined }, { query: { enabled: !!selectedCustomerId } as any });

  const [form, setForm] = useState({
    projectName: "", projectType: "stain_seal", status: "pending", priority: "medium",
    propertyId: "", scheduledDate: "", estimatedCost: "", linearFeet: "", totalSqFt: "",
    fenceType: "cedar", stainProduct: "", coatsApplied: "2", leadSource: "", notes: "",
  });

  const set = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) { toast({ title: "Please select a customer", variant: "destructive" }); return; }
    try {
      const project = await createProject.mutateAsync({ data: {
        customerId: Number(selectedCustomerId),
        propertyId: form.propertyId ? Number(form.propertyId) : undefined,
        projectName: form.projectName,
        serviceType: form.projectType as any,
        status: form.status as any,
        priority: form.priority as any,
        scheduledDate: form.scheduledDate || undefined,
        leadSource: form.leadSource || undefined,
        notes: form.notes || undefined,
      } });
      toast({ title: "Project created", description: `${form.projectName} created successfully.` });
      navigate(`/ops/projects/${project.id}`);
    } catch {
      toast({ title: "Failed to create project", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/projects"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Project</h1>
          <p className="text-muted-foreground text-sm">Create a new fence project</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={selectedCustomerId} onValueChange={v => { setSelectedCustomerId(v); set("propertyId", ""); }}>
                <SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCustomerId && (
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={form.propertyId} onValueChange={v => set("propertyId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select property (optional)" /></SelectTrigger>
                  <SelectContent>
                    {properties?.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.address}, {p.city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name *</Label>
              <Input id="projectName" required value={form.projectName} onChange={e => set("projectName", e.target.value)} placeholder="Oak Hollow Fence Stain & Seal" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select value={form.projectType} onValueChange={v => set("projectType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stain_seal">Stain & Seal</SelectItem>
                    <SelectItem value="seal">Seal Only</SelectItem>
                    <SelectItem value="stain">Stain Only</SelectItem>
                    <SelectItem value="power_wash">Power Wash</SelectItem>
                    <SelectItem value="repair">Repair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={v => set("priority", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => set("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input id="scheduledDate" type="date" value={form.scheduledDate} onChange={e => set("scheduledDate", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fence Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fence Type</Label>
                <Select value={form.fenceType} onValueChange={v => set("fenceType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cedar">Cedar</SelectItem>
                    <SelectItem value="pressure_treated">Pressure Treated</SelectItem>
                    <SelectItem value="redwood">Redwood</SelectItem>
                    <SelectItem value="pine">Pine</SelectItem>
                    <SelectItem value="composite">Composite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stainProduct">Stain Product</Label>
                <Input id="stainProduct" value={form.stainProduct} onChange={e => set("stainProduct", e.target.value)} placeholder="TWP 100 Cedar" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="linearFeet">Linear Feet</Label>
                <Input id="linearFeet" type="number" value={form.linearFeet} onChange={e => set("linearFeet", e.target.value)} placeholder="210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalSqFt">Total Sq Ft</Label>
                <Input id="totalSqFt" type="number" value={form.totalSqFt} onChange={e => set("totalSqFt", e.target.value)} placeholder="2520" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coatsApplied">Coats</Label>
                <Input id="coatsApplied" type="number" min="1" max="3" value={form.coatsApplied} onChange={e => set("coatsApplied", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedCost">Estimated Cost ($)</Label>
              <Input id="estimatedCost" type="number" step="0.01" value={form.estimatedCost} onChange={e => set("estimatedCost", e.target.value)} placeholder="1650.00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Additional Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Lead Source</Label>
              <Select value={form.leadSource} onValueChange={v => set("leadSource", v)}>
                <SelectTrigger><SelectValue placeholder="How did they find us?" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="nextdoor">Nextdoor</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="repeat">Repeat Customer</SelectItem>
                  <SelectItem value="yard_sign">Yard Sign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Special instructions, access codes, customer preferences..." rows={4} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createProject.isPending}>
            <FolderPlus className="w-4 h-4 mr-2" />
            {createProject.isPending ? "Creating..." : "Create Project"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/projects">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
