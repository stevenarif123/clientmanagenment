#!/usr/bin/env node

const baseURL = 'http://localhost:8000';
const token = ''; // Will get from login

async function testAPI() {
  console.log('=== Testing Project Expenses API ===\n');
  
  try {
    // Get project with expenses
    const projectId = 1;
    
    console.log(`Testing /projects/${projectId}/expenses\n`);
    
    const response = await fetch(`${baseURL}/projects/${projectId}/expenses`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('\n✅ API returned success');
      console.log('Data structure:', Object.keys(data.data));
      
      if (data.data.expenses) {
        console.log(`Found ${data.data.expenses.length} expenses`);
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testAPI();
