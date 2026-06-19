import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Loader2, Pencil, Plus, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/shared/api/client';
import { permissionsApi } from '@/shared/api/permissions';
import { rolesApi } from '@/shared/api/roles';
import type { Permission, PermissionGroup, Role } from '@/shared/api/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';

interface RoleFormState {
  name: string;
  code: string;
  description: string;
}

interface PermissionEditState {
  name: string;
  description: string;
  module: string;
}

const emptyRoleForm: RoleFormState = {
  name: '',
  code: '',
  description: '',
};

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.firstError;
  if (error instanceof Error) return error.message;
  return 'Something went wrong.';
}

function roleToForm(role: Role): RoleFormState {
  return {
    name: role.name || '',
    code: role.code || role.name || '',
    description: role.description || '',
  };
}

function permissionToEditState(permission: Permission): PermissionEditState {
  return {
    name: permission.name || permission.code,
    description: permission.description || '',
    module: permission.module || permission.code.split('_')[0] || 'GENERAL',
  };
}

function formatPermissionCode(code: string) {
  return code.toLowerCase().replace(/_/g, ' ');
}

function RoleForm({
  form,
  onChange,
}: {
  form: RoleFormState;
  onChange: (form: RoleFormState) => void;
}) {
  return (
    <div className="grid gap-4 py-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role-name">Name</Label>
          <Input
            id="role-name"
            value={form.name}
            onChange={(event) => onChange({ ...form, name: event.target.value.toUpperCase() })}
            placeholder="REVIEWER"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-code">Code</Label>
          <Input
            id="role-code"
            value={form.code}
            onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })}
            placeholder="REVIEWER"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role-description">Description</Label>
        <Input
          id="role-description"
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
          placeholder="Can review operational records and event evidence."
        />
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  if (role.isSystemRole) return <Badge variant="secondary">System</Badge>;
  if (role.isActive === false) return <Badge variant="outline">Inactive</Badge>;
  return <Badge variant="outline">Custom</Badge>;
}

