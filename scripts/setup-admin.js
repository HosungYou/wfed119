const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('🔧 Setting up SUPER_ADMIN for newhosung@gmail.com...');

    // First, check if user exists
    let user = await prisma.user.findUnique({
      where: { email: 'newhosung@gmail.com' }
    });

    if (!user) {
      console.log('👤 User not found. Creating placeholder user...');
      // Create user if doesn't exist (they'll get proper data on first Google login)
      user = await prisma.user.create({
        data: {
          googleId: 'placeholder-for-newhosung', // Will be updated on first login
          email: 'newhosung@gmail.com',
          name: 'Hosung You',
          role: 'SUPER_ADMIN',
          isActive: true
        }
      });
      console.log('✅ User created with SUPER_ADMIN role');
    } else {
      console.log('👤 User found. Updating role to SUPER_ADMIN...');
      user = await prisma.user.update({
        where: { email: 'newhosung@gmail.com' },
        data: { role: 'SUPER_ADMIN' }
      });
      console.log('✅ User updated to SUPER_ADMIN role');
    }

    // Verify the setup
    const adminUser = await prisma.user.findUnique({
      where: { email: 'newhosung@gmail.com' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log('📊 Admin user details:');
    console.log(`- ID: ${adminUser.id}`);
    console.log(`- Email: ${adminUser.email}`);
    console.log(`- Name: ${adminUser.name}`);
    console.log(`- Role: ${adminUser.role}`);
    console.log(`- Active: ${adminUser.isActive}`);
    console.log(`- Created: ${adminUser.createdAt.toISOString()}`);

    // Check total users
    const totalUsers = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });

    console.log(`\n📈 Database stats:`);
    console.log(`- Total users: ${totalUsers}`);
    console.log(`- Admin users: ${adminCount}`);

    console.log('\n🎉 Admin setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Access local dashboard: http://localhost:3000/dashboard');
    console.log('2. Sign in with Google using newhosung@gmail.com');
    console.log('3. Access admin panel: http://localhost:3000/admin/database');
    console.log('4. Deploy to production with updated DATABASE_URL');

  } catch (error) {
    console.error('❌ Admin setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupAdmin()
    .then(() => {
      console.log('✨ Setup completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupAdmin;