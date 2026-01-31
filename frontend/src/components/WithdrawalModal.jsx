import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, Wallet, Building2, Smartphone, IndianRupee, AlertTriangle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function WithdrawalModal({ open, onClose, collection, kycStatus, getAuthHeader, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [payoutMode, setPayoutMode] = useState("bank");

  const availableAmount = (collection?.current_amount || 0) - (collection?.withdrawn_amount || 0);
  const maxAmount = availableAmount;

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (withdrawAmount > maxAmount) {
      toast.error(`Maximum available amount is ₹${maxAmount.toLocaleString('en-IN')}`);
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/withdrawals/request`,
        {
          collection_id: collection.id,
          amount: withdrawAmount,
          payout_mode: payoutMode
        },
        { headers: getAuthHeader() }
      );
      toast.success("Withdrawal request submitted successfully!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error(error.response?.data?.detail || "Failed to submit withdrawal request");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amt) => `₹${amt?.toLocaleString('en-IN') || 0}`;

  // KYC not approved
  if (kycStatus !== "approved") {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: 'Bricolage Grotesque' }} className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> KYC Required
            </DialogTitle>
            <DialogDescription>
              You need to complete KYC verification before withdrawing funds.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-700">
                {kycStatus === "pending" 
                  ? "Your KYC is currently under review. Please wait for approval."
                  : kycStatus === "rejected"
                  ? "Your KYC was rejected. Please update your details and resubmit."
                  : "Please submit your KYC documents to enable withdrawals."
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button 
              className="bg-[#FF5F00] hover:bg-[#E05400] text-white"
              onClick={() => window.location.href = "/profile"}
            >
              Go to KYC
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: 'Bricolage Grotesque' }} className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#FF5F00]" /> Withdraw Funds
          </DialogTitle>
          <DialogDescription>
            Request withdrawal from "{collection?.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Balance Info */}
          <div className="bg-zinc-50 rounded-xl p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-zinc-500">Total Raised</p>
                <p className="font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
                  {formatAmount(collection?.current_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Withdrawn</p>
                <p className="font-bold text-zinc-600" style={{ fontFamily: 'Bricolage Grotesque' }}>
                  {formatAmount(collection?.withdrawn_amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Available</p>
                <p className="font-bold text-emerald-600" style={{ fontFamily: 'Bricolage Grotesque' }}>
                  {formatAmount(availableAmount)}
                </p>
              </div>
            </div>
          </div>

          {availableAmount > 0 ? (
            <>
              {/* Amount Input */}
              <div>
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" /> Withdrawal Amount
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    max={maxAmount}
                    className="flex-1"
                    data-testid="withdrawal-amount-input"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(maxAmount.toString())}
                    className="whitespace-nowrap"
                  >
                    Max
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Platform fee (2.5%) will be deducted from the withdrawal amount
                </p>
              </div>

              {/* Payout Mode */}
              <div>
                <Label className="mb-3 block">Payout Mode</Label>
                <RadioGroup value={payoutMode} onValueChange={setPayoutMode} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="bank" id="bank" data-testid="payout-bank" />
                    <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer">
                      <Building2 className="w-4 h-4" /> Bank Transfer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upi" id="upi" data-testid="payout-upi" />
                    <Label htmlFor="upi" className="flex items-center gap-2 cursor-pointer">
                      <Smartphone className="w-4 h-4" /> UPI
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Summary */}
              {amount && parseFloat(amount) > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <p className="text-sm text-emerald-700">
                    <strong>You will receive:</strong> {formatAmount(parseFloat(amount) * 0.975)} 
                    <span className="text-emerald-600 text-xs ml-2">
                      (after 2.5% platform fee)
                    </span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-zinc-100 rounded-lg p-4 text-center">
              <p className="text-zinc-600">No funds available for withdrawal</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleWithdraw}
            disabled={loading || availableAmount <= 0 || !amount}
            className="bg-[#FF5F00] hover:bg-[#E05400] text-white"
            data-testid="submit-withdrawal-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" /> Request Withdrawal
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
