import React from "react";
import { Check } from "lucide-react";

interface OnboardingStepsProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

// Step indicator: วงกลมตัวเลข + เส้นเชื่อม, ใช้สี terracotta สำหรับ active
export function OnboardingSteps({
  currentStep,
  totalSteps,
  labels,
}: OnboardingStepsProps) {
  const steps = Array.from({ length: totalSteps }, function makeIndex(_, i) {
    return i + 1;
  });

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map(function renderStep(step, idx) {
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          const circleClass = isCompleted
            ? "bg-[#CC785C] text-white border-[#CC785C]"
            : isActive
              ? "bg-[#CC785C] text-white border-[#CC785C]"
              : "bg-[#FFFFFF] text-[#736B66] border-[#E8E0D5]";
          const lineClass =
            step < currentStep ? "bg-[#CC785C]" : "bg-[#E8E0D5]";
          const labelClass =
            isActive || isCompleted ? "text-[#2D2825]" : "text-[#736B66]";

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors ${circleClass}`}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step}
                </div>
                {labels?.[idx] ? (
                  <span className={`text-xs font-medium ${labelClass}`}>
                    {labels[idx]}
                  </span>
                ) : null}
              </div>
              {idx < steps.length - 1 ? (
                <div className={`flex-1 h-0.5 mx-2 -mt-6 ${lineClass}`} />
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
