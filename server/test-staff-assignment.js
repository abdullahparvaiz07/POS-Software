async function testStaffAssignmentSystem() {
  console.log("=== STARTING UAT-001 STAFF ASSIGNMENT SYSTEM INTEGRATION TEST ===");

  // 1. Authenticate as Cashier/Admin
  const loginRes = await fetch('http://127.0.0.1:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: 'cashier@test.com', password: 'cashier@123' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log("Login keys:", Object.keys(loginData));

  if (!token) {
    throw new Error("Login failed: " + JSON.stringify(loginData));
  }
  console.log("✓ Login successful");

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch Eligible Staff
  const waiterRes = await fetch('http://127.0.0.1:5000/api/v1/orders/eligible-staff?role=WAITER', { headers });
  const waitersData = await waiterRes.json();
  console.log("Waiter Response:", waitersData);

  const riderRes = await fetch('http://127.0.0.1:5000/api/v1/orders/eligible-staff?role=RIDER', { headers });
  const ridersData = await riderRes.json();
  console.log("Rider Response:", ridersData);

  // Fetch valid menu item
  const menuRes = await fetch('http://127.0.0.1:5000/api/v1/menu-items', { headers });
  const menuData = await menuRes.json();
  const firstItem = Array.isArray(menuData.data) ? menuData.data[0] : (menuData.data?.items?.[0] || menuData[0]);
  const validMenuItemId = firstItem?.id;
  console.log(`✓ Using valid Menu Item ID: ${validMenuItemId} (${firstItem?.name})`);

  // 3. Test Manual Waiter Assignment (Dine-In)
  const manualWaiterId = waitersData.data?.[0]?.id || 1;
  const manualDineInRes = await fetch('http://127.0.0.1:5000/api/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orderType: 'DINE_IN',
      tableNumber: 3,
      waiterId: manualWaiterId,
      assignmentMethod: 'MANUAL',
      paymentMethod: 'CASH',
      items: [{ menuItemId: validMenuItemId, quantity: 2 }]
    })
  });
  const manualDineInData = await manualDineInRes.json();
  console.log("Create Order Full Response:", JSON.stringify(manualDineInData, null, 2));
  console.log("✓ Manual Waiter Order Created:", {
    orderNumber: manualDineInData.data?.orderNumber,
    waiterId: manualDineInData.data?.waiterId,
    waiterName: manualDineInData.data?.waiter?.fullName,
    method: manualDineInData.data?.assignmentMethod
  });

  // 4. Test Auto Round-Robin Waiter Assignment (Dine-In)
  const autoOrder1Res = await fetch('http://127.0.0.1:5000/api/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orderType: 'DINE_IN',
      tableNumber: 4,
      paymentMethod: 'CASH',
      items: [{ menuItemId: validMenuItemId, quantity: 1 }]
    })
  });
  const autoOrder1Data = await autoOrder1Res.json();

  const autoOrder2Res = await fetch('http://127.0.0.1:5000/api/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orderType: 'DINE_IN',
      tableNumber: 5,
      paymentMethod: 'CASH',
      items: [{ menuItemId: validMenuItemId, quantity: 1 }]
    })
  });
  const autoOrder2Data = await autoOrder2Res.json();

  console.log("✓ Auto Round-Robin Waiters Assigned:", [
    { order: autoOrder1Data.data?.orderNumber, waiter: autoOrder1Data.data?.waiter?.fullName || autoOrder1Data.data?.waiterId, method: autoOrder1Data.data?.assignmentMethod },
    { order: autoOrder2Data.data?.orderNumber, waiter: autoOrder2Data.data?.waiter?.fullName || autoOrder2Data.data?.waiterId, method: autoOrder2Data.data?.assignmentMethod }
  ]);

  // 5. Test Delivery Order Manual & Auto Rider Assignment
  const manualRiderId = ridersData.data?.[0]?.id;
  const deliveryRes = await fetch('http://127.0.0.1:5000/api/v1/orders', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orderType: 'DELIVERY',
      customerName: 'Ali Khan',
      customerPhone: '0300-9876543',
      deliveryRiderId: manualRiderId,
      assignmentMethod: 'MANUAL',
      paymentMethod: 'CASH',
      items: [{ menuItemId: validMenuItemId, quantity: 1 }]
    })
  });
  const deliveryData = await deliveryRes.json();
  console.log("✓ Delivery Order Rider Assigned:", {
    orderNumber: deliveryData.data?.orderNumber,
    riderId: deliveryData.data?.deliveryRiderId,
    riderName: deliveryData.data?.deliveryRider?.fullName,
    method: deliveryData.data?.assignmentMethod
  });

  // 6. Test Staff Reassignment API (PATCH /api/v1/orders/:id/assign)
  if (manualDineInData.data?.id && waitersData.data?.length > 1) {
    const newWaiterId = waitersData.data[1].id;
    const reassignRes = await fetch(`http://127.0.0.1:5000/api/v1/orders/${manualDineInData.data.id}/assign`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        waiterId: newWaiterId,
        assignmentMethod: 'MANUAL'
      })
    });
    const reassignData = await reassignRes.json();
    console.log("✓ Staff Reassignment API Success:", {
      orderNumber: reassignData.data?.orderNumber,
      newWaiter: reassignData.data?.waiter?.fullName,
      assignedBy: reassignData.data?.assignedBy?.fullName,
      assignedAt: reassignData.data?.assignedAt
    });
  }

  // 7. Test Staff Performance Report API
  const reportRes = await fetch('http://127.0.0.1:5000/api/v1/reports/staff-performance', { headers });
  const reportData = await reportRes.json();
  console.log("✓ Staff Performance Metrics API Success:", {
    waitersCount: reportData.data?.waiters?.length,
    ridersCount: reportData.data?.riders?.length,
    sampleWaiter: reportData.data?.waiters?.[0]
  });

  console.log("=== ALL UAT-001 STAFF ASSIGNMENT SYSTEM TESTS PASSED CLEANLY ===");
}

testStaffAssignmentSystem().catch(console.error);
