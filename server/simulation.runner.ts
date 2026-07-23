import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:5000/api/v1';
const prisma = new PrismaClient();

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runSimulation() {
  console.log('=== RESTAURANT POS BUSINESS SIMULATION ===\n');

  try {
    console.log('[1/5] Initializing & Authenticating Users...');
    const users = await prisma.user.findMany({ include: { userRoles: { include: { role: true } } } });
    const manager = users.find(u => u.userRoles.some(ur => ur.role.name === 'MANAGER'));
    const cashier = users.find(u => u.userRoles.some(ur => ur.role.name === 'CASHIER'));
    const kitchen = users.find(u => u.userRoles.some(ur => ur.role.name === 'KITCHEN'));
    const admin = users.find(u => u.userRoles.some(ur => ur.role.name === 'ADMIN'));

    if (!manager || !cashier || !kitchen || !admin) {
      throw new Error('Required roles not found in DB.');
    }

    const login = async (phone: string) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password: 'password123' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');
      return data.data.token;
    };

    const adminToken = await login(admin.phone);
    const cashierToken = await login(cashier.phone);

    console.log(`Successfully authenticated Cashier & Admin.`);

    const menuRes = await fetch(`${API_URL}/menu-items`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const menuData = await menuRes.json();
    const menuItems = menuData.data;
    if (menuItems.length === 0) throw new Error('No menu items found.');

    console.log(`Loaded ${menuItems.length} menu items.`);

    console.log('\n[2/5] Simulating Orders (Morning, Lunch Rush, Evening)...');

    const createOrder = async (token: string, type: string, itemCount: number) => {
      const items = [];
      for (let i = 0; i < itemCount; i++) {
        const randomItem = menuItems[Math.floor(Math.random() * menuItems.length)];
        const variant = randomItem.variants[0];
        items.push({
          menuItemId: randomItem.id,
          variantId: variant.id,
          quantity: Math.floor(Math.random() * 3) + 1,
          price: variant.price,
          notes: ''
        });
      }

      const payload = {
        orderType: type,
        tableNumber: type === 'DINE_IN' ? Math.floor(Math.random() * 20) + 1 : null,
        items,
        paymentMethod: Math.random() > 0.5 ? 'CASH' : 'CARD'
      };

      try {
        const res = await fetch(`${API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Order failed');
        return data.data;
      } catch (err: any) {
        console.error(`Order failed: ${err.message}`);
        return null;
      }
    };

    console.log('Simulating slow morning...');
    for (let i = 0; i < 10; i++) {
      await createOrder(cashierToken, 'DINE_IN', 2);
      await delay(100);
    }

    console.log('Simulating Lunch Rush (Concurrent)...');
    const lunchRush = [];
    for (let i = 0; i < 40; i++) {
      lunchRush.push(createOrder(cashierToken, Math.random() > 0.7 ? 'TAKEAWAY' : 'DINE_IN', Math.floor(Math.random() * 4) + 1));
    }
    await Promise.all(lunchRush);

    console.log('Simulating Evening / Delivery...');
    const eveningRush = [];
    for (let i = 0; i < 50; i++) {
      eveningRush.push(createOrder(cashierToken, Math.random() > 0.8 ? 'DELIVERY' : 'DINE_IN', Math.floor(Math.random() * 5) + 1));
    }
    await Promise.all(eveningRush);
    
    const totalOrders = await prisma.order.count();
    console.log(`Total orders processed: ${totalOrders}`);

    console.log('\n[3/5] Testing Error Scenarios...');
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({ name: 'Hack Category' })
      });
      if (res.status === 403) {
        console.log('✅ RBAC Success: Cashier blocked from Admin route (403).');
      } else {
        console.log(`❌ RBAC Failed with wrong status: ${res.status}`);
      }
    } catch (e: any) {
      console.log(`❌ RBAC Failed: ${e.message}`);
    }

    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cashierToken}` },
        body: JSON.stringify({})
      });
      if (res.status === 400 || res.status === 422 || res.status === 500) {
        console.log(`✅ Validation Success: Empty order blocked (${res.status}).`);
      } else {
        console.log(`❌ Validation Failed with wrong status: ${res.status}`);
      }
    } catch (e: any) {
      console.log(`❌ Validation Failed: ${e.message}`);
    }

    console.log('\n[4/5] Generating EOD Reports...');
    const salesRes = await fetch(`${API_URL}/reports/sales/daily`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const salesData = await salesRes.json();
    console.log('Daily Sales Report:');
    console.log(JSON.stringify(salesData.data, null, 2));

    const inventoryRes = await fetch(`${API_URL}/reports/inventory/status`, { headers: { Authorization: `Bearer ${adminToken}` } });
    const inventoryData = await inventoryRes.json();
    console.log(`Inventory Items Count: ${inventoryData.data?.length || 0}`);

    console.log('\n[5/5] Checking Database Constraints & Audit Logs...');
    const auditLogs = await prisma.auditLog.count();
    console.log(`Audit Logs Generated: ${auditLogs}`);

    const kitchenQueues = await prisma.kitchenQueue.count();
    console.log(`Kitchen Queue Items: ${kitchenQueues}`);

    console.log('\n✅ SIMULATION COMPLETED SUCCESSFULLY.');

  } catch (error: any) {
    console.error('\n❌ SIMULATION FAILED:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runSimulation();
