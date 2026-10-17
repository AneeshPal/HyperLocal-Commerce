
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Typography,
} from "@mui/material";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function getToken() {
  return localStorage.getItem("token");
}

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed (${response.status}).`
    );
  }

  return data;
}

// Load Razorpay Checkout only when the buyer starts checkout.
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Could not load Razorpay Checkout.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () =>
      reject(new Error("Could not load Razorpay Checkout."));

    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { id: listingId } = useParams();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchListing() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE_URL}/api/listings/${listingId}`
        );

        const data = await readResponse(response);

        if (!cancelled) {
          setListing(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load listing.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (!listingId) {
      setError("Listing ID is missing.");
      setLoading(false);
    } else {
      fetchListing();
    }

    return () => {
      cancelled = true;
    };
  }, [listingId]);

  async function handlePayment() {
    if (paying) return;

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    if (!listing) {
      setError("Listing details are not available.");
      return;
    }

    try {
      setPaying(true);

      // 1. Load the Razorpay Checkout script.
      await loadRazorpayScript();

      // 2. Create a transaction on our backend.
      const transactionResponse = await fetch(
        `${API_BASE_URL}/api/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ listingId }),
        }
      );

      const transactionData = await readResponse(
        transactionResponse
      );

      const transaction = transactionData.transaction;

      if (!transaction?.id) {
        throw new Error(
          "The server did not return a transaction ID."
        );
      }

      // 3. Create or retrieve the Razorpay order.
      const orderResponse = await fetch(
        `${API_BASE_URL}/api/payments/${transaction.id}/order`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const orderData = await readResponse(orderResponse);
      const order = orderData.order;
      const keyId = orderData.keyId;

      if (
        !keyId ||
        !order?.orderId ||
        !Number.isSafeInteger(order.amountPaise) ||
        !order.currency
      ) {
        throw new Error(
          "The server returned incomplete payment-order details."
        );
      }

      // 4. Open Razorpay Checkout.
      const options = {
        key: keyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Aas-Paas",
        description: listing.title
          ? `Purchase: ${listing.title}`
          : "Marketplace purchase",
        order_id: order.orderId,

        handler: async function (paymentResponse) {
          try {
            setError("");
            setSuccess("");

            // 5. Ask our backend to verify the payment.
            const verifyResponse = await fetch(
              `${API_BASE_URL}/api/payments/${transaction.id}/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,
                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,
                  razorpay_signature:
                    paymentResponse.razorpay_signature,
                }),
              }
            );

            const verificationData = await readResponse(
              verifyResponse
            );

            if (
              verificationData.paymentStatus !== "paid"
            ) {
              throw new Error(
                "Payment has not been confirmed by the server."
              );
            }

            setSuccess(
              "Payment verified successfully!"
            );
          } catch (err) {
            setError(
              err.message ||
                "We could not confirm your payment. Check your transaction status before trying again."
            );
          } finally {
            setPaying(false);
          }
        },

        modal: {
          ondismiss: function () {
            setPaying(false);
          },
        },

        theme: {
          color: "#1976d2",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (response) {
        setError(
          response.error?.description ||
            "Payment failed. Please check the transaction status before retrying."
        );
        setPaying(false);
      });

      checkout.open();
    } catch (err) {
      setError(err.message || "Could not start checkout.");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: "center" }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>
          Loading checkout...
        </Typography>
      </Container>
    );
  }

  if (error && !listing) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>
          Go back
        </Button>
      </Container>
    );
  }

  if (!listing) return null;

  return (
    <Container maxWidth="sm" sx={{ py: 5 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Checkout
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Review your order before proceeding to payment.
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" fontWeight={600}>
          {listing.title || "Marketplace listing"}
        </Typography>

        {listing.description && (
          <Typography
            color="text.secondary"
            sx={{ mt: 1, mb: 2 }}
          >
            {listing.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            mb: 2,
          }}
        >
          <Typography>Listing price</Typography>
          <Typography fontWeight={700}>
            {new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 2,
            }).format(Number(listing.price))}
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          The final payable amount is determined by the transaction
          stored on the server.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={handlePayment}
          disabled={paying || Boolean(success)}
        >
          {paying ? (
            <>
              <CircularProgress
                size={20}
                color="inherit"
                sx={{ mr: 1 }}
              />
              Processing...
            </>
          ) : success ? (
            "Payment verified"
          ) : (
            "Proceed to payment"
          )}
        </Button>

        <Button
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => navigate(`/listing/${listingId}`)}
          disabled={paying}
        >
          Back to listing
        </Button>
      </Paper>
    </Container>
  );
}
