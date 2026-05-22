import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('dcis_user') || '{}')

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  const nav = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/projects',  label: 'Projects'  },
    { to: '/alerts',    label: 'Alerts'    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-8">
          <span className="font-bold text-base tracking-tight">
            🏛 DCIS · Chhattisgarh
          </span>
          {nav.map(n => (
            <NavLink key={n.to} to={n.to}
              className={({ isActive }) =>
                `text-sm ${isActive
                  ? 'text-white font-semibold border-b-2 border-yellow-400 pb-0.5'
                  : 'text-blue-200 hover:text-white'}`
              }
            >{n.label}</NavLink>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-blue-200 text-xs">
            {user.full_name || user.username}
            {user.role && <span className="ml-1 opacity-60">· {user.role.replace(/_/g, ' ')}</span>}
            {user.district && <span className="ml-1 opacity-60">· {user.district}</span>}
          </span>
          <button onClick={logout}
            className="bg-blue-800 hover:bg-blue-700 border border-blue-700 px-3 py-1 rounded text-xs transition-colors">
            Logout
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
