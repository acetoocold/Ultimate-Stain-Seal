import { useParams, Link } from "wouter";
import { useGetDiagnosis } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Ruler, AlertTriangle, CheckCircle2, Wrench } from "lucide-react";
import { format } from "date-fns";

const CONDITION_COLOR: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-blue-100 text-blue-700",
  fair: "bg-amber-100 text-amber-700",
  poor: "bg-red-100 text-red-700",
  failing: "bg-red-200 text-red-800",
};

export default function DiagnosisDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: diagnosis, isLoading } = useGetDiagnosis(parseInt(id));

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!diagnosis) return <div className="p-8 text-red-600">Diagnosis not found.</div>;

  const conditions: { key: string; label: string; value: boolean | null | undefined }[] = [
    { key: "moldMildew", label: "Mold / Mildew", value: diagnosis.moldMildew },
    { key: "graying", label: "Surface Graying", value: diagnosis.graying },
    { key: "cracking", label: "Cracking / Splitting", value: diagnosis.cracking },
    { key: "repairNeeded", label: "Repair Needed", value: diagnosis.repairNeeded },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ops/diagnosis"><ArrowLeft className="w-4 h-4 mr-1" />Diagnoses</Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Fence Diagnosis #{diagnosis.id}</h1>
            <Badge variant="outline" className={`capitalize ${CONDITION_COLOR[diagnosis.fenceCondition ?? ""] ?? ""}`}>
              {diagnosis.fenceCondition}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {diagnosis.diagnosedAt ? `Diagnosed ${format(new Date(diagnosis.diagnosedAt), "MMMM d, yyyy")}` : "Diagnosis pending"}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/ops/projects/${diagnosis.projectId}`}>View Project</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Ruler className="w-4 h-4" />Fence Measurements</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div><span className="text-xs text-muted-foreground block">Linear Feet</span><p className="text-sm font-medium">{diagnosis.totalLinearFeet ?? "—"} LF</p></div>
            <div><span className="text-xs text-muted-foreground block">Avg. Height</span><p className="text-sm font-medium">{diagnosis.averageHeight ?? "—"} ft</p></div>
            <div><span className="text-xs text-muted-foreground block">Total Sq Ft</span><p className="text-sm font-medium">{diagnosis.totalSqFt ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Gates</span><p className="text-sm font-medium">{diagnosis.numberOfGates ?? 0}</p></div>
            <div><span className="text-xs text-muted-foreground block">Posts</span><p className="text-sm font-medium">{diagnosis.numberOfPosts ?? 0}</p></div>
            <div><span className="text-xs text-muted-foreground block">Last Stained</span><p className="text-sm font-medium">{diagnosis.lastStainedYear ? `${diagnosis.lastStainedYear}` : "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Fence Type</span><p className="text-sm font-medium capitalize">{diagnosis.fenceType}</p></div>
            <div><span className="text-xs text-muted-foreground block">Moisture</span><p className="text-sm font-medium capitalize">{diagnosis.moistureLevel ?? "—"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />Surface Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {diagnosis.currentFinish && (
              <div><span className="text-xs text-muted-foreground block">Current Finish</span><p className="text-sm">{diagnosis.currentFinish}</p></div>
            )}
            <Separator className="my-2" />
            <div className="space-y-1.5">
              {conditions.map(({ key, label, value }) => (
                <div key={key} className="flex items-center gap-2">
                  {value ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                  <span className="text-sm">{label}</span>
                  <Badge variant={value ? "destructive" : "outline"} className="text-xs ml-auto">{value ? "Yes" : "No"}</Badge>
                </div>
              ))}
            </div>
            {diagnosis.repairNotes && (
              <div className="pt-2"><span className="text-xs text-muted-foreground block">Repair Notes</span><p className="text-sm">{diagnosis.repairNotes}</p></div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-4 h-4" />Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {diagnosis.prepRequired && (
              <div><span className="text-xs text-muted-foreground block">Prep Required</span><p className="text-sm capitalize">{diagnosis.prepRequired}</p></div>
            )}
            <div><span className="text-xs text-muted-foreground block">Product</span><p className="text-sm font-medium">{diagnosis.recommendedProduct ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Coats</span><p className="text-sm font-medium">{diagnosis.recommendedCoats ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Weather Exposure</span><p className="text-sm capitalize">{diagnosis.weatherExposure ?? "—"}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Estimate</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Product (gallons)</span><span>{diagnosis.estimatedProductGallons ?? "—"} gal</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor Hours</span><span>{diagnosis.estimatedLaborHours ?? "—"} hrs</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Material Cost</span><span>${parseFloat(diagnosis.estimatedMaterialCost?.toString() ?? "0").toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor Cost</span><span>${parseFloat(diagnosis.estimatedLaborCost?.toString() ?? "0").toFixed(2)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold text-base"><span>Est. Total</span><span>${parseFloat(diagnosis.estimatedTotal?.toString() ?? "0").toFixed(2)}</span></div>
          </CardContent>
        </Card>

        {diagnosis.careNotes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{diagnosis.careNotes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
