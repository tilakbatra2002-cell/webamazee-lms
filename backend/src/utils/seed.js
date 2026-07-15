require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  const slug = (process.env.SEED_COMPANY_SLUG || 'webamazee').toLowerCase();
  const name = process.env.SEED_COMPANY_NAME || 'Webamazee';
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@webamazee.com').toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

  let company = await Company.findOne({ slug });
  if (!company) {
    company = await Company.create({
      name,
      slug,
      industry: 'Web Design, Development & Digital Marketing Agency',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      settings: {
        leadCategories: [
          'Restaurant',
          'Gym',
          'Doctor / Clinic',
          'Real Estate',
          'Salon / Spa',
          'Retail Store',
          'Education',
          'Freelancer',
          'Startup',
        ],
      },
    });
    console.log(`Created company: ${company.name} (slug: ${company.slug})`);
  } else {
    console.log(`Company already exists: ${company.name}`);
  }

  const existingAdmin = await User.findOne({ company: company._id, email: adminEmail });
  if (!existingAdmin) {
    await User.create({
      company: company._id,
      name: 'Tilak',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });
    console.log(`Created admin user: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  console.log('\nSeed complete. Login with:');
  console.log(`  Company slug: ${slug}`);
  console.log(`  Email: ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
