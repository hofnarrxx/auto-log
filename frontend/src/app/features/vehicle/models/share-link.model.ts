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

export interface CreateShareLinkRequest {
  carId: number;
  expiresAt: string;
  includeAttachments: boolean;
}
