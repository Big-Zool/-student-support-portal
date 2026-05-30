import type { Role } from './types';
import { cn } from './ui/utils';

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
}

const roles: { value: Role; label: string; color: string; activeColor: string }[] = [
  { value: 'student', label: 'Student', color: 'text-slate-400 hover:text-slate-200', activeColor: 'bg-violet-600 text-white shadow-sm' },
  { value: 'sales',   label: 'Sales',   color: 'text-slate-400 hover:text-slate-200', activeColor: 'bg-blue-600 text-white shadow-sm' },
  { value: 'manager', label: 'Manager', color: 'text-slate-400 hover:text-slate-200', activeColor: 'bg-emerald-600 text-white shadow-sm' },
];

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {

  return (
    <>
      {/* Dev role switcher bar */}
      <div className="flex-shrink-0 bg-slate-900 dark:bg-slate-950 border-b border-slate-800 dark:border-slate-900 px-3 py-2 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium tracking-wide uppercase whitespace-nowrap">
            Dev · Role
          </span>
          <div className="flex items-center gap-1 bg-slate-800 dark:bg-slate-900 rounded-lg p-1">
            {roles.map((role) => (
              <button
                key={role.value}
                onClick={() => onRoleChange(role.value)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer',
                  currentRole === role.value ? role.activeColor : role.color
                )}
              >
                {role.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline">
            Switch roles to preview different UI experiences
          </span>
        </div>
      </div>

    </>
  );
}
