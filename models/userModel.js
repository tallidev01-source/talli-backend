const { Schema, model } = require("mongoose");

// Define the schema
const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    
    password: {
      type: String,
      required: true,
      select: false,
    },
    status: {
      type: String,
      default: "active", // Possible values: "active", "inactive", "pending"
    },
   
  },
  { timestamps: true }
);

// Add text index for search functionality
userSchema.index({
  firstName: "text",
  lastName: "text",
  middleName: "text",
  email: "text",
  phone: "text",
});

// Export the model
module.exports = model("users" , userSchema);
