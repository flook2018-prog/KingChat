import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function useNotificationCount() {
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-ae50d4c0`;

  const fetchNotificationCount = async () => {
    try {
      const response = await fetch(`${API_BASE}/customers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Notification count data:', data);
        
        if (data && data.customers && Array.isArray(data.customers)) {
          const unassignedCustomers = data.customers.filter((customer: any) => {
            // เพิ่มการตรวจสอบ null safety ที่เข้มงวด
            if (!customer || typeof customer !== 'object') {
              console.log('⚠️ Invalid customer object:', customer);
              return false;
            }
            
            // ตรวจสอบ status หลายแบบ
            const caseStatus = customer.caseStatus || customer.status || 'unknown';
            const isUnassigned = caseStatus === 'pending' || 
                               caseStatus === 'unassigned' || 
                               caseStatus === 'waiting';
            
            console.log('🔍 Customer status check:', {
              userId: customer.userId || 'no-id',
              name: customer.name || 'no-name',
              caseStatus: caseStatus,
              originalCaseStatus: customer.caseStatus,
              originalStatus: customer.status,
              isUnassigned: isUnassigned
            });
            
            return isUnassigned;
          });
          
          console.log('📈 Unassigned customers found:', unassignedCustomers.length);
          setUnassignedCount(unassignedCustomers.length);
        } else {
          console.log('📝 No customers data, not an array, or empty array');
          setUnassignedCount(0);
        }
      } else {
        console.error('❌ Response not OK:', response.status, await response.text());
        setUnassignedCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching notification count:', error);
      setUnassignedCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificationCount();
    
    // รีเฟรชทุก 10 วินาที
    const interval = setInterval(fetchNotificationCount, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return { unassignedCount, loading };
}