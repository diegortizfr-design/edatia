import React from 'react'

interface WhatsAppIconProps {
  className?: string
  size?: number
}

export function WhatsAppIcon({ className = '', size = 16 }: WhatsAppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-label="WhatsApp"
    >
      {/* Burbuja verde oficial de WhatsApp */}
      <path
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2Z"
        fill="#25D366"
      />
      {/* Auricular de teléfono blanco oficial */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.5 14.38C17.26 14.26 16.09 13.68 15.87 13.6C15.65 13.52 15.49 13.48 15.33 13.72C15.17 13.96 14.71 14.5 14.57 14.66C14.43 14.82 14.29 14.84 14.05 14.72C13.81 14.6 13.04 14.35 12.12 13.53C11.4 12.89 10.91 12.1 10.77 11.86C10.63 11.62 10.75 11.49 10.87 11.37C10.98 11.26 11.12 11.08 11.24 10.94C11.36 10.8 11.4 10.7 11.48 10.54C11.56 10.38 11.52 10.24 11.46 10.12C11.4 10 10.92 8.82 10.72 8.34C10.52 7.86 10.32 7.92 10.17 7.91C10.03 7.9 9.87 7.9 9.71 7.9C9.55 7.9 9.29 7.96 9.07 8.2C8.85 8.44 8.23 9.02 8.23 10.2C8.23 11.38 9.09 12.52 9.21 12.68C9.33 12.84 10.91 15.28 13.33 16.32C13.91 16.57 14.35 16.72 14.7 16.83C15.28 17.01 15.81 16.99 16.23 16.93C16.69 16.86 17.65 16.35 17.85 15.79C18.05 15.23 18.05 14.75 17.99 14.65C17.93 14.55 17.77 14.5 17.5 14.38Z"
        fill="white"
      />
    </svg>
  )
}
