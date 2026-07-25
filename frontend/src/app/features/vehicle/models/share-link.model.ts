export interface ShareLinkResponse {
  id: number;
  token: string;
  carId: number;
  createdBy: number;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
  includeAttachments: boolean;
}
