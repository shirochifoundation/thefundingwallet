import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import WithdrawalModal from "@/components/WithdrawalModal";
import {
  PlusCircle,
  Loader2,
  Users,
  IndianRupee,
  Calendar,
  Eye,
  Share2,
  Copy,
  MoreVertical,
  TrendingUp,
  Wallet,
  Globe,
  Lock,
  ArrowDownToLine,
  Clock,
  CheckCircle2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import axios from "axios";

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

export default function MyCollectionsPage() {
  const { user, getAuthHeader, kycStatus, refreshKycStatus } = useAuth();
  const [collections, setCollections] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCollections: 0,
    totalRaised: 0,
    totalDonors: 0,
    totalWithdrawn: 0,
    totalAvailable: 0
  });
  const [withdrawalModal, setWithdrawalModal] = useState({ open: false, collection: null });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [collectionsRes, withdrawalsRes] = await Promise.all([
        axios.get(`${API}/my-collections`, { headers: getAuthHeader() }),
        axios.get(`${API}/withdrawals`, { headers: getAuthHeader() })
      ]);
      
      setCollections(collectionsRes.data);
      setWithdrawals(withdrawalsRes.data);
      
      // Calculate stats
      const totalRaised = collectionsRes.data.reduce((sum, c) => sum + c.current_amount, 0);
      const totalDonors = collectionsRes.data.reduce((sum, c) => sum + c.donor_count, 0);
      const totalWithdrawn = collectionsRes.data.reduce((sum, c) => sum + (c.withdrawn_amount || 0), 0);
      const totalAvailable = totalRaised - totalWithdrawn;
      
      setStats({
        totalCollections: collectionsRes.data.length,
        totalRaised,
        totalDonors,
        totalWithdrawn,
        totalAvailable
      });
      
      // Refresh KYC status
      refreshKycStatus();
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load your collections");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = (collectionId) => {
    const link = `${window.location.origin}/collection/${collectionId}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleWithdrawClick = (e, collection) => {
    e.preventDefault();
    e.stopPropagation();
    setWithdrawalModal({ open: true, collection });
  };

  const formatAmount = (amount) => {
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
    if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
    return `₹${amount?.toLocaleString('en-IN') || 0}`;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getKYCStatusBadge = () => {
    switch(kycStatus) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 rounded-full px-3">
            <CheckCircle2 className="w-3 h-3 mr-1" /> KYC Verified
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-100 text-amber-700 rounded-full px-3">
            <Clock className="w-3 h-3 mr-1" /> KYC Pending
          </Badge>
        );
      default:
        return (
          <Link to="/profile">
            <Badge className="bg-red-100 text-red-700 rounded-full px-3 hover:bg-red-200 cursor-pointer">
              Complete KYC to Withdraw
            </Badge>
          </Link>
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
      <div className="container-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 
              className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-2"
              style={{ fontFamily: 'Bricolage Grotesque' }}
              data-testid="my-collections-title"
            >
              My Collections
            </h1>
            <p className="text-zinc-600">
              Manage and track all your fundraising campaigns
            </p>
          </div>
          <div className="flex items-center gap-3">
            {getKYCStatusBadge()}
            <Link to="/create">
              <Button 
                className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-6 font-semibold"
                data-testid="create-new-btn"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Collection
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-gradient-to-br from-[#002FA7] to-[#0047d6] rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <IndianRupee className="w-4 h-4" />
              </div>
              <span className="text-blue-100 text-xs">Total Raised</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {formatAmount(stats.totalRaised)}
            </p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <span className="text-emerald-100 text-xs">Available</span>
            </div>
            <p className="text-2xl font-bold" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {formatAmount(stats.totalAvailable)}
            </p>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#FF5F00]/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-[#FF5F00]" />
              </div>
              <span className="text-zinc-500 text-xs">Collections</span>
            </div>
            <p className="text-2xl font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {stats.totalCollections}
            </p>
          </div>
          
          <div className="bg-white border border-zinc-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-zinc-600" />
              </div>
              <span className="text-zinc-500 text-xs">Total Donors</span>
            </div>
            <p className="text-2xl font-bold text-[#0a0a0a]" style={{ fontFamily: 'Bricolage Grotesque' }}>
              {stats.totalDonors}
            </p>
          </div>
        </div>

        {/* Withdrawal History Link */}
        {withdrawals.length > 0 && (
          <div className="mb-6 p-4 bg-zinc-50 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArrowDownToLine className="w-5 h-5 text-zinc-500" />
              <span className="text-sm text-zinc-600">
                You have <strong>{withdrawals.length}</strong> withdrawal request(s). 
                Total withdrawn: <strong>{formatAmount(stats.totalWithdrawn)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Collections List */}
        {collections.length > 0 ? (
          <div className="space-y-4">
            {collections.map((collection, index) => {
              const progress = Math.min((collection.current_amount / collection.goal_amount) * 100, 100);
              const badgeClass = categoryColors[collection.category?.toLowerCase()] || categoryColors.other;
              const availableAmount = collection.current_amount - (collection.withdrawn_amount || 0);
              
              return (
                <Link 
                  to={`/collection/${collection.id}`}
                  key={collection.id}
                  className="block"
                  data-testid={`collection-item-${collection.id}`}
                >
                  <div 
                    className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-md hover:border-zinc-300 transition-all cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Image */}
                      <div className="w-full lg:w-32 h-24 rounded-xl overflow-hidden flex-shrink-0">
                        <img 
                          src={collection.cover_image}
                          alt={collection.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge className={`${badgeClass} rounded-full px-3 py-1 text-xs font-semibold`}>
                                {collection.category}
                              </Badge>
                              {collection.visibility === 'private' ? (
                                <Badge className="bg-zinc-100 text-zinc-600 rounded-full px-2 py-1 text-xs">
                                  <Lock className="w-3 h-3 mr-1" /> Private
                                </Badge>
                              ) : (
                                <Badge className="bg-zinc-100 text-zinc-600 rounded-full px-2 py-1 text-xs">
                                  <Globe className="w-3 h-3 mr-1" /> Public
                                </Badge>
                              )}
                            </div>
                            <h3 
                              className="text-lg font-bold text-[#0a0a0a] group-hover:text-[#002FA7] transition-colors truncate"
                              style={{ fontFamily: 'Bricolage Grotesque' }}
                            >
                              {collection.title}
                            </h3>
                            <p className="text-sm text-zinc-500 mt-1">
                              Created {formatDate(collection.created_at)}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                              <Button variant="ghost" size="icon" className="flex-shrink-0">
                                <MoreVertical className="w-5 h-5 text-zinc-500" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link to={`/collection/${collection.id}`} className="cursor-pointer">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.preventDefault();
                                  copyShareLink(collection.id);
                                }}
                                className="cursor-pointer"
                              >
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Link
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => handleWithdrawClick(e, collection)}
                                className="cursor-pointer text-emerald-600"
                                disabled={availableAmount <= 0}
                              >
                                <ArrowDownToLine className="w-4 h-4 mr-2" />
                                Withdraw Funds
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        {/* Progress Section */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="sm:col-span-2">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-semibold text-[#0a0a0a]">
                                {formatAmount(collection.current_amount)}
                              </span>
                              <span className="text-zinc-500">
                                of {formatAmount(collection.goal_amount)}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2 bg-zinc-100" />
                            <p className="text-xs text-zinc-500 mt-1">{progress.toFixed(0)}% raised</p>
                          </div>
                          
                          <div className="flex items-center gap-2 text-zinc-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{collection.donor_count} donors</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-emerald-600 font-medium">
                              {formatAmount(availableAmount)} available
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[#f5f5f7] rounded-2xl">
            <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center mx-auto mb-6">
              <Wallet className="w-10 h-10 text-zinc-400" />
            </div>
            <h3 
              className="text-xl font-bold text-[#0a0a0a] mb-2"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              No Collections Yet
            </h3>
            <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
              Start your first fundraising campaign and collect funds from your community.
            </p>
            <Link to="/create">
              <Button className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-8">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Your First Collection
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <WithdrawalModal
        open={withdrawalModal.open}
        onClose={() => setWithdrawalModal({ open: false, collection: null })}
        collection={withdrawalModal.collection}
        kycStatus={kycStatus}
        getAuthHeader={getAuthHeader}
        onSuccess={fetchData}
      />
    </div>
  );
}
