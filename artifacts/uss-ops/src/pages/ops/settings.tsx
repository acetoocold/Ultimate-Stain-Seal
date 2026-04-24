import { useGetSettings, useListPricingRules } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings2, DollarSign, AlertTriangle, Plus, Wifi } from "lucide-react";

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const { data: pricingRules } = useListPricingRules();

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Company configuration and pricing rules</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Settings2 className="w-4 h-4" />
              Company Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Company Name</label>
              <p className="text-sm font-medium">{settings?.companyName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <p className="text-sm">{settings?.companyPhone ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{settings?.companyEmail ?? "—"}</p>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <p className="text-sm">{settings?.companyAddress ?? "—"}</p>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">Edit Company Info</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-4 h-4" />
              Billing Defaults
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Tax Rate</label>
                <p className="text-sm font-medium">{settings?.defaultTaxRate ? `${(parseFloat(settings.defaultTaxRate.toString()) * 100).toFixed(2)}%` : "—"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Labor Rate/hr</label>
                <p className="text-sm font-medium">{settings?.defaultLaborRate ? `$${settings.defaultLaborRate}/hr` : "—"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Coverage Rate</label>
                <p className="text-sm font-medium">{settings?.defaultCoverageRate ? `${settings.defaultCoverageRate} sqft/gal` : "—"}</p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Invoice Prefix</label>
                <p className="text-sm font-medium">{settings?.invoicePrefix ?? "USS"}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-2">Edit Billing Defaults</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4" />
              Invoice Disclaimers
            </CardTitle>
            <CardDescription>Displayed on customer invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">Soft Disclaimer</Badge>
                <span className="text-xs text-muted-foreground">Standard informational notice</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3 border">{settings?.softDisclaimerText ?? "—"}</p>
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="destructive" className="text-xs">Hard Disclaimer</Badge>
                <span className="text-xs text-muted-foreground">Requires customer signature</span>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3 border">{settings?.hardDisclaimerText ?? "—"}</p>
            </div>
            <Button variant="outline" size="sm">Edit Disclaimers</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="w-4 h-4" />
              Glide Integration
            </CardTitle>
            <CardDescription>Sync data with the Glide mobile app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/30">
              <div className={`w-2.5 h-2.5 rounded-full ${settings?.glideEnabled ? "bg-green-500" : "bg-gray-300"}`} />
              <div>
                <p className="text-sm font-medium">{settings?.glideEnabled ? "Glide sync enabled" : "Glide sync disabled"}</p>
                <p className="text-xs text-muted-foreground">{settings?.glideApiKey ? "API key configured" : "No API key set"}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto">Configure Glide</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Pricing Rules</h2>
            <p className="text-sm text-muted-foreground">Service pricing by fence type</p>
          </div>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rule Name</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Fence Type</TableHead>
                <TableHead className="text-right">Price/SqFt</TableHead>
                <TableHead className="text-right">Min Charge</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!pricingRules?.length ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No pricing rules defined.</TableCell></TableRow>
              ) : pricingRules.map(rule => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">{rule.name}</TableCell>
                  <TableCell className="capitalize">{rule.serviceType.replace("_", " ")}</TableCell>
                  <TableCell className="capitalize">{rule.fenceType?.replace("_", " ") ?? "Any"}</TableCell>
                  <TableCell className="text-right">{rule.pricePerSqFt ? `$${parseFloat(rule.pricePerSqFt.toString()).toFixed(3)}` : "—"}</TableCell>
                  <TableCell className="text-right">{rule.minimumCharge ? `$${parseFloat(rule.minimumCharge.toString()).toFixed(2)}` : "—"}</TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? "default" : "secondary"}>{rule.isActive ? "Active" : "Off"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
