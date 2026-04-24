import { Link } from "wouter";
import { useListPayments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, DollarSign, TrendingUp, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const METHOD_STYLES: Record<string, string> = {
  check: "bg-blue-50 text-blue-700 border-blue-200",
  zelle: "bg-purple-50 text-purple-700 border-purple-200",
  cash: "bg-green-50 text-green-700 border-green-200",
  credit_card: "bg-orange-50 text-orange-700 border-orange-200",
  bank_transfer: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function PaymentsPage() {
  const { data: payments, isLoading } = useListPayments({});

  const total = payments?.reduce((sum, p) => sum + parseFloat(p.amount?.toString() ?? "0"), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Payment history and collections</p>
        </div>
        <Button asChild>
          <Link href="/ops/payments/new">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold mt-1">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold mt-1">{payments?.length ?? 0}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Payment</p>
                <p className="text-2xl font-bold mt-1">
                  ${payments?.length ? (total / payments.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Loading payments...</TableCell></TableRow>
            ) : !payments?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">No payments recorded yet.</TableCell></TableRow>
            ) : (
              payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm">
                    {payment.paymentDate ? format(new Date(payment.paymentDate), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    {payment.invoiceId ? (
                      <Link href={`/ops/invoices/${payment.invoiceId}`} className="text-primary hover:underline text-sm font-mono">
                        INV-{payment.invoiceId}
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {payment.customerId ? (
                      <Link href={`/ops/customers/${payment.customerId}`} className="text-primary hover:underline">
                        Customer #{payment.customerId}
                      </Link>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize text-xs ${METHOD_STYLES[payment.paymentMethod ?? ""] ?? ""}`}>
                      {payment.paymentMethod?.replace("_", " ") ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground font-mono">{payment.checkNumber ?? payment.transactionId ?? "—"}</TableCell>
                  <TableCell className="text-right font-semibold text-green-700">
                    ${parseFloat(payment.amount?.toString() ?? "0").toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.invoiceId && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/ops/invoices/${payment.invoiceId}`}>Invoice</Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
