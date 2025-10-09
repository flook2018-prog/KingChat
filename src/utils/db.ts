// ตัวอย่างโค้ดเชื่อมต่อ PostgreSQL ด้วยไลบรารี pg (Node.js)
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

export async function connectDb() {
  if (!client._connected) {
    await client.connect();
  }
  return client;
}

// ตัวอย่างการใช้งาน
// const db = await connectDb();
// const res = await db.query('SELECT * FROM admin');
// console.log(res.rows);
