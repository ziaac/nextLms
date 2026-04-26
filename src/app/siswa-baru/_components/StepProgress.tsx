import { Check } from 'lucide-react'
import { STEPS } from './form-constants'

interface Props {
  currentStep: number
}

export function StepProgress({ currentStep }: Props) {
  return (
    <div className="mb-8">
      {/* Mobile: show step x/y */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 sm:hidden">
        Langkah {currentStep} dari {STEPS.length}
      </p>

      {/* Desktop: step dots */}
      <div className="hidden sm:flex items-center">
        {STEPS.map((step, idx) => {
          const done    = currentStep > step.id
          const active  = currentStep === step.id
          const pending = currentStep < step.id

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    done   ? 'bg-emerald-600 text-white' :
                    active ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900' :
                             'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}
                >
                  {done ? <Check size={14} /> : step.id}
                </div>
                <span className={`mt-1 text-[11px] whitespace-nowrap ${
                  active  ? 'text-emerald-600 dark:text-emerald-400 font-medium' :
                  done    ? 'text-gray-600 dark:text-gray-300' :
                            'text-gray-400'
                }`}>
                  {step.title}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                  done ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile progress bar */}
      <div className="sm:hidden w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-emerald-500 h-1.5 rounded-full transition-all"
          style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  )
}
