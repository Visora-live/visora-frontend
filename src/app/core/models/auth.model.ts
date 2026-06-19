export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string | null;
  estado_acceso: boolean;
  rol_id: number;
  rol_tipo: string | null;
}
