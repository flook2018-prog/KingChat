import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Edit3, Save, X, Clock, User, XCircle } from "lucide-react";

interface Customer {
  id: string;
  name: string;
  lineId: string;
  avatar?: string;
  notes: string;
  caseOpenTime?: Date;
  caseCloseTime?: Date;
  assignedAdmin: string;
  status: 'active' | 'closed' | 'waiting' | 'unassigned';
  lastMessage?: string;
}

interface CustomerInfoProps {
  customer: Customer | null;
  onUpdateCustomer?: (customer: Customer) => void;
  onCloseCase?: (customer: Customer) => void;
}

export function CustomerInfo({ customer, onUpdateCustomer, onCloseCase }: CustomerInfoProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Customer | null>(null);

  if (!customer) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            ข้อมูลลูกค้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            เลือกลูกค้าเพื่อดูข้อมูล
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...customer });
  };

  const handleSave = () => {
    if (editData && onUpdateCustomer) {
      onUpdateCustomer(editData);
      setIsEditing(false);
      setEditData(null);
    }
  };

  const handleCloseCase = () => {
    if (customer && onCloseCase) {
      const updatedCustomer = {
        ...customer,
        status: 'closed' as const,
        caseCloseTime: new Date()
      };
      onCloseCase(updatedCustomer);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const formatDateTime = (date?: Date) => {
    if (!date) return '-';
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    unassigned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
  };

  const statusText = {
    active: 'กำลังสนทนา',
    closed: 'ปิดเคส',
    waiting: 'รอตอบกลับ',
    unassigned: 'ยังไม่รับเคส'
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            ข้อมูลลูกค้า
          </CardTitle>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit3 className="size-4 mr-1" />
              แก้ไข
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="size-4 mr-1" />
                บันทึก
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                <X className="size-4 mr-1" />
                ยกเลิก
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Profile Section */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="relative">
            <Avatar className="size-12">
              <AvatarImage src={customer.avatar} alt={customer.name} />
              <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {/* Close Case Button on Profile */}
            {customer.status !== 'closed' && onCloseCase && (
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full shadow-lg"
                onClick={handleCloseCase}
                title="ปิดเคส"
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          <div className="flex-1">
            <Badge className={statusColors[customer.status]} variant="secondary">
              {statusText[customer.status]}
            </Badge>
          </div>
        </div>

        {/* Customer Details */}
        <div className="space-y-3">
          <div>
            <Label>ชื่อลูกค้า</Label>
            {isEditing ? (
              <Input
                value={editData?.name || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, name: e.target.value } : null)}
                placeholder="กรุณาใส่ชื่อลูกค้า"
              />
            ) : (
              <p className="py-2">{customer.name}</p>
            )}
          </div>

          <div>
            <Label>Line ID</Label>
            {isEditing ? (
              <Input
                value={editData?.lineId || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, lineId: e.target.value } : null)}
                placeholder="กรุณาใส่ Line ID"
              />
            ) : (
              <p className="py-2 font-mono text-sm">{customer.lineId}</p>
            )}
          </div>

          <div>
            <Label>หมายเหตุ</Label>
            {isEditing ? (
              <Textarea
                value={editData?.notes || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="กรุณาใส่หมายเหตุ"
                rows={3}
              />
            ) : (
              <p className="py-2 text-sm">{customer.notes || 'ไม่มีหมายเหตุ'}</p>
            )}
          </div>

          <div>
            <Label>แอดมินที่รับเคส</Label>
            {isEditing ? (
              <Input
                value={editData?.assignedAdmin || ''}
                onChange={(e) => setEditData(prev => prev ? { ...prev, assignedAdmin: e.target.value } : null)}
                placeholder="กรุณาใส่ชื่อแอดมิน"
              />
            ) : (
              <p className="py-2">{customer.assignedAdmin}</p>
            )}
          </div>
        </div>

        {/* Case Timeline */}
        <div className="pt-4 border-t space-y-3">
          <h4 className="flex items-center gap-2">
            <Clock className="size-4" />
            เวลาเคส
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">เปิดเคส:</span>
              <span>{formatDateTime(customer.caseOpenTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ปิดเคส:</span>
              <span>{formatDateTime(customer.caseCloseTime)}</span>
            </div>
          </div>
        </div>

        {/* Last Message */}
        {customer.lastMessage && (
          <div className="pt-4 border-t">
            <Label>ข้อความล่าสุด</Label>
            <p className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
              {customer.lastMessage}
            </p>
          </div>
        )}

        {/* Close Case Button */}
        {customer.status !== 'closed' && onCloseCase && (
          <div className="pt-4 border-t">
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleCloseCase}
            >
              <XCircle className="size-4 mr-2" />
              ปิดเคส
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}