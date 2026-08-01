const Patient = require('../models/Patient');
const Registration = require('../models/Registration');
const QueueToken = require('../models/QueueToken');
const Counter = require('../models/Counter');
const { getRegistrationWindowId } = require('../middleware/validateRegistrationWindow');

const searchPatients = async (req, res) => {
    try {
        const { query } = req.query;
        let dbQuery = {};
        
        if (query) {
            dbQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { phoneNumber: { $regex: query, $options: 'i' } },
                { caseNumber: { $regex: query, $options: 'i' } },
                { villageName: { $regex: query, $options: 'i' } }
            ];
        }

        const patients = await Patient.find(dbQuery).sort({ createdAt: -1 }).lean();

        // Calculate total visits and last visit date for each patient
        // For production with large datasets, this should be done using aggregation framework
        // but for now this is fine.
        const patientIds = patients.map(p => p._id);
        const registrations = await Registration.find({ patientId: { $in: patientIds } }).lean();
        
        const visitData = registrations.reduce((acc, reg) => {
            const pId = reg.patientId.toString();
            if (!acc[pId]) {
                acc[pId] = { totalVisits: 0, lastVisitDate: null };
            }
            acc[pId].totalVisits += 1;
            if (!acc[pId].lastVisitDate || new Date(reg.createdAt) > new Date(acc[pId].lastVisitDate)) {
                acc[pId].lastVisitDate = reg.createdAt;
            }
            return acc;
        }, {});

        const enrichedPatients = patients.map(p => ({
            ...p,
            totalVisits: visitData[p._id.toString()]?.totalVisits || 0,
            lastVisitDate: visitData[p._id.toString()]?.lastVisitDate || p.createdAt
        }));

        res.status(200).json({ patients: enrichedPatients });
    } catch (error) {
        console.error('searchPatients error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getPatientStats = async (req, res) => {
    try {
        const totalPatients = await Patient.countDocuments();
        
        const windowId = getRegistrationWindowId();
        const todaysRegistrations = await Registration.countDocuments({ registrationWindowId: windowId });
        
        const returningPatients = await Patient.countDocuments({ caseType: 'old' });
        
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const newPatientsThisMonth = await Patient.countDocuments({
            createdAt: { $gte: startOfMonth }
        });

        res.status(200).json({
            totalPatients,
            todaysRegistrations,
            returningPatients,
            newPatientsThisMonth
        });
    } catch (error) {
        console.error('getPatientStats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id).lean();
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const registrations = await Registration.find({ patientId: id }).sort({ createdAt: -1 }).lean();
        
        // Find tokens for these registrations to show queue status/token number
        const regIds = registrations.map(r => r._id);
        const tokens = await QueueToken.find({ registrationId: { $in: regIds } }).lean();
        
        const tokenMap = tokens.reduce((acc, t) => {
            acc[t.registrationId.toString()] = t;
            return acc;
        }, {});

        const history = registrations.map(reg => {
            const token = tokenMap[reg._id.toString()];
            return {
                ...reg,
                tokenNumber: token ? token.tokenNumber : null,
                queueStatus: token ? token.status : null
            };
        });

        res.status(200).json({ patient, history });
    } catch (error) {
        console.error('getPatientById error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const allowedUpdates = ['name', 'phoneNumber', 'villageName', 'caseNumber', 'caseType'];
        const updates = {};
        
        allowedUpdates.forEach(key => {
            if (req.body[key] !== undefined) {
                updates[key] = req.body[key];
            }
        });

        const patient = await Patient.findByIdAndUpdate(id, updates, { new: true });
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        res.status(200).json({ message: 'Patient updated', patient });
    } catch (error) {
        console.error('updatePatient error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const registerAgain = async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await Patient.findById(id);
        if (!patient) return res.status(404).json({ error: 'Patient not found' });

        const registrationWindowId = getRegistrationWindowId();

        const existing = await Registration.findOne({ patientId: patient._id, registrationWindowId });
        if (existing) {
            return res.status(409).json({ error: 'Patient is already registered for this window.' });
        }

        // 1. Create Registration
        const registration = new Registration({
            patientId: patient._id,
            registrationWindowId,
            status: 'arrived' // Admin is registering them physically
        });
        await registration.save();
        await registration.populate('patientId');

        // 2. Generate Queue Token directly
        const counter = await Counter.findOneAndUpdate(
            { registrationWindowId },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
        );

        const token = new QueueToken({
            registrationId: registration._id,
            tokenNumber: counter.sequence,
            registrationWindowId,
            status: 'active'
        });
        await token.save();

        if (req.io) {
            req.io.to('admin').emit('registration:created', { registration });
            req.io.to('admin').emit('queue:new-token', { token, registration });
        }

        res.status(201).json({ message: 'Re-registration successful', registration, token });
    } catch (error) {
        console.error('registerAgain error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    searchPatients,
    getPatientStats,
    getPatientById,
    updatePatient,
    registerAgain
};
