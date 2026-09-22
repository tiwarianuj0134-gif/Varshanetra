import { demoCredentials } from './demoCredentials';
export async function loginDemo(type: keyof typeof demoCredentials) {
  const cred = demoCredentials[type];
  if (!cred) return;
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: cred.identifier, password: cred.password, rememberMe: false }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Demo login failed:', data.error);
      return;
    }
    const event = new CustomEvent('demo-login-success', { detail: data.user });
    window.dispatchEvent(event);
  } catch (e) {
    console.error('Demo login error', e);
  }
}
