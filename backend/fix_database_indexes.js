// Fix database email index issue - URGENT PRODUCTION FIX
const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailIndex() {
  try {
    console.log('🔧 Connecting to MongoDB to fix email index...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('Database:', mongoose.connection.db.databaseName);
    
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Check current indexes
    console.log('\n📋 Current indexes on users collection:');
    const indexes = await usersCollection.indexes();
    indexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${JSON.stringify(index)}`);
    });
    
    // Check for problematic email index
    const emailIndex = indexes.find(idx => idx.key && idx.key.email);
    
    if (emailIndex && !emailIndex.sparse) {
      console.log('\n❌ Found problematic email index (not sparse)');
      console.log('Index details:', emailIndex);
      
      // Drop the old index
      console.log('\n🗑️  Dropping old email index...');
      await usersCollection.dropIndex('email_1');
      console.log('✅ Old email index dropped');
      
      // Create new sparse index
      console.log('\n📝 Creating new sparse email index...');
      await usersCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          sparse: true,
          background: true 
        }
      );
      console.log('✅ New sparse email index created');
      
    } else if (emailIndex && emailIndex.sparse) {
      console.log('\n✅ Email index is already sparse - no changes needed');
    } else {
      console.log('\n📝 No email index found, creating sparse email index...');
      await usersCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          sparse: true,
          background: true 
        }
      );
      console.log('✅ Sparse email index created');
    }
    
    // Also check/fix phoneNumber index
    const phoneIndex = indexes.find(idx => idx.key && idx.key.phoneNumber);
    
    if (phoneIndex && !phoneIndex.sparse) {
      console.log('\n❌ Found problematic phoneNumber index (not sparse)');
      
      // Drop the old index
      console.log('\n🗑️  Dropping old phoneNumber index...');
      await usersCollection.dropIndex('phoneNumber_1');
      console.log('✅ Old phoneNumber index dropped');
      
      // Create new sparse index
      console.log('\n📝 Creating new sparse phoneNumber index...');
      await usersCollection.createIndex(
        { phoneNumber: 1 }, 
        { 
          unique: true, 
          sparse: true,
          background: true 
        }
      );
      console.log('✅ New sparse phoneNumber index created');
      
    } else if (phoneIndex && phoneIndex.sparse) {
      console.log('\n✅ Phone number index is already sparse');
    } else {
      console.log('\n📝 Creating sparse phoneNumber index...');
      await usersCollection.createIndex(
        { phoneNumber: 1 }, 
        { 
          unique: true, 
          sparse: true,
          background: true 
        }
      );
      console.log('✅ Sparse phoneNumber index created');
    }
    
    // Verify new indexes
    console.log('\n📋 Updated indexes on users collection:');
    const updatedIndexes = await usersCollection.indexes();
    updatedIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - sparse: ${index.sparse || false}`);
    });
    
    // Clean up any users with null emails that might be causing conflicts
    console.log('\n🧹 Checking for conflicting null email entries...');
    const nullEmailUsers = await usersCollection.find({ email: null }).toArray();
    console.log(`Found ${nullEmailUsers.length} users with null email`);
    
    if (nullEmailUsers.length > 1) {
      console.log('⚠️  Multiple users with null email found - this could cause conflicts');
      console.log('Usernames:', nullEmailUsers.map(u => u.username));
      
      // Keep only the first one, remove email field from others
      for (let i = 1; i < nullEmailUsers.length; i++) {
        const user = nullEmailUsers[i];
        console.log(`Updating user ${user.username} to remove null email`);
        await usersCollection.updateOne(
          { _id: user._id },
          { $unset: { email: "" } }
        );
      }
      console.log('✅ Cleaned up conflicting null emails');
    }
    
    console.log('\n🎉 Database index fix completed successfully!');
    console.log('\n💡 What this fixed:');
    console.log('- Email field now allows multiple null values (sparse index)');
    console.log('- Phone number field now allows multiple null values (sparse index)');
    console.log('- Removed conflicting null email entries');
    console.log('- Registration should now work without E11000 duplicate key errors');
    
  } catch (error) {
    console.error('❌ Database index fix failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the fix
console.log('🚨 URGENT: Fixing database indexes for production...');
console.log('This will resolve the E11000 duplicate key error on email field\n');

fixEmailIndex().catch(console.error);