import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Plus, Edit, Trash2, Zap, Image as ImageIcon, MessageSquare, Settings2, Upload, Link, Eye } from "lucide-react";


interface LineOA {
  id: string;
  name: string;
  isActive: boolean;
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string;
  image?: string;
  imageAlt?: string;
  lineOAIds: string[]; // Array of Line OA IDs that can use this reply
  isActive: boolean;
  createdAt: Date;
  usageCount: number;
}

export function QuickRepliesManagement() {
  const [lineOAs] = useState<LineOA[]>([
    { id: '1', name: 'บริษัท ABC', isActive: true },
    { id: '2', name: 'ร้านอาหาร XYZ', isActive: true },
    { id: '3', name: 'ร้านเสื้อผ้า DEF', isActive: false }
  ]);

  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([
    {
      id: '1',
      title: 'สวัสดี',
      message: 'สวัสดีครับ ยินดีที่ได้รู้จัก มีอะไรให้ช่วยไหมครับ',
      category: 'ทักทาย',
      lineOAIds: ['1', '2'],
      isActive: true,
      createdAt: new Date(Date.now() - 86400000),
      usageCount: 45
    },
    {
      id: '2',
      title: 'ขอบคุณ',
      message: 'ขอบคุณมากครับ หากมีคำถามเพิ่มเติม สามารถสอบถามได้เสมอ',
      category: 'ขอบคุณ',
      lineOAIds: ['1', '2', '3'],
      isActive: true,
      createdAt: new Date(Date.now() - 3600000),
      usageCount: 32
    },
    {
      id: '3',
      title: 'เวลาทำการ',
      message: 'เวลาทำการของเรา:\n📅 จันทร์-ศุกร์: 9:00-18:00 น.\n📅 เสาร์-อาทิตย์: 10:00-16:00 น.',
      category: 'ข้อมูل',
      image: 'https://images.unsplash.com/photo-1604028450756-07dc85d91880?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGhvdXJzJTIwY2xvY2t8ZW58MXx8fHwxNzU3NDA5MjQyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      imageAlt: 'เวลาทำการ',
      lineOAIds: ['1'],
      isActive: true,
      createdAt: new Date(Date.now() - 7200000),
      usageCount: 18
    }
  ]);

  const [newReply, setNewReply] = useState({
    title: '',
    message: '',
    category: '',
    image: '',
    imageAlt: '',
    lineOAIds: [] as string[]
  });

  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [imageUrl, setImageUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const categories = [...new Set(quickReplies.map(reply => reply.category))];
  const activeLineOAs = lineOAs.filter(oa => oa.isActive);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ตรวจสอบประเภทไฟล์
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
      return;
    }

    // ตรวจสอบขนาดไฟล์ (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ขนาดไฟล์ต้องไม่เกิน 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const fileName = file.name.replace(/\.[^/.]+$/, ""); // ลบนามสกุลไฟล์
      
      if (isEditing && editingReply) {
        setEditingReply({ 
          ...editingReply, 
          image: imageUrl, 
          imageAlt: fileName 
        });
      } else {
        setNewReply({ 
          ...newReply, 
          image: imageUrl, 
          imageAlt: fileName 
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUrlImage = (url: string, isEditing = false) => {
    if (!url.trim()) return;
    
    // ตรวจสอบ URL พื้นฐาน
    try {
      new URL(url);
    } catch {
      alert('กรุณาใส่ URL ที่ถูกต้อง');
      return;
    }

    if (isEditing && editingReply) {
      setEditingReply({ 
        ...editingReply, 
        image: url, 
        imageAlt: editingReply.imageAlt || 'รูปภาพจาก URL' 
      });
    } else {
      setNewReply({ 
        ...newReply, 
        image: url, 
        imageAlt: newReply.imageAlt || 'รูปภาพจาก URL' 
      });
    }
    setImageUrl('');
  };

  const addQuickReply = () => {
    if (!newReply.title || !newReply.message) return;

    const reply: QuickReply = {
      id: Date.now().toString(),
      title: newReply.title,
      message: newReply.message,
      category: newReply.category || 'ทั่วไป',
      image: newReply.image,
      imageAlt: newReply.imageAlt,
      lineOAIds: newReply.lineOAIds,
      isActive: true,
      createdAt: new Date(),
      usageCount: 0
    };

    setQuickReplies([...quickReplies, reply]);
    setNewReply({ title: '', message: '', category: '', image: '', imageAlt: '', lineOAIds: [] });
    setIsAdding(false);
  };

  const updateQuickReply = () => {
    if (!editingReply) return;

    setQuickReplies(quickReplies.map(reply => 
      reply.id === editingReply.id ? editingReply : reply
    ));
    setEditingReply(null);
  };

  const deleteQuickReply = (id: string) => {
    setQuickReplies(quickReplies.filter(reply => reply.id !== id));
  };

  const toggleReplyStatus = (id: string) => {
    setQuickReplies(quickReplies.map(reply => 
      reply.id === id ? { ...reply, isActive: !reply.isActive } : reply
    ));
  };

  const handleLineOAToggle = (lineOAId: string, isEditing = false) => {
    if (isEditing && editingReply) {
      const newLineOAIds = editingReply.lineOAIds.includes(lineOAId)
        ? editingReply.lineOAIds.filter(id => id !== lineOAId)
        : [...editingReply.lineOAIds, lineOAId];
      
      setEditingReply({ ...editingReply, lineOAIds: newLineOAIds });
    } else {
      const newLineOAIds = newReply.lineOAIds.includes(lineOAId)
        ? newReply.lineOAIds.filter(id => id !== lineOAId)
        : [...newReply.lineOAIds, lineOAId];
      
      setNewReply({ ...newReply, lineOAIds: newLineOAIds });
    }
  };

  const filteredReplies = selectedCategory === 'all' 
    ? quickReplies 
    : quickReplies.filter(reply => reply.category === selectedCategory);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Zap className="size-5" />
            จัดการข้อความด่วน
          </h1>
          <p className="text-muted-foreground mt-2">
            สร้างและจัดการข้อความตอบกลับอัตโนมัติพร้อมรูปภาพ
          </p>
        </div>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              เพิ่มข้อความด่วน
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>เพิ่มข้อความตอบกลับด่วน</DialogTitle>
              <DialogDescription>
                สร้างข้อความที่ใช้ตอบกลับลูกค้าได้อย่างรวดเร็ว พร้อมรูปภาพ
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reply-title">ชื่อข้อความ</Label>
                  <Input
                    id="reply-title"
                    placeholder="เช่น สวัสดี"
                    value={newReply.title}
                    onChange={(e) => setNewReply({ ...newReply, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="reply-category">หมวดหมู่</Label>
                  <Input
                    id="reply-category"
                    placeholder="เช่น ทักทาย"
                    value={newReply.category}
                    onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reply-message">ข้อความ</Label>
                <Textarea
                  id="reply-message"
                  placeholder="เช่น สวัสดีครับ ยินดีที่ได้รู้จัก"
                  value={newReply.message}
                  onChange={(e) => setNewReply({ ...newReply, message: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label>รูปภาพ (ไม่บังคับ)</Label>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="size-4" />
                      อัปโหลดไฟล์
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="size-4" />
                      URL รูปภาพ
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={(e) => handleFileUpload(e)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="size-4 mr-2" />
                        เลือกไฟล์รูปภาพ
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        onClick={() => handleUrlImage(imageUrl)}
                        disabled={!imageUrl.trim()}
                      >
                        <Link className="size-4 mr-2" />
                        เพิ่มรูป
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ใส่ URL รูปภาพที่ต้องการใช้
                    </p>
                  </TabsContent>
                </Tabs>
                
                {newReply.image && (
                  <div className="mt-3">
                    <div className="relative">
                      <ImageWithFallback 
                        src={newReply.image} 
                        alt={newReply.imageAlt}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setNewReply({ ...newReply, image: '', imageAlt: '' })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="คำอธิบายรูปภาพ"
                      value={newReply.imageAlt}
                      onChange={(e) => setNewReply({ ...newReply, imageAlt: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Line OA ที่สามารถใช้ได้</Label>
                <div className="space-y-2 mt-2">
                  {activeLineOAs.map((oa) => (
                    <div key={oa.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`oa-${oa.id}`}
                        checked={newReply.lineOAIds.includes(oa.id)}
                        onCheckedChange={() => handleLineOAToggle(oa.id)}
                      />
                      <Label htmlFor={`oa-${oa.id}`} className="text-sm">
                        {oa.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  <Eye className="size-4" />
                  {showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}
                </Button>
                <Button onClick={addQuickReply} className="flex-1">
                  เพิ่มข้อความ
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  ยกเลิก
                </Button>
              </div>

              {/* ตัวอย่างข้อความ */}
              {showPreview && (newReply.title || newReply.message || newReply.image) && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <Label className="text-sm text-muted-foreground">ตัวอย่างการแสดงผล:</Label>
                  <div className="mt-2 max-w-sm">
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      {newReply.image && (
                        <ImageWithFallback 
                          src={newReply.image} 
                          alt={newReply.imageAlt}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      {newReply.message && (
                        <p className="text-sm whitespace-pre-wrap">{newReply.message}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ข้อความจาก: {newReply.title || 'ไม่ระบุชื่อ'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">ข้อความทั้งหมด</CardTitle>
            <MessageSquare className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickReplies.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">กำลังใช้งาน</CardTitle>
            <Zap className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickReplies.filter(r => r.isActive).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">มีรูปภาพ</CardTitle>
            <ImageIcon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickReplies.filter(r => r.image).length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">ใช้งานรวม</CardTitle>
            <Settings2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickReplies.reduce((sum, r) => sum + r.usageCount, 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="เลือกหมวดหมู่" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกหมวดหมู่</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick Replies List */}
      <div className="grid gap-4">
        {filteredReplies.map((reply) => (
          <Card key={reply.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{reply.title}</CardTitle>
                    <Badge variant={reply.isActive ? "default" : "secondary"}>
                      {reply.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                    </Badge>
                    <Badge variant="outline">{reply.category}</Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>ใช้งาน {reply.usageCount} ครั้ง</span>
                    <span>สร้างเมื่อ {reply.createdAt.toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingReply(reply)}
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant={reply.isActive ? "destructive" : "default"}
                    size="sm"
                    onClick={() => toggleReplyStatus(reply.id)}
                  >
                    {reply.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => deleteQuickReply(reply.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-sm mb-3 whitespace-pre-wrap">{reply.message}</p>
                  <div>
                    <Label className="text-xs text-muted-foreground">Line OA ที่ใช้ได้:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {reply.lineOAIds.map(oaId => {
                        const oa = lineOAs.find(oa => oa.id === oaId);
                        return oa ? (
                          <Badge key={oaId} variant="secondary" className="text-xs">
                            {oa.name}
                          </Badge>
                        ) : null;
                      })}
                      {reply.lineOAIds.length === 0 && (
                        <Badge variant="outline" className="text-xs">
                          ไม่ได้กำหนด
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {reply.image && (
                  <div>
                    <Label className="text-xs text-muted-foreground">รูปภาพ:</Label>
                    <ImageWithFallback 
                      src={reply.image} 
                      alt={reply.imageAlt || reply.title}
                      className="w-full h-24 object-cover rounded-lg mt-1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingReply} onOpenChange={() => setEditingReply(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อความตอบกลับด่วน</DialogTitle>
            <DialogDescription>
              แก้ไขข้อความและการตั้งค่า
            </DialogDescription>
          </DialogHeader>
          {editingReply && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-title">ชื่อข้อความ</Label>
                  <Input
                    id="edit-title"
                    value={editingReply.title}
                    onChange={(e) => setEditingReply({ ...editingReply, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">หมวดหมู่</Label>
                  <Input
                    id="edit-category"
                    value={editingReply.category}
                    onChange={(e) => setEditingReply({ ...editingReply, category: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-message">ข้อความ</Label>
                <Textarea
                  id="edit-message"
                  value={editingReply.message}
                  onChange={(e) => setEditingReply({ ...editingReply, message: e.target.value })}
                  rows={4}
                />
              </div>

              <div>
                <Label>รูปภาพ (ไม่บังคับ)</Label>
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="size-4" />
                      อัปโหลดไฟล์
                    </TabsTrigger>
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link className="size-4" />
                      URL รูปภาพ
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="upload" className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        ref={editFileInputRef}
                        onChange={(e) => handleFileUpload(e, true)}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => editFileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="size-4 mr-2" />
                        เลือกไฟล์รูปภาพ
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      รองรับไฟล์: JPG, PNG, GIF (ขนาดไม่เกิน 5MB)
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="url" className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        onClick={() => handleUrlImage(imageUrl, true)}
                        disabled={!imageUrl.trim()}
                      >
                        <Link className="size-4 mr-2" />
                        เพิ่มรูป
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ใส่ URL รูปภาพที่ต้องการใช้
                    </p>
                  </TabsContent>
                </Tabs>
                
                {editingReply.image && (
                  <div className="mt-3">
                    <div className="relative">
                      <ImageWithFallback 
                        src={editingReply.image} 
                        alt={editingReply.imageAlt}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => setEditingReply({ ...editingReply, image: '', imageAlt: '' })}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder="คำอธิบายรูปภาพ"
                      value={editingReply.imageAlt || ''}
                      onChange={(e) => setEditingReply({ ...editingReply, imageAlt: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>Line OA ที่สามารถใช้ได้</Label>
                <div className="space-y-2 mt-2">
                  {activeLineOAs.map((oa) => (
                    <div key={oa.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-oa-${oa.id}`}
                        checked={editingReply.lineOAIds.includes(oa.id)}
                        onCheckedChange={() => handleLineOAToggle(oa.id, true)}
                      />
                      <Label htmlFor={`edit-oa-${oa.id}`} className="text-sm">
                        {oa.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2"
                >
                  <Eye className="size-4" />
                  {showPreview ? 'ซ่อนตัวอย่าง' : 'ดูตัวอย่าง'}
                </Button>
                <Button onClick={updateQuickReply} className="flex-1">
                  บันทึกการเปลี่ยนแปลง
                </Button>
                <Button variant="outline" onClick={() => setEditingReply(null)}>
                  ยกเลิก
                </Button>
              </div>

              {/* ตัวอย่างข้อความ */}
              {showPreview && editingReply && (editingReply.title || editingReply.message || editingReply.image) && (
                <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                  <Label className="text-sm text-muted-foreground">ตัวอย่างการแสดงผล:</Label>
                  <div className="mt-2 max-w-sm">
                    <div className="bg-white p-3 rounded-lg shadow-sm border">
                      {editingReply.image && (
                        <ImageWithFallback 
                          src={editingReply.image} 
                          alt={editingReply.imageAlt}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      {editingReply.message && (
                        <p className="text-sm whitespace-pre-wrap">{editingReply.message}</p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      ข้อความจาก: {editingReply.title || 'ไม่ระบุชื่อ'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}