import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, Search, Filter, Loader2, AlertCircle, CheckCircle, XCircle, Ban } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Checkbox } from '../../components/ui/checkbox';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { usersApi } from '../../../lib/api/users';
import { ApiError } from '../../../lib/api/client';
import type { User, UserStatus } from '../../../lib/api/types';

type FilterType = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

export function Participants() {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Fetch users
  const { data: usersResponse, isLoading, error: fetchError } = useQuery({
    queryKey: ['users', searchQuery],
    queryFn: () => usersApi.list({
      page: 1,
      limit: 100,
      search: searchQuery || undefined,
    }),
  });

  const allUsers = usersResponse?.data || [];
  const pagination = usersResponse?.pagination;

  const showStatusToast = (user: User, successMessage: string) => {
    const notification = user.emailNotification;

    if (!notification) {
      toast.success(successMessage);
      return;
    }

    if (notification.sent) {
      toast.success(`${successMessage} and email sent`);
      return;
    }

    toast.warning(`${successMessage}, but email was not sent`, {
      description: notification.reason || 'Check email configuration.',
    });
  };

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => usersApi.approve(id),
    onSuccess: (response) => {
      showStatusToast(response.data, 'User approved');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to approve user', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => usersApi.reject(id),
    onSuccess: (response) => {
      showStatusToast(response.data, 'User rejected');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to reject user', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  // Suspend mutation
  const suspendMutation = useMutation({
    mutationFn: (id: string) => usersApi.suspend(id),
    onSuccess: () => {
      toast.success('User suspended');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      toast.error('Failed to suspend user', {
        description: error instanceof ApiError ? error.firstError : 'Unknown error',
      });
    },
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    if (activeFilter === 'all') return allUsers;
    return allUsers.filter((u) => u.status === activeFilter);
  }, [allUsers, activeFilter]);

  const allSelected = filteredUsers.length > 0 && selectedIds.length === filteredUsers.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUsers.map((p) => p.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleExport = () => {
    const dataToExport = selectedIds.length > 0
      ? filteredUsers.filter((p) => selectedIds.includes(p.id))
      : filteredUsers;

    toast.success('Export Successful', {
      description: `Exported ${dataToExport.length} user(s) to CSV.`,
    });
  };

  const filterCounts = useMemo(() => ({
    all: allUsers.length,
    PENDING: allUsers.filter((u) => u.status === 'PENDING').length,
    APPROVED: allUsers.filter((u) => u.status === 'APPROVED').length,
    REJECTED: allUsers.filter((u) => u.status === 'REJECTED').length,
    SUSPENDED: allUsers.filter((u) => u.status === 'SUSPENDED').length,
  }), [allUsers]);

  const getStatusBadge = (status: UserStatus) => {
    const config: Record<UserStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }> = {
      APPROVED: { variant: 'default', label: 'Approved', className: 'bg-green-500 hover:bg-green-600' },
      PENDING: { variant: 'secondary', label: 'Pending' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      SUSPENDED: { variant: 'outline', label: 'Suspended' },
    };
    const { variant, label, className } = config[status] || { variant: 'outline' as const, label: status };
    return <Badge variant={variant} className={className}>{label}</Badge>;
  };

  const getRoleLabels = (user: User) => {
    return user.roles.map((r) => r.name).join(', ') || '—';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Participants</h1>
          <p className="text-sm text-muted-foreground">
            Manage participant registration and status
            {selectedIds.length > 0 && ` • ${selectedIds.length} selected`}
            {pagination && ` • ${pagination.totalItems} total`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setFilterSheetOpen(true)}>
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as FilterType[]).map((f) => (
          <Badge
            key={f}
            variant={activeFilter === f ? 'secondary' : 'outline'}
            className="cursor-pointer"
            onClick={() => setActiveFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({filterCounts[f]})
          </Badge>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-muted-foreground">Loading participants...</span>
        </div>
      )}

      {/* Error state */}
      {fetchError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-700">
            {fetchError instanceof ApiError ? fetchError.firstError : 'Failed to load participants'}
          </p>
        </div>
      )}

      {/* Users table */}
      {!isLoading && !fetchError && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                    className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
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
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(user.id)}
                        onCheckedChange={() => toggleSelect(user.id)}
                        aria-label={`Select ${user.fullName}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                            {user.fullName
                              ?.split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || '?'}
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
                    <TableCell className="text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getRoleLabels(user)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.studentId ? (
                        <span>{user.studentId}{user.schoolName ? ` · ${user.schoolName}` : ''}</span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <span className="sr-only">Actions</span>
                            ···
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {user.status === 'PENDING' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => approveMutation.mutate(user.id)}
                                disabled={approveMutation.isPending}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => rejectMutation.mutate(user.id)}
                                disabled={rejectMutation.isPending}
                                className="text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {user.status === 'APPROVED' && (
                            <DropdownMenuItem
                              onClick={() => suspendMutation.mutate(user.id)}
                              disabled={suspendMutation.isPending}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {user.status === 'REJECTED' && (
                            <DropdownMenuItem
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {user.status === 'SUSPENDED' && (
                            <DropdownMenuItem
                              onClick={() => approveMutation.mutate(user.id)}
                              disabled={approveMutation.isPending}
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
        </Card>
      )}

      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Filter Participants</SheetTitle>
            <SheetDescription>
              Apply advanced filters to narrow down the participant list.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="space-y-2">
                {(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as UserStatus[]).map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`filter-${status}`}
                      checked={activeFilter === status}
                      onCheckedChange={(checked) => {
                        if (checked) setActiveFilter(status);
                        else setActiveFilter('all');
                      }}
                    />
                    <label htmlFor={`filter-${status}`} className="text-sm cursor-pointer capitalize">
                      {status.toLowerCase()} ({filterCounts[status]})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setActiveFilter('all');
                  setFilterSheetOpen(false);
                }}
              >
                Clear Filters
              </Button>
              <Button
                className="flex-1"
                onClick={() => setFilterSheetOpen(false)}
              >
                Apply
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
