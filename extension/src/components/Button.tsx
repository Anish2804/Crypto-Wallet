import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}: ButtonProps) {
  const baseStyle = "font-bold py-3.5 px-6 rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 tracking-wide";
  const variants = {
    primary: "bg-primary hover:bg-primary-hover text-black shadow-lg shadow-white/5",
    secondary: "bg-surface hover:bg-[#27272a] text-white border border-white/10",
    outline: "bg-transparent hover:bg-surface text-slate-300 border border-white/10"
  };
  
  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
