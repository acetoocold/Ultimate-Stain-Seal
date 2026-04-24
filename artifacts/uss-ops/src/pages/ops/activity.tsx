import { useListActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity, User, FileText, Briefcase, DollarSign, ClipboardCheck, Bell } from "lucide-react";

const ACTION_ICONS: Record<string, React.ElementType> = {
  created: Activity,
  updated: Activity,
  sent: Bell,
  received: DollarSign,
  signed: ClipboardCheck,
  completed: ClipboardCheck,
  glide_push: Activity,
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  customer: User,
  project: Briefcase,
  invoice: FileText,
  payment: DollarSign,
  job: ClipboardCheck,
  diagnosis: Activity,
};

const ACTION_COLORS: Record<string, string> = {
  created: "bg-green-100 text-green-700",
  updated: "bg-blue-100 text-blue-700",
  sent: "bg-purple-100 text-purple-700",
  received: "bg-emerald-100 text-emerald-700",
  completed: "bg-teal-100 text-teal-700",
  glide_push: "bg-gray-100 text-gray-700",
};

export default function ActivityPage() {
  const { data: activities, isLoading } = useListActivity({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">Full audit trail of all operations</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Events</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading activity...</div>
          ) : !activities?.length ? (
            <div className="text-center py-8 text-muted-foreground">No activity yet.</div>
          ) : (
            <div className="relative pl-6 space-y-0">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
              {activities.map((entry, idx) => {
                const Icon = ENTITY_ICONS[entry.entityType] ?? Activity;
                return (
                  <div key={entry.id} className="relative flex gap-4 pb-6">
                    <div className="absolute -left-4 w-6 h-6 rounded-full bg-background border-2 border-border flex items-center justify-center">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1 pt-0.5 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground leading-snug">{entry.description}</p>
                        <Badge variant="outline" className={`text-xs shrink-0 capitalize ${ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-700"}`}>
                          {entry.action.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{format(new Date(entry.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        <span className="capitalize text-muted-foreground/60">{entry.entityType}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
