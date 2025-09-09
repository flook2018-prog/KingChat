import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { CheckCircle, XCircle, AlertTriangle, Send, Eye, EyeOff } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface TokenValidationResult {
  isValid: boolean;
  error?: string;
  details?: any;
}

export function LineTokenValidator() {
  const [testUserId, setTestUserId] = useState('');
  const [testMessage, setTestMessage] = useState('ทดสอบการส่งข้อความจากระบบ');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TokenValidationResult | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  
  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ae50d4c0`;

  const checkHealth = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
      }
    } catch (error) {
      console.error('Health check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testLineAPI = async () => {
    if (!testUserId.trim() || !testMessage.trim()) {
      setResult({
        isValid: false,
        error: 'กรุณากรอก User ID และข้อความที่ต้องการทดสอบ'
      });
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);
      
      const response = await fetch(`${API_BASE}/test-line`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId: testUserId.trim(),
          message: testMessage.trim()
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          isValid: true,
          details: data
        });
      } else {
        setResult({
          isValid: false,
          error: data.details || data.error || 'Unknown error',
          details: data
        });
      }
    } catch (error) {
      console.error('Test Line API error:', error);
      setResult({
        isValid: false,
        error: `Network error: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-check health on component mount
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="size-5" />
            ตรวจสอบสถานะ Line Configuration
          </CardTitle>
          <CardDescription>
            ตรวจสอบว่า Line Channel Access Token และ Channel Secret ได้รับการตั้งค่าถูกต้องหรือไม่
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkHealth} disabled={isLoading}>
              {isLoading ? 'กำลังตรวจสอบ...' : 'ตรวจสอบสถานะ'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('https://developers.line.biz/console/', '_blank')}
            >
              เปิด Line Console
            </Button>
          </div>
          
          {healthStatus && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">Line Configuration:</span>
                <Badge variant={healthStatus.lineConfigured ? 'default' : 'destructive'}>
                  {healthStatus.lineConfigured ? 'Configured' : 'Not Configured'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {healthStatus.environment.hasAccessToken ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  <span>Access Token</span>
                  {healthStatus.environment.hasAccessToken && (
                    <Badge variant="outline">{healthStatus.environment.accessTokenLength} chars</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {healthStatus.environment.hasSecret ? (
                    <CheckCircle className="size-4 text-green-500" />
                  ) : (
                    <XCircle className="size-4 text-red-500" />
                  )}
                  <span>Channel Secret</span>
                  {healthStatus.environment.hasSecret && (
                    <Badge variant="outline">{healthStatus.environment.secretLength} chars</Badge>
                  )}
                </div>
              </div>
              
              {!healthStatus.lineConfigured && (
                <Alert>
                  <AlertTriangle className="size-4" />
                  <AlertDescription>
                    Line credentials are not properly configured. Please set LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET environment variables.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-5" />
            ทดสอบการส่งข้อความ Line
          </CardTitle>
          <CardDescription>
            ทดสอบการส่งข้อความไปยัง Line User ID เพื่อยืนยันว่า API ทำงานถูกต้อง
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Line User ID</label>
            <Input
              placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Line User ID ของผู้ใช้ที่ต้องการทดสอบ (เริ่มต้นด้วย U และตามด้วยอักขระ 32 ตัว)
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm">ข้อความทดสอบ</label>
            <Input
              placeholder="ข้อความที่ต้องการส่ง"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={testLineAPI} 
            disabled={isLoading || !testUserId.trim() || !testMessage.trim()}
            className="w-full"
          >
            {isLoading ? 'กำลังส่งข้อความ...' : 'ทดสอบส่งข้อความ'}
          </Button>
          
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.isValid ? (
                  <CheckCircle className="size-5 text-green-500" />
                ) : (
                  <XCircle className="size-5 text-red-500" />
                )}
                <span className="text-sm">
                  {result.isValid ? 'ส่งข้อความสำเร็จ' : 'การส่งข้อความล้มเหลว'}
                </span>
              </div>
              
              {result.error && (
                <Alert variant="destructive">
                  <XCircle className="size-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div>{result.error}</div>
                      {result.details?.help && (
                        <div className="text-xs font-medium">💡 {result.details.help}</div>
                      )}
                      {result.details?.solution && (
                        <div className="text-xs whitespace-pre-line">
                          🛠️ วิธีแก้ไข:\n{result.details.solution}
                        </div>
                      )}
                      {result.details?.troubleshooting && (
                        <div className="text-xs">
                          🔍 การตรวจสอบ:
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Token Length: {result.details.troubleshooting.tokenLength}</li>
                            <li>Token Format: {result.details.troubleshooting.tokenFormat}</li>
                            {result.details.troubleshooting.lineApiResponse && (
                              <li>Line API Response: {result.details.troubleshooting.lineApiResponse}</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {result.isValid && result.details && (
                <Alert>
                  <CheckCircle className="size-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div>✅ {result.details.message}</div>
                      <div className="text-xs text-muted-foreground">
                        ส่งไปยัง: {result.details.sentTo}
                      </div>
                      {result.details.tokenInfo && (
                        <div className="text-xs">
                          Token: {result.details.tokenInfo.format} ({result.details.tokenInfo.length} chars)
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              {result.details && !result.isValid && (
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                    ดูรายละเอียดเพิ่มเติม
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-lg">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5" />
            คำแนะนำการแก้ไขปัญหา
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              <strong>ปัญหาที่พบบ่อย:</strong> Error 401 Authentication failed - Token ไม่ถูกต้องหรือหมดอายุ
            </AlertDescription>
          </Alert>
          
          <div>
            <h4 className="font-medium mb-2 text-red-600">🚨 Error 401 - Authentication Failed:</h4>
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                <li><strong>ตรวจสอบ LINE_CHANNEL_ACCESS_TOKEN:</strong> ต้องเป็น Channel Access Token (Long-lived)</li>
                <li><strong>Token Format:</strong> ต้องเริ่มต้นด้วย <code>+</code> และมีความยาว 180+ ตัวอักษร</li>
                <li><strong>ตรวจสอบ expiry:</strong> Token อาจหมดอายุแล้ว ให้ reissue ใหม่</li>
                <li><strong>Messaging API:</strong> ตรวจสอบว่า Channel เป็นประเภท Messaging API</li>
              </ul>
              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                <strong>วิธีแก้:</strong> ไปที่ Line Developers Console → Channel → Messaging API → Channel access token → Issue/Reissue
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-orange-600">⚠️ Error 403 - Forbidden:</h4>
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
              <ul className="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300">
                <li><strong>User ID ไม่ถูกต้อง:</strong> ตรวจสอบว่า User ID เริ่มต้นด้วย <code>U</code> และมี 33 ตัวอักษร</li>
                <li><strong>ไม่ได้เป็นเพื่อน:</strong> User ต้อง add Bot เป็นเพื่อนก่อน</li>
                <li><strong>ไม่เคยทักหา:</strong> User ต้องทักหา Bot อย่างน้อย 1 ครั้ง</li>
              </ul>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-blue-600">🔍 วิธีการหา User ID:</h4>
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>ให้ลูกค้าทักหา Line Bot ก่อน</li>
                <li>ดู User ID จาก Webhook logs (แท็บ Debug & Monitor)</li>
                <li>หรือดูจากรายชื่อลูกค้าในแท็บ "แชทลูกค้า"</li>
                <li>User ID จะมีรูปแบบ: <code>Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code></li>
              </ol>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-green-600">✅ ขั้นตอนการตั้งค่าใหม่:</h4>
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <ol className="list-decimal list-inside space-y-1 text-green-700 dark:text-green-300 text-xs">
                <li>เข้า <a href="https://developers.line.biz/console/" target="_blank" className="underline">Line Developers Console</a></li>
                <li>เลือก Provider → Channel → Messaging API</li>
                <li>ในส่วน "Channel access token" กด "Issue" หรือ "Reissue"</li>
                <li>คัดลอก token ที่ได้ (เริ่มต้นด้วย +)</li>
                <li>อัปเดต LINE_CHANNEL_ACCESS_TOKEN ใน environment variables</li>
                <li>ทดสอบอีกครั้งในหน้านี้</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}