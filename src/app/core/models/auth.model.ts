export interface LoginRequest {
  username_or_email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
