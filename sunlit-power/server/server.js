const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const connectDB = require('./config/db');
const Complaint = require('./models/Complaint');
const { calculateSlaStatus } = require('./utils/slaCalculator');

// Import routes
const authRoutes = require('./routes/authRoutes');
const batteryRoutes = require('./routes/batteryRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const customerRoutes = require('./routes/customerRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes');

// Initialize database
connectDB();

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false // Allows loading local uploads in frontend from localhost
}));
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, '')) 
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: function (origin, callback) {
    console.log('[CORS DEBUG] Incoming request from origin:', origin);
    console.log('[CORS DEBUG] Whitelisted origins:', allowedOrigins);
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    console.log('[CORS DEBUG] Origin blocked by CORS policy.');
    return callback(new Error('CORS Policy restriction'), false);
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploads as static static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/batteries', batteryRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Sunlit Power API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Background check for SLA breaches ( setInterval every 30 minutes )
const checkSlaBreaches = async () => {
  try {
    const openComplaints = await Complaint.find({ status: { $nin: ['Resolved', 'Closed'] } });
    let breachCount = 0;
    
    for (const comp of openComplaints) {
      const { isBreached } = calculateSlaStatus(comp.createdAt, comp.priority, false, null);
      if (isBreached && !comp.slaBreached) {
        comp.slaBreached = true;
        comp.timeline.push({
          status: comp.status,
          note: 'SLA Breach Alert: Resolution time limit exceeded.',
          date: new Date()
        });
        await comp.save();
        breachCount++;
      }
    }
    if (breachCount > 0) {
      console.log(`[SLA WORKER] Checked open complaints. flagged ${breachCount} new breach(es).`);
    }
  } catch (error) {
    console.error(`[SLA WORKER ERROR] SLA check failed: ${error.message}`);
  }
};

// Start background worker
checkSlaBreaches();
const SLA_INTERVAL = 30 * 60 * 1000; // 30 minutes
setInterval(checkSlaBreaches, SLA_INTERVAL);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
