const Payer = require("../models/payerModel");
const Payment = require("../models/paymentModel");
const { responseReturn } = require("../utils/response");

class payerController {
  // ✅ Add a new payer
  updatePayer = async (req, res) => {
    try {
      const userId = req.id;
      const { name, contact, id } = req.body;
      console.log(req.body);
      //   const userId = req.user._id; // assuming user is authenticated and attached to req

      const existingUser = await Payer.findByIdAndUpdate(id, {
        name: name,
        contact: contact,
      });

      if (!existingUser) {
        return responseReturn(res, 400, {
          error: "Payer Doest Not Exist",
        });
      }
      const payerInfo = await Payer.findById(id);
      return responseReturn(res, 201, {
        message: "Payer Info Updated Successfully",
        payer: payerInfo,
      });
      // res
      //   .status(201)
      //   .json({ message: "Payer added successfully", payer: newPayer });
    } catch (error) {
      console.error("Error adding payer:", error);
      res.status(500).json({ error: "Failed to add payer" });
    }
  };
  addPayer = async (req, res) => {
    try {
      const userId = req.id;
      const { name, contact } = req.body;
      console.log(req.body);
      //   const userId = req.user._id; // assuming user is authenticated and attached to req

      const existingUserName = await Payer.findOne({ name });
      const existingUserContact = await Payer.findOne({ contact });

      if (existingUserName) {
        return responseReturn(res, 400, {
          error: "Payer Name Already Exist",
        });
      }
      if (existingUserContact) {
        return responseReturn(res, 400, {
          error: "Payer Contact Already Exist",
        });
      }

      const newPayer = new Payer({
        name,
        contact,
        user: userId,
      });

      await newPayer.save();
      return responseReturn(res, 201, {
        message: "Payer Added Successfully",
        payer: newPayer,
      });
      // res
      //   .status(201)
      //   .json({ message: "Payer added successfully", payer: newPayer });
    } catch (error) {
      console.error("Error adding payer:", error);
      res.status(500).json({ error: "Failed to add payer" });
    }
  };
  getPayers = async (req, res) => {
    try {
      const userId = req.id;
      const { selectedDate } = req.params;

      if (!selectedDate) {
        return res.status(400).json({ error: "selectedDate is required" });
      }

      const date = new Date(selectedDate);
      if (isNaN(date)) {
        return res.status(400).json({ error: "Invalid selectedDate format" });
      }

      // Day range
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));

      // Month range
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      ).getDate();

      const payers = await Payer.find({ user: userId }).sort({ createdAt: -1 });

      const payersWithDetails = await Promise.all(
        payers.map(async (payer) => {
          // Payment for selected day
          const payment = await Payment.findOne({
            payer: payer._id,
            paidAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          });

          // Monthly payment count
          const monthlyPayments = await Payment.find({
            payer: payer._id,
            paidAt: {
              $gte: startOfMonth,
              $lte: endOfMonth,
            },
          });

          const totalAmount = monthlyPayments.reduce(
            (sum, p) => sum + p.amount,
            0
          );

          return {
            _id: payer._id,
            name: payer.name,
            contact: payer.contact,
            createdAt: payer.createdAt,
            paymentMade: !!payment,
            paymentDetails: payment || null,
            monthlyProgress: `${monthlyPayments.length}/${daysInMonth}`,
            totalMonthlyAmount: totalAmount,
          };
        })
      );

      responseReturn(res, 200, {
        payers: payersWithDetails,
        message: "Payers with payment status and monthly total",
      });
    } catch (error) {
      console.error("Error fetching payers:", error);
      res.status(500).json({ error: "Failed to fetch payers" });
    }
  };

removePayer = async (req, res) => {
  try {
    const userId = req.id; // from auth middleware
    const { payerId } = req.params;

    if (!payerId) {
      return responseReturn(res, 400, { error: "Payer ID is required" });
    }

    // Delete payer and return it
    const payer = await Payer.findOneAndDelete({ _id: payerId, user: userId });
    if (!payer) {
      return responseReturn(res, 404, {
        error: "Payer not found or unauthorized",
      });
    }

    // Delete all payments linked to this payer
    await Payment.deleteMany({ payer: payerId });

    // Use current date
    const date = new Date();

    // Date ranges
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    // Fetch all remaining payers
    const payers = await Payer.find({ user: userId }).sort({ createdAt: -1 });
    const payerIds = payers.map((p) => p._id);

    // Fetch all payments for remaining payers in the month
    const payments = await Payment.find({
      payer: { $in: payerIds },
      paidAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    // Build details
    const payersWithDetails = payers.map((payer) => {
      const payerPayments = payments.filter(
        (p) => p.payer.toString() === payer._id.toString()
      );

      const paymentToday = payerPayments.find(
        (p) => p.paidAt >= startOfDay && p.paidAt <= endOfDay
      );

      const totalAmount = payerPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0
      );

      return {
        _id: payer._id,
        name: payer.name,
        contact: payer.contact,
        createdAt: payer.createdAt,
        paymentMade: !!paymentToday,
        paymentDetails: paymentToday || null,
        monthlyProgress: `${payerPayments.length}/${daysInMonth}`,
        totalMonthlyAmount: totalAmount,
      };
    });

    return responseReturn(res, 200, {
      message: "Payer and related payments deleted successfully",
      payers: payersWithDetails,
    });
  } catch (error) {
    console.error("Error deleting payer:", error);
    res.status(500).json({ error: "Failed to delete payer" });
  }
};


  //   getPayers = async (req, res) => {
  //     try {
  //     //   const userId = req.query.userId; // from auth middleware
  //       const userId = req.id; // from auth middleware
  //       console.log("ASdasd")
  //       console.log(userId)

  //       const payers = await Payer.find({ user: userId }).sort({ createdAt: -1 });

  //       responseReturn(res, 200, {payers,message : "asdasd"})
  //     //   res.status(200).json({ payers });
  //     } catch (error) {
  //       console.error("Error fetching payers:", error);
  //       res.status(500).json({ error: "Failed to fetch payers" });
  //     }
  //   };
}

module.exports = new payerController();
