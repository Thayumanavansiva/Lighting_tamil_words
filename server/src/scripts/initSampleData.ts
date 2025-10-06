import bcrypt from 'bcrypt';
import { dbInstance } from '../config/database';
import { getCollections } from '../config/schema';

async function initializeSampleData() {
  const collections = getCollections();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await collections.users.insertOne({
    email: 'admin@example.com',
    password: adminPassword,
    full_name: 'Admin User',
    role: 'admin',
    points: 0,
    level: 1,
    created_at: new Date(),
    updated_at: new Date()
  });

  // Insert sample words
  const sampleWords = [
    {
      word: 'படி',
      meaning_ta: 'அளவுக் குடுவை (கோரையால்/மரத்தால்)',
      meaning_en: 'Padi: dry/volume measure',
      domain: 'Volume',
      period: 'Classical/Medieval',
      modern_equivalent: 'லிட்டர்',
      status: 'traditional',
      notes: '2 உறி = 1 படி',
      created_by: admin.insertedId,
      created_at: new Date(),
      approved: true
    },
    {
      word: 'குறணி',
      meaning_ta: 'அளவுக் கருவி',
      meaning_en: 'Small measure unit',
      domain: 'Volume',
      period: 'Classical',
      modern_equivalent: 'மில்லிலிட்டர்',
      status: 'extinct',
      notes: 'குறிய அளவு',
      created_by: admin.insertedId,
      created_at: new Date(),
      approved: true
    },
    {
      word: 'நாழிகை',
      meaning_ta: 'காலஅளவு',
      meaning_en: 'Time measurement unit',
      domain: 'Time',
      period: 'Ancient',
      modern_equivalent: 'நிமிடம்',
      status: 'extinct',
      notes: '24 நிமிடங்கள்',
      created_by: admin.insertedId,
      created_at: new Date(),
      approved: true
    }
  ];

  await collections.words.insertMany(sampleWords);

  console.log('Sample data initialized successfully');
}

if (require.main === module) {
  dbInstance.connect()
    .then(initializeSampleData)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error initializing sample data:', error);
      process.exit(1);
    });
}