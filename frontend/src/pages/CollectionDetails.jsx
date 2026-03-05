import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  Share2,
  Copy,
  Heart,
  Loader2,
  ArrowLeft,
  Globe,
  Lock,
  CheckCircle,
  User,
  MessageSquare,
  IndianRupee,
  Building2,
  Smartphone,
  CreditCard,
  QrCode
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categoryColors = {
  celebration: "bg-amber-100 text-amber-800",
  medical: "bg-red-100 text-red-800",
  festival: "bg-pink-100 text-pink-800",
  society: "bg-blue-100 text-blue-800",
  social: "bg-emerald-100 text-emerald-800",
  office: "bg-indigo-100 text-indigo-800",
  reunion: "bg-yellow-100 text-yellow-800",
  other: "bg-gray-100 text-gray-800",
};

export default function CollectionDetails() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [collection, setCollection] = useState(null);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [donationLoading, setDonationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [virtualAccount, setVirtualAccount] = useState(null);
  const [loadingVA, setLoadingVA] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank"); // "bank" or "card"
  
  // Donation form state - pre-populate with logged in user data
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  // Pre-populate form with user data when user is logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      setDonorName(user.name || "");
      setDonorEmail(user.email || "");
      setDonorPhone(user.phone || "");
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchCollection();
  }, [id]);

  useEffect(() => {
    if (collection && activeTab === "donors") {
      fetchDonations();
    }
  }, [collection, activeTab]);

  const fetchCollection = async () => {
    try {
      const response = await axios.get(`${API}/collections/${id}`);
      setCollection(response.data);
    } catch (error) {
      console.error("Error fetching collection:", error);
      toast.error("Collection not found");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await axios.get(`${API}/collections/${id}/donations`);
      setDonations(response.data);
    } catch (error) {
      console.error("Error fetching donations:", error);
    }
  };

  const fetchVirtualAccount = async () => {
    if (virtualAccount) return; // Already loaded
    setLoadingVA(true);
    try {
      const response = await axios.get(`${API}/collections/${id}/virtual-account`);
      setVirtualAccount(response.data.virtual_account);
    } catch (error) {
      console.error("Error fetching virtual account:", error);
      // Don't show error toast - user can still use card payment
    } finally {
      setLoadingVA(false);
    }
  };

  // Fetch virtual account when donate tab is opened
  useEffect(() => {
    if (activeTab === "donate" && !virtualAccount) {
      fetchVirtualAccount();
    }
  }, [activeTab]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleDonate = async (e) => {
    e.preventDefault();
    
    if (!donorName || !donorEmail || !donorPhone || !amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (parseFloat(amount) < 10) {
      toast.error("Minimum donation amount is ₹10");
      return;
    }

    setDonationLoading(true);
    
    try {
      const response = await axios.post(`${API}/payments/create-order`, {
        collection_id: id,
        donor_name: donorName,
        donor_email: donorEmail,
        donor_phone: donorPhone,
        amount: parseFloat(amount),
        message: message || null,
        anonymous: anonymous
      });

      const { order_id, razorpay_order_id, razorpay_key_id, amount: amountPaise } = response.data;
      
      // Initialize Razorpay checkout
      if (window.Razorpay) {
        const options = {
          key: razorpay_key_id,
          amount: amountPaise,
          currency: "INR",
          name: "FundFlow",
          description: `Donation for: ${collection.title}`,
          order_id: razorpay_order_id,
          handler: async function (razorpayResponse) {
            // Verify payment on server
            try {
              console.log("Razorpay payment response:", razorpayResponse);
              const verifyResponse = await axios.post(`${API}/payments/verify-razorpay`, {
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature
              });
              
              console.log("Verify response:", verifyResponse.data);
              if (verifyResponse.data.status === "success") {
                window.location.href = `/payment/callback?order_id=${order_id}&status=success`;
              } else {
                window.location.href = `/payment/callback?order_id=${order_id}&status=failed`;
              }
            } catch (verifyError) {
              console.error("Payment verification error:", verifyError);
              console.error("Error details:", verifyError.response?.data);
              // Even if verification fails, the payment might be successful
              // Redirect to pending page which will poll for status
              window.location.href = `/payment/callback?order_id=${order_id}&status=pending`;
            }
          },
          prefill: {
            name: donorName,
            email: donorEmail,
            contact: donorPhone
          },
          notes: {
            collection_id: id,
            donor_name: donorName
          },
          theme: {
            color: "#FF5F00"
          },
          modal: {
            ondismiss: function() {
              setDonationLoading(false);
              toast.info("Payment cancelled");
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on('payment.failed', function (response) {
          console.error("Payment failed:", response.error);
          toast.error(response.error?.description || "Payment failed");
          setDonationLoading(false);
          // Don't redirect immediately, let user see the error
        });
        razorpay.open();
      } else {
        // SDK not loaded
        toast.error("Payment gateway not loaded. Please refresh and try again.");
        setDonationLoading(false);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error.response?.data?.detail || "Failed to initiate payment");
      setDonationLoading(false);
    }
  };

  const copyShareLink = () => {
    const link = `${window.location.origin}/collection/${id}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const formatAmount = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-[#FF5F00] animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container-main py-20 text-center">
        <h2 className="text-2xl font-bold text-[#0a0a0a] mb-4">Collection Not Found</h2>
        <p className="text-zinc-500 mb-6">The collection you're looking for doesn't exist or has been removed.</p>
        <Link to="/browse">
          <Button className="bg-[#002FA7] hover:bg-[#002585] text-white rounded-full">
            Browse Collections
          </Button>
        </Link>
      </div>
    );
  }

  const progress = collection.goal_amount 
    ? Math.min((collection.current_amount / collection.goal_amount) * 100, 100)
    : 0;
  const hasGoal = collection.goal_amount && collection.goal_amount > 0;
  const badgeClass = categoryColors[collection.category?.toLowerCase()] || categoryColors.other;

  const suggestedAmounts = [100, 500, 1000, 2000, 5000];

  return (
    <div className="pb-24 md:pb-12">
      {/* Hero Section */}
      <div className="bg-[#f5f5f7]">
        <div className="container-main py-6">
          <Link 
            to="/browse" 
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-[#0a0a0a] transition-colors mb-6"
            data-testid="back-link"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Left - Image & Info */}
            <div className="lg:col-span-3 space-y-6">
              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <img 
                  src={collection.cover_image}
                  alt={collection.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <Badge className={`${badgeClass} rounded-full px-4 py-1.5 text-sm font-semibold`}>
                    {collection.category}
                  </Badge>
                  {collection.visibility === 'private' ? (
                    <Badge className="bg-zinc-800 text-white rounded-full px-3 py-1.5">
                      <Lock className="w-3 h-3 mr-1" /> Private
                    </Badge>
                  ) : (
                    <Badge className="bg-white/90 text-zinc-700 rounded-full px-3 py-1.5">
                      <Globe className="w-3 h-3 mr-1" /> Public
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <h1 
                  className="text-2xl md:text-3xl font-bold text-[#0a0a0a] mb-3"
                  style={{ fontFamily: 'Bricolage Grotesque' }}
                  data-testid="collection-title"
                >
                  {collection.title}
                </h1>
                <p className="text-zinc-600">
                  Organized by <span className="font-medium text-[#0a0a0a]">{collection.organizer_name}</span>
                </p>
              </div>
            </div>

            {/* Right - Progress Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 sticky top-24">
                {/* Amount Raised */}
                <div className="mb-6">
                  <p className="text-sm text-zinc-500 mb-1">Amount Raised</p>
                  <div className="flex items-baseline gap-2">
                    <span 
                      className="text-3xl font-bold text-[#0a0a0a] amount-display"
                      data-testid="amount-raised"
                    >
                      {formatAmount(collection.current_amount)}
                    </span>
                    {hasGoal && (
                      <span className="text-zinc-500">
                        of {formatAmount(collection.goal_amount)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar - only show if goal is set */}
                {hasGoal && (
                  <div className="mb-6">
                    <Progress value={progress} className="h-3 bg-zinc-100" />
                    <p className="text-sm text-zinc-500 mt-2 text-right">
                      {progress.toFixed(0)}% of goal
                    </p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#f5f5f7] rounded-xl p-4">
                    <div className="flex items-center gap-2 text-zinc-500 mb-1">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">Donors</span>
                    </div>
                    <p className="text-xl font-bold text-[#0a0a0a]">{collection.donor_count}</p>
                  </div>
                  {collection.deadline && (
                    <div className="bg-[#f5f5f7] rounded-xl p-4">
                      <div className="flex items-center gap-2 text-zinc-500 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Deadline</span>
                      </div>
                      <p className="text-sm font-medium text-[#0a0a0a]">
                        {formatDate(collection.deadline)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Share Button */}
                <Button 
                  variant="outline"
                  className="w-full rounded-xl border-zinc-200 mb-3"
                  onClick={copyShareLink}
                  data-testid="share-btn"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Collection
                </Button>

                {/* Donate Button - Mobile sticky */}
                <Button 
                  className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-xl py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all hidden md:flex"
                  onClick={() => setActiveTab("donate")}
                  data-testid="donate-btn-desktop"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Donate Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="container-main py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-zinc-200 bg-transparent h-auto p-0 mb-8">
            <TabsTrigger 
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF5F00] data-[state=active]:bg-transparent px-6 py-3"
              data-testid="tab-overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="donate"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF5F00] data-[state=active]:bg-transparent px-6 py-3"
              data-testid="tab-donate"
            >
              Donate
            </TabsTrigger>
            <TabsTrigger 
              value="donors"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#FF5F00] data-[state=active]:bg-transparent px-6 py-3"
              data-testid="tab-donors"
            >
              Donors ({collection.donor_count})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <div className="max-w-3xl">
              <h2 
                className="text-xl font-bold text-[#0a0a0a] mb-4"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                About this Collection
              </h2>
              <div className="prose prose-zinc max-w-none">
                <p className="text-zinc-600 whitespace-pre-wrap leading-relaxed">
                  {collection.description}
                </p>
              </div>

              <div className="mt-8 p-6 bg-[#f5f5f7] rounded-2xl">
                <h3 className="font-semibold text-[#0a0a0a] mb-3">Collection Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Category</p>
                    <p className="font-medium text-[#0a0a0a] capitalize">{collection.category}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Visibility</p>
                    <p className="font-medium text-[#0a0a0a] capitalize">{collection.visibility}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Created</p>
                    <p className="font-medium text-[#0a0a0a]">{formatDate(collection.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Organizer</p>
                    <p className="font-medium text-[#0a0a0a]">{collection.organizer_name}</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Donate Tab */}
          <TabsContent value="donate" className="mt-0">
            <div className="max-w-2xl">
              <h2 
                className="text-xl font-bold text-[#0a0a0a] mb-6"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                Make a Donation
              </h2>

              {/* Payment Method Tabs */}
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  variant={paymentMethod === "bank" ? "default" : "outline"}
                  className={`flex-1 h-12 rounded-xl gap-2 ${paymentMethod === "bank" ? 'bg-[#002FA7] text-white' : 'border-zinc-200'}`}
                  onClick={() => setPaymentMethod("bank")}
                  data-testid="payment-method-bank"
                >
                  <Building2 className="w-4 h-4" />
                  Bank/UPI Transfer
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className={`flex-1 h-12 rounded-xl gap-2 ${paymentMethod === "card" ? 'bg-[#002FA7] text-white' : 'border-zinc-200'}`}
                  onClick={() => setPaymentMethod("card")}
                  data-testid="payment-method-card"
                >
                  <CreditCard className="w-4 h-4" />
                  Card/UPI App
                </Button>
              </div>

              {/* Bank/UPI Transfer Option (Smart Collect) */}
              {paymentMethod === "bank" && (
                <div className="space-y-6">
                  {loadingVA ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#002FA7]" />
                    </div>
                  ) : virtualAccount ? (
                    <>
                      {/* Bank Account Details */}
                      {virtualAccount.bank_account && (
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#002FA7] flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-[#0a0a0a]">Bank Transfer</h3>
                              <p className="text-sm text-zinc-500">NEFT / IMPS / RTGS</p>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
                              <div>
                                <p className="text-xs text-zinc-500 uppercase">Account Number</p>
                                <p className="font-mono font-bold text-[#0a0a0a]">{virtualAccount.bank_account.account_number}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(virtualAccount.bank_account.account_number, "Account number")}
                                className="text-[#002FA7]"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
                              <div>
                                <p className="text-xs text-zinc-500 uppercase">IFSC Code</p>
                                <p className="font-mono font-bold text-[#0a0a0a]">{virtualAccount.bank_account.ifsc}</p>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(virtualAccount.bank_account.ifsc, "IFSC code")}
                                className="text-[#002FA7]"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="bg-white/70 rounded-lg p-3">
                              <p className="text-xs text-zinc-500 uppercase">Bank Name</p>
                              <p className="font-medium text-[#0a0a0a]">{virtualAccount.bank_account.bank_name || "RazorpayX"}</p>
                            </div>
                            
                            <div className="bg-white/70 rounded-lg p-3">
                              <p className="text-xs text-zinc-500 uppercase">Beneficiary Name</p>
                              <p className="font-medium text-[#0a0a0a]">{virtualAccount.bank_account.name || collection.title}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* UPI Details */}
                      {virtualAccount.vpa && (
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                              <Smartphone className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-[#0a0a0a]">UPI Transfer</h3>
                              <p className="text-sm text-zinc-500">Google Pay / PhonePe / BHIM</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center bg-white/70 rounded-lg p-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-zinc-500 uppercase">UPI ID</p>
                              <p className="font-mono font-bold text-[#0a0a0a] truncate">{virtualAccount.vpa.address}</p>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(virtualAccount.vpa.address, "UPI ID")}
                              className="text-emerald-600 ml-2"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="text-sm text-amber-800">
                          <strong>How it works:</strong> Transfer any amount directly to the bank account or UPI ID above. 
                          Your donation will be automatically credited to this fundraiser within minutes.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-zinc-50 rounded-xl">
                      <p className="text-zinc-500 mb-4">Bank transfer option not available for this collection.</p>
                      <Button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className="bg-[#002FA7]"
                      >
                        Use Card/UPI App Instead
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Card/UPI App Option (Razorpay Checkout) */}
              {paymentMethod === "card" && (
                <form onSubmit={handleDonate} className="space-y-5">
                  {/* Quick Amount Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#0a0a0a] mb-3">
                      Select Amount
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {suggestedAmounts.map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={amount === String(amt) ? "default" : "outline"}
                          className={`rounded-full ${amount === String(amt) ? 'bg-[#002FA7] text-white' : 'border-zinc-200'}`}
                          onClick={() => setAmount(String(amt))}
                          data-testid={`amount-${amt}`}
                        >
                          ₹{amt.toLocaleString()}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-12 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                        min="10"
                        required
                        data-testid="custom-amount-input"
                      />
                    </div>
                  </div>

                {/* Donor Details */}
                {isAuthenticated && user && (
                  <div className="bg-[#002FA7]/5 border border-[#002FA7]/20 rounded-xl p-4 mb-2">
                    <p className="text-sm text-[#002FA7] font-medium">
                      Donating as {user.name}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-[#0a0a0a] mb-2">
                    Your Name *
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={donorName}
                    onChange={(e) => !isAuthenticated && setDonorName(e.target.value)}
                    className={`h-12 rounded-xl border-transparent ${
                      isAuthenticated 
                        ? 'bg-zinc-100 text-zinc-600 cursor-not-allowed' 
                        : 'bg-[#f5f5f7] focus:border-[#002FA7] focus:bg-white'
                    }`}
                    required
                    readOnly={isAuthenticated}
                    data-testid="donor-name-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0a0a0a] mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={donorEmail}
                    onChange={(e) => !isAuthenticated && setDonorEmail(e.target.value)}
                    className={`h-12 rounded-xl border-transparent ${
                      isAuthenticated 
                        ? 'bg-zinc-100 text-zinc-600 cursor-not-allowed' 
                        : 'bg-[#f5f5f7] focus:border-[#002FA7] focus:bg-white'
                    }`}
                    required
                    readOnly={isAuthenticated}
                    data-testid="donor-email-input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0a0a0a] mb-2">
                    Phone Number {isAuthenticated && user?.phone ? '' : '*'}
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={donorPhone}
                    onChange={(e) => !isAuthenticated && setDonorPhone(e.target.value)}
                    className={`h-12 rounded-xl border-transparent ${
                      isAuthenticated && user?.phone
                        ? 'bg-zinc-100 text-zinc-600 cursor-not-allowed' 
                        : 'bg-[#f5f5f7] focus:border-[#002FA7] focus:bg-white'
                    }`}
                    pattern="[0-9]{10}"
                    required={!isAuthenticated || !user?.phone}
                    readOnly={isAuthenticated && !!user?.phone}
                    data-testid="donor-phone-input"
                  />
                  {isAuthenticated && !user?.phone && (
                    <p className="text-xs text-zinc-500 mt-1">Phone number required for payment</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0a0a0a] mb-2">
                    Message (Optional)
                  </label>
                  <Textarea
                    placeholder="Add a message of support..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white resize-none"
                    rows={3}
                    data-testid="donor-message-input"
                  />
                </div>

                {/* Anonymous Option */}
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="anonymous"
                    checked={anonymous}
                    onCheckedChange={setAnonymous}
                    data-testid="anonymous-checkbox"
                  />
                  <label htmlFor="anonymous" className="text-sm text-zinc-600 cursor-pointer">
                    Donate anonymously (your name won't be displayed)
                  </label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-xl py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
                  disabled={donationLoading}
                  data-testid="submit-donation-btn"
                >
                  {donationLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5 mr-2" />
                      Donate {amount ? formatAmount(parseFloat(amount)) : 'Now'}
                    </>
                  )}
                </Button>

                <p className="text-xs text-zinc-500 text-center">
                  Secured by Razorpay Payment Gateway
                </p>
              </form>
            </div>
          </TabsContent>

          {/* Donors Tab */}
          <TabsContent value="donors" className="mt-0">
            <div className="max-w-2xl">
              <h2 
                className="text-xl font-bold text-[#0a0a0a] mb-6"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                {collection.donor_count} Donor{collection.donor_count !== 1 ? 's' : ''}
              </h2>

              {donations.length > 0 ? (
                <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
                  {donations.map((donation, index) => (
                    <div 
                      key={donation.id}
                      className="donor-item"
                      data-testid={`donor-${index}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#002FA7]/10 flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-[#002FA7]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-[#0a0a0a]">
                            {donation.anonymous ? "Anonymous" : donation.donor_name}
                          </p>
                          <p className="font-bold text-[#0a0a0a] amount-display">
                            {formatAmount(donation.amount)}
                          </p>
                        </div>
                        {donation.message && (
                          <p className="text-sm text-zinc-500 flex items-start gap-1">
                            <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{donation.message}</span>
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 mt-1">
                          {formatDate(donation.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-[#f5f5f7] rounded-2xl">
                  <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                  <p className="text-zinc-500 mb-4">No donations yet. Be the first to contribute!</p>
                  <Button 
                    className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full"
                    onClick={() => setActiveTab("donate")}
                  >
                    Make First Donation
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Mobile Fixed Donate Button - Hidden when already on Donate tab */}
      {activeTab !== "donate" && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-zinc-200">
          <Button 
            className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-xl py-5 text-lg font-bold shadow-lg"
            onClick={() => setActiveTab("donate")}
            data-testid="donate-btn-mobile"
          >
            <Heart className="w-5 h-5 mr-2" />
            Donate Now
          </Button>
        </div>
      )}
    </div>
  );
}
