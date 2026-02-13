interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export type { CardProps };

export default function Card({ children, className = '', onClick, style }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl bg-dark-900 p-4 border border-dark-800 card-hover
        ${onClick ? 'cursor-pointer hover:bg-dark-800 transition-colors' : ''}
        ${className}
      `}
      style={style}
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
