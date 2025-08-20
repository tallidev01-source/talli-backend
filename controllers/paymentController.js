const Payment = require("../models/paymentModel");
const Payer = require("../models/payerModel");
const { responseReturn } = require("../utils/response");
const mongoose = require("mongoose");
class paymentController {
  // Helper: format date -> "Feb 03 2025"
 formatDateToReadable(date) {
  const d = new Date(date);
  const options = { month: "short", day: "2-digit",  year: "2-digit" };
  return d.toLocaleDateString("en-US", options).replace(", ", ", "); // remove comma
}


  addPayment = async (req, res) => {
    try {
      const userId = req.id;
      const { payerId, amount, description, paidAt, paymentMethod } = req.body;

      const payed = await Payment.findOne({
        payer : payerId,
        paidAt: paidAt,
      });

      const formattedDate = this.formatDateToReadable(paidAt);


      if (payed) {
        console.log(payed)
        return responseReturn(res, 404, {
          error: `Payment for ${formattedDate} Already Exist`,
        });
      }

      const payer = await Payer.findOne({ _id: payerId, user: userId });
      if (!payer) {
        console.log("01");
        return responseReturn(res, 404, {
          error: "Payer not found or unauthorized.",
        });
      }

      const paidDate = new Date(paidAt);
      if (isNaN(paidDate)) {
        console.log("asd");
        return responseReturn(res, 400, {
          error: "Invalid date format.",
        });
        // return res.status(400).json({ error: "Invalid date format." });
      }

      // Validate payment method
      const allowedMethods = [
        "cash",
        "gcash",
        "paymaya",
        "bank transfer",
        "other",
      ];
      if (paymentMethod && !allowedMethods.includes(paymentMethod)) {
        console.log("asd");
        return responseReturn(res, 400, {
          error: "Invalid payment method.",
        });
        // return res.status(400).json({ error: "Invalid payment method." });
      }

      const payment = new Payment({
        payer: payerId,
        amount,
        description,
        paidAt: paidDate,
        paymentMethod: paymentMethod || "cash",
      });

      await payment.save();
      return responseReturn(res, 201, {
        message: "Payment added successfully",
        payment,
      });
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({ error: "Failed to add payment" });
    }
  };
  // Utility to get all dates in a given month/year (month is 1-based)
  getAllDatesInMonth(year, month) {
    const dates = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(new Date(year, month - 1, day));
    }
    return dates;
  }

