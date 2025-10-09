import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Activity, Database, Webhook, MessageSquare, Settings } from "lucide-react";
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { LineTokenValidator } from './LineTokenValidator';

interface HealthStatus {
  status: 'healthy' | 'error';
  timestamp: string;
  lineConfigured: boolean;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function DebugMonitoring() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [customers, setCustomers] = useState([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ae50d4c0`;

  const checkHealth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/health`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setHealthStatus(data);
        addLog('info', 'Health check successful', data);
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Health check error:', error);
      addLog('error', 'Health check failed', error);
      setHealthStatus({
        status: 'error',
        timestamp: new Date().toISOString(),
        lineConfigured: false
      });
    }
    setIsLoading(false);
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE}/customers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        addLog('info', `Fetched ${data.customers?.length || 0} customers`);
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to fetch customers: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Fetch customers error:', error);
      addLog('error', 'Failed to fetch customers', { error: error.message });
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${API_BASE}/logs`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.logs && Array.isArray(data.logs)) {
          const serverLogs = data.logs.map(log => ({
            timestamp: log.timestamp,
            level: log.level as 'info' | 'error' | 'warning',
            message: log.message,
            details: log.details ? (typeof log.details === 'string' ? JSON.parse(log.details) : log.details) : undefined
          }));
          setLogs(prev => [...serverLogs, ...prev.filter(log => log.message.includes('client:'))]);
        }
      }
    } catch (error) {
      console.error('Fetch logs error:', error);
      addLog('error', 'Failed to fetch server logs', { error: error.message });
    }
  };

  const testWebhook = async () => {
    try {
      const testData = {
        events: [{
          type: 'message',
          message: {
            type: 'text',
            text: 'Test message from debug panel at ' + new Date().toLocaleString('th-TH')
          },
          source: {
            userId: 'test-user-' + Date.now()
          },
          replyToken: 'test-reply-token-' + Date.now()
        }]
      };

      const response = await fetch(`${API_BASE}/webhook/line`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(testData),
      });
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
      
      if (response.ok) {
        addLog('info', 'Webhook test successful', responseData);
      } else {
        throw new Error(`Webhook test failed: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      console.error('Webhook test error:', error);
      addLog('error', 'Webhook test failed', { error: error.message });
    }
  };

  const testServer = async () => {
    try {
      const response = await fetch(`${API_BASE}/test?message=hello+from+debug+panel`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog('info', 'Server test successful', data);
      } else {
        const errorText = await response.text();
        throw new Error(`Server test failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Server test error:', error);
      addLog('error', 'Server test failed', { error: error.message });
    }
  };

  const addLog = (level: 'info' | 'error' | 'warning', message: string, details?: any) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[client:] ${message}`,
      details
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50)); // Keep only last 50 logs
  };

  const refreshAll = async () => {
    setLastRefresh(new Date());
    await Promise.all([
      checkHealth(),
      fetchCustomers(),
      fetchLogs()
    ]);
  };

  useEffect(() => {
    refreshAll();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(refreshAll, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="size-4 text-green-500" />;
      case 'error':
        return <XCircle className="size-4 text-red-500" />;
      default:
        return <AlertCircle className="size-4 text-yellow-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info':
        return 'text-blue-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>ตรวจสอบระบบ & Debug</h1>
          <p className="text-muted-foreground mt-2">
            ตรวจสอบสถานะการทำงานของระบบและแก้ไขปัญหา
          </p>
        </div>
        <Button onClick={refreshAll} disabled={isLoading}>
          <RefreshCw className={`size-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          รีเฟรช
        </Button>
      </div>

      <Tabs defaultValue="status" className="space-y-4">
        <TabsList>
          <TabsTrigger value="status">
            <Activity className="size-4 mr-2" />
            สถานะระบบ
          </TabsTrigger>
          <TabsTrigger value="line-validation">
            <Settings className="size-4 mr-2" />
            ทดสอบ Line API
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-6">

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">สถานะเซิร์ฟเวอร์</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {healthStatus && getStatusIcon(healthStatus.status)}
              <div className="text-2xl font-bold">
                {healthStatus?.status === 'healthy' ? 'ปกติ' : 'ข้อผิดพลาด'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              ล่าสุด: {lastRefresh.toLocaleTimeString('th-TH')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">การกำหนดค่า LINE</CardTitle>
            <Webhook className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {healthStatus?.lineConfigured ? (
                <CheckCircle className="size-4 text-green-500" />
              ) : (
                <XCircle className="size-4 text-red-500" />
              )}
              <div className="text-2xl font-bold">
                {healthStatus?.lineConfigured ? 'พร้อม' : 'ไม่พร้อม'}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Channel Access Token & Secret
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">ลูกค้าในระบบ</CardTitle>
            <Database className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">
              ข้อมูลลูกค้าทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Actions */}
      <Card>
        <CardHeader>
          <CardTitle>การทดสอบระบบ</CardTitle>
          <CardDescription>
            ทดสอบฟังก์ชันต่างๆ ของระบบ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button onClick={checkHealth} variant="outline">
              <Activity className="size-4 mr-2" />
              ทดสอบ Health
            </Button>
            <Button onClick={testServer} variant="outline">
              <CheckCircle className="size-4 mr-2" />
              ทดสอบ Server
            </Button>
            <Button onClick={testWebhook} variant="outline">
              <Webhook className="size-4 mr-2" />
              ทดสอบ Webhook
            </Button>
            <Button onClick={fetchCustomers} variant="outline">
              <MessageSquare className="size-4 mr-2" />
              ดึงข้อมูลลูกค้า
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Button onClick={fetchLogs} variant="outline">
              <Database className="size-4 mr-2" />
              ดึง Server Logs
            </Button>
            <Button onClick={() => setLogs([])} variant="outline">
              <RefreshCw className="size-4 mr-2" />
              ล้าง Client Logs
            </Button>
            <Button onClick={() => refreshAll()} variant="outline">
              <RefreshCw className="size-4 mr-2" />
              รีเฟรชทั้งหมด
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook URL */}
      <Card>
        <CardHeader>
          <CardTitle>ข้อมูล Webhook</CardTitle>
          <CardDescription>
            URL สำหรับตั้งค่าใน LINE Developers Console
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <code className="text-sm">{API_BASE}/webhook/line</code>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            <p><strong>ขั้นตอนการแก้ปัญหา:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>ตรวจสอบว่า Health Check เป็นสีเขียว</li>
              <li>ตรวจสอบว่า LINE Configuration เป็นสีเขียว</li>
              <li>ทดสอบ Webhook ด้วยปุ่มด้านบน</li>
              <li>ตรวจสอบ URL ใน LINE Developers Console</li>
              <li>ลองส่งข้อความทดสอบใน LINE</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการทำงาน (Logs)</CardTitle>
          <CardDescription>
            บันทึกการทำงานของระบบล่าสุด 50 รายการ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">ยังไม่มีบันทึก</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex items-start space-x-2 text-sm">
                    <Badge variant="outline" className={getLevelColor(log.level)}>
                      {log.level.toUpperCase()}
                    </Badge>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span>{log.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                        </span>
                      </div>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            ดูรายละเอียด
                          </summary>
                          <pre className="text-xs text-muted-foreground mt-1 bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="line-validation">
          <LineTokenValidator />
        </TabsContent>
      </Tabs>
    </div>
  );
}