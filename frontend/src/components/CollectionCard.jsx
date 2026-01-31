import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Lock, Globe } from "lucide-react";

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

export const CollectionCard = ({ collection }) => {
  const progress = Math.min((collection.current_amount / collection.goal_amount) * 100, 100);
  const badgeClass = categoryColors[collection.category?.toLowerCase()] || categoryColors.other;
  
  const formatAmount = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getDaysRemaining = () => {
    if (!collection.deadline) return null;
    const deadline = new Date(collection.deadline);
    const today = new Date();
    const days = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <Link 
      to={`/collection/${collection.id}`} 
      className="block"
      data-testid={`collection-card-${collection.id}`}
    >
      <div className="collection-card group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img 
            src={collection.cover_image || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7"} 
            alt={collection.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <Badge className={`${badgeClass} rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
              {collection.category}
            </Badge>
            {collection.visibility === 'private' ? (
              <Badge className="bg-zinc-800 text-white rounded-full px-2 py-1">
                <Lock className="w-3 h-3" />
              </Badge>
            ) : (
              <Badge className="bg-white/90 text-zinc-700 rounded-full px-2 py-1">
                <Globe className="w-3 h-3" />
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          <h3 
            className="text-lg font-bold text-[#0a0a0a] mb-2 line-clamp-2 group-hover:text-[#002FA7] transition-colors"
            style={{ fontFamily: 'Bricolage Grotesque' }}
          >
            {collection.title}
          </h3>
          
          <p className="text-sm text-zinc-500 mb-4 line-clamp-2 flex-1">
            {collection.description}
          </p>

          {/* Progress */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#0a0a0a] amount-display">
                {formatAmount(collection.current_amount)}
              </span>
              <span className="text-sm text-zinc-500">
                of {formatAmount(collection.goal_amount)}
              </span>
            </div>
            <Progress value={progress} className="h-2 bg-zinc-100" />
            <p className="text-xs text-zinc-500 text-right">
              {progress.toFixed(0)}% raised
            </p>
          </div>

          {/* Footer Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <div className="flex items-center gap-1.5 text-zinc-500">
              <Users className="w-4 h-4" />
              <span className="text-sm">{collection.donor_count} donors</span>
            </div>
            {daysRemaining !== null && (
              <div className="flex items-center gap-1.5 text-zinc-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CollectionCard;
