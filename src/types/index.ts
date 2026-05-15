export interface ImportJob {
  id: string;
  sourceId: string;
  fileName: string;
  fileType: 'csv' | 'excel' | 'json' | 'xml';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'csv' | 'database' | 'api' | 'excel';
  configuration: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transformation {
  id: string;
  name: string;
  sourceId: string;
  rules: TransformationRule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TransformationRule {
  field: string;
  operation: 'map' | 'filter' | 'aggregate' | 'custom';
  config: Record<string, unknown>;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'email' | 'phone' | 'number' | 'date' | 'custom';
  message: string;
  options?: Record<string, unknown>;
}

export interface ImportRecord {
  id: string;
  jobId: string;
  originalData: Record<string, unknown>;
  transformedData: Record<string, unknown>;
  status: 'valid' | 'invalid' | 'skipped';
  errors: string[];
  createdAt: Date;
}
