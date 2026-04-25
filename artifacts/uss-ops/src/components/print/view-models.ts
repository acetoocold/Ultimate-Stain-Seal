import type {
  Customer,
  Diagnosis,
  InvoiceDetail,
  Jobsheet,
  ProjectDetail,
  Property,
} from "@workspace/api-client-react";

export interface DiagnosisWithRelations extends Diagnosis {
  customer?: Customer;
  project?: ProjectDetail;
  woodType?: string | null;
  productColor?: string | null;
  recommendedProductType?: string | null;
}

export interface InvoiceDetailWithRelations extends InvoiceDetail {
  customer?: Customer;
  project?: ProjectDetail;
}

export interface JobsheetView extends Jobsheet {}

export type ProjectDetailView = Omit<ProjectDetail, "property"> & {
  property?: Property | null;
};
