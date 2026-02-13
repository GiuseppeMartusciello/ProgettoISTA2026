
export interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}


export function NavItem({ icon, label, active, badge, onClick }: NavItemProps) {
  return (
    <button onClick={onClick} className={`navItem ${active ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}
