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