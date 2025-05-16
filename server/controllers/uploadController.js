const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqyaazjxq',
    api_key: process.env.CLOUDINARY_API_KEY || '271831761788339',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'vbdDZyBGBuXkV9QiH2FmJCSBkBo'
});

console.log('Using Cloudinary for image storage with credentials:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqyaazjxq'
});

// Configure multer for disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const fileExt = path.extname(file.originalname);
        const fileName = `${uuidv4()}${fileExt}`;
        cb(null, fileName);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Configure upload middleware for single image
const uploadSingle = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).single('image');

// Configure upload middleware for multiple images
const uploadMultiple = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
}).array('images', 10); // Allow up to 10 images

// Upload file to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'eventron') => {
    try {
        console.log(`Uploading to Cloudinary: ${filePath}`);
        const result = await cloudinary.uploader.upload(filePath, {
            folder: folder,
            resource_type: 'auto'
        });
        
        console.log(`Cloudinary upload successful: ${result.secure_url}`);
        
        // Delete the temporary file after successful upload
        try {
            fs.unlinkSync(filePath);
            console.log(`Deleted temporary file: ${filePath}`);
        } catch (unlinkError) {
            console.error(`Error deleting temporary file: ${filePath}`, unlinkError);
            // Continue even if file deletion fails
        }
        
        return result;
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw error;
    }
};

// Handle single file upload
const uploadSingleImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }
        
        console.log('File received:', req.file);
        
        // Upload to Cloudinary
        const filePath = req.file.path;
        const result = await uploadToCloudinary(filePath);
        
        console.log('Cloudinary upload result:', result);
        
        res.status(200).json({
            msg: 'File uploaded successfully to Cloudinary',
            file: {
                filename: result.public_id,
                url: result.url,
                secure_url: result.secure_url,
                public_id: result.public_id
            }
        });
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        res.status(500).json({ 
            msg: 'Server error during file upload', 
            error: error.message 
        });
    }
};

// Handle multiple file uploads
const uploadMultipleImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: 'No files uploaded' });
        }
        
        console.log(`Received ${req.files.length} files`);
        
        // Upload each file to Cloudinary
        const uploadPromises = req.files.map(file => uploadToCloudinary(file.path));
        const results = await Promise.all(uploadPromises);
        
        console.log(`Successfully uploaded ${results.length} files to Cloudinary`);
        
        // Format response
        const files = results.map(result => ({
            filename: result.public_id,
            url: result.url,
            secure_url: result.secure_url,
            public_id: result.public_id
        }));
        
        res.status(200).json({
            msg: 'Files uploaded successfully to Cloudinary',
            files: files
        });
    } catch (error) {
        console.error('Error uploading files to Cloudinary:', error);
        res.status(500).json({ 
            msg: 'Server error during files upload', 
            error: error.message 
        });
    }
};

// Handle single image upload route
const handleSingleImageUpload = (req, res) => {
    uploadSingle(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                msg: 'Error uploading file', 
                error: err.message 
            });
        }
        
        // Process the upload
        await uploadSingleImage(req, res);
    });
};

// Handle multiple images upload route
const handleMultipleImageUpload = (req, res) => {
    uploadMultiple(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(400).json({ 
                msg: 'Error uploading files', 
                error: err.message 
            });
        }
        
        // Process the uploads
        await uploadMultipleImages(req, res);
    });
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    handleSingleImageUpload,
    handleMultipleImageUpload,
    uploadToCloudinary
};
