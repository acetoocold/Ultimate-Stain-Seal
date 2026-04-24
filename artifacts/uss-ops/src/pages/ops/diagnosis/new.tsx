import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useCreateDiagnosis, useListProjects, useListCustomers, useListProperties } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Stethoscope } from "lucide-react";

export default function NewDiagnosis() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const urlParams = new URLSearchParams(search);
  const preselectedProjectId = urlParams.get("projectId");

  const { toast } = useToast();
  const createDiagnosis = useCreateDiagnosis();
  const { data: projects } = useListProjects({});
  const { data: customers } = useListCustomers({});
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const { data: properties } = useListProperties({ customerId: selectedCustomerId ? Number(selectedCustomerId) : undefined }, { query: { enabled: !!selectedCustomerId } as any });

  const [form, setForm] = useState({
    projectId: preselectedProjectId || "", customerId: "", propertyId: "",
    totalLinearFeet: "", averageHeight: "6", totalSqFt: "",
    fenceCondition: "good", fenceAge: "", fenceType: "cedar",
    numberOfGates: "0", numberOfPosts: "0",
    previouslyStained: false, previousProduct: "", lastTreatedYear: "",
    surfaceMoisture: "dry",
    mildewPresent: false, grayingPresent: false, crackingPresent: false,
    looseBoards: false, rotPresent: false,
    recommendedTreatment: "stain_seal", recommendedCoats: "2",
    recommendedProduct: "", estimatedProductGallons: "",
    estimatedLaborHours: "", estimatedMaterialCost: "", estimatedLaborCost: "", estimatedTotal: "",
    disclaimerMode: "soft", notes: "",
  });

  const set = (field: string, value: string | boolean) => setForm(f => ({ ...f, [field]: value }));

  const autoCalcSqFt = (lf: string, height: string) => {
    const sqft = parseFloat(lf || "0") * parseFloat(height || "0") * 2;
    if (sqft > 0) set("totalSqFt", sqft.toFixed(0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.projectId || !form.customerId) {
        toast({ title: "Project and customer are required", variant: "destructive" });
        return;
      }
      const diag = await createDiagnosis.mutateAsync({ data: {
        projectId: Number(form.projectId),
        customerId: Number(form.customerId),
        fenceType: form.fenceType as any,
        fenceCondition: form.fenceCondition as any,
        totalLinearFeet: form.totalLinearFeet ? Number(form.totalLinearFeet) : undefined,
        averageHeight: form.averageHeight ? Number(form.averageHeight) : undefined,
        numberOfGates: form.numberOfGates ? Number(form.numberOfGates) : undefined,
        numberOfPosts: form.numberOfPosts ? Number(form.numberOfPosts) : undefined,
        lastStainedYear: form.lastTreatedYear ? Number(form.lastTreatedYear) : undefined,
        currentFinish: form.previousProduct || undefined,
        moistureLevel: form.surfaceMoisture || undefined,
        moldMildew: form.mildewPresent,
        graying: form.grayingPresent,
        cracking: form.crackingPresent,
        repairNeeded: form.looseBoards || form.rotPresent,
        recommendedCoats: form.recommendedCoats ? Number(form.recommendedCoats) : undefined,
        recommendedProduct: form.recommendedProduct || undefined,
        careNotes: form.notes || undefined,
        prepRequired: form.recommendedTreatment || undefined,
      } });
      toast({ title: "Diagnosis created", description: "Fence diagnosis recorded successfully." });
      navigate(`/ops/diagnosis/${diag.id}`);
    } catch {
      toast({ title: "Failed to create diagnosis", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/diagnosis"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Fence Diagnosis</h1>
          <p className="text-muted-foreground text-sm">Source-to-Seal assessment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Linked Records</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Link to project (recommended)" /></SelectTrigger>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={form.customerId} onValueChange={v => { set("customerId", v); setSelectedCustomerId(v); }}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomerId && (
              <div className="space-y-2">
                <Label>Property</Label>
                <Select value={form.propertyId} onValueChange={v => set("propertyId", v)}>
                  <SelectTrigger><SelectValue placeholder="Select property" /></SelectTrigger>
                  <SelectContent>
                    {properties?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.address}, {p.city}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Fence Measurements</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalLinearFeet">Linear Feet</Label>
                <Input id="totalLinearFeet" type="number" value={form.totalLinearFeet}
                  onChange={e => { set("totalLinearFeet", e.target.value); autoCalcSqFt(e.target.value, form.averageHeight); }}
                  placeholder="210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageHeight">Avg. Height (ft)</Label>
                <Input id="averageHeight" type="number" value={form.averageHeight}
                  onChange={e => { set("averageHeight", e.target.value); autoCalcSqFt(form.totalLinearFeet, e.target.value); }}
                  placeholder="6" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalSqFt">Total Sq Ft (auto-calculated both sides)</Label>
              <Input id="totalSqFt" type="number" value={form.totalSqFt} onChange={e => set("totalSqFt", e.target.value)} placeholder="2520" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fenceAge">Fence Age (yrs)</Label>
                <Input id="fenceAge" type="number" value={form.fenceAge} onChange={e => set("fenceAge", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfGates">Gates</Label>
                <Input id="numberOfGates" type="number" min="0" value={form.numberOfGates} onChange={e => set("numberOfGates", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPosts">Posts</Label>
                <Input id="numberOfPosts" type="number" min="0" value={form.numberOfPosts} onChange={e => set("numberOfPosts", e.target.value)} />
              </div>
            </div>
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
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition</Label>
                <Select value={form.fenceCondition} onValueChange={v => set("fenceCondition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                    <SelectItem value="failing">Failing</SelectItem>
                  </SelectContent>
                </Select>
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
          <CardHeader><CardTitle>Surface Conditions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              ["previouslyStained", "Previously Stained"],
              ["mildewPresent", "Mildew Present"],
              ["grayingPresent", "Surface Graying"],
              ["crackingPresent", "Cracking / Splitting"],
              ["looseBoards", "Loose Boards"],
              ["rotPresent", "Rot Present"],
            ].map(([field, label]) => (
              <div key={field} className="flex items-center justify-between">
                <Label htmlFor={field}>{label}</Label>
                <Switch id={field} checked={!!form[field as keyof typeof form]}
                  onCheckedChange={v => set(field, v)} />
              </div>
            ))}
            {form.previouslyStained && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                <div className="space-y-2">
                  <Label htmlFor="previousProduct">Previous Product</Label>
                  <Input id="previousProduct" value={form.previousProduct} onChange={e => set("previousProduct", e.target.value)} placeholder="Cabot Australian Timber Oil" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastTreatedYear">Year Last Treated</Label>
                  <Input id="lastTreatedYear" type="number" value={form.lastTreatedYear} onChange={e => set("lastTreatedYear", e.target.value)} placeholder="2020" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recommendation & Estimate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recommended Treatment</Label>
                <Select value={form.recommendedTreatment} onValueChange={v => set("recommendedTreatment", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stain_seal">Stain & Seal</SelectItem>
                    <SelectItem value="seal">Seal Only</SelectItem>
                    <SelectItem value="stain">Stain Only</SelectItem>
                    <SelectItem value="power_wash">Power Wash Only</SelectItem>
                    <SelectItem value="repair">Repair First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recommendedCoats">Coats</Label>
                <Input id="recommendedCoats" type="number" min="1" max="3" value={form.recommendedCoats} onChange={e => set("recommendedCoats", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommendedProduct">Recommended Product</Label>
              <Input id="recommendedProduct" value={form.recommendedProduct} onChange={e => set("recommendedProduct", e.target.value)} placeholder="TWP 100 Cedar" />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedProductGallons">Product (gallons)</Label>
                <Input id="estimatedProductGallons" type="number" step="0.1" value={form.estimatedProductGallons} onChange={e => set("estimatedProductGallons", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedLaborHours">Labor Hours</Label>
                <Input id="estimatedLaborHours" type="number" step="0.5" value={form.estimatedLaborHours} onChange={e => set("estimatedLaborHours", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedMaterialCost">Material Cost ($)</Label>
                <Input id="estimatedMaterialCost" type="number" step="0.01" value={form.estimatedMaterialCost} onChange={e => set("estimatedMaterialCost", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedLaborCost">Labor Cost ($)</Label>
                <Input id="estimatedLaborCost" type="number" step="0.01" value={form.estimatedLaborCost} onChange={e => set("estimatedLaborCost", e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTotal">Est. Total ($)</Label>
              <Input id="estimatedTotal" type="number" step="0.01" value={form.estimatedTotal} onChange={e => set("estimatedTotal", e.target.value)} className="font-semibold" />
            </div>
            <div className="space-y-2">
              <Label>Disclaimer Mode</Label>
              <Select value={form.disclaimerMode} onValueChange={v => set("disclaimerMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="soft">Soft Disclaimer</SelectItem>
                  <SelectItem value="hard">Hard Disclaimer (Signature Required)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Specific observations, special conditions, customer preferences..." rows={4} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={createDiagnosis.isPending}>
            <Stethoscope className="w-4 h-4 mr-2" />
            {createDiagnosis.isPending ? "Saving..." : "Save Diagnosis"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/diagnosis">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
