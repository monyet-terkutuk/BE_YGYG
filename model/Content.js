const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const contentSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'UserAccounting', // Ubah dari 'User' ke 'UserAccounting'
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        media: [
            {
                type: String,
            }
        ],
        hashtags: [
            {
                type: String,
            }
        ],
        mentions: [
            {
                type: String,
            }
        ],
        scheduled_at: {
            type: Date,
        },
        posted_at: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'scheduled', 'posting', 'success', 'failed'],
            default: 'pending',
        },
        social_accounts: [
            {
                platform: {
                    type: String,
                    enum: ['facebook', 'twitter', 'instagram', 'tiktok', 'linkedin'],
                    required: true,
                },
                post_url: {
                    type: String,
                },
                post_id: {
                    type: String,
                },
                status: {
                    type: String,
                    enum: ['pending', 'posting', 'success', 'failed'],
                    default: 'pending',
                },
                error_message: {
                    type: String,
                },
            }
        ],
    },
    { timestamps: true },
);

contentSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
    },
});

module.exports = model('Content', contentSchema);
