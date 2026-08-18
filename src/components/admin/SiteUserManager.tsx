"use client";

import { useState } from "react";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { UserRole } from "~/lib/roles";
import { api } from "~/trpc/react";

const emptyCreate = {
  name: "",
  email: "",
  password: "",
  role: "manager" as UserRole,
  organizationId: "",
};

type EditDraft = {
  id: string;
  name: string;
  role: UserRole;
  organizationId: string;
  password: string;
};

function roleLabel(role: string) {
  return role === "admin" ? "Site Admin" : "Manager";
}

export function SiteUserManager() {
  const utils = api.useUtils();
  const usersQuery = api.siteAdmin.listUsers.useQuery();
  const orgsQuery = api.siteAdmin.listOrganizations.useQuery();

  const [createForm, setCreateForm] = useState(emptyCreate);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = api.siteAdmin.createUser.useMutation({
    onSuccess: async () => {
      setCreateForm(emptyCreate);
      setFormError(null);
      await utils.siteAdmin.listUsers.invalidate();
      await utils.siteAdmin.listOrganizations.invalidate();
    },
    onError: (error) => setFormError(error.message),
  });

  const updateMutation = api.siteAdmin.updateUser.useMutation({
    onSuccess: async () => {
      setEditing(null);
      setFormError(null);
      await utils.siteAdmin.listUsers.invalidate();
      await utils.siteAdmin.listOrganizations.invalidate();
    },
    onError: (error) => setFormError(error.message),
  });

  if (usersQuery.isLoading || orgsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading users…</p>;
  }

  if (usersQuery.error || orgsQuery.error) {
    return (
      <p className="text-sm text-destructive">
        Unable to load users.{" "}
        {usersQuery.error?.message ?? orgsQuery.error?.message}
      </p>
    );
  }

  const users = usersQuery.data ?? [];
  const orgs = orgsQuery.data ?? [];

  const orgOptions = (
    <>
      <option value="">No organization</option>
      {orgs.map((org) => (
        <option key={org.id} value={org.id}>
          {org.name}
        </option>
      ))}
    </>
  );

  const selectClassName =
    "flex h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-slate-900 outline-none focus-visible:border-[#1e4a8c] focus-visible:ring-[3px] focus-visible:ring-[#1e4a8c]/20";

  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Create user
          </CardTitle>
          <CardDescription>
            Local Credentials accounts for managers and Site Admins. Managers
            require an organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <form
            className="grid gap-3 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              setFormError(null);
              createMutation.mutate({
                name: createForm.name,
                email: createForm.email,
                password: createForm.password,
                role: createForm.role,
                organizationId:
                  createForm.organizationId.trim() === ""
                    ? null
                    : createForm.organizationId,
              });
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="create-name">Name</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-email">Email</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-password">Password</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                minLength={8}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="create-role">Role</Label>
              <select
                id="create-role"
                className={selectClassName}
                value={createForm.role}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    role: event.target.value as UserRole,
                  }))
                }
              >
                <option value="manager">Manager</option>
                <option value="admin">Site Admin</option>
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="create-org">Organization</Label>
              <select
                id="create-org"
                className={selectClassName}
                value={createForm.organizationId}
                onChange={(event) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    organizationId: event.target.value,
                  }))
                }
                required={createForm.role === "manager"}
              >
                {orgOptions}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button
                type="submit"
                className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Users
          </CardTitle>
          <CardDescription>
            {users.length} account{users.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 py-4">
          {users.length === 0 ? (
            <p className="text-sm text-slate-500">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Email</th>
                    <th className="py-2 pr-3 font-medium">Role</th>
                    <th className="py-2 pr-3 font-medium">Organization</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isEditing = editing?.id === user.id;
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-slate-50 align-top text-slate-700"
                      >
                        <td className="py-2.5 pr-3">
                          {isEditing && editing ? (
                            <Input
                              value={editing.name}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  name: event.target.value,
                                })
                              }
                              className="max-w-[12rem]"
                            />
                          ) : (
                            <span className="font-medium text-slate-800">
                              {user.name ?? "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">{user.email}</td>
                        <td className="py-2.5 pr-3">
                          {isEditing && editing ? (
                            <select
                              className={selectClassName}
                              value={editing.role}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  role: event.target.value as UserRole,
                                })
                              }
                            >
                              <option value="manager">Manager</option>
                              <option value="admin">Site Admin</option>
                            </select>
                          ) : (
                            <Badge
                              variant="outline"
                              className={
                                user.role === "admin"
                                  ? "border-[#1e4a8c]/40 bg-[#1e4a8c]/5 text-[#1e4a8c]"
                                  : "border-slate-300 bg-slate-50 text-slate-700"
                              }
                            >
                              {roleLabel(user.role)}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">
                          {isEditing && editing ? (
                            <select
                              className={selectClassName}
                              value={editing.organizationId}
                              onChange={(event) =>
                                setEditing({
                                  ...editing,
                                  organizationId: event.target.value,
                                })
                              }
                            >
                              {orgOptions}
                            </select>
                          ) : (
                            (user.organizationName ?? "—")
                          )}
                        </td>
                        <td className="py-2.5">
                          {isEditing && editing ? (
                            <div className="space-y-2">
                              <Input
                                type="password"
                                placeholder="New password (optional)"
                                value={editing.password}
                                onChange={(event) =>
                                  setEditing({
                                    ...editing,
                                    password: event.target.value,
                                  })
                                }
                                className="max-w-[14rem]"
                              />
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
                                  disabled={updateMutation.isPending}
                                  onClick={() =>
                                    updateMutation.mutate({
                                      id: editing.id,
                                      name: editing.name,
                                      role: editing.role,
                                      organizationId:
                                        editing.organizationId.trim() === ""
                                          ? null
                                          : editing.organizationId,
                                      password: editing.password || undefined,
                                    })
                                  }
                                >
                                  Save
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditing(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing({
                                  id: user.id,
                                  name: user.name ?? "",
                                  role:
                                    user.role === "admin"
                                      ? "admin"
                                      : "manager",
                                  organizationId: user.organizationId ?? "",
                                  password: "",
                                });
                                setFormError(null);
                              }}
                            >
                              Edit
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
