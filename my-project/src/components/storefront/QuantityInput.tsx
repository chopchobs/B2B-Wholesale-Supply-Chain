"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";

interface QuantityInputProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  ariaLabel?: string;
  disabled?: boolean;
}

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max,
  step = 1,
  ariaLabel = "Quantity",
  disabled = false,
}: QuantityInputProps): React.ReactElement {
  // จำกัดค่าให้อยู่ในช่วง min / max
  function clamp(next: number): number {
    let v = Number.isFinite(next) ? Math.floor(next) : min;
    if (v < min) v = min;
    if (typeof max === "number" && v > max) v = max;
    return v;
  }

  function handleDecrement(): void {
    onChange(clamp(value - step));
  }

  function handleIncrement(): void {
    onChange(clamp(value + step));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const parsed = parseInt(e.target.value, 10);
    if (Number.isNaN(parsed)) {
      onChange(min);
      return;
    }
    onChange(clamp(parsed));
  }

  return (
    <div className="inline-flex items-stretch overflow-hidden rounded-lg border border-[#E8E0D5] bg-white">
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
        className="flex h-10 w-10 items-center justify-center text-[#2D2825] transition-colors hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:text-[#736B66] disabled:opacity-50"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={handleInputChange}
        aria-label={ariaLabel}
        disabled={disabled}
        className="w-16 border-x border-[#E8E0D5] bg-white text-center font-mono text-sm text-[#2D2825] outline-none focus:ring-2 focus:ring-[#CC785C]/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || (typeof max === "number" && value >= max)}
        aria-label="Increase quantity"
        className="flex h-10 w-10 items-center justify-center text-[#2D2825] transition-colors hover:bg-[#F5F0E8] disabled:cursor-not-allowed disabled:text-[#736B66] disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
