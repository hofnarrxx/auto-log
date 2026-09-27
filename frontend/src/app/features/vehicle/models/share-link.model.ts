export interface ShareLinkResponse {
  id: string;
  token: string;
  carId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
  includeAttachments: boolean;
  includeImage: boolean;
}

export interface CreateShareLinkRequest {
  carId: string;
  expiresAt: string;
  includeAttachments: boolean;
  includeImage: boolean;
}
