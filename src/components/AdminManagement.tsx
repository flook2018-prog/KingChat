import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Plus, Edit, Trash2, Users, Shield, Activity, Search, Filter } from "lucide-react";

interface Admin {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'agent';
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  activeCases: number;
  totalCases: number;
  avatar?: string;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([
    {
      id: '1',
      name: 'แอดมิน A',
      username: 'admin_a',
      email: 'admin_a@company.com',
      role: 'admin',
      isActive: true,
      lastLogin: new Date(Date.now() - 3600000),
      createdAt: new Date(Date.now() - 30 * 86400000),
      activeCases: 3,
      totalCases: 45,
      avatar: 'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8cGVyc29uJTIwYXZhdGFyJTIwcHJvZmlsZXxlbnwxfHx8fDE3NTczNjgxMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: '2',
      name: 'แอดมิน B',
      username: 'admin_b',
      email: 'admin_b@company.com',
      role: 'moderator',
      isActive: true,
      lastLogin: new Date(Date.now() - 7200000),
      createdAt: new Date(Date.now() - 20 * 86400000),
      activeCases: 2,
      totalCases: 32,
      avatar: 'https://images.unsplash.com/photo-1655249493799-9cee4fe983bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b21hbiUyMHByb2ZpbGUlMjBoZWFkc2hvdHxlbnwxfHx8fDE3NTczNTkyNzF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    },
    {
      id: '3',
      name: 'พนักงาน C',
      username: 'agent_c',
      email: 'agent_c@company.com',
      role: 'agent',
      isActive: false,
      lastLogin: new Date(Date.now() - 86400000),
      createdAt: new Date(Date.now() - 10 * 86400000),
      activeCases: 0,
      totalCases: 18
    }
  ]);

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'agent' as Admin['role']
  });

  const [isAdding, setIsAdding] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const addAdmin = () => {
    if (!newAdmin.name || !newAdmin.username || !newAdmin.email || !newAdmin.password) return;

    const admin: Admin = {
      id: Date.now().toString(),
      name: newAdmin.name,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role,
      isActive: true,
      createdAt: new Date(),
      activeCases: 0,
      totalCases: 0
    };

    setAdmins([...admins, admin]);
    setNewAdmin({ name: '', username: '', email: '', password: '', role: 'agent' });
    setIsAdding(false);
  };

  const toggleAdminStatus = (id: string) => {
    setAdmins(admins.map(admin => 
      admin.id === id ? { ...admin, isActive: !admin.isActive } : admin
    ));
  };

  const deleteAdmin = (id: string) => {
    setAdmins(admins.filter(admin => admin.id !== id));
  };

  const updateAdmin = (updatedAdmin: Admin) => {
    setAdmins(admins.map(admin => 
      admin.id === updatedAdmin.id ? updatedAdmin : admin
    ));
    setEditingAdmin(null);
  };

  // ฟังก์ชันกรองข้อมูลแอดมิน
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         admin.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && admin.isActive) ||
                         (statusFilter === 'inactive' && !admin.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    moderator: 'bg-blue-100 text-blue-800',
    agent: 'bg-green-100 text-green-800'
  };

  const roleText = {
    admin: 'ผู้ดูแลระบบ',
    moderator: 'ผู้ควบคุม',
    agent: 'พนักงาน'
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Users className="size-5" />
            จัดการแอดมิน
          </h1>
          <p className="text-muted-foreground mt-2">
            จัดการผู้ใช้งานระบบและสิทธิ์การเข้าถึง
          </p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              เพิ่มแอดมิน
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>เพิ่มแอดมินใหม่</DialogTitle>
              <DialogDescription>
                กรุณากรอกข้อมูลแอดมินที่ต้องการเพิ่ม
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="admin-name">ชื่อ-นามสกุล</Label>
                <Input
                  id="admin-name"
                  placeholder="เช่น สมชาย ใจดี"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="admin-username">ชื่อผู้ใช้</Label>
                <Input
                  id="admin-username"
                  placeholder="เช่น admin_somchai"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="admin-email">อีเมล</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@company.com"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="admin-password">รหัสผ่าน</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="รหัสผ่านสำหรับเข้าสู่ระบบ"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="admin-role">บทบาท</Label>
                <Select value={newAdmin.role} onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value as Admin['role'] })}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">พนักงาน</SelectItem>
                    <SelectItem value="moderator">ผู้ควบคุม</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={addAdmin} className="flex-1">
                  เพิ่มแอดมิน
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">แอดมินทั้งหมด</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">กำลังออนไลน์</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.filter(admin => admin.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">เคสที่กำลังดำเนินการ</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{admins.reduce((sum, admin) => sum + admin.activeCases, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="size-4" />
            ค้นหาและกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="ค้นหาชื่อ, ชื่อผู้ใช้, หรืออีเมล..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="บทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">บทบาททั้งหมด</SelectItem>
                  <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="moderator">ผู้ควบคุม</SelectItem>
                  <SelectItem value="agent">พนักงาน</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">สถานะทั้งหมด</SelectItem>
                  <SelectItem value="active">ออนไลน์</SelectItem>
                  <SelectItem value="inactive">ออฟไลน์</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายชื่อแอดมิน</CardTitle>
          <CardDescription>
            รายการแอดมินทั้งหมดในระบบ ({filteredAdmins.length} จากทั้งหมด {admins.length} คน)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>แอดมิน</TableHead>
                <TableHead>บทบาท</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>เคสที่ดำเนินการ</TableHead>
                <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                <TableHead className="text-right">การจัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.length > 0 ? (
                filteredAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage src={admin.avatar} alt={admin.name} />
                          <AvatarFallback>{admin.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p>{admin.name}</p>
                          <p className="text-sm text-muted-foreground">@{admin.username}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[admin.role]} variant="secondary">
                        {roleText[admin.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.isActive ? "default" : "secondary"}>
                        {admin.isActive ? 'ออนไลน์' : 'ออฟไลน์'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{admin.activeCases} เคส</p>
                        <p className="text-muted-foreground">รวม {admin.totalCases} เคส</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {admin.lastLogin ? admin.lastLogin.toLocaleString('th-TH') : 'ยังไม่เข้าสู่ระบบ'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingAdmin(admin)}
                        >
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant={admin.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleAdminStatus(admin.id)}
                        >
                          {admin.isActive ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteAdmin(admin.id)}
                          disabled={admin.role === 'admin'}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="size-8 opacity-50" />
                      <p>ไม่พบแอดมินที่ตรงกับเงื่อนไขการค้นหา</p>
                      {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                        <Button 
                          variant="link" 
                          onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('all');
                            setStatusFilter('all');
                          }}
                        >
                          ล้างการกรอง
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Admin Dialog */}
      <Dialog open={!!editingAdmin} onOpenChange={() => setEditingAdmin(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลแอดมิน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลและสิทธิ์ของแอดมิน
            </DialogDescription>
          </DialogHeader>
          {editingAdmin && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">ชื่อ-นามสกุล</Label>
                <Input
                  id="edit-name"
                  value={editingAdmin.name}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-email">อีเมล</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingAdmin.email}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">บทบาท</Label>
                <Select 
                  value={editingAdmin.role} 
                  onValueChange={(value) => setEditingAdmin({ ...editingAdmin, role: value as Admin['role'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">พนักงาน</SelectItem>
                    <SelectItem value="moderator">ผู้ควบคุม</SelectItem>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={() => updateAdmin(editingAdmin)} className="flex-1">
                  บันทึกการเปลี่ยนแปลง
                </Button>
                <Button variant="outline" onClick={() => setEditingAdmin(null)}>
                  ยกเลิก
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}