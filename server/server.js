const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/members',    require('./routes/members'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/expenses',   require('./routes/expenses'));
app.use('/api/plans',      require('./routes/plans'));
app.use('/api/trainers',   require('./routes/trainers'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ FitTrack server running on http://localhost:${PORT}`));
