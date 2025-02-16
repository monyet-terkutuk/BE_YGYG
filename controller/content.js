const express = require('express');
const router = express.Router();
const Content = require('../model/Content');
const { isAuthenticated } = require('../middleware/auth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Validator = require('fastest-validator');
const v = new Validator();

// Schema validasi untuk Content
const contentSchema = {
    title: { type: 'string', empty: false },
    content: { type: 'string', empty: false },
    media: { type: 'array', items: 'string', optional: true },
    hashtags: { type: 'array', items: 'string', optional: true },
    mentions: { type: 'array', items: 'string', optional: true },
    scheduled_at: { type: 'string', optional: true },
    // social_accounts: {
    //     type: 'array',
    //     items: {
    //         type: 'object',
    //         props: {
    //             platform: { type: 'enum', values: ['facebook', 'twitter', 'instagram', 'tiktok', 'linkedin'], empty: false },
    //             account_id: { type: 'string', empty: false },
    //         },
    //     },
    //     optional: true,
    // },
};

// Create Content
router.post(
    '/',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { body } = req;

        // Validasi input data
        const validationResponse = v.validate(body, contentSchema);
        if (validationResponse !== true) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                data: {
                    error: 'Validation failed',
                    details: validationResponse,
                },
            });
        }

        // Tambahkan user_id dari pengguna yang terautentikasi
        body.user_id = req.user._id;

        // Buat konten baru
        const content = await Content.create(body);

        res.status(201).json({
            code: 201,
            status: 'success',
            data: content,
        });
    })
);

router.get(
    '/',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const contents = await Content.find({ user_id: req.user._id })
            .populate('user_id', 'username email') // Mengambil username & email dari UserAccounting
            .sort({ createdAt: -1 });

        res.status(200).json({
            code: 200,
            status: 'success',
            data: contents,
        });
    })
);

// Get Content by ID (Menampilkan Nama User)
router.get(
    '/:id',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const content = await Content.findOne({ _id: req.params.id, user_id: req.user._id })
            .populate('user_id', 'name email');

        if (!content) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                message: 'Content not found',
            });
        }

        res.status(200).json({
            code: 200,
            status: 'success',
            data: content,
        });
    })
);


// Update Content
router.put(
    '/:id',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const { body } = req;

        // Validasi input data
        const validationResponse = v.validate(body, contentSchema);
        if (validationResponse !== true) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                data: {
                    error: 'Validation failed',
                    details: validationResponse,
                },
            });
        }

        // Cari dan perbarui konten
        const content = await Content.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user._id },
            body,
            { new: true, runValidators: true }
        );

        if (!content) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                message: 'Content not found',
            });
        }

        res.status(200).json({
            code: 200,
            status: 'success',
            data: content,
        });
    })
);

// Delete Content
router.delete(
    '/:id',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const content = await Content.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
        if (!content) {
            return res.status(404).json({
                code: 404,
                status: 'error',
                message: 'Content not found',
            });
        }
        res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Content deleted successfully',
        });
    })
);

module.exports = router;
