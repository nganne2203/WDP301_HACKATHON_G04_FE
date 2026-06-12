import { AlertCircle, Ban, CheckCircle, Download, Filter, Loader2, Search, XCircle } from 'lucide-react';

import { ApiError } from '@/shared/api/client';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Input } from '@/shared/ui/input';
import { ListPagination } from '@/shared/ui/list-pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

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
        {(['all', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as ParticipantFilterType[]).map((filter) => (
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
                <TableHead>Roles</TableHead>
                <TableHead>Student Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {view.filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                          {user.status === 'PENDING' && (
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
                          {user.status === 'APPROVED' && (
                            <DropdownMenuItem
                              onClick={() => view.suspendMutation.mutate(user.id)}
                              disabled={view.suspendMutation.isPending}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status === 'REJECTED' && (
                            <DropdownMenuItem
                              onClick={() => view.approveMutation.mutate(user.id)}
                              disabled={view.approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {user.status === 'SUSPENDED' && (
                            <DropdownMenuItem
                              onClick={() => view.approveMutation.mutate(user.id)}
                              disabled={view.approveMutation.isPending}
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
    </div>
  );
}
