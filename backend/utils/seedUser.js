const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User.model');

async function seedUsers() {
  try {
    // ✅ Connect DB
    // await mongoose.connect('mongodb://127.0.0.1:27017/billflow');

    // console.log('✅ DB Connected');

    const password = await bcrypt.hash('12345678', 10);

    const users = [
      {
        tenantId: 'tenant_001',
        name: 'Admin User',
        email: 'admin1@example.com',
        password,
        role: 'admin',
        avatar: 'https://i.pravatar.cc/150?img=1'
      },
      {
        tenantId: 'tenant_001',
        name: 'Staff User',
        email: 'staff1@example.com',
        password,
        role: 'staff',
        avatar: 'https://i.pravatar.cc/150?img=2'
      }
    ];

    await User.insertMany(users);

    console.log('✅ Dummy users inserted');

    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// ✅ Call function
seedUsers();

// const mongoose = require('mongoose');
// const bcrypt = require('bcrypt');
// const User = require('../models/User.model'); // adjust path

// async function seedUsers() {
//     //   await mongoose.connect('mongodb://127.0.0.1:27017/billflow');

//     console.log(' Seeding users:' );
//     const password = await bcrypt.hash('12345678', 10);

//     const users = [
//         {
//             tenantId: 'tenant_001',
//             name: 'Admin User',
//             email: 'kshadan236@gmail.com',
//             password,
//             role: 'admin',
//             avatar: 'https://i.pravatar.cc/150?img=1'
//         },
//         {
//             tenantId: 'tenant_001',
//             name: 'Staff User',
//             email: 'staff@example.com',
//             password,
//             role: 'staff',
//             avatar: 'https://i.pravatar.cc/150?img=2'
//         }
//     ];

//     await User.insertMany(users);
//     console.log('Dummy users inserted');
//     process.exit();
// }

// // seedUsers();
// module.exports = { seedUsers };