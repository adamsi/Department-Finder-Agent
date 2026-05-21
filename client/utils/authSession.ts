let valid = false;

export function isAuthSessionValid(): boolean {
  return valid;
}

export function setAuthSessionValid(value: boolean): void {
  valid = value;
}

export function clearAuthSession(): void {
  valid = false;
}
