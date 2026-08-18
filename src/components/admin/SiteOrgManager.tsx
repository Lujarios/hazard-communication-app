"use client";

import { useState } from "react";

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
import { api } from "~/trpc/react";

export function SiteOrgManager() {
  const utils = api.useUtils();
  const orgsQuery = api.siteAdmin.listOrganizations.useQuery();
  const createMutation = api.siteAdmin.createOrganization.useMutation({
    onSuccess: async () => {
      setNewName("");
      setFormError(null);
      await utils.siteAdmin.listOrganizations.invalidate();
    },
    onError: (error) => setFormError(error.message),
  });
  const updateMutation = api.siteAdmin.updateOrganization.useMutation({
    onSuccess: async () => {
      setEditingId(null);
      setEditName("");
      setFormError(null);
      await utils.siteAdmin.listOrganizations.invalidate();
    },
    onError: (error) => setFormError(error.message),
  });

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  if (orgsQuery.isLoading) {
    return <p className="text-sm text-slate-500">Loading organizations…</p>;
  }

  if (orgsQuery.error) {
    return (
      <p className="text-sm text-destructive">
        Unable to load organizations. {orgsQuery.error.message}
      </p>
    );
  }

  const orgs = orgsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Create organization
          </CardTitle>
          <CardDescription>
            Add a company so managers can be assigned and scenarios scoped.
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              setFormError(null);
              createMutation.mutate({ name: newName });
            }}
          >
            <div className="min-w-[16rem] flex-1 space-y-1.5">
              <Label htmlFor="new-org-name">Name</Label>
              <Input
                id="new-org-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Contoso Construction"
                required
              />
            </div>
            <Button
              type="submit"
              className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {formError ? (
        <p className="text-sm text-destructive">{formError}</p>
      ) : null}

      <Card className="gap-0 py-0 ring-1 ring-slate-200">
        <CardHeader className="border-b border-slate-100 py-4">
          <CardTitle className="text-base font-semibold text-slate-800">
            Organizations
          </CardTitle>
          <CardDescription>
            {orgs.length} organization{orgs.length === 1 ? "" : "s"}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-4">
          {orgs.length === 0 ? (
            <p className="text-sm text-slate-500">No organizations yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">Users</th>
                    <th className="py-2 pr-3 font-medium">Scenarios</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orgs.map((org) => {
                    const isEditing = editingId === org.id;
                    return (
                      <tr
                        key={org.id}
                        className="border-b border-slate-50 text-slate-700"
                      >
                        <td className="py-2.5 pr-3">
                          {isEditing ? (
                            <Input
                              value={editName}
                              onChange={(event) =>
                                setEditName(event.target.value)
                              }
                              className="max-w-xs"
                            />
                          ) : (
                            <span className="font-medium text-slate-800">
                              {org.name}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {org.userCount}
                        </td>
                        <td className="py-2.5 pr-3 tabular-nums">
                          {org.scenarioCount}
                        </td>
                        <td className="py-2.5">
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                className="bg-[#1e4a8c] hover:bg-[#1e4a8c]/90"
                                disabled={updateMutation.isPending}
                                onClick={() =>
                                  updateMutation.mutate({
                                    id: org.id,
                                    name: editName,
                                  })
                                }
                              >
                                Save
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditName("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingId(org.id);
                                setEditName(org.name);
                                setFormError(null);
                              }}
                            >
                              Rename
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
