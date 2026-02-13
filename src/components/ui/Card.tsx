interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export type { CardProps };

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl bg-dark-900 p-4
        ${onClick ? 'cursor-pointer hover:bg-dark-800 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
