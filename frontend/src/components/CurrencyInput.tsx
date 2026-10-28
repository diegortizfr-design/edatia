import React from 'react'
import { formatMiles, parseMiles } from '../lib/utils'

interface CurrencyInputProps {
  value: string | number | null | undefined
  onChange: (rawValue: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  symbol?: string
  id?: string
  autoFocus?: boolean
  required?: boolean
}

/**
 * Input formateador de moneda (ej: Pesos Colombianos COP).
 * Muestra el símbolo "$" y formatea con separadores de miles "." mientras se escribe.
 * Guarda y emite el valor numérico limpio (ej: "10000").
 */
export function CurrencyInput({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  symbol = '$',
  id,
  autoFocus = false,
  required = false,
}: CurrencyInputProps) {
  const displayVal = formatMiles(value)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseMiles(e.target.value)
    onChange(raw)
  }

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-2.5 text-xs font-bold text-slate-400 select-none pointer-events-none">
        {symbol}
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        autoFocus={autoFocus}
        required={required}
        value={displayVal}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full text-right pl-6 pr-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono ${className}`}
      />
    </div>
  )
}
