import type { Dispatch, SetStateAction } from 'react';
import { AlertCircle, Ban, CheckCircle, Download, Filter, Loader2, Pencil, Plus, Search, XCircle } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { ListPagination } from '@/shared/ui/list-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Textarea } from '@/shared/ui/textarea';

import {
  participantUserRoleOptions,
  participantUserStatusOptions,
  toggleUserRole,
  userNeedsStudentInfo,
  type ParticipantUserFormState,
} from '../model/participant-user-form';
import {
  getParticipantInitials,
  getParticipantRoleLabels,
  getParticipantStatusBadge,
  type ParticipantFilterType,
} from '../model/participants-view.utils';
import { useParticipantsView } from '../model/useParticipantsView';
import { ParticipantFiltersSheet } from './ParticipantFiltersSheet';

export function Participants() {
  const view = useParticipantsView();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Participants</h1>
          <p className="text-sm text-muted-foreground">
            Manage participant registration and status
            {view.selectedIds.length > 0 && ` - ${view.selectedIds.length} selected`}
            {view.pagination && ` - ${view.pagination.totalItems} total`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => view.setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </Button>
          <Button variant="outline" onClick={view.handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9"
            value={view.searchQuery}
            onChange={(event) => view.setSearchQuery(event.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => view.setFilterSheetOpen(true)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'PENDING', 'APPROVED', 'ACTIVE', 'REJECTED', 'SUSPENDED'] as ParticipantFilterType[]).map((filter) => (
          <Badge
            key={filter}
            variant={view.activeFilter === filter ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => view.setActiveFilter(filter)}
          >
            {filter === 'all' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase()} ({view.filterCounts[filter]})
          </Badge>
        ))}
      </div>

      {view.usersQuery.isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-muted-foreground">Loading participants...</span>
        </div>
      )}

      {view.usersQuery.error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {view.usersQuery.error instanceof ApiError ? view.usersQuery.error.firstError : 'Failed to load participants'}
          </p>
        </div>
      )}

      {!view.usersQuery.isLoading && !view.usersQuery.error && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={view.allSelected}
                    onCheckedChange={view.toggleAll}
                    aria-label="Select all"
                    className={view.someSelected ? 'data-[state=checked]:bg-primary' : ''}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>GitHub</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Student Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                view.filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={view.selectedIds.includes(user.id)}
                        onCheckedChange={() => view.toggleSelect(user.id)}
                        aria-label={`Select ${user.fullName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {getParticipantInitials(user.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {user.studentType?.toLowerCase() || 'user'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.githubUsername || <span className="italic">-</span>}
                    </TableCell>
                    <TableCell className="text-sm">{getParticipantRoleLabels(user)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.studentId ? (
                        <span>{user.studentId}{user.schoolName ? ` - ${user.schoolName}` : ''}</span>
                      ) : (
                        <span className="italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getParticipantStatusBadge(user.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Actions</span>
                            ...
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => view.openEditDialog(user)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {user.registrationSource === 'FORM' && user.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => view.approveMutation.mutate(user.id)}
                                disabled={view.approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => view.rejectMutation.mutate(user.id)}
                                disabled={view.rejectMutation.isPending}
                                className="text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {(user.status === 'APPROVED' || user.status === 'ACTIVE') && (
                            <DropdownMenuItem
                              onClick={() => view.suspendMutation.mutate(user.id)}
                              disabled={view.suspendMutation.isPending}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.registrationSource === 'FORM' && user.status === 'REJECTED' && (
                            <DropdownMenuItem
                              onClick={() => view.approveMutation.mutate(user.id)}
                              disabled={view.approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {user.registrationSource === 'FORM' && user.status === 'SUSPENDED' && (
                            <DropdownMenuItem
                              onClick={() => view.approveMutation.mutate(user.id)}
                              disabled={view.approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Re-activate
                            </DropdownMenuItem>
                          )}
                          {user.registrationSource === 'GOOGLE' && user.status === 'SUSPENDED' && (
                            <DropdownMenuItem
                              onClick={() => view.activateMutation.mutate(user.id)}
                              disabled={view.activateMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Re-activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ListPagination page={view.page} pagination={view.pagination} onPageChange={view.setPage} />
        </Card>
      )}

      <ParticipantFiltersSheet
        open={view.filterSheetOpen}
        onOpenChange={view.setFilterSheetOpen}
        activeFilter={view.activeFilter}
        setActiveFilter={view.setActiveFilter}
        filterCounts={view.filterCounts}
      />

      <ParticipantUserDialog
        form={view.createForm}
        mode="create"
        onChange={view.setCreateForm}
        onOpenChange={view.setCreateOpen}
        onSubmit={view.handleCreateUser}
        open={view.createOpen}
        submitting={view.createMutation.isPending}
      />

      <ParticipantUserDialog
        form={view.editForm}
        mode="edit"
        onChange={view.setEditForm}
        onOpenChange={view.setEditOpen}
        onSubmit={view.handleUpdateUser}
        open={view.editOpen}
        submitting={view.updateMutation.isPending}
      />
    </div>
  );
}

function ParticipantUserDialog({
  form,
  mode,
  onChange,
  onOpenChange,
  onSubmit,
  open,
  submitting,
}: {
  form: ParticipantUserFormState;
  mode: 'create' | 'edit';
  onChange: Dispatch<SetStateAction<ParticipantUserFormState>>;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  open: boolean;
  submitting: boolean;
}) {
  const needsStudentInfo = userNeedsStudentInfo(form);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden p-0">
        <div className="flex-shrink-0 px-6 pt-6">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create User' : 'Edit User'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Add a local account for a participant or event staff member.' : 'Update account profile fields and assigned roles.'}
          </DialogDescription>
        </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6">
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-user-full-name`}>Full Name</Label>
              <Input
                id={`${mode}-user-full-name`}
                value={form.fullName}
                onChange={(event) => onChange((current) => ({ ...current, fullName: event.target.value }))}
                placeholder="Nguyen Van A"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-user-email`}>Email</Label>
              <Input
                id={`${mode}-user-email`}
                type="email"
                value={form.email}
                onChange={(event) => onChange((current) => ({ ...current, email: event.target.value }))}
                placeholder="participant@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="create-user-password">Password</Label>
                <Input
                  id="create-user-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => onChange((current) => ({ ...current, password: event.target.value }))}
                  placeholder="At least 8 characters"
                />
              </div>
            )}
            {mode === 'create' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => onChange((current) => ({ ...current, status: value as ParticipantUserFormState['status'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {participantUserStatusOptions.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Roles</Label>
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 md:grid-cols-4">
              {participantUserRoleOptions.map((role) => (
                <label key={role} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.roles.includes(role)}
                    onCheckedChange={() => onChange((current) => ({ ...current, roles: toggleUserRole(current.roles, role) }))}
                  />
                  <span className="truncate">{role}</span>
                </label>
              ))}
            </div>
          </div>

          {needsStudentInfo && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Student Type</Label>
                <Select
                  value={form.studentType}
                  onValueChange={(value) => onChange((current) => ({ ...current, studentType: value as ParticipantUserFormState['studentType'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FPT">FPT</SelectItem>
                    <SelectItem value="EXTERNAL">External</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${mode}-student-id`}>Student ID</Label>
                <Input
                  id={`${mode}-student-id`}
                  value={form.studentId}
                  onChange={(event) => onChange((current) => ({ ...current, studentId: event.target.value }))}
                  placeholder="SE123456"
                />
              </div>
              {form.studentType === 'EXTERNAL' && (
                <div className="space-y-2">
                  <Label htmlFor={`${mode}-school-name`}>School Name</Label>
                  <Input
                    id={`${mode}-school-name`}
                    value={form.schoolName}
                    onChange={(event) => onChange((current) => ({ ...current, schoolName: event.target.value }))}
                    placeholder="University name"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${mode}-github-username`}>GitHub Username</Label>
              <Input
                id={`${mode}-github-username`}
                value={form.githubUsername}
                onChange={(event) => onChange((current) => ({ ...current, githubUsername: event.target.value }))}
                placeholder="octocat"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${mode}-phone`}>Phone</Label>
              <Input
                id={`${mode}-phone`}
                value={form.phone}
                onChange={(event) => onChange((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+84901234567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${mode}-bio`}>Bio</Label>
            <Textarea
              id={`${mode}-bio`}
              rows={3}
              value={form.bio}
              onChange={(event) => onChange((current) => ({ ...current, bio: event.target.value }))}
              placeholder="Short profile note"
            />
          </div>
        </div>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 border-t bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'create' ? 'Create User' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
