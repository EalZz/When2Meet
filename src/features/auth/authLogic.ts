export function usernameToEmail(username: string) {
  // Use a reserved domain that always parses as a valid email.
  // This app treats username as the user-facing identifier.
  return `${username.trim().toLowerCase()}@example.com`;
}
