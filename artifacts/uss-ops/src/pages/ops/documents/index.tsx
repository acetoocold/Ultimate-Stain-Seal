import { useState } from "react";
import { Link } from "wouter";
import { useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, FileText, Image, FileCheck, Plus, ExternalLink, File } from "lucide-react";
import { format } from "date-fns";

const TYPE_ICON: Record<string, React.ElementType> = {
  photo: Image,
  invoice: FileText,
  contract: FileCheck,
  other: File,
};

const TYPE_STYLES: Record<string, string> = {
  photo: "bg-purple-50 text-purple-700 border-purple-200",
  invoice: "bg-blue-50 text-blue-700 border-blue-200",
  contract: "bg-amber-50 text-amber-700 border-amber-200",
  other: "bg-gray-50 text-gray-700 border-gray-200",
};

function formatFileSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const { data: documents, isLoading } = useListDocuments({});

  const filtered = documents?.filter(d =>
    !search || d.fileName?.toLowerCase().includes(search.toLowerCase()) || d.description?.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Photos, invoices, contracts, and files</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="text-sm text-muted-foreground">{filtered.length} document{filtered.length !== 1 ? "s" : ""}</div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading documents...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No documents found.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(doc => {
            const Icon = TYPE_ICON[doc.documentType ?? "other"] ?? File;
            return (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-sm truncate">{doc.fileName}</p>
                        <Badge variant="outline" className={`text-xs flex-shrink-0 capitalize ${TYPE_STYLES[doc.documentType ?? "other"] ?? ""}`}>
                          {doc.documentType}
                        </Badge>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        {doc.createdAt && <span>{format(new Date(doc.createdAt), "MMM d, yyyy")}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        {doc.projectId && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                            <Link href={`/ops/projects/${doc.projectId}`}>Project</Link>
                          </Button>
                        )}
                        {doc.fileUrl && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Open
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
