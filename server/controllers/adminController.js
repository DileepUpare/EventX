const Admin = require("../models/admin");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const setAdmin = async (req, res) => {
    const secret = JWT_SECRET;
    const payload = {
        email: req.body.email,
    };

    const token = await jwt.sign(payload, secret);

    const new_admin = new Admin({
        admin_id: token,
        email: req.body.email,
        name: req.body.name,
        pass: req.body.password,
    });

    await new_admin.save((error, success) => {
        if (error) console.log(error);
        else console.log("Saved::New Admin::credentials.");
    });

    res.status(200).send({ msg: "Credentials Added" });
};

const adminAuth = async (req, res) => {
    const Email = req.body.email;
    const Pass = req.body.password;

    Admin.find({ email: Email }, async function (err, docs) {
        if (docs.length === 0) {
            return res.status(400).send({ msg: "Admin access denied" });
        } else if (Pass === docs[0].pass) {
            res.status(200).send({
                msg: "Success",
                admin_token: docs[0].admin_id,
            });
        } else {
            return res.status(400).send({ msg: "Email or Password is wrong" });
        }
    });
};

const { Event } = require('../models/event');

const adminDetails = async (req, res) => {
    const admin_token = req.body.admin_id;

    try {
        // Find admin by token
        const admin = await Admin.findOne({ admin_id: admin_token });
        
        if (!admin) {
            console.log('No admin found with token:', admin_token);
            return res.status(400).send({ msg: "No such admin exists" });
        }
        
        console.log('Admin found:', admin.name, admin.email);
        
        // Get ALL events from the database
        const allEvents = await Event.find({});
        console.log(`Found ${allEvents.length} total events in database`);
        
        // Convert to plain JavaScript objects
        const plainEvents = allEvents.map(event => event.toObject());
        
        // Log the events for debugging
        console.log('Events sample:');
        plainEvents.slice(0, 3).forEach(e => {
            console.log(`- ${e.name} (${e.event_id}), Admin: ${e.admin_id || 'not set'}`);
        });
        
        // Add events to admin response
        const adminResponse = admin.toObject();
        adminResponse.eventCreated = plainEvents;
        
        console.log(`Sending ${adminResponse.eventCreated.length} events to admin dashboard`);
        
        res.status(200).send(adminResponse);
    } catch (error) {
        console.error('Error in adminDetails:', error);
        res.status(500).send({ msg: "Server error", error: error.message });
    }
};

module.exports = {
    setAdmin,
    adminAuth,
    adminDetails,
};
