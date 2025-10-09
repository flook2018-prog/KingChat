import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { playDoubleBeepSound } from '../utils/notificationSound';
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { CustomerInfo } from "./CustomerInfo";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "./ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MessageCircle, Clock, User, MoreVertical, Zap, History, CheckCircle, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: {
    name: string;
    avatar?: string;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  type?: 'text' | 'sticker' | 'image';
  imageUrl?: string;
  stickerId?: string;
}

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
  unreadCount: number;
  lineOAId: string;
  lineOAName: string;
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string;
}

export function ChatDashboard() {
  const [activeTab, setActiveTab] = useState('unassigned');
  const [shouldAutoSwitchTab, setShouldAutoSwitchTab] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [previousUnassignedCount, setPreviousUnassignedCount] = useState(0);
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const lastSoundPlayTime = useRef<number>(0);

  const [quickReplies] = useState<QuickReply[]>([
    { id: '1', title: 'ทักทาย', message: 'สวัสดีครับ ยินดีให้บริการ', category: 'greeting' },
    { id: '2', title: 'ขอใบเสร็จ', message: 'เดี๋ยวจะส่งใบเสร็จให้นะครับ', category: 'receipt' },
    { id: '3', title: 'ขอบคุณ', message: 'ขอบคุณที่ใช้บริการครับ', category: 'thanks' },
    { id: '4', title: 'รอสักครู่', message: 'รอสักครู่นะครับ กำลังตรวจสอบให้', category: 'wait' }
  ]);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // API Base URL
  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ae50d4c0`;

  // ฟังก์ชันดึงข้อมูลลูกค้าจาก API พร้อมตรวจจับข้อความใหม่
  const fetchCustomers = useCallback(async (playSound = false) => {
    try {
      setIsLoadingCustomers(true);
      console.log('🔄 กำลังดึงข้อมูลลูกค้าจาก API...');
      
      const response = await fetch(`${API_BASE}/customers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ได้รับข้อมูลลูกค้า:', data);
        
        if (data.customers && Array.isArray(data.customers) && data.customers.length > 0) {
          const formattedCustomers = data.customers.map((customer: any) => ({
            id: customer.userId,
            name: customer.name || customer.displayName || `ลูกค้า ${customer.userId.substring(0, 8)}`,
            lineId: customer.userId,
            avatar: customer.avatar || customer.pictureUrl,
            notes: customer.notes || '',
            caseOpenTime: customer.lastMessageTime ? new Date(customer.lastMessageTime) : new Date(),
            caseCloseTime: customer.caseCloseTime ? new Date(customer.caseCloseTime) : undefined,
            assignedAdmin: customer.adminName || '',
            status: customer.caseStatus === 'pending' ? 'unassigned' : 
                    customer.caseStatus === 'assigned' ? 'active' : 
                    customer.caseStatus === 'closed' ? 'closed' : 'unassigned',
            lastMessage: customer.lastMessage || 'ไม่มีข้อความ',
            unreadCount: customer.unreadCount || 0,
            lineOAId: customer.lineOAId || 'default',
            lineOAName: customer.lineOAName || 'Line Official Account'
          }));
          
          console.log('📋 ลูกค้าที่จัดรูปแบบแล้ว:', formattedCustomers);
          
          // ตรวจสอบว่ามีข้อความใหม่เข้ามาหรือไม่ (นับเฉพาะ status unassigned)
          const currentUnassignedCount = formattedCustomers.filter(c => c && c.status === 'unassigned').length;
          const now = Date.now();
          
          console.log('🔢 Current unassigned count:', currentUnassignedCount, 'Previous:', previousUnassignedCount);
          
          // อัปเดต customers state ก่อน
          setCustomers(formattedCustomers);
          
          // ตรวจสอบเสียงแจ้งเตือนหลังจากที่อัปเดต state แล้ว
          if (playSound && currentUnassignedCount > previousUnassignedCount && (now - lastSoundPlayTime.current) > 5000) {
            console.log('🔔 มีข้อความใหม่เข้ามา - เล่นเสียงแจ้งเตือน');
            try {
              playDoubleBeepSound();
              lastSoundPlayTime.current = now;
            } catch (err) {
              console.log('ไม่สามารถเล่นเสียงแจ้งเตือนได้:', err);
            }
          }
          setPreviousUnassignedCount(currentUnassignedCount);
        } else {
          console.log('📝 ไม่มีข้อมูลลูกค้า - ตั้งค่าเป็น array ว่าง');
          setCustomers([]);
          setPreviousUnassignedCount(0);
        }
      } else {
        console.error('❌ Error response from API:', response.status, await response.text());
        setCustomers([]);
        setPreviousUnassignedCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      setCustomers([]);
      setPreviousUnassignedCount(0);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  // ฟังก์ชันดึงข้อความของลูกค้า
  const fetchMessages = async (userId: string) => {
    try {
      setIsLoadingMessages(true);
      console.log('💬 กำลังดึงข้อความสำหรับลูกค้า:', userId);
      
      const response = await fetch(`${API_BASE}/messages/${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ ได้รับข้อความ:', data);
        
        if (data.messages && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id || Date.now().toString(),
            content: msg.message || msg.text || '',
            sender: { 
              name: msg.isFromCustomer ? (msg.userName || 'ลูกค้า') : (msg.adminName || 'แอดมิน'),
              avatar: msg.avatar || msg.pictureUrl
            },
            timestamp: new Date(msg.timestamp || Date.now()),
            isCurrentUser: !msg.isFromCustomer,
            type: msg.type || 'text',
            imageUrl: msg.imageUrl,
            stickerId: msg.stickerId
          }));
          
          console.log('💬 ข้อความที่จัดรูปแบบแล้ว:', formattedMessages);
          setMessages(formattedMessages);
        } else {
          console.log('📝 ไม่มีข้อความ');
          setMessages([]);
        }
      } else {
        console.error('❌ Error response from messages API:', response.status, await response.text());
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // ฟังก์ชันส่งข้อความ
  const sendMessage = async (userId: string, message: string) => {
    try {
      console.log('📤 กำลังส่งข้อความถึง:', userId, 'ข้อความ:', message);
      
      const response = await fetch(`${API_BASE}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId,
          message,
          adminId: 'admin1',
          adminName: 'แอดมิน'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ ส่งข้อความสำเร็จ:', result);
        
        // รีเฟรชข้อความและลูกค้า
        await fetchMessages(userId);
        await fetchCustomers();
      } else {
        const errorText = await response.text();
        console.error('❌ Error sending message:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
    }
  };

  // ฟังก์ชันอัปเดตสถานะเคส
  const updateCaseStatus = async (userId: string, status: string) => {
    try {
      console.log('🔄 กำลังอัปเดตสถานะเคส:', userId, 'เป็น:', status);
      
      const response = await fetch(`${API_BASE}/customer/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          status,
          adminId: 'admin1',
          adminName: 'แอดมิน'
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ อัปเดตสถานะเคสสำเร็จ:', result);
        await fetchCustomers();
      } else {
        const errorText = await response.text();
        console.error('❌ Error updating case status:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error updating case status:', error);
    }
  };

  // เรียกข้อมูลเมื่อ component โหลด
  useEffect(() => {
    console.log('🚀 เริ่มต้น ChatDashboard - กำลังโหลดข้อมูลลูกค้าจาก Line OA');
    fetchCustomers(false); // ไม่เล่นเสียงในครั้งแรก
    
    // ตั้งเวลารีเฟรชข้อมูลทุก 10 วินาที พร้อมเล่นเสียงแจ้งเตือน
    const interval = setInterval(() => {
      console.log('🔄 รีเฟรชข้อมูลลูกค้าอัตโนมัติ');
      fetchCustomers(true); // เล่นเสียงเมื่อมีข้อความใหม่
    }, 10000);
    
    return () => clearInterval(interval);
  }, []); // เอา fetchCustomers ออกจาก dependencies เพื่อป้องกัน infinite loop

  const handleSelectCustomer = useCallback(async (customer: Customer) => {
    console.log('📋 เลือกลูกค้า:', customer.name, 'ID:', customer.id);
    setSelectedCustomer(customer);
    // โหลดข้อความจาก API
    await fetchMessages(customer.id);
  }, []);

  const handleCloseCase = useCallback(async (updatedCustomer: Customer) => {
    // Update case status via API
    await updateCaseStatus(updatedCustomer.id, 'closed');
    
    // เซ็ตแฟล็กเพื่อให้เปลี่ยนแท็บอัตโนมัติ
    setShouldAutoSwitchTab(true);
    console.log('เคสถูกปิดแล้ว:', updatedCustomer);
  }, []);

  const handleTakeCase = useCallback(async (customerId: string) => {
    console.log('กำลังรับเคส:', customerId);
    
    // Update case status via API
    await updateCaseStatus(customerId, 'assigned');
    
    // เซ็ตแฟล็กเพื่อให้เปลี่ยนแท็บอัตโนมัติ
    setShouldAutoSwitchTab(true);
    console.log('เปลี่ยนไปแท็บ active');
  }, []);

  const handleSendMessage = async (content: string) => {
    if (!selectedCustomer) return;
    
    // ส่งข้อความผ่าน API
    await sendMessage(selectedCustomer.id, content);
  };

  const handleSendSticker = (stickerId: string) => {
    if (!selectedCustomer) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: '',
      sender: { 
        name: 'แอดมิน A',
        avatar: 'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8cGVyc29uJTIwYXZhdGFyJTIwcHJvZmlsZXxlbnwxfHx8fDE3NTczNjgxMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      timestamp: new Date(),
      isCurrentUser: true,
      type: 'sticker',
      stickerId
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update customer's assigned admin if not already assigned
    const updatedCustomer = { ...selectedCustomer };
    if (!updatedCustomer.assignedAdmin) {
      updatedCustomer.assignedAdmin = 'แอดมิน A';
      updatedCustomer.status = 'active';
    }
    
    // Update last message
    updatedCustomer.lastMessage = 'ส่งสติกเกอร์';
    
    setSelectedCustomer(updatedCustomer);
    updateCustomerInList(updatedCustomer);
  };

  const handleSendImage = (imageFile: File) => {
    if (!selectedCustomer) return;
    
    // Create a mock URL for the image (in real app, upload to server)
    const imageUrl = URL.createObjectURL(imageFile);
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: '',
      sender: { 
        name: 'แอดมิน A',
        avatar: 'https://images.unsplash.com/photo-1724435811349-32d27f4d5806?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8cGVyc29uJTIwYXZhdGFyJTIwcHJvZmlsZXxlbnwxfHx8fDE3NTczNjgxMzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
      },
      timestamp: new Date(),
      isCurrentUser: true,
      type: 'image',
      imageUrl
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update customer's assigned admin if not already assigned
    const updatedCustomer = { ...selectedCustomer };
    if (!updatedCustomer.assignedAdmin) {
      updatedCustomer.assignedAdmin = 'แอดมิน A';
      updatedCustomer.status = 'active';
    }
    
    // Update last message
    updatedCustomer.lastMessage = 'ส่งรูปภาพ';
    
    setSelectedCustomer(updatedCustomer);
    updateCustomerInList(updatedCustomer);
  };

  // Helper function to update customer in the main list
  const updateCustomerInList = (updatedCustomer: Customer) => {
    setCustomers(prevCustomers => 
      prevCustomers.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
  };

  // Set default selected customer to first unassigned case (แก้ไขเพื่อไม่ให้เด้งออกเอง)
  useEffect(() => {
    if (!selectedCustomer && customers.length > 0 && !isLoadingCustomers) {
      const firstUnassigned = customers.find(c => c.status === 'unassigned');
      const firstCustomer = firstUnassigned || customers[0];
      
      if (firstCustomer) {
        console.log('🎯 เลือกลูกค้าเริ่มต้น:', firstCustomer.name);
        handleSelectCustomer(firstCustomer);
      }
    }
  }, [customers, selectedCustomer, isLoadingCustomers, handleSelectCustomer]);

  // Debug: Log selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      console.log('selectedCustomer เปลี่ยนเป็น:', selectedCustomer.name, 'status:', selectedCustomer.status);
    }
  }, [selectedCustomer]);

  // อัปเดต selectedCustomer เมื่อ customers state เปลี่ยนแปลง (แก้ไขเพื่อไม่ให้เด้งออกเอง)
  useEffect(() => {
    if (selectedCustomer && !isLoadingCustomers) {
      const updatedSelectedCustomer = customers.find(c => c.id === selectedCustomer.id);
      if (updatedSelectedCustomer) {
        // อัปเดตเฉพาะข้อมูลที่จำเป็น โดยไม่เปลี่ยน reference ถ้าไม่จำเป็น
        if (JSON.stringify(updatedSelectedCustomer) !== JSON.stringify(selectedCustomer)) {
          console.log('🔄 อัปเดต selectedCustomer เนื่องจาก customers state เปลี่ยน');
          setSelectedCustomer(updatedSelectedCustomer);
        }
      } else {
        // ถ้าไม่เจอลูกค้าที่เลือกอยู่ ให้เลือกคนแรกแทน
        console.log('⚠️ ไม่เจอลูกค้าที่เลือกอยู่ในรายการใหม่');
        if (customers.length > 0) {
          const firstCustomer = customers[0];
          setSelectedCustomer(firstCustomer);
        } else {
          setSelectedCustomer(null);
        }
      }
    }
  }, [customers, selectedCustomer, isLoadingCustomers]);

  // เปลี่ยนแท็บอัตโนมัติเฉพาะเมื่อมีการรับเคสหรือปิดเคส
  useEffect(() => {
    if (selectedCustomer && shouldAutoSwitchTab) {
      let newTab = activeTab;
      
      if (selectedCustomer.status === 'unassigned') {
        newTab = 'unassigned';
      } else if (selectedCustomer.status === 'active' || selectedCustomer.status === 'waiting') {
        newTab = 'active';
      } else if (selectedCustomer.status === 'closed') {
        newTab = 'history';
      }
      
      if (newTab !== activeTab) {
        console.log(`เปลี่ยนแท็บจาก ${activeTab} เป็น ${newTab} เพื่อให้ตรงกับ status: ${selectedCustomer.status}`);
        setActiveTab(newTab);
      }
      
      // รีเซ็ตแฟล็ก
      setShouldAutoSwitchTab(false);
    }
  }, [selectedCustomer, activeTab, shouldAutoSwitchTab]);

  // Debug: Log customers changes
  useEffect(() => {
    console.log('customers state เปลี่ยนแปลง:', customers.map(c => `${c.name}: ${c.status}`));
  }, [customers]);

  // Debug: Log activeTab changes
  useEffect(() => {
    console.log('activeTab เปลี่ยนเป็น:', activeTab);
  }, [activeTab]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

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

  // Filter customers by status using useMemo to recalculate when customers change
  const unassignedCases = useMemo(() => {
    const filtered = customers.filter(customer => customer.status === 'unassigned');
    console.log('unassignedCases:', filtered.length, filtered.map(c => c.name));
    return filtered;
  }, [customers]);
  
  const activeCases = useMemo(() => {
    const filtered = customers.filter(customer => customer.status === 'active' || customer.status === 'waiting');
    console.log('activeCases:', filtered.length, filtered.map(c => c.name));
    return filtered;
  }, [customers]);
  
  const closedCases = useMemo(() => {
    const filtered = customers.filter(customer => customer.status === 'closed');
    console.log('closedCases:', filtered.length, filtered.map(c => c.name));
    return filtered;
  }, [customers]);

  // Component for customer list item
  const CustomerListItem = ({ customer, selectedCustomer, onSelectCustomer, statusColors, statusText }: any) => (
    <div
      onClick={() => onSelectCustomer(customer)}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        selectedCustomer?.id === customer.id 
          ? 'bg-primary/10 border-primary/20' 
          : 'bg-card hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="size-10">
            <AvatarImage src={customer.avatar} alt={customer.name} />
            <AvatarFallback>{customer.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {customer.unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 size-5 flex items-center justify-center text-xs p-0">
              {customer.unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate">{customer.name}</p>
            <Badge className={`${statusColors[customer.status]} text-xs`} variant="secondary">
              {statusText[customer.status]}
            </Badge>
          </div>
          
          {/* แท็ก Line OA */}
          <div className="flex items-center gap-1 mt-1">
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700">
              {customer.lineOAName}
            </Badge>
          </div>
          
          {/* แอดมินที่รับเคส */}
          <div className="flex items-center gap-1 mt-1">
            <User className="size-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {customer.assignedAdmin || 'ยังไม่มีผู้รับผิดชอบ'}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground truncate mt-1">
            {customer.lastMessage}
          </p>
          
          {customer.caseOpenTime && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {customer.caseOpenTime.toLocaleTimeString('th-TH', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal">
        {/* Customer List */}
        <ResizablePanel defaultSize={25} minSize={20}>
          <Card className="h-full rounded-none border-r">
            <div className="p-4 border-b">
              <h3 className="flex items-center gap-2">
                <MessageCircle className="size-4" />
                รายชื่อลูกค้า
              </h3>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="px-4 py-2 border-b">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="unassigned" className="text-xs">
                    <AlertCircle className="size-3 mr-1" />
                    ยังไม่รับ ({unassignedCases.length})
                  </TabsTrigger>
                  <TabsTrigger value="active" className="text-xs">
                    <CheckCircle className="size-3 mr-1" />
                    รับแล้ว ({activeCases.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="text-xs">
                    <History className="size-3 mr-1" />
                    ประวัติ
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="unassigned" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {unassignedCases.map((customer) => (
                      <CustomerListItem 
                        key={customer.id} 
                        customer={customer} 
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={handleSelectCustomer}
                        statusColors={statusColors}
                        statusText={statusText}
                      />
                    ))}
                    {unassignedCases.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <AlertCircle className="size-8 mx-auto mb-2 opacity-50" />
                        <p>ไม่มีเคสที่ยังไม่รับ</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="active" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {activeCases.map((customer) => (
                      <CustomerListItem 
                        key={customer.id} 
                        customer={customer} 
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={handleSelectCustomer}
                        statusColors={statusColors}
                        statusText={statusText}
                      />
                    ))}
                    {activeCases.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <CheckCircle className="size-8 mx-auto mb-2 opacity-50" />
                        <p>ไม่มีเคสที่ก���ลังดำเนินการ</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 mt-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-2">
                    {closedCases.map((customer) => (
                      <CustomerListItem 
                        key={customer.id} 
                        customer={customer} 
                        selectedCustomer={selectedCustomer}
                        onSelectCustomer={handleSelectCustomer}
                        statusColors={statusColors}
                        statusText={statusText}
                      />
                    ))}
                    {closedCases.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <History className="size-8 mx-auto mb-2 opacity-50" />
                        <p>ไม่มีประวัติการสนทนา</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </Card>
        </ResizablePanel>

        <ResizableHandle />

        {/* Chat Area */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <Card className="h-full rounded-none flex flex-col">
            {/* Chat Header */}
            {selectedCustomer && (
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedCustomer.avatar} alt={selectedCustomer.name} />
                    <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3>{selectedCustomer.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCustomer.lineOAName} • {selectedCustomer.lineId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {selectedCustomer?.status === 'unassigned' && (
                        <DropdownMenuItem onClick={() => handleTakeCase(selectedCustomer.id)}>
                          <User className="size-4 mr-2" />
                          รับเคสนี้
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Zap className="size-4 mr-2" />
                        ส่งข้อความด่วน
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* Messages */}
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    id={message.id}
                    content={message.content}
                    sender={message.sender}
                    timestamp={message.timestamp}
                    isCurrentUser={message.isCurrentUser}
                    type={message.type}
                    imageUrl={message.imageUrl}
                    stickerId={message.stickerId}
                  />
                ))}
              </div>
            </ScrollArea>

            {/* Quick Replies */}
            {selectedCustomer && (
              <div className="p-4 border-t bg-muted/30">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">ข้อความด่วน:</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {quickReplies.map((reply) => (
                    <Button
                      key={reply.id}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleSendMessage(reply.message)}
                    >
                      {reply.title}
                    </Button>
                  ))}
                </div>
                <ChatInput 
                  onSendMessage={handleSendMessage}
                  onSendSticker={handleSendSticker}
                  onSendImage={handleSendImage}
                />
              </div>
            )}

            {!selectedCustomer && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="size-12 mx-auto mb-4 opacity-50" />
                  <p>เลือกลูกค้าเพื่อเริ่มการสนทนา</p>
                </div>
              </div>
            )}
          </Card>
        </ResizablePanel>

        <ResizableHandle />

        {/* Customer Info Panel */}
        <ResizablePanel defaultSize={25} minSize={20}>
          {selectedCustomer && (
            <CustomerInfo 
              customer={selectedCustomer} 
              onCloseCase={handleCloseCase}
              onUpdateCustomer={(updatedCustomer) => {
                setCustomers(prevCustomers => 
                  prevCustomers.map(customer => 
                    customer.id === updatedCustomer.id ? updatedCustomer : customer
                  )
                );
                setSelectedCustomer(updatedCustomer);
              }}
            />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}