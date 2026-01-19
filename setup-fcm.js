#!/usr/bin/env node

/**
 * Firebase FCM Setup Helper
 * Run this script to configure Firebase Cloud Messaging for mobile push notifications
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🔥 Firebase Cloud Messaging Setup for Mobile Push Notifications\n');
console.log('This wizard will help you configure FCM for your mobile app.\n');
console.log('Before starting, make sure you have:');
console.log('1. Created a Firebase project at https://console.firebase.google.com/');
console.log('2. Registered a Web app in your Firebase project');
console.log('3. Generated a VAPID key pair in Cloud Messaging settings\n');

const questions = [
  { key: 'NEXT_PUBLIC_FIREBASE_API_KEY', prompt: 'Firebase API Key: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', prompt: 'Firebase Auth Domain (e.g., your-app.firebaseapp.com): ' },
  { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', prompt: 'Firebase Project ID: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', prompt: 'Firebase Storage Bucket (e.g., your-app.appspot.com): ' },
  { key: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', prompt: 'Firebase Messaging Sender ID: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_APP_ID', prompt: 'Firebase App ID: ' },
  { key: 'NEXT_PUBLIC_FIREBASE_VAPID_KEY', prompt: 'Firebase VAPID Key (Web Push certificate): ' },
];

let config = {};
let index = 0;

function askQuestion() {
  if (index < questions.length) {
    const question = questions[index];
    rl.question(question.prompt, (answer) => {
      config[question.key] = answer.trim();
      index++;
      askQuestion();
    });
  } else {
    rl.close();
    saveConfig();
  }
}

function saveConfig() {
  console.log('\n✅ Configuration received!\n');

  // Create .env.local content
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const envPath = path.join(process.cwd(), '.env.local');
  
  // Check if .env.local exists
  if (fs.existsSync(envPath)) {
    const existingContent = fs.readFileSync(envPath, 'utf8');
    const updatedContent = existingContent + '\n\n# Firebase Configuration (FCM)\n' + envContent;
    fs.writeFileSync(envPath, updatedContent);
    console.log('✅ Added Firebase config to existing .env.local\n');
  } else {
    const fullContent = '# Firebase Configuration (FCM)\n' + envContent;
    fs.writeFileSync(envPath, fullContent);
    console.log('✅ Created .env.local with Firebase config\n');
  }

  // Update service worker
  const swPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');
  if (fs.existsSync(swPath)) {
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Replace placeholder values
    swContent = swContent.replace('YOUR_API_KEY', config.NEXT_PUBLIC_FIREBASE_API_KEY);
    swContent = swContent.replace('YOUR_AUTH_DOMAIN', config.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
    swContent = swContent.replace('YOUR_PROJECT_ID', config.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    swContent = swContent.replace('YOUR_STORAGE_BUCKET', config.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    swContent = swContent.replace('YOUR_MESSAGING_SENDER_ID', config.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
    swContent = swContent.replace('YOUR_APP_ID', config.NEXT_PUBLIC_FIREBASE_APP_ID);
    
    fs.writeFileSync(swPath, swContent);
    console.log('✅ Updated firebase-messaging-sw.js with your config\n');
  }

  console.log('🎉 Setup complete!\n');
  console.log('Next steps:');
  console.log('1. Restart your development server: npm run dev');
  console.log('2. Open the app and login');
  console.log('3. Go to Settings → Notifications');
  console.log('4. Click "Enable Push Notifications"');
  console.log('5. Allow notifications when prompted\n');
  console.log('📱 For mobile testing:');
  console.log('   - Use HTTPS (required for push notifications)');
  console.log('   - Or use ngrok for local testing: npx ngrok http 3000\n');
  console.log('Need help? Check FCM_MOBILE_SETUP.md for detailed instructions.\n');
}

// Start the questionnaire
askQuestion();
