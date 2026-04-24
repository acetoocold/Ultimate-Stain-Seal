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
  const { data: diagnosis, isLoading } = useGetDiagnosis({ id: parseInt(id) });

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!diagnosis) return <div className="p-8 text-red-600">Diagnosis not found.</div>;

  const issues: string[] = [];
  if (diagnosis.mildewPresent) issues.push("Mildew present");
  if (diagnosis.grayingPresent) issues.push("Surface graying");
  if (diagnosis.crackingPresent) issues.push("Cracking/splitting");
  if (diagnosis.looseBoards) issues.push("Loose boards");
  if (diagnosis.rotPresent) issues.push("Rot present");

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
            <div><span className="text-xs text-muted-foreground block">Fence Age</span><p className="text-sm font-medium">{diagnosis.fenceAge ? `${diagnosis.fenceAge} yrs` : "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Fence Type</span><p className="text-sm font-medium capitalize">{diagnosis.fenceType}</p></div>
            <div><span className="text-xs text-muted-foreground block">Moisture</span><p className="text-sm font-medium capitalize">{diagnosis.surfaceMoisture ?? "—"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />Surface Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Previously Stained:</span>
              <Badge variant={diagnosis.previouslyStained ? "default" : "secondary"}>{diagnosis.previouslyStained ? "Yes" : "No"}</Badge>
            </div>
            {diagnosis.previouslyStained && (
              <div><span className="text-xs text-muted-foreground block">Previous Product</span><p className="text-sm">{diagnosis.previousProduct ?? "—"}</p></div>
            )}
            <Separator className="my-2" />
            <div className="space-y-1.5">
              {["mildewPresent", "grayingPresent", "crackingPresent", "looseBoards", "rotPresent"].map(key => {
                const val = (diagnosis as any)[key];
                const label = key.replace("Present", "").replace("loose", "Loose ").replace(/([A-Z])/g, " $1").trim();
                return (
                  <div key={key} className="flex items-center gap-2">
                    {val ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    <span className="text-sm capitalize">{label}</span>
                    <Badge variant={val ? "destructive" : "outline"} className="text-xs ml-auto">{val ? "Yes" : "No"}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Wrench className="w-4 h-4" />Recommendation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div><span className="text-xs text-muted-foreground block">Treatment</span><p className="text-sm font-medium capitalize">{diagnosis.recommendedTreatment?.replace("_", " ") ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Product</span><p className="text-sm font-medium">{diagnosis.recommendedProduct ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Coats</span><p className="text-sm font-medium">{diagnosis.recommendedCoats ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground block">Disclaimer Mode</span>
              <Badge variant={diagnosis.disclaimerMode === "hard" ? "destructive" : "outline"} className="text-xs mt-0.5 capitalize">
                {diagnosis.disclaimerMode ?? "none"}
              </Badge>
            </div>
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

        {diagnosis.notes && (
          <Card>
            <CardHeader><CardTitle className="text-base">Notes</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{diagnosis.notes}</p></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
