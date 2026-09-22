// Auth utilities — session tokens, OTP generation, cookie helpers

export function generateSessionToken(): string {
  const a = crypto.randomUUID().replace(/-/g, "");
  const b = crypto.randomUUID().replace(/-/g, "");
  return `sess_${a}${b}`;
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getSessionFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map(c => c.trim());
  const found = cookies.find(c => c.startsWith("varshanetra_session="));
  return found ? found.split("=")[1] : null;
}

export function createSessionCookie(token: string, rememberMe = false): string {
  const maxAge = rememberMe ? 30 * 24 * 3600 : 24 * 3600;
  return `varshanetra_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
  return `varshanetra_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
