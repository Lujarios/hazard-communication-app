/** Account roles for managers and platform Site Admins. */
export const USER_ROLES = ["manager", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Site Admin (`admin`) has platform-wide access across organizations. */
export function isSiteAdmin(role: string | undefined | null): boolean {
  return role === "admin";
}

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}
