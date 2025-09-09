import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Settings, Copy, Info } from "lucide-react";

export function LineOASettings() {
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [newOA, setNewOA] = useState({ name: '', channelId: '', channelSecret: '' });
  const webhookUrl = "<YOUR_WEBHOOK_URL_HERE>";
  const addLineOA = () => {
    if (!newOA.name || !newOA.channelId || !newOA.channelSecret) return;
    // เพิ่ม logic สำหรับบันทึก OA ตามต้องการ
  };
  const copyWebhookUrl = () => {
    import { useState } from "react";
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
    import { Button } from "./ui/button";
    import { Input } from "./ui/input";
    import { Label } from "./ui/label";
    import { Settings, Copy, Info } from "lucide-react";

    export function LineOASettings() {
      const [copiedWebhook, setCopiedWebhook] = useState(false);
      const [newOA, setNewOA] = useState({ name: '', channelId: '', channelSecret: '' });
      const webhookUrl = "<YOUR_WEBHOOK_URL_HERE>";
      const addLineOA = () => {
        if (!newOA.name || !newOA.channelId || !newOA.channelSecret) return;
        // เพิ่ม logic สำหรับบันทึก OA ตามต้องการ
      };
      const copyWebhookUrl = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopiedWebhook(true);
        setTimeout(() => setCopiedWebhook(false), 2000);
      };
      return (
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
            </div>
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
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>เพิ่ม Line OA</CardTitle>
                <CardDescription>กรอก Channel ID และ Channel Secret ของ Line OA ที่ต้องการเชื่อมต่อ</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    addLineOA();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="oa-name">ชื่อ OA</Label>
                    <Input
                      id="oa-name"
                      value={newOA.name}
                      onChange={e => setNewOA({ ...newOA, name: e.target.value })}
                      placeholder="เช่น KingChat OA"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="oa-channel-id">Channel ID</Label>
                    <Input
                      id="oa-channel-id"
                      value={newOA.channelId}
                      onChange={e => setNewOA({ ...newOA, channelId: e.target.value })}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="oa-channel-secret">Channel Secret</Label>
                    <Input
                      id="oa-channel-secret"
                      value={newOA.channelSecret}
                      onChange={e => setNewOA({ ...newOA, channelSecret: e.target.value })}
                      placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full mt-2">เพิ่ม Line OA</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }
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