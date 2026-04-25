import { useParams, Link } from "wouter";
import { useGetInvoice } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Printer,
} from "lucide-react";
import { format } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  partial: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  void: "bg-gray-100 text-gray-400 line-through",
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: invoice, isLoading } = useGetInvoice(parseInt(id));

  if (isLoading)
    return <div className="p-8 text-muted-foreground">Loading invoice...</div>;
  if (!invoice)
    return <div className="p-8 text-red-600">Invoice not found.</div>;

  const lineItems = (invoice as any).lineItems ?? [];
  const payments = (invoice as any).payments ?? [];

  const isOverdue =
    invoice.dueDate &&
    new Date(invoice.dueDate) < new Date() &&
    invoice.status !== "paid" &&
    invoice.status !== "void";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/ops/invoices">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Invoices
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-mono">
              {invoice.invoiceNumber}
            </h1>
            <Badge
              variant="outline"
              className={`capitalize ${STATUS_BADGE[invoice.status] ?? ""}`}
            >
              {invoice.status}
            </Badge>
            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
          </div>
          <p className="text-muted-foreground text-sm">
            {invoice.dueDate
              ? `Due ${format(new Date(invoice.dueDate), "MMMM d, yyyy")}`
              : "No due date"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            asChild
            data-testid="button-print-invoice"
          >
            <Link href={`/ops/invoices/${invoice.id}/print`}>
              <Printer className="w-4 h-4 mr-1" />
              Print
            </Link>
          </Button>
          {invoice.status === "draft" && (
            <Button size="sm">Send Invoice</Button>
          )}
          {invoice.status !== "paid" && invoice.status !== "void" && (
            <Button size="sm" variant="outline">
              <DollarSign className="w-4 h-4 mr-1" />
              Record Payment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Line Items
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-muted-foreground"
                      >
                        No line items
                      </TableCell>
                    </TableRow>
                  ) : (
                    lineItems.map((li: any) => (
                      <TableRow key={li.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm">{li.description}</p>
                            {li.category && (
                              <Badge
                                variant="outline"
                                className="text-xs mt-0.5 capitalize"
                              >
                                {li.category}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {li.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          $
                          {parseFloat(li.unitPrice?.toString() ?? "0").toFixed(
                            2,
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          $
                          {parseFloat(li.lineTotal?.toString() ?? "0").toFixed(
                            2,
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payments.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          ${parseFloat(p.amount?.toString() ?? "0").toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {p.paymentMethod?.replace("_", " ")} ·{" "}
                          {format(new Date(p.paymentDate), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 text-xs"
                      >
                        Received
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.disclaimerMode && (
            <Card
              className={
                invoice.disclaimerMode === "hard"
                  ? "border-red-200 bg-red-50/30"
                  : "border-amber-200 bg-amber-50/30"
              }
            >
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-4 h-4" />
                  {invoice.disclaimerMode === "hard"
                    ? "Hard Disclaimer (Signature Required)"
                    : "Soft Disclaimer"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {invoice.disclaimerText ?? "—"}
                </p>
                {invoice.disclaimerMode === "hard" && (
                  <div className="mt-4 p-3 border border-dashed rounded-md">
                    <p className="text-xs text-muted-foreground">
                      Customer Signature:{" "}
                      {invoice.signedAt
                        ? `Signed ${format(new Date(invoice.signedAt), "MMM d, yyyy")}`
                        : "Not yet signed"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  ${parseFloat(invoice.subtotal?.toString() ?? "0").toFixed(2)}
                </span>
              </div>
              {invoice.discountAmount &&
                parseFloat(invoice.discountAmount.toString()) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>
                      -$
                      {parseFloat(invoice.discountAmount.toString()).toFixed(2)}
                    </span>
                  </div>
                )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax (
                  {invoice.taxRate
                    ? `${(parseFloat(invoice.taxRate.toString()) * 100).toFixed(2)}%`
                    : "0%"}
                  )
                </span>
                <span>
                  ${parseFloat(invoice.taxAmount?.toString() ?? "0").toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>
                  $
                  {parseFloat(invoice.totalAmount?.toString() ?? "0").toFixed(
                    2,
                  )}
                </span>
              </div>
              {parseFloat(invoice.paidAmount?.toString() ?? "0") > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Paid</span>
                  <span>
                    -${parseFloat(invoice.paidAmount!.toString()).toFixed(2)}
                  </span>
                </div>
              )}
              <div
                className={`flex justify-between font-bold text-base ${parseFloat(invoice.balanceDue?.toString() ?? "0") > 0 ? "text-red-600" : "text-green-600"}`}
              >
                <span>Balance Due</span>
                <span>
                  $
                  {parseFloat(invoice.balanceDue?.toString() ?? "0").toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>

          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
