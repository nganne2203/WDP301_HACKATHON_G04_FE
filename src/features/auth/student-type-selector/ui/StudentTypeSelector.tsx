import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';

interface StudentTypeSelectorProps {
  onValueChange: (value: 'FPT' | 'EXTERNAL') => void;
  value: 'FPT' | 'EXTERNAL';
}

export function StudentTypeSelector({ value, onValueChange }: StudentTypeSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Loai sinh vien</Label>
      <RadioGroup defaultValue={value} onValueChange={(nextValue) => onValueChange(nextValue as 'FPT' | 'EXTERNAL')}>
        <div className="flex cursor-pointer items-center space-x-2 rounded-md border p-3 hover:bg-gray-50">
          <RadioGroupItem value="FPT" id="fpt" />
          <Label htmlFor="fpt" className="flex-1 cursor-pointer">
            Sinh vien FPT
          </Label>
        </div>
        <div className="flex cursor-pointer items-center space-x-2 rounded-md border p-3 hover:bg-gray-50">
          <RadioGroupItem value="EXTERNAL" id="external" />
          <Label htmlFor="external" className="flex-1 cursor-pointer">
            Sinh vien ngoai truong
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
