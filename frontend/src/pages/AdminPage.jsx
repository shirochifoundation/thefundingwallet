import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import axios from "axios";
import {
  Shield,
  Users,
  Wallet,
  Settings,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Eye,
  IndianRupee,
  Percent,
  Building2,
  Smartphone,
  LogOut
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPage() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState(localStorage.getItem("adminToken"));
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [kycRequests, setKycRequests] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [settings, setSettings] = useState({ platform_fee_percentage: 2.5 });
  
  // Modal states
  const [reviewModal, setReviewModal] = useState({ open: false, kyc: null, action: "" });
  const [withdrawalModal, setWithdrawalModal] = useState({ open: false, withdrawal: null, action: "" });
  const [rejectionReason, setRejectionReason] = useState("");
  const [failureReason, setFailureReason] = useState("");

  useEffect(() => {
    if (adminToken) {
      verifyAdmin();
    }
  }, [adminToken]);

  const getAuthHeader = () => ({ Authorization: `Bearer ${adminToken}` });

  const verifyAdmin = async () => {
    try {
      const response = await axios.get(`${API}/admin/dashboard`, {
        headers: getAuthHeader()
      });
      setDashboard(response.data);
      setIsLoggedIn(true);
      fetchAllData();
    } catch (error) {
      localStorage.removeItem("adminToken");
      setAdminToken(null);
      setIsLoggedIn(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/admin/login`, loginData);
      localStorage.setItem("adminToken", response.data.access_token);
      setAdminToken(response.data.access_token);
      toast.success("Admin login successful");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Invalid admin credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken(null);
    setIsLoggedIn(false);
    setDashboard(null);
    toast.success("Logged out successfully");
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [kycRes, withdrawRes, settingsRes] = await Promise.all([
        axios.get(`${API}/admin/kyc-requests`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/withdrawals`, { headers: getAuthHeader() }),
        axios.get(`${API}/admin/settings`, { headers: getAuthHeader() })
      ]);
      setKycRequests(kycRes.data);
      setWithdrawals(withdrawRes.data);
      setSettings(settingsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCReview = async () => {
    if (!reviewModal.kyc) return;
    
    if (reviewModal.action === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/admin/kyc/${reviewModal.kyc.id}/review`,
        {
          status: reviewModal.action,
          rejection_reason: reviewModal.action === "rejected" ? rejectionReason : null
        },
        { headers: getAuthHeader() }
      );
      toast.success(`KYC ${reviewModal.action} successfully`);
      setReviewModal({ open: false, kyc: null, action: "" });
      setRejectionReason("");
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update KYC");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalProcess = async () => {
    if (!withdrawalModal.withdrawal) return;

    if (withdrawalModal.action === "reject" && !failureReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/admin/withdrawals/${withdrawalModal.withdrawal.id}/process?action=${withdrawalModal.action}${withdrawalModal.action === "reject" ? `&failure_reason=${encodeURIComponent(failureReason)}` : ""}`,
        {},
        { headers: getAuthHeader() }
      );
      toast.success(`Withdrawal ${withdrawalModal.action === "approve" ? "approved and sent to Cashfree" : "rejected"}`);
      setWithdrawalModal({ open: false, withdrawal: null, action: "" });
      setFailureReason("");
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const updatePlatformFee = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/admin/settings`, settings, { headers: getAuthHeader() });
      toast.success("Platform fee updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: "bg-amber-100 text-amber-700", icon: Clock },
      approved: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
      rejected: { color: "bg-red-100 text-red-700", icon: XCircle },
      processing: { color: "bg-blue-100 text-blue-700", icon: Loader2 },
      completed: { color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
      failed: { color: "bg-red-100 text-red-700", icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${color} rounded-full px-3 py-1 capitalize`}>
        <Icon className="w-3 h-3 mr-1" /> {status}
      </Badge>
    );
  };

  const formatAmount = (amount) => `₹${amount?.toLocaleString('en-IN') || 0}`;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[#002FA7]/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#002FA7]" />
            </div>
            <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }} className="text-2xl">
              Admin Login
            </CardTitle>
            <CardDescription>Sign in to access admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fundflow.com"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  data-testid="admin-email-input"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1"
                  data-testid="admin-password-input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#002FA7] hover:bg-[#0040d0] text-white rounded-full py-6"
                data-testid="admin-login-btn"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="py-8 md:py-12 pb-24 md:pb-12">
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 
              className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2"
              style={{ fontFamily: 'Bricolage Grotesque' }}
              data-testid="admin-title"
            >
              Admin Dashboard
            </h1>
            <p className="text-zinc-600">Manage KYC requests, withdrawals, and platform settings</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="rounded-full">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>

        {/* Stats Cards */}
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Total Users</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
                      {dashboard.total_users}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Pending KYC</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
                      {dashboard.pending_kyc}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Total Withdrawn</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
                      {formatAmount(dashboard.total_withdrawn)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF5F00]/10 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-[#FF5F00]" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Platform Fees</p>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
                      {formatAmount(dashboard.total_platform_fees)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="kyc" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="kyc" className="rounded-lg">
              <Shield className="w-4 h-4 mr-2" /> KYC Requests
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="rounded-lg">
              <Wallet className="w-4 h-4 mr-2" /> Withdrawals
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </TabsTrigger>
          </TabsList>

          {/* KYC Requests Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }}>KYC Verification Requests</CardTitle>
                <CardDescription>Review and approve user KYC submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {kycRequests.length > 0 ? (
                  <div className="space-y-4">
                    {kycRequests.map((kyc) => (
                      <div 
                        key={kyc.id} 
                        className="border border-zinc-200 rounded-xl p-4 hover:bg-zinc-50 transition-colors"
                        data-testid={`kyc-item-${kyc.id}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-[#0a0a0a]">{kyc.user_name}</p>
                              {getStatusBadge(kyc.status)}
                            </div>
                            <p className="text-sm text-zinc-500">{kyc.user_email}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm">
                              <span className="text-zinc-600">
                                <strong>PAN:</strong> {kyc.pan_number?.substring(0, 5)}****{kyc.pan_number?.slice(-1)}
                              </span>
                              <span className="text-zinc-600">
                                <strong>Aadhaar:</strong> XXXX {kyc.aadhaar_number?.slice(-4)}
                              </span>
                              {kyc.bank_account_number && (
                                <span className="text-zinc-600 flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> Bank: XXXX{kyc.bank_account_number?.slice(-4)}
                                </span>
                              )}
                              {kyc.upi_id && (
                                <span className="text-zinc-600 flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" /> UPI: {kyc.upi_id}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-2">
                              Submitted: {formatDate(kyc.created_at)}
                            </p>
                          </div>
                          {kyc.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                                onClick={() => setReviewModal({ open: true, kyc, action: "approved" })}
                                data-testid={`approve-kyc-${kyc.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => setReviewModal({ open: true, kyc, action: "rejected" })}
                                data-testid={`reject-kyc-${kyc.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                    <p>No KYC requests found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals">
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }}>Withdrawal Requests</CardTitle>
                <CardDescription>Process user withdrawal requests</CardDescription>
              </CardHeader>
              <CardContent>
                {withdrawals.length > 0 ? (
                  <div className="space-y-4">
                    {withdrawals.map((withdrawal) => (
                      <div 
                        key={withdrawal.id} 
                        className="border border-zinc-200 rounded-xl p-4 hover:bg-zinc-50 transition-colors"
                        data-testid={`withdrawal-item-${withdrawal.id}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="font-semibold text-[#0a0a0a]">{withdrawal.user_name}</p>
                              {getStatusBadge(withdrawal.status)}
                            </div>
                            <p className="text-sm text-zinc-500 mb-2">
                              Collection: {withdrawal.collection_title}
                            </p>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <span className="font-medium text-[#0a0a0a]">
                                Amount: {formatAmount(withdrawal.amount)}
                              </span>
                              <span className="text-red-600">
                                Fee: -{formatAmount(withdrawal.platform_fee)}
                              </span>
                              <span className="text-emerald-600 font-semibold">
                                Net: {formatAmount(withdrawal.net_amount)}
                              </span>
                              <span className="text-zinc-600 capitalize">
                                Mode: {withdrawal.payout_mode}
                              </span>
                            </div>
                            {withdrawal.payout_details && (
                              <div className="mt-2 text-xs text-zinc-500">
                                {withdrawal.payout_mode === "bank" && withdrawal.payout_details.bank_account && (
                                  <span>Bank: XXXX{withdrawal.payout_details.bank_account} ({withdrawal.payout_details.bank_ifsc})</span>
                                )}
                                {withdrawal.payout_mode === "upi" && withdrawal.payout_details.upi_id && (
                                  <span>UPI: {withdrawal.payout_details.upi_id}</span>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-zinc-400 mt-2">
                              Requested: {formatDate(withdrawal.created_at)}
                            </p>
                          </div>
                          {withdrawal.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full"
                                onClick={() => setWithdrawalModal({ open: true, withdrawal, action: "approve" })}
                                data-testid={`approve-withdrawal-${withdrawal.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50 rounded-full"
                                onClick={() => setWithdrawalModal({ open: true, withdrawal, action: "reject" })}
                                data-testid={`reject-withdrawal-${withdrawal.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-500">
                    <Wallet className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                    <p>No withdrawal requests found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }}>Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-w-md">
                  <Label htmlFor="platform_fee" className="flex items-center gap-2">
                    <Percent className="w-4 h-4" /> Platform Fee Percentage
                  </Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      id="platform_fee"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={settings.platform_fee_percentage}
                      onChange={(e) => setSettings({ platform_fee_percentage: parseFloat(e.target.value) || 0 })}
                      className="w-32"
                      data-testid="platform-fee-input"
                    />
                    <Button
                      onClick={updatePlatformFee}
                      disabled={loading}
                      className="bg-[#002FA7] hover:bg-[#0040d0] text-white rounded-full"
                      data-testid="update-fee-btn"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                  <p className="text-sm text-zinc-500 mt-2">
                    This fee is deducted from each withdrawal. Current: {settings.platform_fee_percentage}%
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* KYC Review Modal */}
      <Dialog open={reviewModal.open} onOpenChange={(open) => !open && setReviewModal({ open: false, kyc: null, action: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Bricolage Grotesque' }}>
              {reviewModal.action === "approved" ? "Approve KYC" : "Reject KYC"}
            </DialogTitle>
            <DialogDescription>
              {reviewModal.action === "approved" 
                ? `Confirm approval of KYC for ${reviewModal.kyc?.user_name}?`
                : `Please provide a reason for rejecting ${reviewModal.kyc?.user_name}'s KYC.`
              }
            </DialogDescription>
          </DialogHeader>
          {reviewModal.action === "rejected" && (
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-2"
              data-testid="rejection-reason-input"
            />
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReviewModal({ open: false, kyc: null, action: "" })}>
              Cancel
            </Button>
            <Button
              onClick={handleKYCReview}
              disabled={loading}
              className={reviewModal.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              data-testid="confirm-kyc-action"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Process Modal */}
      <Dialog open={withdrawalModal.open} onOpenChange={(open) => !open && setWithdrawalModal({ open: false, withdrawal: null, action: "" })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Bricolage Grotesque' }}>
              {withdrawalModal.action === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}
            </DialogTitle>
            <DialogDescription>
              {withdrawalModal.action === "approve"
                ? `Approve and send payout of ${formatAmount(withdrawalModal.withdrawal?.net_amount)} to ${withdrawalModal.withdrawal?.user_name}?`
                : `Please provide a reason for rejecting this withdrawal.`
              }
            </DialogDescription>
          </DialogHeader>
          {withdrawalModal.action === "reject" && (
            <Textarea
              placeholder="Enter rejection reason..."
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
              className="mt-2"
              data-testid="rejection-reason-input"
            />
          )}
          {withdrawalModal.action === "approve" && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                This will initiate a payout via Cashfree. The transfer will be processed immediately.
              </p>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setWithdrawalModal({ open: false, withdrawal: null, action: "" })}>
              Cancel
            </Button>
            <Button
              onClick={handleWithdrawalProcess}
              disabled={loading}
              className={withdrawalModal.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
              data-testid="confirm-withdrawal-action"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
