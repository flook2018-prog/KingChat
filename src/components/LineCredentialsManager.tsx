import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Eye, EyeOff, RefreshCw, AlertTriangle, CheckCircle, Save, Trash2, ExternalLink } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface LineCredentials {
  id: string;
  name: string;
  accessToken: string;
  channelSecret: string;
  isActive: boolean;
  lastValidated: Date | null;
  isValid: boolean;
}

export function LineCredentialsManager() {
  const [credentials, setCredentials] = useState<LineCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showTokens, setShowTokens] = useState<{[key: string]: boolean}>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempCredentials, setTempCredentials] = useState<{accessToken: string, channelSecret: string}>({
    accessToken: '',
    channelSecret: ''
  });

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ae50d4c0`;

  // Load saved credentials from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lineCredentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCredentials(parsed.map((cred: any) => ({
          ...cred,
          lastValidated: cred.lastValidated ? new Date(cred.lastValidated) : null
        })));
      } catch (error) {
        console.error('Failed to parse saved credentials:', error);
      }
    }
  }, []);

  // Save credentials to localStorage
  const saveCredentials = (newCredentials: LineCredentials[]) => {
    localStorage.setItem('lineCredentials', JSON.stringify(newCredentials));
    setCredentials(newCredentials);
  };

  // Test a specific credential
  const testCredential = async (credential: LineCredentials): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Test with a dummy user ID (this will fail but we can check the error type)
      const response = await fetch(`${API_BASE}/test-line`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          userId: 'U1234567890abcdef1234567890abcdef12345678',
          message: 'Test validation',
          testAccessToken: credential.accessToken
        }),
      });
      
      const data = await response.json();
      
      // If we get a 403 error, it means the token is valid but user doesn't exist
      // If we get a 401 error, it means the token is invalid
      const isValid = response.status === 403 || (response.status === 400 && data.error?.includes('User ID'));
      
      // Update credential status
      const updatedCredentials = credentials.map(cred => 
        cred.id === credential.id 
          ? { ...cred, isValid, lastValidated: new Date() }
          : cred
      );
      saveCredentials(updatedCredentials);
      
      return isValid;
    } catch (error) {
      console.error('Test credential error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Add new credential
  const addCredential = () => {
    const newCredential: LineCredentials = {
      id: Date.now().toString(),
      name: `Line OA ${credentials.length + 1}`,
      accessToken: '',
      channelSecret: '',
      isActive: credentials.length === 0, // First one is active by default
      lastValidated: null,
      isValid: false
    };
    
    setCredentials([...credentials, newCredential]);
    setEditingId(newCredential.id);
    setTempCredentials({ accessToken: '', channelSecret: '' });
  };

  // Start editing
  const startEditing = (credential: LineCredentials) => {
    setEditingId(credential.id);
    setTempCredentials({
      accessToken: credential.accessToken,
      channelSecret: credential.channelSecret
    });
  };

  // Save editing
  const saveEditing = async () => {
    if (!editingId) return;
    
    const updatedCredentials = credentials.map(cred => 
      cred.id === editingId 
        ? { 
            ...cred, 
            accessToken: tempCredentials.accessToken,
            channelSecret: tempCredentials.channelSecret,
            isValid: false,
            lastValidated: null
          }
        : cred
    );
    
    saveCredentials(updatedCredentials);
    setEditingId(null);
    
    // Test the updated credential
    const updatedCred = updatedCredentials.find(c => c.id === editingId);
    if (updatedCred && updatedCred.accessToken) {
      await testCredential(updatedCred);
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setTempCredentials({ accessToken: '', channelSecret: '' });
  };

  // Delete credential
  const deleteCredential = (id: string) => {
    const updatedCredentials = credentials.filter(cred => cred.id !== id);
    
    // If we deleted the active one, make the first remaining one active
    if (updatedCredentials.length > 0 && !updatedCredentials.some(c => c.isActive)) {
      updatedCredentials[0].isActive = true;
    }
    
    saveCredentials(updatedCredentials);
  };

  // Set active credential
  const setActiveCredential = (id: string) => {
    const updatedCredentials = credentials.map(cred => ({
      ...cred,
      isActive: cred.id === id
    }));
    saveCredentials(updatedCredentials);
  };

  // Toggle token visibility
  const toggleTokenVisibility = (id: string) => {
    setShowTokens(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskToken = (token: string, show: boolean) => {
    if (show || !token) return token;
    if (token.length <= 10) return '•'.repeat(token.length);
    return token.substring(0, 10) + '•'.repeat(Math.max(0, token.length - 10));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 bg-purple-500 rounded-full flex items-center justify-center">
                <RefreshCw className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-purple-800 dark:text-purple-200">จัดการ Line Credentials</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  จัดการ Channel Access Token และ Channel Secret อย่างปลอดภัย
                </p>
              </div>
            </div>
            <Button 
              onClick={addCredential}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <RefreshCw className="size-4 mr-2" />
              เพิ่ม Token ใหม่
            </Button>
          </div>
        </CardContent>
      </Card>

      {credentials.length === 0 ? (
        <Card className="border-dashed border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="size-16 mx-auto bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <AlertTriangle className="size-8 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-medium text-purple-800 dark:text-purple-200">ยังไม่มี Line Credentials</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                  เพิ่ม Channel Access Token และ Channel Secret เพื่อเริ่มใช้งาน
                </p>
              </div>
              <div className="space-y-2">
                <Button 
                  onClick={addCredential} 
                  className="bg-purple-500 hover:bg-purple-600"
                >
                  <RefreshCw className="size-4 mr-2" />
                  เพิ่ม Token แรก
                </Button>
                <div className="text-xs text-purple-600 dark:text-purple-400">
                  ต้องการ Access Token จาก Line Developers Console
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {credentials.map((credential) => (
            <Card key={credential.id} className={credential.isActive ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{credential.name}</CardTitle>
                    {credential.isActive && (
                      <Badge variant="default">กำลังใช้งาน</Badge>
                    )}
                    {credential.lastValidated && (
                      <Badge variant={credential.isValid ? "secondary" : "destructive"}>
                        {credential.isValid ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!credential.isActive && credential.isValid && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveCredential(credential.id)}
                      >
                        ใช้เป็นหลัก
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testCredential(credential)}
                      disabled={isLoading || !credential.accessToken}
                    >
                      <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCredential(credential.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {credential.lastValidated && (
                  <CardDescription>
                    ตรวจสอบล่าสุด: {credential.lastValidated.toLocaleString('th-TH')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingId === credential.id ? (
                  // Editing mode
                  <div className="space-y-4">
                    <div>
                      <Label>Channel Access Token</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type={showTokens[credential.id] ? "text" : "password"}
                          value={tempCredentials.accessToken}
                          onChange={(e) => setTempCredentials(prev => ({
                            ...prev,
                            accessToken: e.target.value
                          }))}
                          placeholder="Channel Access Token"
                          className="font-mono text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTokenVisibility(credential.id)}
                        >
                          {showTokens[credential.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Channel Secret</Label>
                      <Input
                        type="password"
                        value={tempCredentials.channelSecret}
                        onChange={(e) => setTempCredentials(prev => ({
                          ...prev,
                          channelSecret: e.target.value
                        }))}
                        placeholder="Channel Secret"
                        className="font-mono text-sm mt-1"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={saveEditing} size="sm">
                        <Save className="size-4 mr-2" />
                        บันทึก
                      </Button>
                      <Button variant="outline" onClick={cancelEditing} size="sm">
                        ยกเลิก
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel Access Token</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="flex-1 p-2 bg-muted rounded border">
                          <code className="text-sm">
                            {credential.accessToken 
                              ? maskToken(credential.accessToken, showTokens[credential.id])
                              : 'ไม่ได้ตั้งค่า'
                            }
                          </code>
                        </div>
                        {credential.accessToken && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTokenVisibility(credential.id)}
                          >
                            {showTokens[credential.id] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-xs text-muted-foreground">Channel Secret</Label>
                      <div className="p-2 bg-muted rounded border mt-1">
                        <code className="text-sm">
                          {credential.channelSecret ? '•'.repeat(20) : 'ไม่ได้ตั้งค่า'}
                        </code>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEditing(credential)}
                    >
                      แก้ไข
                    </Button>
                  </div>
                )}

                {!credential.isValid && credential.lastValidated && (
                  <Alert variant="destructive">
                    <AlertTriangle className="size-4" />
                    <AlertDescription>
                      Access Token ไม่ถูกต้องหรือหมดอายุ กรุณาตรวจสอบและอัปเดต
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {credentials.length > 0 && (
        <div className="space-y-4">
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CheckCircle className="size-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium text-green-800 dark:text-green-200">
                  ขั้นตอนสุดท้าย: อัปเดต Environment Variables
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  หลังจากเพิ่มและทดสอบ credentials แล้ว ให้อัปเดต environment variables:
                </div>
                <ul className="text-sm text-green-700 dark:text-green-300 list-disc list-inside space-y-1 ml-2">
                  <li><code className="bg-green-100 dark:bg-green-900 px-1 rounded">LINE_CHANNEL_ACCESS_TOKEN</code> = Access Token ที่ "กำลังใช้งาน"</li>
                  <li><code className="bg-green-100 dark:bg-green-900 px-1 rounded">LINE_CHANNEL_SECRET</code> = Channel Secret ที่ "กำลังใช้งาน"</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
          
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="size-8 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                  <CheckCircle className="size-4 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                    เมื่อตั้งค่าเสร็จแล้ว
                  </h4>
                  <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <p>✅ แชทจากลูกค้าจะเด้งเข้าระบบอัตโนมัติ</p>
                    <p>✅ คุณสามารถตอบกลับลูกค้าผ่านระบบได้</p>
                    <p>✅ ระบบแจ้งเตือนจะทำงาน</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => document.querySelector('[value="test"]')?.click()}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      <CheckCircle className="size-4 mr-1" />
                      ทดสอบระบบ
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open('https://developers.line.biz/console/', '_blank')}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      <ExternalLink className="size-4 mr-1" />
                      Line Console
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}