getPaymentStatusByMonth = async (req, res) => {
  try {
    const { payerId, year, month } = req.query;

    const yearNum = Number(year);
    const monthNum = Number(month);

    // Validation
    if (
      !payerId ||
      isNaN(yearNum) ||
      isNaN(monthNum) ||
      monthNum < 1 ||
      monthNum > 12
    ) {
      return res.status(400).json({
        message: "Valid payerId, year, and month are required",
      });
    }

    const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0);
    const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

    // Payments for selected month
    const payments = await Payment.find({
      payer: payerId,
      paidAt: { $gte: startDate, $lte: endDate },
    }).lean();

    const formatDate = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

    // Map payments by date for quick lookup
    const paymentsByDate = {};
    payments.forEach((p) => {
      const dateStr = formatDate(p.paidAt);
      paymentsByDate[dateStr] = {
        paymentId: p._id,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
      };
    });

    // All dates in the month
    const getAllDatesInMonth = (year, month) => {
      const dates = [];
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        dates.push(new Date(year, month - 1, day));
      }
      return dates;
    };

    const allDates = getAllDatesInMonth(yearNum, monthNum).map((date) => {
      const dateStr = formatDate(date);
      const payment = paymentsByDate[dateStr];
      return {
        date: dateStr,
        paid: !!payment,
        amount: payment ? payment.amount : 0,
        paymentId: payment ? payment.paymentId : null,
        paymentMethod: payment ? payment.paymentMethod : null,
      };
    });

    // Aggregate monthly totals for the given year
    const monthlyTotalsRaw = await Payment.aggregate([
      {
        $match: {
          payer: new mongoose.Types.ObjectId(payerId),
          paidAt: {
            $gte: new Date(yearNum, 0, 1),
            $lte: new Date(yearNum, 11, 31, 23, 59, 59),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$paidAt" } },
          totalAmount: { $sum: "$amount" },
          paidDays: {
            $addToSet: {
              $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          totalAmount: 1,
          totalMonthsPaid: { $size: "$paidDays" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Build chartData with totalMonthsPaid
    const chartData = monthNames.map((name, index) => {
      const found = monthlyTotalsRaw.find((m) => m._id.month === index + 1);
      return {
        month: name,
        totalAmount: found ? found.totalAmount : 0,
        totalMonthsPaid: found ? `${found.totalMonthsPaid}` : ` `,
      };
    });

    const payer = await Payer.findById(payerId);

    return responseReturn(res, 201, {
      message: "Payer Info Retrieved Successfully",
      payer: payer,
      totalPayments: payments.length,
      totalPaidDays: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      allDates,
      chartData,
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    res.status(500).json({ message: "Server error" });
  }
};


  // getPaymentStatusByMonth = async (req, res) => {
  //   try {
  //     const { payerId, year, month } = req.query;

  //     const yearNum = Number(year);
  //     const monthNum = Number(month);

  //     // Validation
  //     if (
  //       !payerId ||
  //       isNaN(yearNum) ||
  //       isNaN(monthNum) ||
  //       monthNum < 1 ||
  //       monthNum > 12
  //     ) {
  //       return res.status(400).json({
  //         message: "Valid payerId, year, and month are required",
  //       });
  //     }

  //     const startDate = new Date(yearNum, monthNum - 1, 1, 0, 0, 0);
  //     const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

  //     // Payments for selected month
  //     const payments = await Payment.find({
  //       payer: payerId,
  //       paidAt: { $gte: startDate, $lte: endDate },
  //     }).lean();

  //     const formatDate = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD

  //     // Daily totals for the month
  //     const dailyAmounts = {};
  //     payments.forEach((p) => {
  //       const dateStr = formatDate(p.paidAt);
  //       dailyAmounts[dateStr] = (dailyAmounts[dateStr] || 0) + p.amount;
  //     });

  //     // All dates in the month
  //     const getAllDatesInMonth = (year, month) => {
  //       const dates = [];
  //       const daysInMonth = new Date(year, month, 0).getDate();
  //       for (let day = 1; day <= daysInMonth; day++) {
  //         dates.push(new Date(year, month - 1, day));
  //       }
  //       return dates;
  //     };

  //     const allDates = getAllDatesInMonth(yearNum, monthNum).map((date) => {
  //       const dateStr = formatDate(date);
  //       return {
  //         date: dateStr,
  //         paid: !!dailyAmounts[dateStr],
  //         amount: dailyAmounts[dateStr] || 0,
  //       };
  //     });

  //     // Aggregate monthly totals for the given year
  //     const monthlyTotalsRaw = await Payment.aggregate([
  //       {
  //         $match: {
  //           payer: new mongoose.Types.ObjectId(payerId),
  //           paidAt: {
  //             $gte: new Date(yearNum, 0, 1),
  //             $lte: new Date(yearNum, 11, 31, 23, 59, 59),
  //           },
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: { month: { $month: "$paidAt" } },
  //           totalAmount: { $sum: "$amount" },
  //           paidDays: {
  //             $addToSet: {
  //               $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
  //             },
  //           },
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: 1,
  //           totalAmount: 1,
  //           totalMonthsPaid: { $size: "$paidDays" },
  //         },
  //       },
  //       { $sort: { "_id.month": 1 } },
  //     ]);

  //     const monthNames = [
  //       "January",
  //       "February",
  //       "March",
  //       "April",
  //       "May",
  //       "June",
  //       "July",
  //       "August",
  //       "September",
  //       "October",
  //       "November",
  //       "December",
  //     ];

  //     // Build chartData with totalMonthsPaid in "x/12" format
  //     const chartData = monthNames.map((name, index) => {
  //       const found = monthlyTotalsRaw.find((m) => m._id.month === index + 1);
  //       return {
  //         month: name,
  //         totalAmount: found ? found.totalAmount : 0,
  //         totalMonthsPaid: found ? `${found.totalMonthsPaid}` : ` `,
  //       };
  //     });

  //     const payer = await Payer.findById(payerId);

  //     return responseReturn(res, 201, {
  //       message: "Payer Info Retrieved Successfully",
  //       payer: payer,
  //       totalPayments: payments.length,
  //       totalPaidDays: Object.keys(dailyAmounts).length,
  //       totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
  //       allDates,
  //       chartData,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching payment status:", error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // };
}
module.exports = new paymentController();
