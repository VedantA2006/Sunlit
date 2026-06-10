const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Customer = require('../models/Customer');
const Technician = require('../models/Technician');
const Battery = require('../models/Battery');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Notification = require('../models/Notification');
const Report = require('../models/Report');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sunlitpower';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Technician.deleteMany({});
    await Battery.deleteMany({});
    await Complaint.deleteMany({});
    await Feedback.deleteMany({});
    await Notification.deleteMany({});
    await Report.deleteMany({});
    console.log('Cleared existing database collections.');

    // 1. Create Users
    const salt = await bcrypt.genSalt(12);
    
    const adminPasswordHash = await bcrypt.hash('Admin@123', salt);
    const customerPasswordHash = await bcrypt.hash('Customer@123', salt);
    const techPasswordHash = await bcrypt.hash('Tech@123', salt);

    // Create Admin
    const admin = await User.create({
      name: 'Sunlit Admin',
      email: 'admin@sunlitpower.in',
      passwordHash: adminPasswordHash,
      role: 'admin',
      phone: '+91-98765-43210',
      address: 'Sunlit Corporate Office, Mumbai'
    });

    // Create Customers
    const cust1 = await User.create({
      name: 'Ramesh Kumar',
      email: 'ramesh.kumar@example.com',
      passwordHash: customerPasswordHash,
      role: 'customer',
      phone: '+91-99887-76655',
      address: 'Flat 102, Shanti Vihar, Pune, Maharashtra - 411001'
    });
    await Customer.create({ userId: cust1._id, gstNumber: '27AAAAA1111A1Z1', companyName: 'Ramesh Agro Industries' });

    const cust2 = await User.create({
      name: 'Priya Mehta',
      email: 'priya.mehta@example.com',
      passwordHash: customerPasswordHash,
      role: 'customer',
      phone: '+91-98989-89898',
      address: 'Building 4B, Sector 15, Noida, Uttar Pradesh - 201301'
    });
    await Customer.create({ userId: cust2._id, gstNumber: '09BBBBB2222B2Z2', companyName: 'Priya Telecom Services' });

    const cust3 = await User.create({
      name: 'Sunil Singh',
      email: 'sunil.singh@example.com',
      passwordHash: customerPasswordHash,
      role: 'customer',
      phone: '+91-97777-66666',
      address: 'Plot 45, Industrial Area, Phase II, Bengaluru, Karnataka - 560001'
    });
    await Customer.create({ userId: cust3._id, gstNumber: '29CCCCC3333C3Z3', companyName: 'Singh Robotics' });

    // Create Technicians
    const tech1 = await User.create({
      name: 'Arjun Sharma',
      email: 'tech1@sunlitpower.in',
      passwordHash: techPasswordHash,
      role: 'technician',
      phone: '+91-91111-22222',
      address: 'Tech Quarter 10, Chembur, Mumbai'
    });
    await Technician.create({ userId: tech1._id, skills: ['EV', 'Telecom', 'Solar'] });

    const tech2 = await User.create({
      name: 'Meena Patel',
      email: 'tech2@sunlitpower.in',
      passwordHash: techPasswordHash,
      role: 'technician',
      phone: '+91-92222-33333',
      address: 'Poonam Colony, Vadodara, Gujarat'
    });
    await Technician.create({ userId: tech2._id, skills: ['Agriculture', 'Solar', 'Robotics'] });

    const tech3 = await User.create({
      name: 'Ravi Kumar',
      email: 'tech3@sunlitpower.in',
      passwordHash: techPasswordHash,
      role: 'technician',
      phone: '+91-93333-44444',
      address: 'Street No 3, Karol Bagh, Delhi'
    });
    await Technician.create({ userId: tech3._id, skills: ['Industrial', 'Telecom', 'EV'] });

    console.log('Created users and role-specific profiles.');

    // 2. Create Batteries
    const bat1 = await Battery.create({
      serialNumber: 'SLP-TEL-2025-001',
      model: 'Telecom',
      purchaseDate: new Date('2025-01-15'),
      dealerName: 'Apex Telecom Distributors',
      warrantyYears: 3,
      customerId: cust1._id
    });

    const bat2 = await Battery.create({
      serialNumber: 'SLP-EV-2025-002',
      model: 'EV',
      purchaseDate: new Date('2025-02-20'),
      dealerName: 'Speedy Motors',
      warrantyYears: 2,
      customerId: cust1._id
    });

    const bat3 = await Battery.create({
      serialNumber: 'SLP-SOL-2024-003',
      model: 'Solar',
      purchaseDate: new Date('2024-06-10'),
      dealerName: 'Green Energy Solutions',
      warrantyYears: 5,
      customerId: cust2._id
    });

    const bat4 = await Battery.create({
      serialNumber: 'SLP-IND-2025-004',
      model: 'Industrial',
      purchaseDate: new Date('2025-03-05'),
      dealerName: 'National Hardware & Tools',
      warrantyYears: 2,
      customerId: cust2._id
    });

    const bat5 = await Battery.create({
      serialNumber: 'SLP-ROB-2025-005',
      model: 'Robotics',
      purchaseDate: new Date('2025-04-12'),
      dealerName: 'Future Tech Systems',
      warrantyYears: 2,
      customerId: cust3._id
    });

    console.log('Created 5 registered batteries.');

    // 3. Create 8 Complaints
    // Complaint 1: Submitted (Customer 1, Battery 1)
    const cmp1 = await Complaint.create({
      complaintId: 'CMP-20260601-0001',
      batteryId: bat1._id,
      customerId: cust1._id,
      type: 'Not Charging',
      description: 'The telecom backup battery has stopped charging completely after the power grid fluctuation yesterday.',
      priority: 'High',
      status: 'Submitted',
      estimatedResolutionDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      timeline: [{
        status: 'Submitted',
        note: 'Complaint raised by customer Ramesh Kumar',
        updatedBy: cust1._id,
        date: new Date('2026-06-01T10:00:00Z')
      }],
      createdAt: new Date('2026-06-01T10:00:00Z')
    });

    // Complaint 2: Submitted (Customer 2, Battery 3)
    const cmp2 = await Complaint.create({
      complaintId: 'CMP-20260602-0001',
      batteryId: bat3._id,
      customerId: cust2._id,
      type: 'Low Backup',
      description: 'The solar battery provides less than 2 hours of backup power under standard domestic load.',
      priority: 'Medium',
      status: 'Submitted',
      estimatedResolutionDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      timeline: [{
        status: 'Submitted',
        note: 'Complaint raised by customer Priya Mehta',
        updatedBy: cust2._id,
        date: new Date('2026-06-02T11:30:00Z')
      }],
      createdAt: new Date('2026-06-02T11:30:00Z')
    });

    // Complaint 3: Assigned (Customer 1, Battery 2, Tech 1)
    const cmp3 = await Complaint.create({
      complaintId: 'CMP-20260603-0001',
      batteryId: bat2._id,
      customerId: cust1._id,
      technicianId: tech1._id,
      type: 'Overheating',
      description: 'EV battery temperature goes beyond 55 degrees within 15 minutes of operating the vehicle.',
      priority: 'Critical',
      status: 'Assigned',
      estimatedResolutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint raised by customer Ramesh Kumar',
          updatedBy: cust1._id,
          date: new Date('2026-06-03T09:00:00Z')
        },
        {
          status: 'Assigned',
          note: 'Assigned to technician Arjun Sharma',
          updatedBy: admin._id,
          date: new Date('2026-06-03T10:15:00Z')
        }
      ],
      createdAt: new Date('2026-06-03T09:00:00Z')
    });

    // Complaint 4: Assigned (Customer 3, Battery 5, Tech 2)
    const cmp4 = await Complaint.create({
      complaintId: 'CMP-20260604-0001',
      batteryId: bat5._id,
      customerId: cust3._id,
      technicianId: tech2._id,
      type: 'Physical Damage',
      description: 'Robotics battery pack casing shows slight hairline fractures near the connection terminal.',
      priority: 'Low',
      status: 'Assigned',
      estimatedResolutionDate: new Date(Date.now() + 120 * 60 * 60 * 1000),
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint raised by customer Sunil Singh',
          updatedBy: cust3._id,
          date: new Date('2026-06-04T14:00:00Z')
        },
        {
          status: 'Assigned',
          note: 'Assigned to technician Meena Patel',
          updatedBy: admin._id,
          date: new Date('2026-06-04T16:00:00Z')
        }
      ],
      createdAt: new Date('2026-06-04T14:00:00Z')
    });

    // Complaint 5: In Progress (Customer 2, Battery 4, Tech 3)
    const cmp5 = await Complaint.create({
      complaintId: 'CMP-20260605-0001',
      batteryId: bat4._id,
      customerId: cust2._id,
      technicianId: tech3._id,
      type: 'Leakage',
      description: 'Acids/liquids leaking from the top vent cap during standard charging cycles.',
      priority: 'Critical',
      status: 'In Progress',
      estimatedResolutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint raised by customer Priya Mehta',
          updatedBy: cust2._id,
          date: new Date('2026-06-05T08:00:00Z')
        },
        {
          status: 'Assigned',
          note: 'Assigned to technician Ravi Kumar',
          updatedBy: admin._id,
          date: new Date('2026-06-05T09:30:00Z')
        },
        {
          status: 'In Progress',
          note: 'Technician Ravi Kumar initiated cell-voltage inspection',
          updatedBy: tech3._id,
          date: new Date('2026-06-05T10:45:00Z')
        }
      ],
      createdAt: new Date('2026-06-05T08:00:00Z')
    });

    // Complaint 6: In Progress (Customer 1, Battery 1, Tech 3)
    const cmp6 = await Complaint.create({
      complaintId: 'CMP-20260605-0002',
      batteryId: bat1._id,
      customerId: cust1._id,
      technicianId: tech3._id,
      type: 'Swelling',
      description: 'Telecom battery sidewall appears bloated and swollen. Dangerous condition.',
      priority: 'Critical',
      status: 'In Progress',
      estimatedResolutionDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint raised by customer Ramesh Kumar',
          updatedBy: cust1._id,
          date: new Date('2026-06-05T12:00:00Z')
        },
        {
          status: 'Assigned',
          note: 'Assigned to technician Ravi Kumar',
          updatedBy: admin._id,
          date: new Date('2026-06-05T13:00:00Z')
        },
        {
          status: 'In Progress',
          note: 'Technician Ravi Kumar in transit to server room site',
          updatedBy: tech3._id,
          date: new Date('2026-06-05T15:00:00Z')
        }
      ],
      createdAt: new Date('2026-06-05T12:00:00Z')
    });

    // Complaint 7: Resolved (Customer 2, Battery 3, Tech 2)
    const cmp7 = await Complaint.create({
      complaintId: 'CMP-20260520-0001',
      batteryId: bat3._id,
      customerId: cust2._id,
      technicianId: tech2._id,
      type: 'Not Charging',
      description: 'Solar battery had a disconnected internal bridge fuse.',
      priority: 'Medium',
      status: 'Resolved',
      resolvedAt: new Date('2026-05-22T14:00:00Z'),
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint raised',
          updatedBy: cust2._id,
          date: new Date('2026-05-20T10:00:00Z')
        },
        {
          status: 'Assigned',
          note: 'Assigned to Meena Patel',
          updatedBy: admin._id,
          date: new Date('2026-05-20T11:00:00Z')
        },
        {
          status: 'In Progress',
          note: 'Started repairs',
          updatedBy: tech2._id,
          date: new Date('2026-05-21T09:00:00Z')
        },
        {
          status: 'Resolved',
          note: 'Replaced fuse and tested charge cycle. Working perfectly.',
          updatedBy: tech2._id,
          date: new Date('2026-05-22T14:00:00Z')
        }
      ],
      createdAt: new Date('2026-05-20T10:00:00Z')
    });

    // Complaint 8: Closed (Customer 3, Battery 5, Tech 2)
    const cmp8 = await Complaint.create({
      complaintId: 'CMP-20260525-0001',
      batteryId: bat5._id,
      customerId: cust3._id,
      technicianId: tech2._id,
      type: 'Low Backup',
      description: 'Robotics battery pack needs calibration of voltage management IC.',
      priority: 'High',
      status: 'Closed',
      resolvedAt: new Date('2026-05-27T11:00:00Z'),
      timeline: [
        {
          status: 'Submitted',
          note: 'Complaint raised',
          updatedBy: cust3._id,
          date: new Date('2026-05-25T09:00:00Z')
        },
        {
          status: 'Assigned',
          note: 'Assigned to Meena Patel',
          updatedBy: admin._id,
          date: new Date('2026-05-25T11:00:00Z')
        },
        {
          status: 'In Progress',
          note: 'Calibrating BMS',
          updatedBy: tech2._id,
          date: new Date('2026-05-26T14:00:00Z')
        },
        {
          status: 'Resolved',
          note: 'BMS recalibrated. Capacity restored to 98%.',
          updatedBy: tech2._id,
          date: new Date('2026-05-27T11:00:00Z')
        },
        {
          status: 'Closed',
          note: 'Customer approved closure',
          updatedBy: admin._id,
          date: new Date('2026-05-28T10:00:00Z')
        }
      ],
      createdAt: new Date('2026-05-25T09:00:00Z')
    });

    console.log('Created 8 complaints in various statuses.');

    // 4. Create 4 Feedbacks
    await Feedback.create({
      complaintId: cmp7._id,
      customerId: cust2._id,
      serviceRating: 5,
      techRating: 5,
      comments: 'Technician Meena Patel was very professional. Replaced the fuse instantly and solar storage is working perfectly now.'
    });

    await Feedback.create({
      complaintId: cmp8._id,
      customerId: cust3._id,
      serviceRating: 4,
      techRating: 5,
      comments: 'Repairs were done on time, robot pack runs normally. Great service support.'
    });

    // We can also have minor ratings to show variety in graphs
    // Let's fabricate 2 additional feedbacks for completed complaints
    // We'll link them to fictitious or same complaints, or let's create two other resolved complaints for seeding feedback
    const cmpExtra1 = await Complaint.create({
      complaintId: 'CMP-20260510-0001',
      batteryId: bat1._id,
      customerId: cust1._id,
      technicianId: tech1._id,
      type: 'Leakage',
      description: 'Minor leakage around the terminals.',
      priority: 'Low',
      status: 'Resolved',
      resolvedAt: new Date('2026-05-12T10:00:00Z'),
      timeline: [{ status: 'Resolved', note: 'Sealed minor terminal casing leakage', updatedBy: tech1._id, date: new Date('2026-05-12T10:00:00Z') }],
      createdAt: new Date('2026-05-10T10:00:00Z')
    });
    await Feedback.create({
      complaintId: cmpExtra1._id,
      customerId: cust1._id,
      serviceRating: 3,
      techRating: 4,
      comments: 'Repaired okay, but response could have been slightly faster.'
    });

    const cmpExtra2 = await Complaint.create({
      complaintId: 'CMP-20260515-0001',
      batteryId: bat2._id,
      customerId: cust1._id,
      technicianId: tech3._id,
      type: 'Not Charging',
      description: 'Battery refused to draw power.',
      priority: 'Medium',
      status: 'Resolved',
      resolvedAt: new Date('2026-05-17T11:00:00Z'),
      timeline: [{ status: 'Resolved', note: 'Reset the circuit breaker connection', updatedBy: tech3._id, date: new Date('2026-05-17T11:00:00Z') }],
      createdAt: new Date('2026-05-15T09:00:00Z')
    });
    await Feedback.create({
      complaintId: cmpExtra2._id,
      customerId: cust1._id,
      serviceRating: 5,
      techRating: 5,
      comments: 'Amazing experience, Ravi solved it within 30 minutes.'
    });

    console.log('Created 4 feedbacks.');

    // 5. Create 10 Notifications
    const mixedNotifications = [
      { userId: cust1._id, title: 'Welcome to Sunlit Power', message: 'You have registered Ramesh Agro Industries on our portal.', type: 'complaint_created', isRead: true },
      { userId: cust1._id, title: 'Complaint Registered', message: 'Your complaint CMP-20260601-0001 is submitted.', type: 'complaint_created', isRead: false },
      { userId: cust1._id, title: 'Technician Assigned', message: 'Arjun Sharma assigned to CMP-20260603-0001.', type: 'complaint_assigned', isRead: false },
      { userId: tech1._id, title: 'New Task Assigned', message: 'You are assigned to complaint CMP-20260603-0001.', type: 'complaint_assigned', isRead: false },
      { userId: cust2._id, title: 'Complaint Resolved', message: 'CMP-20260520-0001 resolved. Please rate our service.', type: 'complaint_resolved', isRead: true },
      { userId: cust2._id, title: 'Feedback Requested', message: 'Rate service for CMP-20260520-0001.', type: 'feedback_request', isRead: true },
      { userId: tech2._id, title: 'New Task Assigned', message: 'You are assigned to complaint CMP-20260525-0001.', type: 'complaint_assigned', isRead: true },
      { userId: cust3._id, title: 'Complaint Closed', message: 'CMP-20260525-0001 is closed.', type: 'status_updated', isRead: true },
      { userId: admin._id, title: 'New Complaint Received', message: 'CMP-20260601-0001 submitted by ramesh.kumar@example.com.', type: 'complaint_created', isRead: false },
      { userId: admin._id, title: 'New Complaint Received', message: 'CMP-20260602-0001 submitted by priya.mehta@example.com.', type: 'complaint_created', isRead: false }
    ];

    await Notification.insertMany(mixedNotifications);
    console.log('Created 10 notifications.');

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error.message);
    process.exit(1);
  }
};

seedData();