export function RbacManagementView() {
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createForm, setCreateForm] = useState<RoleFormState>(emptyRoleForm);
  const [editForm, setEditForm] = useState<RoleFormState>(emptyRoleForm);
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, PermissionEditState>>({});

  const rolesQuery = useQuery({
    queryKey: queryKeys.roles.list({ limit: 100 }),
    queryFn: () => rolesApi.list({ limit: 100 }),
  });

  const permissionsQuery = useQuery({
    queryKey: queryKeys.permissions.grouped(),
    queryFn: () => permissionsApi.grouped(),
  });

  const roles = rolesQuery.data?.data || [];
  const permissionGroups = permissionsQuery.data?.data || [];
  const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0] || null;

  useEffect(() => {
    if (!selectedRoleId && roles[0]) setSelectedRoleId(roles[0].id);
  }, [roles, selectedRoleId]);

  useEffect(() => {
    if (selectedRole) setEditForm(roleToForm(selectedRole));
  }, [selectedRole]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();
    if (!query) return roles;
    return roles.filter((role) => {
      const searchable = `${role.name} ${role.code || ''} ${role.description || ''}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [roleSearch, roles]);

  const assignedPermissionIds = useMemo(() => {
    return new Set((selectedRole?.permissions || []).map((permission) => permission.id));
  }, [selectedRole?.permissions]);

  const visiblePermissionGroups = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase();
    if (!query) return permissionGroups;

    return permissionGroups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((permission) => {
          const searchable = `${permission.code} ${permission.name || ''} ${permission.description || ''} ${permission.module || group.module}`.toLowerCase();
          return searchable.includes(query);
        }),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [permissionGroups, permissionSearch]);

  const selectedRoleCanManagePermissions = Boolean(selectedRole && selectedRole.name !== 'ADMIN');
  const selectedRoleCanDelete = Boolean(selectedRole && !selectedRole.isSystemRole && selectedRole.isActive !== false);

  const invalidateRbac = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.permissions.all }),
    ]);
  };

  const createRoleMutation = useMutation({
    mutationFn: () => rolesApi.create({
      name: createForm.name.trim(),
      code: createForm.code.trim() || createForm.name.trim(),
      description: createForm.description.trim() || null,
      permissions: [],
    }),
    onSuccess: async (response) => {
      toast.success('Role created', { description: `${response.data.name} is ready.` });
      setSelectedRoleId(response.data.id);
      setCreateForm(emptyRoleForm);
      setCreateOpen(false);
      await invalidateRbac();
    },
    onError: (error) => toast.error('Could not create role', { description: getErrorMessage(error) }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: () => {
      if (!selectedRole) throw new Error('Select a role first.');
      return rolesApi.update(selectedRole.id, {
        name: editForm.name.trim(),
        code: editForm.code.trim() || editForm.name.trim(),
        description: editForm.description.trim() || null,
      });
    },
    onSuccess: async (response) => {
      toast.success('Role updated', { description: response.data.name });
      setEditOpen(false);
      await invalidateRbac();
    },
    onError: (error) => toast.error('Could not update role', { description: getErrorMessage(error) }),
  });

  const deleteRoleMutation = useMutation({
    mutationFn: () => {
      if (!selectedRole) throw new Error('Select a role first.');
      return rolesApi.delete(selectedRole.id);
    },
    onSuccess: async () => {
      toast.success('Role deactivated');
      setDeleteOpen(false);
      setSelectedRoleId('');
      await invalidateRbac();
    },
    onError: (error) => toast.error('Could not delete role', { description: getErrorMessage(error) }),
  });

  const setRolePermissionsMutation = useMutation({
    mutationFn: (permissionIds: string[]) => {
      if (!selectedRole) throw new Error('Select a role first.');
      return rolesApi.setPermissions(selectedRole.id, permissionIds);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
    },
    onError: (error) => toast.error('Could not update role permissions', { description: getErrorMessage(error) }),
  });

  const updatePermissionMutation = useMutation({
    mutationFn: ({ permission, data }: { permission: Permission; data: Partial<PermissionEditState> & { isActive?: boolean } }) =>
      permissionsApi.update(permission.id, data),
    onSuccess: async (response) => {
      toast.success('Permission updated', { description: response.data.code });
      await invalidateRbac();
    },
    onError: (error) => toast.error('Could not update permission', { description: getErrorMessage(error) }),
  });

  const handleTogglePermission = (permission: Permission, checked: boolean) => {
    if (!selectedRole || !selectedRoleCanManagePermissions || setRolePermissionsMutation.isPending) return;

    const next = new Set(assignedPermissionIds);
    if (checked) next.add(permission.id);
    else next.delete(permission.id);

    setRolePermissionsMutation.mutate([...next]);
  };

  const handleCreateRole = () => {
    if (!createForm.name.trim()) {
      toast.error('Role name is required.');
      return;
    }
    createRoleMutation.mutate();
  };

  const handleUpdateRole = () => {
    if (!selectedRole) return;
    if (!editForm.name.trim()) {
      toast.error('Role name is required.');
      return;
    }
    updateRoleMutation.mutate();
  };

  const handlePermissionDraftChange = (permission: Permission, next: PermissionEditState) => {
    setPermissionDrafts((current) => ({ ...current, [permission.id]: next }));
  };

  const handleSavePermission = (permission: Permission, group: PermissionGroup) => {
    const draft = permissionDrafts[permission.id] || permissionToEditState({ ...permission, module: permission.module || group.module });
    updatePermissionMutation.mutate({
      permission,
      data: {
        name: draft.name.trim() || permission.code,
        description: draft.description.trim() || null,
        module: draft.module.trim().toUpperCase() || group.module,
      },
    });
  };

  const permissionCount = permissionGroups.reduce((total, group) => total + group.permissions.length, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Roles & Permissions
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage role containers, permission assignments, and the permission catalog used by authorization.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>Create a custom permission container for users.</DialogDescription>
            </DialogHeader>
            <RoleForm form={createForm} onChange={setCreateForm} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateRole} disabled={createRoleMutation.isPending}>
                {createRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Role'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{roles.length}</p>
            <p className="text-xs text-muted-foreground">System and custom containers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{permissionCount}</p>
            <p className="text-xs text-muted-foreground">{permissionGroups.length} modules</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Selected Role</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="truncate text-2xl font-bold">{selectedRole?.name || 'None'}</p>
            <p className="text-xs text-muted-foreground">{selectedRole?.permissionCount ?? selectedRole?.permissions?.length ?? 0} permissions assigned</p>
          </CardContent>
        </Card>
      </div>

      {(rolesQuery.error || permissionsQuery.error) && (
        <Alert>
          <AlertTitle>Could not load RBAC data</AlertTitle>
          <AlertDescription>{getErrorMessage(rolesQuery.error || permissionsQuery.error)}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">Role Matrix</TabsTrigger>
          <TabsTrigger value="permissions">Permission Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Roles</CardTitle>
                <CardDescription>Select a role to inspect and assign permissions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search roles"
                    value={roleSearch}
                    onChange={(event) => setRoleSearch(event.target.value)}
                  />
                </div>

                {rolesQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading roles
                  </div>
                ) : (
                  <div className="max-h-[36rem] space-y-2 overflow-auto pr-1">
                    {filteredRoles.map((role) => {
                      const selected = role.id === selectedRole?.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          className={`w-full rounded-md border p-3 text-left transition ${selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                          onClick={() => setSelectedRoleId(role.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{role.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{role.description || role.code || 'No description'}</p>
                            </div>
                            <RoleBadge role={role} />
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{role.permissionCount ?? role.permissions?.length ?? 0} permissions</p>
                        </button>
                      );
                    })}
                    {filteredRoles.length === 0 && (
                      <p className="rounded-md border p-4 text-sm text-muted-foreground">No roles match this search.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedRole?.name || 'Select a role'}</CardTitle>
                    <CardDescription>{selectedRole?.description || 'Permission assignments are grouped by module.'}</CardDescription>
                  </div>
                  {selectedRole && (
                    <div className="flex flex-wrap gap-2">
                      <Dialog open={editOpen} onOpenChange={setEditOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                          <DialogHeader>
                            <DialogTitle>Edit Role</DialogTitle>
                            <DialogDescription>Update metadata for {selectedRole.name}.</DialogDescription>
                          </DialogHeader>
                          <RoleForm form={editForm} onChange={setEditForm} />
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending}>
                              {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Role'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button variant="outline" size="sm" disabled={!selectedRoleCanDelete} onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deactivate
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {!selectedRole ? (
                  <Alert>
                    <KeyRound className="h-4 w-4" />
                    <AlertTitle>No role selected</AlertTitle>
                    <AlertDescription>Create or select a role before assigning permissions.</AlertDescription>
                  </Alert>
                ) : selectedRole.name === 'ADMIN' ? (
                  <Alert>
                    <ShieldCheck className="h-4 w-4" />
                    <AlertTitle>ADMIN is seed-managed</AlertTitle>
                    <AlertDescription>ADMIN receives all permissions automatically from the backend seed process.</AlertDescription>
                  </Alert>
                ) : null}

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Search permissions"
                    value={permissionSearch}
                    onChange={(event) => setPermissionSearch(event.target.value)}
                  />
                </div>

                {permissionsQuery.isLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading permissions
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visiblePermissionGroups.map((group) => (
                      <div key={group.module} className="rounded-md border">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                          <div>
                            <p className="font-medium">{group.module}</p>
                            <p className="text-xs text-muted-foreground">{group.permissions.length} permissions</p>
                          </div>
                          <Badge variant="outline">
                            {group.permissions.filter((permission) => assignedPermissionIds.has(permission.id)).length} assigned
                          </Badge>
                        </div>
                        <div className="divide-y">
                          {group.permissions.map((permission) => {
                            const checked = assignedPermissionIds.has(permission.id);
                            return (
                              <label key={permission.id} className="flex cursor-pointer items-start gap-3 px-4 py-3 hover:bg-muted/40">
                                <Checkbox
                                  checked={checked}
                                  disabled={!selectedRoleCanManagePermissions || permission.isActive === false || setRolePermissionsMutation.isPending}
                                  onCheckedChange={(value) => handleTogglePermission(permission, value === true)}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-sm">{permission.code}</span>
                                    {permission.isActive === false && <Badge variant="outline">Inactive</Badge>}
                                  </span>
                                  <span className="mt-1 block text-xs text-muted-foreground">
                                    {permission.description || permission.name || formatPermissionCode(permission.code)}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {visiblePermissionGroups.length === 0 && (
                      <p className="rounded-md border p-4 text-sm text-muted-foreground">No permissions match this search.</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Permission Catalog</CardTitle>
              <CardDescription>Permission codes come from the backend constants; metadata and active state are editable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {permissionsQuery.isLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading permissions
                </div>
              ) : (
                permissionGroups.map((group) => (
                  <div key={group.module} className="rounded-md border">
                    <div className="border-b px-4 py-3">
                      <p className="font-medium">{group.module}</p>
                      <p className="text-xs text-muted-foreground">{group.permissions.length} permission records</p>
                    </div>
                    <div className="divide-y">
                      {group.permissions.map((permission) => {
                        const draft = permissionDrafts[permission.id] || permissionToEditState({ ...permission, module: permission.module || group.module });
                        return (
                          <div key={permission.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[minmax(12rem,0.9fr)_minmax(0,1fr)_8rem_8rem] lg:items-end">
                            <div className="space-y-1">
                              <Label className="text-xs">Code</Label>
                              <p className="font-mono text-sm">{permission.code}</p>
                            </div>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-1">
                                <Label htmlFor={`permission-name-${permission.id}`} className="text-xs">Name</Label>
                                <Input
                                  id={`permission-name-${permission.id}`}
                                  value={draft.name}
                                  onChange={(event) => handlePermissionDraftChange(permission, { ...draft, name: event.target.value })}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor={`permission-module-${permission.id}`} className="text-xs">Module</Label>
                                <Input
                                  id={`permission-module-${permission.id}`}
                                  value={draft.module}
                                  onChange={(event) => handlePermissionDraftChange(permission, { ...draft, module: event.target.value.toUpperCase() })}
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2">
                                <Label htmlFor={`permission-description-${permission.id}`} className="text-xs">Description</Label>
                                <Input
                                  id={`permission-description-${permission.id}`}
                                  value={draft.description}
                                  onChange={(event) => handlePermissionDraftChange(permission, { ...draft, description: event.target.value })}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pb-2">
                              <Switch
                                checked={permission.isActive !== false}
                                disabled={updatePermissionMutation.isPending}
                                onCheckedChange={(isActive) => updatePermissionMutation.mutate({ permission, data: { isActive } })}
                              />
                              <span className="text-sm">{permission.isActive === false ? 'Inactive' : 'Active'}</span>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => handleSavePermission(permission, group)}
                              disabled={updatePermissionMutation.isPending}
                            >
                              <Save className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate role</AlertDialogTitle>
            <AlertDialogDescription>
              Deactivate {selectedRole?.name}? The backend will reject this if users are still assigned to the role.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRoleMutation.mutate()} disabled={deleteRoleMutation.isPending}>
              {deleteRoleMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
