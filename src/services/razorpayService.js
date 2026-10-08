import api from "./api";

const razorpayService = {
  // POST /api/razorpay/create-order
  createOrder: (orderId) => api.post("/razorpay/create-order", { orderId }),

  // POST /api/razorpay/verify-payment
  verifyPayment: (payload) => api.post("/razorpay/verify-payment", payload),
};

export default razorpayService;
