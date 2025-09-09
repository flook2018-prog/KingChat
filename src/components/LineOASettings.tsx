import { useState, useEffect } from "react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LineTokenValidator } from "./LineTokenValidator";
import { LineCredentialsManager } from "./LineCredentialsManager";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Separator } from "./ui/separator";
import { Plus, Settings, Trash2, Edit, MessageCircle, Zap, Copy, ExternalLink, AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react";
const lineLogoUrl = 'https://images.unsplash.com/photo-1756999223507-72bfbb654193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8bGluZSUyMGFwcCUyMGxvZ28lMjBncmVlbnxlbnwxfHx8fDE3NTc0MjAzNjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral';

interface LineOA {
  id: string;
  name: string;
  channelId: string;
  channelSecret: string;
  webhookUrl: string;
  isActive: boolean;
  connectedAt: Date;
}

interface QuickReply {
  id: string;
  title: string;
  message: string;
  category: string;
}

export function LineOASettings() {
  const [lineOAs, setLineOAs] = useState<LineOA[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    lastChecked: Date | null;
    tokenValid: boolean;
  }>({
  // Removed connectionStatus state
    { id: '4', title: 'ติดต่อ', message: 'สามารถติดต่อได้ที่เบอร์ 02-123-4567', category: 'ข้อมูล' }
  ]);

  const [newOA, setNewOA] = useState({
    name: '',
    channelId: '',
    channelSecret: ''
  });

  const [newReply, setNewReply] = useState({
    title: '',
    message: '',
    category: ''
  });

  const [isAddingOA, setIsAddingOA] = useState(false);
  const [isAddingReply, setIsAddingReply] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const webhookUrl = `https://${projectId}.supabase.co/functions/v1/make-server-ae50d4c0/webhook/line`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const addLineOA = () => {
    if (!newOA.name || !newOA.channelId || !newOA.channelSecret) return;

        {/* Webhook URL Card */}
        <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full flex items-center justify-center bg-blue-200 dark:bg-blue-800">
                  <Info className="size-6 text-blue-600 dark:text-blue-200" />
                </div>
                <div>
                  <div className="font-medium">Webhook URL สำหรับนำไปใส่ใน LINE OA</div>
                  <div className="text-xs text-muted-foreground break-all">
                    {webhookUrl}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                <Copy className="size-4" />
              </Button>
            </div>
            {copiedWebhook && (
              <div className="text-green-600 mt-2">คัดลอก Webhook URL แล้ว</div>
            )}
          </CardContent>
        </Card>
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="flex items-center gap-2">
            <Settings className="size-5" />
            ตั้งค่า Line Official Account
          </h1>
          <p className="text-muted-foreground mt-2">
            จัดการ Line OA และข้อความตอบกลับอัตโนมัติ
          </p>
            {/* Removed Token management button */}
        {/* Connection Status Card */}
        <Card className={`border-2 ${connectionStatus.isConnected && connectionStatus.tokenValid 
          ? 'border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800' 
          : 'border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800'
        }`}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center ${
                  connectionStatus.isConnected && connectionStatus.tokenValid 
                    ? 'bg-green-500' 
                    : 'bg-orange-500'
                }`}>
                  {connectionStatus.isConnected && connectionStatus.tokenValid ? (
                    <CheckCircle className="size-5 text-white" />
                  ) : (
                    <AlertTriangle className="size-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className={`font-medium ${
                    connectionStatus.isConnected && connectionStatus.tokenValid 
                      ? 'text-green-800 dark:text-green-200' 
                      : 'text-orange-800 dark:text-orange-200'
                  }`}>
                    {connectionStatus.isConnected && connectionStatus.tokenValid 
                      ? 'Line OA เชื่อมต่อแล้ว' 
                      : 'Line OA ยังไม่ได้เชื่อมต่อ'
                    }
                  </h3>
                  <p className={`text-sm ${
                    connectionStatus.isConnected && connectionStatus.tokenValid 
                      ? 'text-green-700 dark:text-green-300' 
                      : 'text-orange-700 dark:text-orange-300'
                  }`}>
                    {connectionStatus.isConnected && connectionStatus.tokenValid 
                      ? 'ระบบพร้อมรับแชทจากลูกค้า' 
                      : 'กรุณาตั้งค่า Line OA เพื่อเริ่มใช้งาน'
                    }
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={checkConnectionStatus}
                  size="sm"
                  variant="outline"
                  className="text-gray-600 hover:text-gray-700"
                >
                  <RefreshCw className="size-4 mr-2" />
                  รีเฟรช
                </Button>
                {!connectionStatus.isConnected || !connectionStatus.tokenValid ? (
                  <Button 
                    onClick={() => document.querySelector('[value="credentials"]')?.click()}
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Settings className="size-4 mr-2" />
                    เริ่มตั้งค่า
                  </Button>
                ) : (
                  <Button 
                    onClick={() => document.querySelector('[value="test"]')?.click()}
                    size="sm"
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <CheckCircle className="size-4 mr-2" />
                    ทดสอบระบบ
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1">
          <TabsTrigger value="setup" className="flex items-center gap-2 h-12 data-[state=active]:bg-green-100 data-[state=active]:text-green-800">
            <Settings className="size-4" />
            <span className="hidden sm:inline">ตั้งค่าเริ่มต้น</span>
            <span className="sm:hidden">ตั้งค่า</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="flex items-center gap-2 h-12 data-[state=active]:bg-purple-100 data-[state=active]:text-purple-800">
            <RefreshCw className="size-4" />
            <span className="hidden sm:inline">จัดการ Token</span>
            <span className="sm:hidden">Token</span>
          </TabsTrigger>
          <TabsTrigger value="line-oa" className="flex items-center gap-2 h-12 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
            <MessageCircle className="size-4" />
            <span className="hidden sm:inline">จัดการ Line OA</span>
            <span className="sm:hidden">Line OA</span>
          </TabsTrigger>
          <TabsTrigger value="quick-replies" className="flex items-center gap-2 h-12 data-[state=active]:bg-yellow-100 data-[state=active]:text-yellow-800">
            <Zap className="size-4" />
            <span className="hidden sm:inline">ข้อความด่วน</span>
            <span className="sm:hidden">ข้อความ</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2 h-12 data-[state=active]:bg-red-100 data-[state=active]:text-red-800">
            <CheckCircle className="size-4" />
            <span className="hidden sm:inline">ทดสอบระบบ</span>
            <span className="sm:hidden">ทดสอบ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          {/* Hero Section */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="size-16 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <MessageCircle className="size-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-green-800 dark:text-green-200">
                    เชื่อมต่อ Line Official Account
                  </h2>
                  <p className="text-green-700 dark:text-green-300 mt-1">
                    ตั้งค่าและเชื่อมต่อ Line OA กับระบบจัดการแชทของคุณ
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="size-3 mr-1" />
                      ไม่ต้องติดตั้งอะไรเพิ่ม
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                      <Zap className="size-3 mr-1" />
                      ตั้งค่าง่าย 3 ขั้นตอน
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                      <MessageCircle className="size-3 mr-1" />
                      รองรับหลาย OA
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step-by-Step Setup */}
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="size-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  ขั้นตอนที่ 1: ตั้งค่า Webhook URL ใน Line Developers Console
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300">
                  <AlertTriangle className="size-4" />
                  <AlertDescription className="text-orange-800 dark:text-orange-200">
                    <strong>สำคัญมาก!</strong> นี่คือขั้นตอนที่สำคัญที่สุด! หากไม่ได้ตั้งค่า Webhook URL แชทจากลูกค้าจะไม่เข้าระบบ
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Webhook URL สำหรับระบบนี้:</Label>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        value={webhookUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyWebhookUrl}
                        className="shrink-0"
                      >
                        {copiedWebhook ? (
                          <CheckCircle className="size-4" />
                        ) : (
                          <Copy className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
                    <AlertTriangle className="size-4" />
                    ขั้นตอนการตั้งค่าใน Line Developers Console:
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <li>เข้าไปที่ <a href="https://developers.line.biz/console/" target="_blank" className="underline hover:no-underline">LINE Developers Console</a></li>
                    <li>เลือก Provider และ Channel ของคุณ</li>
                    <li>ไปที่แท็บ <strong>"Messaging API"</strong></li>
                    <li>ในส่วน <strong>"Webhook settings"</strong>:</li>
                    <ul className="list-disc list-inside ml-4 space-y-1 mt-1">
                      <li>ใส่ Webhook URL ที่คัดลอกจากด้านบน</li>
                      <li>เปิดใช้งาน <strong>"Use webhook"</strong></li>
                      <li>กด <strong>"Verify"</strong> เพื่อทดสอบการเชื่อมต่อ</li>
                      <li>เปิดใช้งาน <strong>"Redelivery"</strong> (แนะนำ)</li>
                    </ul>
                    <li>บันทึกการตั้งค่า</li>
                  </ol>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://developers.line.biz/console/', '_blank')}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                  >
                    <ExternalLink className="size-4 mr-2" />
                    เปิด Line Developers Console
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://www.youtube.com/results?search_query=line+developers+console+webhook+setup', '_blank')}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    📺 ดูวิดีโอสอน
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="size-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  ขั้นตอนที่ 2: คัดลอก Channel Access Token และ Channel Secret
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">การดึงข้อมูลจาก Line Developers Console:</h4>
                  <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <div>
                      <strong>Channel Access Token (Long-lived):</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>ในแท็บ "Messaging API" หาส่วน "Channel access token"</li>
                        <li>กด "Issue" หากยังไม่เคยสร้าง หรือ "Reissue" ถ้าต้องการสร้างใหม่</li>
                        <li>คัดลอก token ที่ได้</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <strong>Channel Secret:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>ในแท็บ "Basic settings" หาส่วน "Channel secret"</li>
                        <li>คัดลอก Channel secret</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertDescription>
                    ข้อมูลเหล่านี้เป็นความลับ กรุณาไม่เปิดเผยให้ผู้อื่น และเก็บรักษาไว้อย่างปลอดภัย
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="size-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  ขั้นตอนที่ 3: เพิ่ม Line OA ในระบบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  หลังจากได้ Channel Access Token และ Channel Secret แล้ว ไปที่แท็บ "จัดการ Line OA" เพื่อเพิ่มข้อมูล Line OA ของคุณ
                </p>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => document.querySelector('[value="credentials"]')?.click()}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    <CheckCircle className="size-4 mr-2" />
                    ไปจัดการ Token
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => document.querySelector('[value="line-oa"]')?.click()}
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    <Settings className="size-4 mr-2" />
                    ไปจัดการ Line OA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Separator />
          
          {/* Troubleshooting Section */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-800 dark:text-red-200 flex items-center gap-2">
                <AlertTriangle className="size-5" />
                แก้ไขปัญหาที่พบบ่อย
              </CardTitle>
              <CardDescription className="text-red-700 dark:text-red-300">
                ปัญหา: แชทจากลูกค้าไม่เด้งเข้าระบบ หรือ Error 401 Authentication failed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    1. ตรวจสอบ Webhook URL ใน Line Developers Console
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 ml-4">
                    <li>ไปที่ Line Developers Console → Channel → Messaging API</li>
                    <li>ตรวจสอบว่า Webhook URL ตรงกับที่แสดงในระบบ</li>
                    <li>ตรวจสอบว่าได้เปิดใช้งาน "Use webhook" แล้ว</li>
                    <li>กด "Verify" เพื่อทดสอบการเชื่อมต่อ</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    2. ตรวจสอบ Channel Access Token (Error 401)
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 ml-4">
                    <li>ไปที่แท็บ "จัดการ Token" เพื่อเพิ่มและทดสอบ token</li>
                    <li>ไปที่แท็บ "ทดสอบระบบ" เพื่อตรวจสอบสถานะ token</li>
                    <li>ถ้า token หมดอายุ ให้สร้าง token ใหม่ใน Line Developers Console</li>
                    <li>อัปเดต LINE_CHANNEL_ACCESS_TOKEN ใน environment variables</li>
                    <li>ตรวจสอบว่า token เป็น "Channel Access Token (Long-lived)"</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    3. ตรวจสอบการตั้งค่า Line Bot
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 ml-4">
                    <li>ตรวจสอบว่าได้ปิด "Auto-reply messages" ใน Line Official Account Manager</li>
                    <li>ตรวจสอบว่าได้ปิด "Greeting messages" (ถ้าไม่ต้องการ)</li>
                    <li>ตรวจสอบว่า Bot mode เปิดใช้งานอยู่</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                    4. ทดสอบการเชื่อมต่อ
                  </h4>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 ml-4">
                    <li>ไปที่แท็บ "ทดสอบระบบ" เพื่อทดสอบการส่งข้อความ</li>
                    <li>ให้คนทดลองทักหา Line Bot เพื่อทดสอบ</li>
                    <li>ตรวจสอบ logs ในระบบเพื่อดูว่ามีข้อความเข้ามาหรือไม่</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.querySelector('[value="credentials"]')?.click()}
                >
                  <CheckCircle className="size-4 mr-2" />
                  จัดการ Token
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => document.querySelector('[value="test"]')?.click()}
                >
                  <CheckCircle className="size-4 mr-2" />
                  ทดสอบระบบ
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://developers.line.biz/console/', '_blank')}
                >
                  <ExternalLink className="size-4 mr-2" />
                  เปิด Line Console
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://manager.line.biz/', '_blank')}
                >
                  <ExternalLink className="size-4 mr-2" />
                  เปิด OA Manager
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Setup Guide */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-800 dark:text-blue-200 flex items-center gap-2">
                <Zap className="size-5" />
                เริ่มต้นใช้งานภายใน 5 นาที
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                ทำตามขั้นตอนง่าย ๆ เหล่านี้เพื่อเชื่อมต่อ Line OA ของคุณ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <span className="font-medium">Copy Webhook URL</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    คัดลอก Webhook URL จากด้านบนไปใส่ใน Line Console
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <span className="font-medium">Get Token & Secret</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ดึง Access Token และ Channel Secret จาก Line Console
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="size-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <span className="font-medium">Test & Connect</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ทดสอบการเชื่อมต่อและเริ่มรับแชทจากลูกค้า
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-blue-200 dark:border-blue-700">
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => document.querySelector('[value="credentials"]')?.click()}
                    size="sm"
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <RefreshCw className="size-4 mr-2" />
                    เริ่มตั้งค่า Token
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://developers.line.biz/console/', '_blank')}
                  >
                    <ExternalLink className="size-4 mr-2" />
                    เปิด Line Console
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.querySelector('[value="test"]')?.click()}
                  >
                    <CheckCircle className="size-4 mr-2" />
                    ทดสอบระบบ
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-6">
          <LineCredentialsManager />
        </TabsContent>

        <TabsContent value="line-oa" className="space-y-4">
          {/* Current Status Alert */}
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <strong>สำคัญ!</strong> หากแชทจากลูกค้าไม่เด้งเข้าระบบ หรือได้รับ Error 401:
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>ตรวจสอบ Webhook URL ในแท็บ "ตั้งค่าเริ่มต้น"</li>
                  <li>ตรวจสอบ Access Token ในแท็บ "จัดการ Token"</li>
                  <li>ทดสอบระบบในแท็บ "ทดสอบระบบ"</li>
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.querySelector('[value="setup"]')?.click()}
                  >
                    <Settings className="size-4 mr-1" />
                    ตั้งค่าเริ่มต้น
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.querySelector('[value="credentials"]')?.click()}
                  >
                    <CheckCircle className="size-4 mr-1" />
                    จัดการ Token
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => document.querySelector('[value="test"]')?.click()}
                  >
                    <CheckCircle className="size-4 mr-1" />
                    ทดสอบระบบ
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex justify-between items-center">
            <h2>Line Official Accounts</h2>
            <Dialog open={isAddingOA} onOpenChange={setIsAddingOA}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  เพิ่ม Line OA
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่ม Line Official Account</DialogTitle>
                  <DialogDescription>
                    กรุณากรอกข้อมูล Line OA ของคุณ
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="oa-name">ชื่อ Line OA</Label>
                    <Input
                      id="oa-name"
                      placeholder="เช่น บริษัท ABC"
                      value={newOA.name}
                      onChange={(e) => setNewOA({ ...newOA, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="channel-id">Channel ID</Label>
                    <Input
                      id="channel-id"
                      placeholder="1234567890"
                      value={newOA.channelId}
                      onChange={(e) => setNewOA({ ...newOA, channelId: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="channel-secret">Channel Secret</Label>
                    <Input
                      id="channel-secret"
                      type="password"
                      placeholder="abcdef1234567890"
                      value={newOA.channelSecret}
                      onChange={(e) => setNewOA({ ...newOA, channelSecret: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="access-token">Access Token</Label>
                    <Input
                      id="access-token"
                      type="password"
                      placeholder="xxxxxxxxxxxxxxxx"
                      value={newOA.accessToken}
                      onChange={(e) => setNewOA({ ...newOA, accessToken: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={addLineOA} className="flex-1">
                      เพิ่ม Line OA
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingOA(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {lineOAs.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <div className="size-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <MessageCircle className="size-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">ยังไม่มี Line OA</h3>
                      <p className="text-muted-foreground mt-1">
                        เริ่มต้นโดยการเพิ่ม Line Official Account แรกของคุณ
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 max-w-sm mx-auto">
                      <Button onClick={() => setIsAddingOA(true)}>
                        <Plus className="size-4 mr-2" />
                        เพิ่ม Line OA แรก
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => document.querySelector('[value="setup"]')?.click()}
                      >
                        <Info className="size-4 mr-2" />
                        ดูคำแนะนำการตั้งค่า
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              lineOAs.map((oa) => (
                <Card key={oa.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {oa.name}
                          <Badge variant={oa.isActive ? "default" : "secondary"}>
                            {oa.isActive ? 'เชื่อมต่อแล้ว' : 'ยังไม่เชื่อมต่อ'}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Channel ID: {oa.channelId}<br/>
                          Webhook URL: {oa.webhookUrl}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={oa.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleOAStatus(oa.id)}
                        >
                          {oa.isActive ? 'ยกเลิกการเชื่อมต่อ' : 'เชื่อมต่อ'}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="size-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteOA(oa.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm space-y-1">
                      <p><strong>Webhook URL:</strong> {oa.webhookUrl}</p>
                      <p><strong>เชื่อมต่อเมื่อ:</strong> {oa.connectedAt.toLocaleString('th-TH')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="quick-replies" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2>ข้อความตอบกลับด่วน</h2>
            <Dialog open={isAddingReply} onOpenChange={setIsAddingReply}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  เพิ่มข้อความด่วน
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>เพิ่มข้อความตอบกลับด่วน</DialogTitle>
                  <DialogDescription>
                    สร้างข้อความที่ใช้ตอบกลับลูกค้าได้อย่างรวดเร็ว
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
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
                    <Label htmlFor="reply-message">ข้อความ</Label>
                    <Textarea
                      id="reply-message"
                      placeholder="เช่น สวัสดีครับ ยินดีที่ได้รู้จัก"
                      value={newReply.message}
                      onChange={(e) => setNewReply({ ...newReply, message: e.target.value })}
                      rows={3}
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
                  <div className="flex gap-2 pt-4">
                    <Button onClick={addQuickReply} className="flex-1">
                      เพิ่มข้อความ
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddingReply(false)}>
                      ยกเลิก
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {categories.map((category) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle>{category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {quickReplies
                      .filter(reply => reply.category === category)
                      .map((reply) => (
                        <div key={reply.id} className="flex items-start justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{reply.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{reply.message}</p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm">
                              <Edit className="size-4" />
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="flex items-center gap-2">
                <CheckCircle className="size-5" />
                ทดสอบและตรวจสอบระบบ
              </h2>
              <p className="text-muted-foreground mt-1">
                ตรวจสอบการตั้งค่าและทดสอบการส่งข้อความผ่าน Line API
              </p>
            </div>
            
            <Separator />
            
            <LineTokenValidator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}