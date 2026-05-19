import { Check } from 'lucide-react';
import { cn } from '../../../lib/cn';

interface Step {
  label: string;
  status: 'completed' | 'active' | 'pending';
}

interface EventStepperProps {
  steps: Step[];
}

export function EventStepper({ steps }: EventStepperProps) {
  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-center gap-2 min-w-max">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  step.status === 'completed' && 'bg-green-500 text-white',
                  step.status === 'active' && 'bg-blue-600 text-white',
                  step.status === 'pending' && 'bg-gray-200 text-gray-600'
                )}
              >
                {step.status === 'completed' ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <span
                className={cn(
                  'text-xs text-center whitespace-nowrap',
                  step.status === 'active' && 'font-medium text-blue-700',
                  step.status === 'completed' && 'text-gray-700',
                  step.status === 'pending' && 'text-gray-500'
                )}
              >
                {step.label}
              </span>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-16 mx-2 transition-colors',
                  steps[index + 1].status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
