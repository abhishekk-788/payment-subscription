const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const executePaymentStripe = async (
  paymentMethodId,
  amount,
  customerId,
  currency = "inr"
) => {
  const amountInSmallestUnit = amount * 100;
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency,
      customer: customerId, // Specify the customer ID
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never", // Prevent redirects
      },
    });

    return {
      status: "success",
      paymentIntent: paymentIntent,
    };
  } catch (error) {
    console.error("Payment processing failed:", error.message);
    return {
      status: "failed",
      error: error.message,
    };
  }
};

async function executePaymentStripeMock(paymentMethodId, amount, customerId) {
  // Mock response data
  const mockResponses = {
    success: {
      status: "success",
      paymentIntent: {
        id: "pi_3PqQcCSHpa4aOdjU0j8YvcZA",
        object: "payment_intent",
        amount: amount * 100, // Amount is in the smallest currency unit
        amount_capturable: 0,
        amount_details: { tip: {} },
        amount_received: amount * 100,
        application: null,
        application_fee_amount: null,
        automatic_payment_methods: { allow_redirects: "never", enabled: true },
        canceled_at: null,
        cancellation_reason: null,
        capture_method: "automatic_async",
        client_secret:
          "pi_3PqQcCSHpa4aOdjU0j8YvcZA_secret_miXLv8L8TuiSVmmHU9fBFdexn",
        confirmation_method: "automatic",
        created: Date.now(),
        currency: "inr",
        customer: customerId,
        description: `Payment for ${amount} INR`,
        invoice: null,
        last_payment_error: null,
        latest_charge: "ch_1PqP3fSHpa4aOdjUJrN2dpl6",
        livemode: false,
        metadata: {},
        next_action: null,
        on_behalf_of: null,
        payment_method: paymentMethodId,
        payment_method_configuration_details: null,
        payment_method_options: { card: {} },
        payment_method_types: ["card"],
        processing: null,
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: "Payment",
        statement_descriptor_suffix: null,
        status: "succeeded",
        transfer_data: null,
        transfer_group: null,
      },
    },
    requires_action: {
      status: "requires_action",
      paymentIntent: {
        id: "pi_3PqQcCSHpa4aOdjU0j8YvcZA",
        object: "payment_intent",
        amount: amount * 100,
        amount_capturable: 0,
        amount_details: { tip: {} },
        amount_received: 0,
        automatic_payment_methods: { allow_redirects: "never", enabled: true },
        canceled_at: null,
        cancellation_reason: null,
        capture_method: "automatic_async",
        client_secret:
          "pi_3PqQcCSHpa4aOdjU0j8YvcZA_secret_miXLv8L8TuiSVmmHU9fBFdexn",
        confirmation_method: "automatic",
        created: Date.now(),
        currency: "inr",
        customer: customerId,
        next_action: {
          type: "use_stripe_sdk",
          use_stripe_sdk: {
            type: "three_d_secure_redirect",
            stripe_js: "https://js.stripe.com/v3/",
          },
        },
        payment_method: paymentMethodId,
        payment_method_types: ["card"],
        status: "requires_action",
      },
    },
    failed: {
      status: "failed",
      error: "Payment failed due to insufficient funds",
    },
  };

  // Simulate different scenarios
  if (amount < 1000) {
    return mockResponses.success;
  } else if (amount >= 1000 && amount < 5000) {
    return mockResponses.requires_action;
  } else {
    return mockResponses.failed;
  }
}

module.exports = { executePaymentStripe, executePaymentStripeMock };
