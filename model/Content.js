const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const contentSchema = new Schema(
    {
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'User',
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
                type: String, // URL gambar/video
            }
        ],
        hashtags: [
            {
                type: String,
            }
        ],
        mentions: [
            {
                type: String, // Username akun yang dimention
            }
        ],
        scheduled_at: {
            type: Date, // Waktu untuk posting otomatis
        },
        posted_at: {
            type: Date, // Waktu posting berhasil
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
                // account_id: {
                //     // type: Schema.Types.ObjectId,
                //     // ref: 'SocialAccount', // Referensi ke akun media sosial user yang sudah dihubungkan
                //     required: true,
                // },
                post_url: {
                    type: String, // URL postingan jika berhasil
                },
                post_id: {
                    type: String, // ID postingan dari platform media sosial
                },
                status: {
                    type: String,
                    enum: ['pending', 'posting', 'success', 'failed'],
                    default: 'pending',
                },
                error_message: {
                    type: String, // Jika gagal posting, simpan pesan error dari API
                },
            }
        ],
    },
    { timestamps: true },
);

module.exports = model('Content', contentSchema);
