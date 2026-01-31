import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";
import {
  User,
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  Smartphone,
  Loader2,
  FileText,
  Building2
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function ProfilePage() {
  const { user, getAuthHeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycData, setKycData] = useState(null);
  const [formData, setFormData] = useState({
    pan_number: "",
    aadhaar_number: "",
    bank_account_number: "",
    bank_ifsc: "",
    bank_account_holder: "",
    upi_id: ""
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await axios.get(`${API}/kyc/status`, {
        headers: getAuthHeader()
      });
      setKycData(response.data);
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching KYC:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitKYC = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.pan_number || formData.pan_number.length !== 10) {
      toast.error("Please enter a valid 10-character PAN number");
      return;
    }
    if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!formData.bank_account_number && !formData.upi_id) {
      toast.error("Please provide either Bank Account or UPI ID");
      return;
    }
    if (formData.bank_account_number && (!formData.bank_ifsc || !formData.bank_account_holder)) {
      toast.error("Please provide IFSC code and Account holder name for bank account");
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/kyc/submit`, formData, {
        headers: getAuthHeader()
      });
      setKycData(response.data);
      toast.success("KYC submitted successfully! Awaiting admin approval.");
    } catch (error) {
      console.error("KYC submission error:", error);
      toast.error(error.response?.data?.detail || "Failed to submit KYC");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 rounded-full px-3 py-1">
            <Clock className="w-3 h-3 mr-1" /> Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 rounded-full px-3 py-1">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-100 text-zinc-700 rounded-full px-3 py-1">
            <AlertCircle className="w-3 h-3 mr-1" /> Not Submitted
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#FF5F00] animate-spin" />
      </div>
    );
  }

  return (
    <div className="py-8 md:py-12 pb-24 md:pb-12">
      <div className="container-main max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2"
            style={{ fontFamily: 'Bricolage Grotesque' }}
            data-testid="profile-title"
          >
            My Profile
          </h1>
          <p className="text-zinc-600">
            Manage your account settings and KYC verification
          </p>
        </div>

        <Tabs defaultValue="kyc" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile" className="rounded-lg">
              <User className="w-4 h-4 mr-2" /> Profile
            </TabsTrigger>
            <TabsTrigger value="kyc" className="rounded-lg">
              <Shield className="w-4 h-4 mr-2" /> KYC Verification
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }}>Account Information</CardTitle>
                <CardDescription>Your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-500 text-sm">Name</Label>
                    <p className="font-medium text-[#0a0a0a]">{user?.name}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-sm">Email</Label>
                    <p className="font-medium text-[#0a0a0a]">{user?.email}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-sm">Phone</Label>
                    <p className="font-medium text-[#0a0a0a]">{user?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-zinc-500 text-sm">Member Since</Label>
                    <p className="font-medium text-[#0a0a0a]">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc">
            {/* KYC Status Card */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }}>KYC Status</CardTitle>
                    <CardDescription>Complete KYC to withdraw funds from your collections</CardDescription>
                  </div>
                  {getStatusBadge(kycData?.status)}
                </div>
              </CardHeader>
              {kycData && (
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                      <FileText className="w-5 h-5 text-zinc-500" />
                      <div>
                        <p className="text-xs text-zinc-500">PAN Number</p>
                        <p className="font-medium">{kycData.pan_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                      <CreditCard className="w-5 h-5 text-zinc-500" />
                      <div>
                        <p className="text-xs text-zinc-500">Aadhaar</p>
                        <p className="font-medium">XXXX XXXX {kycData.aadhaar_last_four}</p>
                      </div>
                    </div>
                    {kycData.bank_account_last_four && (
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-zinc-500" />
                        <div>
                          <p className="text-xs text-zinc-500">Bank Account</p>
                          <p className="font-medium">XXXX{kycData.bank_account_last_four} ({kycData.bank_ifsc})</p>
                        </div>
                      </div>
                    )}
                    {kycData.upi_id && (
                      <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-lg">
                        <Smartphone className="w-5 h-5 text-zinc-500" />
                        <div>
                          <p className="text-xs text-zinc-500">UPI ID</p>
                          <p className="font-medium">{kycData.upi_id}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {kycData.status === "rejected" && kycData.rejection_reason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">
                        <strong>Rejection Reason:</strong> {kycData.rejection_reason}
                      </p>
                      <p className="text-sm text-red-600 mt-2">
                        Please update your KYC details and resubmit.
                      </p>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* KYC Form - Show if not submitted or rejected */}
            {(!kycData || kycData.status === "rejected" || kycData.status === "not_submitted") && (
              <Card>
                <CardHeader>
                  <CardTitle style={{ fontFamily: 'Bricolage Grotesque' }}>
                    {kycData?.status === "rejected" ? "Resubmit KYC" : "Submit KYC"}
                  </CardTitle>
                  <CardDescription>
                    Provide your identity and bank details for fund withdrawals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitKYC} className="space-y-6">
                    {/* Identity Documents */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-[#0a0a0a] flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Identity Documents
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="pan_number">PAN Number *</Label>
                          <Input
                            id="pan_number"
                            name="pan_number"
                            placeholder="ABCDE1234F"
                            value={formData.pan_number}
                            onChange={handleInputChange}
                            className="mt-1"
                            maxLength={10}
                            data-testid="pan-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="aadhaar_number">Aadhaar Number *</Label>
                          <Input
                            id="aadhaar_number"
                            name="aadhaar_number"
                            placeholder="123456789012"
                            value={formData.aadhaar_number}
                            onChange={handleInputChange}
                            className="mt-1"
                            maxLength={12}
                            data-testid="aadhaar-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bank Account Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-[#0a0a0a] flex items-center gap-2">
                        <Building2 className="w-4 h-4" /> Bank Account Details (Optional if UPI provided)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bank_account_number">Account Number</Label>
                          <Input
                            id="bank_account_number"
                            name="bank_account_number"
                            placeholder="1234567890123456"
                            value={formData.bank_account_number}
                            onChange={handleInputChange}
                            className="mt-1"
                            data-testid="bank-account-input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bank_ifsc">IFSC Code</Label>
                          <Input
                            id="bank_ifsc"
                            name="bank_ifsc"
                            placeholder="SBIN0001234"
                            value={formData.bank_ifsc}
                            onChange={handleInputChange}
                            className="mt-1"
                            data-testid="bank-ifsc-input"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="bank_account_holder">Account Holder Name</Label>
                          <Input
                            id="bank_account_holder"
                            name="bank_account_holder"
                            placeholder="As per bank records"
                            value={formData.bank_account_holder}
                            onChange={handleInputChange}
                            className="mt-1"
                            data-testid="bank-holder-input"
                          />
                        </div>
                      </div>
                    </div>

                    {/* UPI Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-[#0a0a0a] flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> UPI Details (Optional if Bank Account provided)
                      </h3>
                      <div>
                        <Label htmlFor="upi_id">UPI ID</Label>
                        <Input
                          id="upi_id"
                          name="upi_id"
                          placeholder="yourname@upi"
                          value={formData.upi_id}
                          onChange={handleInputChange}
                          className="mt-1"
                          data-testid="upi-input"
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-700">
                        <strong>Note:</strong> Your KYC details will be verified by our team within 24-48 hours. 
                        Once approved, you will be able to withdraw funds from your collections.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full py-6"
                      data-testid="submit-kyc-btn"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Submit KYC
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Approved Status */}
            {kycData?.status === "approved" && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                    <h3 className="font-bold text-emerald-800 text-lg" style={{ fontFamily: 'Bricolage Grotesque' }}>
                      KYC Verified!
                    </h3>
                    <p className="text-emerald-700 mt-2">
                      You can now withdraw funds from your collections.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pending Status */}
            {kycData?.status === "pending" && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                    <h3 className="font-bold text-amber-800 text-lg" style={{ fontFamily: 'Bricolage Grotesque' }}>
                      KYC Under Review
                    </h3>
                    <p className="text-amber-700 mt-2">
                      Your KYC documents are being reviewed. This usually takes 24-48 hours.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
