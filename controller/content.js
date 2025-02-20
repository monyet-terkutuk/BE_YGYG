const express = require('express');
const router = express.Router();
const Content = require('../model/Content');
const { isAuthenticated } = require('../middleware/auth');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const Validator = require('fastest-validator');
const v = new Validator();
const excelJS = require('exceljs');

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

        // Konversi scheduled_at ke format Date sebelum menyimpan
        if (body.scheduled_at) {
            const [month, day, year] = body.scheduled_at.split('/');
            body.scheduled_at = new Date(`${year}-${month}-${day}T00:00:00Z`); // Format ISO
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
        try {
            let { start_date, end_date } = req.query;
            let filter = { user_id: req.user._id };

            console.log("User ID:", req.user._id); // Debugging user ID
            console.log("Raw Query Params:", req.query); // Debugging raw input

            if (start_date && end_date) {
                // Pastikan format tanggal valid sebelum memprosesnya
                const startDateObj = new Date(start_date);
                const endDateObj = new Date(end_date);

                if (!isNaN(startDateObj) && !isNaN(endDateObj)) {
                    filter.createdAt = {
                        $gte: startDateObj,
                        $lte: endDateObj,
                    };
                } else {
                    console.log("Invalid Date Format:", start_date, end_date);
                }
            }

            console.log("Final Filter:", filter); // Debugging filter sebelum query

            const contents = await Content.find(filter)
                .populate('user_id', 'username email')
                .sort({ createdAt: -1 });

            console.log("Query Result Count:", contents.length); // Debugging jumlah hasil

            res.status(200).json({
                code: 200,
                status: 'success',
                data: contents,
            });
        } catch (error) {
            console.error("Error fetching contents:", error);
            res.status(500).json({ code: 500, status: 'error', message: error.message });
        }
    })
);



// Export content to Excel
router.get(
    '/export-excel',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        let { start_date, end_date } = req.query;
        let filter = { user_id: req.user._id };

        if (start_date && end_date) {
            filter.createdAt = {
                $gte: new Date(start_date),
                $lte: new Date(end_date),
            };
        }

        const contents = await Content.find(filter)
            .populate('user_id', 'username email')
            .sort({ createdAt: -1 });

        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet('Content Data');

        // Header
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Title', key: 'title', width: 25 },
            { header: 'Content', key: 'content', width: 50 },
            { header: 'Media', key: 'media', width: 50 },
            { header: 'Hashtags', key: 'hashtags', width: 30 },
            { header: 'Mentions', key: 'mentions', width: 30 },
            { header: 'Scheduled At', key: 'scheduled_at', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Platform', key: 'platform', width: 15 },
            { header: 'Post URL', key: 'post_url', width: 40 },
            { header: 'Social Status', key: 'social_status', width: 15 },
            { header: 'Created At', key: 'createdAt', width: 20 },
        ];

        // Data
        let rowIndex = 1;
        contents.forEach((content) => {
            content.social_accounts.forEach((account) => {
                worksheet.addRow({
                    no: rowIndex++,
                    username: content.user_id.username,
                    email: content.user_id.email,
                    title: content.title,
                    content: content.content,
                    media: content.media.join(', '),
                    hashtags: content.hashtags.join(', '),
                    mentions: content.mentions.join(', '),
                    scheduled_at: content.scheduled_at,
                    status: content.status,
                    platform: account.platform,
                    post_url: account.post_url || '-',
                    social_status: account.status,
                    createdAt: content.createdAt.toISOString(),
                });
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=ContentData.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();
    })
);


// Get Content by ID (Menampilkan Nama User)
router.get(
    '/:id',
    isAuthenticated,
    catchAsyncErrors(async (req, res, next) => {
        const content = await Content.findOne({ _id: req.params.id, user_id: req.user._id })
            .populate('user_id', 'username email');

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

        // Konversi scheduled_at ke format Date sebelum menyimpan
        if (body.scheduled_at) {
            const [month, day, year] = body.scheduled_at.split('/');
            body.scheduled_at = new Date(`${year}-${month}-${day}T00:00:00Z`); // Format ISO
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
