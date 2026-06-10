import type { Dispatch, SetStateAction } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  createMemberRow,
  removeMemberRow,
  type MemberInviteRow,
  updateMemberRow,
} from '@/features/team/member-invites/model/helpers';

export function MemberInviteFields({
  rows,
  setRows,
  disabled,
}: {
  rows: MemberInviteRow[];
  setRows: Dispatch<SetStateAction<MemberInviteRow[]>>;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.id} className="grid grid-cols-1 gap-2 items-end md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.5rem]">
          <div className="space-y-2">
            <Label htmlFor={`member-name-${row.id}`}>{index === 0 ? 'Member name' : 'Name'}</Label>
            <Input
              id={`member-name-${row.id}`}
              value={row.fullName}
              onChange={(event) => updateMemberRow(setRows, row.id, 'fullName', event.target.value)}
              placeholder="Nguyen Van A"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`member-email-${row.id}`}>{index === 0 ? 'Member email' : 'Email'}</Label>
            <Input
              id={`member-email-${row.id}`}
              type="email"
              value={row.email}
              onChange={(event) => updateMemberRow(setRows, row.id, 'email', event.target.value)}
              placeholder="member@example.com"
              disabled={disabled}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeMemberRow(setRows, row.id)}
            disabled={disabled || rows.length === 1}
            aria-label="Remove invited member"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setRows((current) => [...current, createMemberRow()])}
        disabled={disabled}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add member
      </Button>
    </div>
  );
}
