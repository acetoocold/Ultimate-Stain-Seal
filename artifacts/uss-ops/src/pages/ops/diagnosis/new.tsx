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
import { ArrowLeft, Stethoscope, Plus, Trash2 } from "lucide-react";

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
    // Context
    projectId: preselectedProjectId || "",
    customerId: "",
    propertyId: "",
    
    // Wood & Structure
    woodType: "fence",
    fenceType: "wood_privacy",
    postsCondition: "fair",
    
    // Dimensions
    totalLinearFeet: "",
    averageHeight: "6",
    numberOfSections: "1",
    numberOfPosts: "",
    numberOfGates: "",
    
    // History
    lastStainedYear: "",
    lastStainedYearIsExact: false,
    
    // Current State
    currentFinish: "bare",
    weatherExposure: "partial_shade",
    moistureLevel: "normal",
    
    // Issues
    moldMildew: false,
    cracking: false,
    graying: false,
    repairNeeded: false,
    repairNotes: "",
    
    // Product
    recommendedBrand: "Ultimate Liquid Gold",
    recommendedProductType: "stain",
    recommendedCoats: 2,
    productColor: "",
    prepRequired: "none",
    careNotes: "",
    
    // Estimates
    estimatedProductGallons: "",
    estimatedLaborHours: "",
    estimatedMaterialCost: "",
    estimatedBrandUpsell: 0,
    estimatedLaborCost: "",
    estimatedTotal: "",
  });

  const [sections, setSections] = useState([{ sectionNumber: 1, linearFeet: "", height: "", sidesCompleted: "both", sectionNotes: "" }]);

  const set = (field: string, value: string | boolean | number) => setForm(f => ({ ...f, [field]: value }));

  const addSection = () => {
    setSections(s => [...s, { sectionNumber: s.length + 1, linearFeet: "", height: "", sidesCompleted: "both", sectionNotes: "" }]);
  };

  const updateSection = (index: number, field: string, value: string) => {
    setSections(s => s.map((sec, i) => i === index ? { ...sec, [field]: value } : sec));
  };

  const removeSection = (index: number) => {
    setSections(s => s.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!form.customerId) {
        toast({ title: "Customer is required", variant: "destructive" });
        return;
      }
      const diag = await createDiagnosis.mutateAsync({ data: {
        customerId: Number(form.customerId),
        projectId: form.projectId ? Number(form.projectId) : undefined,
        woodType: form.woodType as any,
        fenceType: form.fenceType as any,
        postsCondition: form.postsCondition as any,
        totalLinearFeet: form.totalLinearFeet ? Number(form.totalLinearFeet) : undefined,
        averageHeight: form.averageHeight ? Number(form.averageHeight) : undefined,
        numberOfSections: form.numberOfSections ? Number(form.numberOfSections) : undefined,
        numberOfPosts: form.numberOfPosts ? Number(form.numberOfPosts) : undefined,
        numberOfGates: form.numberOfGates ? Number(form.numberOfGates) : undefined,
        lastStainedYear: form.lastStainedYear ? Number(form.lastStainedYear) : undefined,
        lastStainedYearIsExact: form.lastStainedYearIsExact,
        currentFinish: form.currentFinish as any,
        weatherExposure: form.weatherExposure as any,
        moistureLevel: form.moistureLevel as any,
        moldMildew: form.moldMildew,
        cracking: form.cracking,
        graying: form.graying,
        repairNeeded: form.repairNeeded,
        repairNotes: form.repairNotes || undefined,
        recommendedBrand: form.recommendedBrand,
        recommendedProductType: form.recommendedProductType as any,
        recommendedCoats: form.recommendedCoats,
        productColor: form.productColor || undefined,
        prepRequired: form.prepRequired as any,
        careNotes: form.careNotes || undefined,
        estimatedProductGallons: form.estimatedProductGallons ? Number(form.estimatedProductGallons) : undefined,
        estimatedLaborHours: form.estimatedLaborHours ? Number(form.estimatedLaborHours) : undefined,
        estimatedMaterialCost: form.estimatedMaterialCost ? Number(form.estimatedMaterialCost) : undefined,
        estimatedBrandUpsell: form.estimatedBrandUpsell,
        estimatedLaborCost: form.estimatedLaborCost ? Number(form.estimatedLaborCost) : undefined,
        estimatedTotal: form.estimatedTotal ? Number(form.estimatedTotal) : undefined,
      } });
      toast({ title: "Diagnosis created", description: "Fence diagnosis recorded successfully." });
      navigate(`/ops/diagnosis/${diag.id}`);
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to create diagnosis", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/ops/diagnosis"><ArrowLeft className="w-4 h-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Fence Diagnosis</h1>
          <p className="text-muted-foreground text-sm">Complete health assessment for predictive maintenance</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Project Context */}
        <Card>
          <CardHeader><CardTitle>Customer & Project Context</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select value={form.customerId} onValueChange={v => { set("customerId", v); setSelectedCustomerId(v); }}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={form.projectId} onValueChange={v => set("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Link to project (optional)" /></SelectTrigger>
                <SelectContent>
                  {projects?.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.projectName}</SelectItem>)}
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

        {/* Wood & Structure */}
        <Card>
          <CardHeader><CardTitle>Wood Type & Structure</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Wood Type</Label>
                <Select value={form.woodType} onValueChange={v => set("woodType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fence">Fence (-3 months)</SelectItem>
                    <SelectItem value="pergola">Pergola (-2 months)</SelectItem>
                    <SelectItem value="deck">Deck (-1 month)</SelectItem>
                    <SelectItem value="dock">Dock (-2 months)</SelectItem>
                    <SelectItem value="siding">Siding (-1 month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fence Type</Label>
                <Select value={form.fenceType} onValueChange={v => set("fenceType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wood_privacy">Wood Privacy</SelectItem>
                    <SelectItem value="side_by_side">Side by Side</SelectItem>
                    <SelectItem value="post_rail">Post & Rail</SelectItem>
                    <SelectItem value="split_rail">Split Rail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Posts Condition</Label>
                <Select value={form.postsCondition} onValueChange={v => set("postsCondition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent (0)</SelectItem>
                    <SelectItem value="good">Good (-1)</SelectItem>
                    <SelectItem value="fair">Fair (-1)</SelectItem>
                    <SelectItem value="poor">Poor (-3)</SelectItem>
                    <SelectItem value="needs_repair">Needs Repair (-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardHeader><CardTitle>Dimensions</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalLinearFeet">Total Linear Feet</Label>
                <Input id="totalLinearFeet" type="number" value={form.totalLinearFeet} onChange={e => set("totalLinearFeet", e.target.value)} placeholder="210" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="averageHeight">Average Height (ft)</Label>
                <Input id="averageHeight" type="number" value={form.averageHeight} onChange={e => set("averageHeight", e.target.value)} placeholder="6" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfSections">Number of Sections</Label>
                <Input id="numberOfSections" type="number" value={form.numberOfSections} onChange={e => set("numberOfSections", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfPosts">Number of Posts</Label>
                <Input id="numberOfPosts" type="number" value={form.numberOfPosts} onChange={e => set("numberOfPosts", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfGates">Number of Gates</Label>
                <Input id="numberOfGates" type="number" value={form.numberOfGates} onChange={e => set("numberOfGates", e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* History & Timeline */}
        <Card>
          <CardHeader><CardTitle>History & Timeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lastStainedYear">Last Stained Year *</Label>
                <Input id="lastStainedYear" type="number" min="2000" max={new Date().getFullYear()} value={form.lastStainedYear} onChange={e => set("lastStainedYear", e.target.value)} placeholder="2020" />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch id="lastStainedYearIsExact" checked={form.lastStainedYearIsExact} onCheckedChange={v => set("lastStainedYearIsExact", v)} />
                <Label htmlFor="lastStainedYearIsExact">Exact year?</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current State & Environment */}
        <Card>
          <CardHeader><CardTitle>Current State & Environment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Current Finish</Label>
                <Select value={form.currentFinish} onValueChange={v => set("currentFinish", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stain_and_sealed">Stain & Sealed (0)</SelectItem>
                    <SelectItem value="bare">Bare (-3 months)</SelectItem>
                    <SelectItem value="weathered">Weathered (-1 month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Weather Exposure</Label>
                <Select value={form.weatherExposure} onValueChange={v => set("weatherExposure", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_sun">Full Sun (-3 months)</SelectItem>
                    <SelectItem value="near_water">Near Water (-3 months)</SelectItem>
                    <SelectItem value="partial_shade">Partial Shade (-1 month)</SelectItem>
                    <SelectItem value="full_shade">Full Shade (0)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Moisture Level</Label>
                <Select value={form.moistureLevel} onValueChange={v => set("moistureLevel", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry">Dry (0)</SelectItem>
                    <SelectItem value="normal">Normal (-1 month)</SelectItem>
                    <SelectItem value="high">High (-3 months)</SelectItem>
                    <SelectItem value="water_logged">Water Logged (-3 months)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Condition Issues */}
        <Card>
          <CardHeader><CardTitle>Condition Issues</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["moldMildew", "Mold/Mildew Present (-3 months)"],
                ["cracking", "Cracking/Splitting (-3 months)"],
                ["graying", "Graying/Oxidation (-3 months)"],
                ["repairNeeded", "Repair Needed (-3 months)"],
              ].map(([field, label]) => (
                <div key={field} className="flex items-center justify-between">
                  <Label htmlFor={field}>{label}</Label>
                  <Switch id={field} checked={!!form[field as keyof typeof form]} onCheckedChange={v => set(field, v)} />
                </div>
              ))}
            </div>
            {form.repairNeeded && (
              <div className="space-y-2">
                <Label htmlFor="repairNotes">Repair Notes</Label>
                <Textarea id="repairNotes" value={form.repairNotes} onChange={e => set("repairNotes", e.target.value)} placeholder="Describe repairs needed..." />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Product Recommendations */}
        <Card>
          <CardHeader><CardTitle>Product Recommendations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Recommended Brand</Label>
                <Input value={form.recommendedBrand} onChange={e => set("recommendedBrand", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Product Type</Label>
                <Select value={form.recommendedProductType} onValueChange={v => set("recommendedProductType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stain">Stain</SelectItem>
                    <SelectItem value="seal">Seal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recommendedCoats">Recommended Coats</Label>
                <Input id="recommendedCoats" type="number" min="1" max="5" value={form.recommendedCoats} onChange={e => set("recommendedCoats", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productColor">Product Color</Label>
                <Input id="productColor" value={form.productColor} onChange={e => set("productColor", e.target.value)} placeholder="Cedar Natural" />
              </div>
              <div className="space-y-2">
                <Label>Prep Required</Label>
                <Select value={form.prepRequired} onValueChange={v => set("prepRequired", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="light_cleaning">Light Cleaning</SelectItem>
                    <SelectItem value="power_wash">Power Wash</SelectItem>
                    <SelectItem value="sand">Sand</SelectItem>
                    <SelectItem value="scrape">Scrape</SelectItem>
                    <SelectItem value="bleach_treat">Bleach Treat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="careNotes">Care Notes</Label>
              <Textarea id="careNotes" value={form.careNotes} onChange={e => set("careNotes", e.target.value)} placeholder="Special care instructions..." />
            </div>
          </CardContent>
        </Card>

        {/* Estimates */}
        <Card>
          <CardHeader><CardTitle>Cost Estimates</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedProductGallons">Product Gallons</Label>
                <Input id="estimatedProductGallons" type="number" step="0.1" value={form.estimatedProductGallons} onChange={e => set("estimatedProductGallons", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedLaborHours">Labor Hours</Label>
                <Input id="estimatedLaborHours" type="number" step="0.5" value={form.estimatedLaborHours} onChange={e => set("estimatedLaborHours", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedMaterialCost">Material Cost ($)</Label>
                <Input id="estimatedMaterialCost" type="number" step="0.01" value={form.estimatedMaterialCost} onChange={e => set("estimatedMaterialCost", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedLaborCost">Labor Cost ($)</Label>
                <Input id="estimatedLaborCost" type="number" step="0.01" value={form.estimatedLaborCost} onChange={e => set("estimatedLaborCost", e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedBrandUpsell">Brand Upsell ($)</Label>
                <Input id="estimatedBrandUpsell" type="number" step="0.01" value={form.estimatedBrandUpsell} onChange={e => set("estimatedBrandUpsell", Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTotal">Total Estimate ($)</Label>
                <Input id="estimatedTotal" type="number" step="0.01" value={form.estimatedTotal} onChange={e => set("estimatedTotal", e.target.value)} className="font-semibold" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/ops/diagnosis">Cancel</Link>
          </Button>
          <Button type="submit" disabled={createDiagnosis.isPending}>
            {createDiagnosis.isPending ? "Creating..." : "Create Diagnosis"}
          </Button>
        </div>
      </form>
    </div>
  );
}
