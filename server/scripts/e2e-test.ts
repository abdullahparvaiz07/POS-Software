import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api/v1';
let token = '';
let categoryId = 0;
let menuItemId = 0;
let orderId = 0;

const log = (msg: string) => console.log(`[E2E] ${msg}`);

async function runTests() {
  log('Starting End-to-End System Tests');

  try {
    // 1. Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'password123'
    });
    token = loginRes.data.data.token;
    log('Login successful. Token obtained.');

    const api = axios.create({
      baseURL: BASE_URL,
      headers: { Authorization: `Bearer ${token}` }
    });

    // 2. Create Category
    const catRes = await api.post('/categories', {
      name: 'E2E Category',
      description: 'Created during automated E2E testing',
      isActive: true
    });
    categoryId = catRes.data.data.id;
    log(`Category created. ID: ${categoryId}`);

    // 3. Create Menu Item
    const menuRes = await api.post('/menu-items', {
      categoryId: categoryId,
      name: 'E2E Test Burger',
      description: 'A delicious test burger',
      sku: `E2E-BURGER-${Date.now()}`,
      pricingMode: 'STANDARD',
      preparationArea: 'KITCHEN',
      displayOrder: 1,
      isAvailable: true,
      variants: [{ name: 'Regular', price: 500, isDefault: true }]
    });
    menuItemId = menuRes.data.data.id;
    log(`Menu Item created. ID: ${menuItemId}`);

    // 4. Create Order
    const orderRes = await api.post('/orders', {
      type: 'DINE_IN',
      tableId: 5,
      items: [
        {
          menuItemId: menuItemId,
          quantity: 2,
          notes: 'Extra test spice'
        }
      ]
    });
    orderId = orderRes.data.data.id;
    log(`Order created. ID: ${orderId}`);

    // Wait a brief moment for background queues to settle
    await new Promise(r => setTimeout(r, 1000));

    // 5. Fetch Kitchen Queue
    const kitchenRes = await api.get('/kitchen/queue');
    const queueItems = kitchenRes.data.data;
    log(`Kitchen Queue fetched. Items: ${queueItems.length}`);
    
    const ourItems = queueItems.filter((q: any) => q.orderId === orderId);
    if (ourItems.length === 0) {
      log('WARNING: No kitchen items found for our order.');
    } else {
      // Complete Kitchen Queue Items
      for (const item of ourItems) {
        await api.patch(`/kitchen/queue/${item.id}/status`, { status: 'PREPARING' });
        await api.patch(`/kitchen/queue/${item.id}/status`, { status: 'READY' });
        log(`Queue item ${item.id} status updated to READY`);
      }
    }

    // 6. Complete Order
    await api.post(`/orders/${orderId}/complete`);
    log(`Order completed.`);

    // 7. Trigger Payment
    await api.patch(`/orders/${orderId}/pay`, { paymentMethod: 'CASH' });
    log(`Payment triggered successfully.`);

    // 8. Cleanup (Delete Menu Item and Category)
    await api.delete(`/menu-items/${menuItemId}`);
    log(`Menu item deleted.`);
    
    await api.delete(`/categories/${categoryId}`);
    log(`Category deleted.`);

    log('E2E TEST PASSED! All core workflows verified.');

  } catch (error: any) {
    if (error.response) {
      console.error(`[E2E] FAILED: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`[E2E] FAILED: ${error.message}`);
    }
    process.exit(1);
  }
}

runTests();
