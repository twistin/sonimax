import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Route,
  Mic, 
  Image,
  BarChart3, 
  Settings,
  Waves,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Proyectos', to: '/proyectos', icon: FolderOpen },
  { name: 'Rutas', to: '/rutas', icon: Route },
  { name: 'Grabaciones', to: '/grabaciones', icon: Mic },
  { name: 'Galeria', to: '/galeria', icon: Image },
  { name: 'Analisis', to: '/analisis', icon: BarChart3 },
  { name: 'Configuracion', to: '/configuracion', icon: Settings },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const handleLinkClick = () => {
    if (isMobile) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para móviles */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'} 
        ${isMobile ? 'w-80' : 'w-64'} 
        bg-gradient-to-b from-gray-900 to-gray-800 text-white flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
      `}>
        {/* Header del sidebar con botón cerrar para móviles */}
        <div className="p-6 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Waves className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">SonimaX</h1>
              <p className="text-xs text-gray-400">Gestión de Soundscapes</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.to}
                  onClick={handleLinkClick}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-400 mb-1">Versión</p>
            <p className="text-sm font-semibold">2.2.1</p>
          </div>
        </div>
      </div>
    </>
  );
}
