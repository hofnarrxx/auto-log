export interface MaintenanceAttachment {
  id: number;
  fileName: string;
  contentType: string | null;
  sizeBytes: number | null;
  url: string | null;
  createdAt: string;
}

export interface MaintenanceRecord {
  id: number;
  vehicleId: number;
  serviceDate: string;
  title: string | null;
  mileage: number | null;
  category: string;
  description: string;
  cost: number | null;
  currency?: string;
  attachments?: MaintenanceAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceRecordPayload {
  serviceDate: string;
  title: string;
  mileage: number | null;
  category: string;
  description: string;
  cost: number | null;
  currency: string;
}

export interface MaintenanceAttachmentUploadUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface MaintenanceAttachmentDownloadUrlResponse {
  downloadUrl: string;
}
