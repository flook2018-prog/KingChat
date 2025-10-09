import { useState, useEffect } from "react";
import { Login } from "./components/Login";
import { ChatDashboard } from "./components/ChatDashboard";
import { LineOASettings } from "./components/LineOASettings";
import { AdminManagement } from "./components/AdminManagement";
import { QuickRepliesManagement } from "./components/QuickRepliesManagement";
import { DebugMonitoring } from "./components/DebugMonitoring";
import { Button } from "./components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { Separator } from "./components/ui/separator";
import { Badge } from "./components/ui/badge";
import { useNotificationCount } from "./hooks/useNotificationCount";
import { 
  MessageCircle, 
  Settings, 
  Users, 
  LogOut, 
  Bell,
  Activity,
  Zap,
  Sun,
  Moon,
  Bug
} from "lucide-react";
import logo from 'figma:asset/3c74b88ecfa55f6a8d6a8afc83a5f34c37156404.png';

interface User {
  name: string;
  username: string;
  role: 'admin' | 'moderator' | 'agent';
  avatar?: string;
}

type Page = 'chat' | 'quick-replies' | 'settings' | 'admin' | 'debug';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // ใช้ hook สำหรับ notification count
  const { unassignedCount } = useNotificationCount();

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setIsDarkMode(savedDarkMode === 'true');
    }
  }, []);

  // Apply dark mode to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleLogin = (username: string, password: string) => {
    // Mock login validation
    if (username && password) {
      const mockUser: User = {
        name: username === 'admin' ? 'ผู้ดูแลระบบ' : 'แอดมิน A',
        username: username,
        role: username === 'admin' ? 'admin' : 'moderator',
        avatar: 'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8cGVyc29uJTIwYXZhdGFyJTIwcHJvZmlsZXxlbnwxfHx8fDE3NTczNjgxMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      };
      setUser(mockUser);
      setIsLoggedIn(true);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setCurrentPage('chat');
  };

  const menuItems = [
    {
      id: 'chat' as Page,
      label: 'แชทลูกค้า',
      icon: MessageCircle,
      badge: unassignedCount // จำนวนข้อความใหม่จาก API จริง
    },
    {
      id: 'quick-replies' as Page,
      label: 'ข้อความด่วน',
      icon: Zap,
      badge: null
    },
    {
      id: 'settings' as Page,
      label: 'ตั้งค่า Line OA',
      icon: Settings,
      badge: null
    },
    {
      id: 'admin' as Page,
      label: 'จัดการแอดมิน',
      icon: Users,
      badge: null,
      adminOnly: true
    },
    {
      id: 'debug' as Page,
      label: 'Debug & Monitor',
      icon: Bug,
      badge: null,
      adminOnly: true
    }
  ];

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'ผู้ดูแลระบบ';
      case 'moderator': return 'ผู้ควบคุม';
      case 'agent': return 'พนักงาน';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-blue-100 text-blue-800';
      case 'agent': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'chat':
        return <ChatDashboard />;
      case 'quick-replies':
        return <QuickRepliesManagement />;
      case 'settings':
        return <LineOASettings />;
      case 'admin':
        return user?.role === 'admin' ? <AdminManagement /> : <ChatDashboard />;
      case 'debug':
        return user?.role === 'admin' ? <DebugMonitoring /> : <ChatDashboard />;
      default:
        return <ChatDashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <div className="flex items-center justify-center">
              <img 
                src={logo} 
                alt="KingChat" 
                className="h-36 w-auto object-contain"
              />
            </div>
          </SidebarHeader>

          <SidebarContent className="px-2">
            <SidebarMenu>
              {menuItems.map((item) => {
                // ซ่อนเมนูแอดมินถ้าไม่ใช่ admin
                if (item.adminOnly && user?.role !== 'admin') {
                  return null;
                }
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentPage(item.id)}
                      isActive={currentPage === item.id}
                      className="relative"
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge className="ml-auto size-5 flex items-center justify-center text-xs p-0">
                          {item.badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <Separator className="mb-4" />
            
            {/* User Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarImage src={user?.avatar} alt={user?.name} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{user?.name}</p>
                  <Badge className={`${getRoleColor(user?.role || '')} text-xs`} variant="secondary">
                    {getRoleText(user?.role || '')}
                  </Badge>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Activity className="size-3 text-green-500" />
                <span>ออนไลน์</span>
                {unassignedCount > 0 && (
                  <>
                    <Bell className="size-3 ml-auto" />
                    <Badge variant="secondary" className="size-4 p-0 text-xs">
                      {unassignedCount}
                    </Badge>
                  </>
                )}
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start" 
                onClick={handleLogout}
              >
                <LogOut className="size-4 mr-2" />
                ออกจากระบบ
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-h-0">
          <header className="flex items-center gap-4 px-6 py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger />
            <div className="flex items-center gap-2">
              <h1 className="text-lg">
                {menuItems.find(item => item.id === currentPage)?.label || 'หน้าแรก'}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="size-4 text-green-500" />
                <span>ระบบทำงานปกติ</span>
              </div>
              
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className="relative"
              >
                {isDarkMode ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
                <span className="sr-only">
                  {isDarkMode ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
                </span>
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-hidden">
            {renderCurrentPage()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}