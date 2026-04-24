import { useParams, Link } from "wouter";
import { useGetJobsheet } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ClipboardList, Calendar, User, CloudSun, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function JobsheetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: js, isLoading } = useGetJobsheet(parseInt(id));

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading...</div>;
  if (!js) return <div className="p-8 text-red-600">Jobsheet not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ops/jobsheets"><ArrowLeft className="w-4 h-4 mr-1" />Back</Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{js.workOrderNumber ?? `Jobsheet #${js.id}`}</h1>
            <Badge variant="outline" className="capitalize">{js.status}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            {js.workDate ? format(new Date(js.workDate), "MMMM d, yyyy") : "No date recorded"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />Crew
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-xs text-muted-foreground">Lead</span><p className="text-sm font-medium">{js.crewLead ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground">Members</span><p className="text-sm">{js.crewMembers ?? "—"}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-muted-foreground">Start</span><p className="text-sm">{js.startTime ?? "—"}</p></div>
              <div><span className="text-xs text-muted-foreground">End</span><p className="text-sm">{js.endTime ?? "—"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CloudSun className="w-4 h-4" />Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-xs text-muted-foreground">Weather</span><p className="text-sm">{js.weatherConditions ?? "—"}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-muted-foreground">Temp</span><p className="text-sm">{js.temperature ? `${js.temperature}°F` : "—"}</p></div>
              <div><span className="text-xs text-muted-foreground">Humidity</span><p className="text-sm">{js.humidity ? `${js.humidity}%` : "—"}</p></div>
            </div>
            <div><span className="text-xs text-muted-foreground">Surface Moisture</span><p className="text-sm capitalize">{js.surfaceMoisture ?? "—"}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />Work Performed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div><span className="text-xs text-muted-foreground">Areas Completed</span><p className="text-sm">{js.areasCompleted ?? "—"}</p></div>
            <div><span className="text-xs text-muted-foreground">Products Applied</span><p className="text-sm">{js.productsApplied ?? "—"}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-xs text-muted-foreground">Coats Applied</span><p className="text-sm font-medium">{js.coatsApplied ?? "—"}</p></div>
              <div><span className="text-xs text-muted-foreground">Method</span><p className="text-sm capitalize">{js.applicationMethod?.replace("_"," ") ?? "—"}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />Completion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Customer Present:</span>
              <Badge variant={js.customerPresent ? "default" : "secondary"}>{js.customerPresent ? "Yes" : "No"}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Follow-up Required:</span>
              <Badge variant={js.followUpRequired ? "destructive" : "secondary"}>{js.followUpRequired ? "Yes" : "No"}</Badge>
            </div>
            {js.followUpNotes && <div><span className="text-xs text-muted-foreground">Follow-up Notes</span><p className="text-sm">{js.followUpNotes}</p></div>}
            {js.fieldNotes && <div><span className="text-xs text-muted-foreground">Field Notes</span><p className="text-sm">{js.fieldNotes}</p></div>}
          </CardContent>
        </Card>
      </div>

      {js.issuesEncountered && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="text-base text-amber-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />Issues Encountered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-amber-800">{js.issuesEncountered}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
