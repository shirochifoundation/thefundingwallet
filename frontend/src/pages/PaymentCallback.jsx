import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Home, 
  ArrowRight,
  Share2,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);

  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      verifyPayment();
    } else {
      setStatus("error");
    }
  }, [orderId]);

  const verifyPayment = async () => {
    try {
      const response = await axios.get(`${API}/payments/verify/${orderId}`);
      setPaymentData(response.data);
      
      if (response.data.status === "success") {
        setStatus("success");
      } else if (response.data.status === "pending") {
        setStatus("pending");
        // Retry after a few seconds
        setTimeout(verifyPayment, 3000);
      } else {
        setStatus("failed");
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setStatus("error");
    }
  };

  const copyShareLink = () => {
    if (paymentData?.collection_id) {
      const link = `${window.location.origin}/collection/${paymentData.collection_id}`;
      navigator.clipboard.writeText(link);
      toast.success("Link copied to clipboard!");
    }
  };

  const formatAmount = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt);
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 pb-24 md:pb-12">
      <div className="container-main">
        <div className="max-w-md mx-auto text-center">
          {/* Loading State */}
          {status === "loading" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-[#f5f5f7] flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-[#002FA7] animate-spin" />
              </div>
              <h1 
                className="text-2xl font-bold text-[#0a0a0a] mb-3"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                Verifying Payment
              </h1>
              <p className="text-zinc-500">
                Please wait while we confirm your payment...
              </p>
            </div>
          )}

          {/* Pending State */}
          {status === "pending" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-amber-600 animate-spin" />
              </div>
              <h1 
                className="text-2xl font-bold text-[#0a0a0a] mb-3"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                Payment Processing
              </h1>
              <p className="text-zinc-500 mb-6">
                Your payment is being processed. This may take a moment...
              </p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 
                className="text-2xl font-bold text-[#0a0a0a] mb-3"
                style={{ fontFamily: 'Bricolage Grotesque' }}
                data-testid="payment-success-title"
              >
                Thank You!
              </h1>
              <p className="text-zinc-500 mb-2">
                Your donation of
              </p>
              {paymentData?.amount && (
                <p className="text-3xl font-bold text-[#0a0a0a] mb-6 amount-display">
                  {formatAmount(paymentData.amount)}
                </p>
              )}
              <p className="text-zinc-500 mb-8">
                has been successfully processed. Your contribution makes a difference!
              </p>

              <div className="space-y-3">
                {paymentData?.collection_id && (
                  <Link to={`/collection/${paymentData.collection_id}`}>
                    <Button 
                      className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full py-6 font-semibold"
                      data-testid="view-collection-btn"
                    >
                      View Collection
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}

                <Button 
                  variant="outline"
                  className="w-full rounded-full py-6 border-zinc-200"
                  onClick={copyShareLink}
                  data-testid="share-btn"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share with Friends
                </Button>

                <Link to="/">
                  <Button 
                    variant="ghost"
                    className="w-full rounded-full py-6"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Failed State */}
          {status === "failed" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 
                className="text-2xl font-bold text-[#0a0a0a] mb-3"
                style={{ fontFamily: 'Bricolage Grotesque' }}
                data-testid="payment-failed-title"
              >
                Payment Failed
              </h1>
              <p className="text-zinc-500 mb-8">
                Unfortunately, your payment could not be processed. Please try again or use a different payment method.
              </p>

              <div className="space-y-3">
                {paymentData?.collection_id && (
                  <Link to={`/collection/${paymentData.collection_id}`}>
                    <Button 
                      className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full py-6 font-semibold"
                    >
                      Try Again
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                )}

                <Link to="/">
                  <Button 
                    variant="outline"
                    className="w-full rounded-full py-6 border-zinc-200"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-zinc-400" />
              </div>
              <h1 
                className="text-2xl font-bold text-[#0a0a0a] mb-3"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                Something Went Wrong
              </h1>
              <p className="text-zinc-500 mb-8">
                We couldn't verify your payment. If you've been charged, please contact support.
              </p>

              <div className="space-y-3">
                <Link to="/browse">
                  <Button 
                    className="w-full bg-[#002FA7] hover:bg-[#002585] text-white rounded-full py-6 font-semibold"
                  >
                    Browse Collections
                  </Button>
                </Link>

                <Link to="/">
                  <Button 
                    variant="outline"
                    className="w-full rounded-full py-6 border-zinc-200"
                  >
                    <Home className="w-5 h-5 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Order Reference */}
          {orderId && status !== "loading" && (
            <div className="mt-8 p-4 bg-[#f5f5f7] rounded-xl">
              <p className="text-xs text-zinc-500 mb-1">Order Reference</p>
              <p className="text-sm font-mono text-zinc-700">{orderId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
