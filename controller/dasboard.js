const express = require("express");
const router = express.Router();
const UserAccounting = require("../model/user");
const Content = require("../model/Content");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Get summary dashboard
router.get(
  "/summary",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const totalUsers = await UserAccounting.countDocuments();
      const totalContent = await Content.countDocuments();

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const totalContentThisMonth = await Content.countDocuments({ createdAt: { $gte: startOfMonth } });

      res.status(200).json({
        code: 200,
        success: true,
        data: {
          totalUsers,
          totalContentThisMonth,
          totalContent,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// Get total users and content per month
router.get(
  "/content-per-month",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const currentYear = new Date().getFullYear();

      // Hitung total content per bulan
      const contentStats = await Content.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            totalContent: { $sum: 1 },
          },
        },
      ]);

      // Hitung total user per bulan
      const userStats = await UserAccounting.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(currentYear, 0, 1),
              $lt: new Date(currentYear + 1, 0, 1),
            },
          },
        },
        {
          $group: {
            _id: { month: { $month: "$createdAt" } },
            totalUsers: { $sum: 1 },
          },
        },
      ]);

      // Initialize array for 12 months
      const monthlyStats = Array.from({ length: 12 }, (_, index) => ({
        year: currentYear,
        month: index + 1,
        totalContent: 0,
        totalUsers: 0,
      }));

      // Populate the array with content data
      contentStats.forEach((stat) => {
        monthlyStats[stat._id.month - 1].totalContent = stat.totalContent;
      });

      // Populate the array with user data
      userStats.forEach((stat) => {
        monthlyStats[stat._id.month - 1].totalUsers = stat.totalUsers;
      });

      const totalUsers = await UserAccounting.countDocuments();

      res.status(200).json({
        code: 200,
        success: true,
        data: {
          totalUsers,
          monthlyStats,
        },
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
