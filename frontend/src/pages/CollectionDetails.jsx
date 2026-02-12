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
  IndianRupee
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

      const { payment_session_id, cf_order_id, order_id } = response.data;
      
      // Initialize Cashfree checkout
      if (window.Cashfree) {
        try {
          const cashfree = window.Cashfree({ mode: "sandbox" });
          const checkoutOptions = {
            paymentSessionId: payment_session_id,
            redirectTarget: "_self"
          };
          await cashfree.checkout(checkoutOptions);
        } catch (checkoutError) {
          console.error("Cashfree checkout error:", checkoutError);
          // Fallback to direct redirect
          toast.info("Opening payment page...");
          window.location.href = `/payment/callback?order_id=${order_id}`;
        }
      } else {
        // SDK not loaded, show toast and redirect to callback
        toast.info("Payment gateway loading... Redirecting...");
        // Give user a moment then redirect
        setTimeout(() => {
          window.location.href = `/payment/callback?order_id=${order_id}`;
        }, 1500);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error.response?.data?.detail || "Failed to initiate payment");
    } finally {
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

  const progress = Math.min((collection.current_amount / collection.goal_amount) * 100, 100);
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
                    <span className="text-zinc-500">
                      of {formatAmount(collection.goal_amount)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <Progress value={progress} className="h-3 bg-zinc-100" />
                  <p className="text-sm text-zinc-500 mt-2 text-right">
                    {progress.toFixed(0)}% of goal
                  </p>
                </div>

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
            <div className="max-w-lg">
              <h2 
                className="text-xl font-bold text-[#0a0a0a] mb-6"
                style={{ fontFamily: 'Bricolage Grotesque' }}
              >
                Make a Donation
              </h2>

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
                  Secured by Cashfree Payment Gateway
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
