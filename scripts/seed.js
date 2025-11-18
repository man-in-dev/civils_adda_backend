import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/database.js';
import Test from '../models/Test.js';
import User from '../models/User.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    // Drop problematic indexes if they exist
    try {
      await Test.collection.dropIndex('testId_1');
      console.log('🗑️  Dropped testId index');
    } catch (err) {
      // Index doesn't exist, which is fine
    }

    // Clear existing data
    await Test.deleteMany({});
    console.log('🗑️  Cleared existing tests');

    // Create demo user if not exists
    const demoEmail = 'demo@civilsadda.com';
    let demoUser = await User.findOne({ email: demoEmail });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Demo User',
        email: demoEmail,
        password: 'demo123',
      });
      console.log('✅ Created demo user');
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    // Create demo admin user if not exists
    const adminEmail = 'admin@civilsadda.com';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Admin User',
        email: adminEmail,
        password: 'admin123',
        isAdmin: true,
      });
      console.log('✅ Created demo admin user');
      console.log('   Email: admin@civilsadda.com');
      console.log('   Password: admin123');
    } else {
      // Update existing user to be admin if not already
      if (!adminUser.isAdmin) {
        adminUser.isAdmin = true;
        await adminUser.save();
        console.log('✅ Updated existing user to admin');
      } else {
        console.log('ℹ️  Demo admin user already exists');
      }
      console.log('   Email: admin@civilsadda.com');
      console.log('   Password: admin123');
    }

    // Sample tests data
    const tests = [
      {
        title: 'Polity Basics - Set 1',
        description: 'Fundamental questions on Indian Polity and Constitution',
        category: 'polity',
        durationMinutes: 20,
        price: 0,
        questions: [
          {
            text: 'Which article defines India as a Union of States?',
            options: ['Art 1', 'Art 2', 'Art 3', 'Art 5'],
            correctAnswer: 0,
          },
          {
            text: 'Who is the head of the Union Executive?',
            options: ['Prime Minister', 'President', 'Cabinet', 'Parliament'],
            correctAnswer: 1,
          },
          {
            text: 'How many fundamental rights are guaranteed by the Indian Constitution?',
            options: ['5', '6', '7', '8'],
            correctAnswer: 1,
          },
          {
            text: 'The Constitution of India was adopted on',
            options: [
              '26 January 1950',
              '26 November 1949',
              '15 August 1947',
              '26 January 1949',
            ],
            correctAnswer: 1,
          },
          {
            text: 'The total number of schedules in the Indian Constitution is',
            options: ['10', '11', '12', '13'],
            correctAnswer: 2,
          },
        ],
      },
      {
        title: 'History - Ancient India',
        description: 'Questions on ancient Indian history and civilization',
        category: 'history',
        durationMinutes: 25,
        price: 50,
        questions: [
          {
            text: 'Which dynasty built the Ajanta Caves?',
            options: ['Maurya', 'Gupta', 'Vakataka', 'Chalukya'],
            correctAnswer: 2,
          },
          {
            text: 'The Harappan Civilization was discovered in which year?',
            options: ['1921', '1922', '1923', '1924'],
            correctAnswer: 0,
          },
          {
            text: 'Who was the founder of the Mauryan Empire?',
            options: ['Ashoka', 'Chandragupta', 'Bindusara', 'Samudragupta'],
            correctAnswer: 1,
          },
          {
            text: 'The first Buddhist Council was held at',
            options: ['Rajgir', 'Vaishali', 'Pataliputra', 'Kashmir'],
            correctAnswer: 0,
          },
          {
            text: 'The author of Arthashastra was',
            options: ['Panini', 'Kautilya', 'Kalidasa', 'Banabhatta'],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: 'Geography - Physical Features',
        description: 'Questions on Indian geography and physical features',
        category: 'geography',
        durationMinutes: 30,
        price: 75,
        questions: [
          {
            text: 'Which is the longest river in India?',
            options: ['Ganga', 'Yamuna', 'Godavari', 'Narmada'],
            correctAnswer: 0,
          },
          {
            text: 'The highest peak in India is',
            options: ['Mount Everest', 'Kanchenjunga', 'Nanda Devi', 'Kamet'],
            correctAnswer: 1,
          },
          {
            text: 'The Tropic of Cancer passes through how many Indian states?',
            options: ['6', '7', '8', '9'],
            correctAnswer: 2,
          },
          {
            text: 'Which state has the longest coastline in India?',
            options: ['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Kerala'],
            correctAnswer: 1,
          },
          {
            text: 'The Deccan Plateau is bounded by',
            options: [
              'Eastern Ghats and Western Ghats',
              'Vindhya and Satpura',
              'Himalayas and Aravalli',
              'None of the above',
            ],
            correctAnswer: 0,
          },
        ],
      },
      {
        title: 'Economy - Indian Economy Basics',
        description: 'Basic questions on Indian economy and economic policies',
        category: 'economy',
        durationMinutes: 20,
        price: 100,
        questions: [
          {
            text: 'The Reserve Bank of India was established in',
            options: ['1930', '1935', '1940', '1945'],
            correctAnswer: 1,
          },
          {
            text: 'GDP stands for',
            options: [
              'Gross Domestic Product',
              'Gross Development Product',
              'General Development Plan',
              'Government Development Program',
            ],
            correctAnswer: 0,
          },
          {
            text: 'Which is the largest sector of the Indian economy?',
            options: ['Agriculture', 'Industry', 'Services', 'IT'],
            correctAnswer: 2,
          },
          {
            text: 'The Goods and Services Tax (GST) was implemented in',
            options: ['2015', '2016', '2017', '2018'],
            correctAnswer: 2,
          },
          {
            text: 'Fiscal deficit is the difference between',
            options: [
              'Revenue and expenditure',
              'Total revenue and total expenditure',
              'Government income and spending',
              'All of the above',
            ],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: 'Polity Advanced - Constitutional Provisions',
        description: 'Advanced level questions on constitutional articles and amendments',
        category: 'polity',
        durationMinutes: 25,
        price: 299,
        questions: [
          {
            text: 'Which article deals with the abolition of untouchability?',
            options: ['Article 15', 'Article 17', 'Article 16', 'Article 18'],
            correctAnswer: 1,
          },
          {
            text: 'The concept of "Basic Structure" of the Constitution was propounded in',
            options: ['Golaknath case', 'Kesavananda Bharati case', 'Minerva Mills case', 'Maneka Gandhi case'],
            correctAnswer: 1,
          },
          {
            text: 'Right to Information (RTI) is a',
            options: ['Fundamental Right', 'Legal Right', 'Constitutional Right', 'Natural Right'],
            correctAnswer: 1,
          },
          {
            text: 'Who can amend the Constitution?',
            options: ['President', 'Parliament', 'Supreme Court', 'Prime Minister'],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: 'Modern History - Set 1',
        description: 'Moderate level questions from Modern India (1857-1947)',
        category: 'history',
        durationMinutes: 20,
        price: 199,
        questions: [
          {
            text: 'The First War of Independence (1857) started from',
            options: ['Delhi', 'Meerut', 'Kanpur', 'Lucknow'],
            correctAnswer: 1,
          },
          {
            text: 'Who founded the Indian National Congress?',
            options: ['A.O. Hume', 'Dadabhai Naoroji', 'W.C. Bonnerjee', 'Surendranath Banerjee'],
            correctAnswer: 0,
          },
          {
            text: 'The partition of Bengal was annulled in',
            options: ['1909', '1911', '1912', '1913'],
            correctAnswer: 1,
          },
          {
            text: 'Jallianwala Bagh Massacre took place in',
            options: ['1917', '1918', '1919', '1920'],
            correctAnswer: 2,
          },
        ],
      },
      {
        title: 'Ancient History - Indus Valley Civilization',
        description: 'Questions on ancient Indian history and civilizations',
        category: 'history',
        durationMinutes: 15,
        price: 149,
        questions: [
          {
            text: 'The main occupation of the people of the Indus Valley Civilization was',
            options: ['Agriculture', 'Trade', 'Craft', 'All of the above'],
            correctAnswer: 3,
          },
          {
            text: 'The largest site of Indus Valley Civilization is',
            options: ['Mohenjo-Daro', 'Harappa', 'Lothal', 'Kalibangan'],
            correctAnswer: 0,
          },
          {
            text: 'Which metal was NOT known to the Harappans?',
            options: ['Gold', 'Silver', 'Iron', 'Copper'],
            correctAnswer: 2,
          },
        ],
      },
      {
        title: 'Geography of India - Physical Features',
        description: 'Questions on physical geography, rivers, mountains of India',
        category: 'geography',
        durationMinutes: 18,
        price: 179,
        questions: [
          {
            text: 'Which river is known as the "Sorrow of Bengal"?',
            options: ['Ganga', 'Damodar', 'Hooghly', 'Teesta'],
            correctAnswer: 1,
          },
          {
            text: 'The Konkan Coast is located between',
            options: ['Goa and Karnataka', 'Goa and Maharashtra', 'Kerala and Karnataka', 'Maharashtra and Gujarat'],
            correctAnswer: 1,
          },
          {
            text: 'Which is the largest state of India by area?',
            options: ['Madhya Pradesh', 'Maharashtra', 'Rajasthan', 'Uttar Pradesh'],
            correctAnswer: 2,
          },
          {
            text: 'The Thar Desert is mainly located in',
            options: ['Rajasthan', 'Gujarat', 'Punjab', 'Haryana'],
            correctAnswer: 0,
          },
        ],
      },
      {
        title: 'Science - Physics Basics',
        description: 'Fundamental questions on physics concepts',
        category: 'science',
        durationMinutes: 15,
        price: 149,
        questions: [
          {
            text: 'The SI unit of force is',
            options: ['Joule', 'Newton', 'Pascal', 'Watt'],
            correctAnswer: 1,
          },
          {
            text: 'Which law states that energy cannot be created or destroyed?',
            options: ['First Law of Thermodynamics', 'Law of Conservation of Energy', "Newton's First Law", "Ohm's Law"],
            correctAnswer: 1,
          },
          {
            text: 'The speed of light in vacuum is approximately',
            options: ['3 × 10⁸ m/s', '3 × 10⁶ m/s', '3 × 10¹⁰ m/s', '3 × 10¹² m/s'],
            correctAnswer: 0,
          },
        ],
      },
      {
        title: 'Science - Chemistry Basics',
        description: 'Basic chemistry concepts and periodic table',
        category: 'science',
        durationMinutes: 15,
        price: 149,
        questions: [
          {
            text: 'The atomic number represents',
            options: ['Number of neutrons', 'Number of protons', 'Number of electrons', 'Mass number'],
            correctAnswer: 1,
          },
          {
            text: 'pH of pure water is',
            options: ['5', '6', '7', '8'],
            correctAnswer: 2,
          },
          {
            text: 'Which gas is most abundant in Earth\'s atmosphere?',
            options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Argon'],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: 'Logical Reasoning - Set 1',
        description: 'Logical reasoning and analytical questions',
        category: 'science',
        durationMinutes: 20,
        price: 199,
        questions: [
          {
            text: 'If all roses are flowers and some flowers fade quickly, then',
            options: ['All roses fade quickly', 'Some roses fade quickly', 'No roses fade quickly', 'Cannot be determined'],
            correctAnswer: 1,
          },
          {
            text: 'What comes next in the series: 2, 6, 12, 20, 30, ?',
            options: ['40', '42', '44', '46'],
            correctAnswer: 1,
          },
          {
            text: 'If Monday is the first day, what day is the 100th day?',
            options: ['Monday', 'Tuesday', 'Wednesday', 'Sunday'],
            correctAnswer: 1,
          },
        ],
      },
      {
        title: 'Current Affairs - 2024',
        description: 'Important current affairs and general knowledge',
        category: 'current-affairs',
        durationMinutes: 15,
        price: 179,
        questions: [
          {
            text: 'What is the capital of India?',
            options: ['Mumbai', 'New Delhi', 'Kolkata', 'Chennai'],
            correctAnswer: 1,
          },
          {
            text: 'Who is the current Prime Minister of India?',
            options: ['Narendra Modi', 'Rahul Gandhi', 'Amit Shah', 'Rajnath Singh'],
            correctAnswer: 0,
          },
        ],
      },
    ];

    // Insert tests
    const insertedTests = await Test.insertMany(tests);
    console.log(`✅ Seeded ${insertedTests.length} tests`);
    console.log('\n📊 Summary:');
    console.log(`   - Free tests: ${insertedTests.filter(t => t.price === 0).length}`);
    console.log(`   - Paid tests: ${insertedTests.filter(t => t.price > 0).length}`);
    console.log(`   - Total questions: ${insertedTests.reduce((sum, t) => sum + t.questions.length, 0)}`);
    console.log('\n🎉 Database seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();

