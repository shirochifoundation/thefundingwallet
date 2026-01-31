import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Globe,
  Lock,
  Loader2,
  PartyPopper,
  Heart,
  Sparkles,
  Home,
  HandHeart,
  Briefcase,
  Users,
  Folder,
  CheckCircle,
  IndianRupee
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const categories = [
  { id: "celebration", name: "Celebration", icon: PartyPopper, desc: "Birthday, farewell, parties" },
  { id: "medical", name: "Medical Emergency", icon: Heart, desc: "Help someone in need" },
  { id: "festival", name: "Festival", icon: Sparkles, desc: "Ganesh Utsav, Navratri" },
  { id: "society", name: "Society/Community", icon: Home, desc: "Maintenance, projects" },
  { id: "social", name: "Social Cause", icon: HandHeart, desc: "Charity, tree plantation" },
  { id: "office", name: "Office/Team", icon: Briefcase, desc: "Team events, lunches" },
  { id: "reunion", name: "Reunion", icon: Users, desc: "School, college meetups" },
  { id: "other", name: "Other", icon: Folder, desc: "Any other purpose" },
];

export default function CreateCollection() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [deadline, setDeadline] = useState(null);
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [organizerPhone, setOrganizerPhone] = useState("");

  const validateStep1 = () => {
    if (!category) {
      toast.error("Please select a category");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return false;
    }
    if (!description.trim()) {
      toast.error("Please enter a description");
      return false;
    }
    if (!goalAmount || parseFloat(goalAmount) < 100) {
      toast.error("Goal amount must be at least ₹100");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!organizerName.trim()) {
      toast.error("Please enter your name");
      return false;
    }
    if (!organizerEmail.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(organizerEmail)) {
      toast.error("Please enter a valid email");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API}/collections`, {
        title,
        description,
        category,
        goal_amount: parseFloat(goalAmount),
        visibility,
        deadline: deadline ? deadline.toISOString() : null,
        organizer_name: organizerName,
        organizer_email: organizerEmail,
        organizer_phone: organizerPhone || null
      });

      toast.success("Collection created successfully!");
      navigate(`/collection/${response.data.id}`);
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error(error.response?.data?.detail || "Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <div className="py-8 md:py-12 pb-24 md:pb-12">
      <div className="container-main">
        {/* Header */}
        <div className="mb-10">
          <button 
            onClick={() => step > 1 ? handleBack() : navigate(-1)}
            className="inline-flex items-center gap-2 text-zinc-600 hover:text-[#0a0a0a] transition-colors mb-6"
            data-testid="back-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 1 ? "Back" : "Cancel"}
          </button>

          <h1 
            className="text-3xl md:text-4xl font-bold text-[#0a0a0a] mb-3"
            style={{ fontFamily: 'Bricolage Grotesque' }}
            data-testid="create-title"
          >
            Create a Collection
          </h1>
          <p className="text-zinc-600">
            Start collecting funds for your cause in just a few steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step 
                    ? 'bg-emerald-500 text-white' 
                    : s === step 
                      ? 'bg-[#002FA7] text-white' 
                      : 'bg-zinc-200 text-zinc-500'
                }`}
              >
                {s < step ? <CheckCircle className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 md:w-24 h-1 mx-2 rounded ${s < step ? 'bg-emerald-500' : 'bg-zinc-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Category Selection */}
        {step === 1 && (
          <div className="max-w-3xl animate-fade-in">
            <h2 
              className="text-xl font-bold text-[#0a0a0a] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              What's the collection for?
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-[#002FA7] bg-[#002FA7]/5' 
                        : 'border-zinc-200 hover:border-zinc-300 bg-white'
                    }`}
                    data-testid={`category-${cat.id}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      isSelected ? 'bg-[#002FA7] text-white' : 'bg-[#f5f5f7] text-zinc-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-[#0a0a0a] text-sm mb-1">{cat.name}</p>
                    <p className="text-xs text-zinc-500">{cat.desc}</p>
                  </button>
                );
              })}
            </div>

            <Button
              onClick={handleNext}
              className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-8 py-6 font-semibold"
              disabled={!category}
              data-testid="next-step-1"
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Collection Details */}
        {step === 2 && (
          <div className="max-w-xl animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              {selectedCategory && (
                <div className="w-10 h-10 rounded-xl bg-[#002FA7] text-white flex items-center justify-center">
                  <selectedCategory.icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <p className="text-sm text-zinc-500">Category</p>
                <p className="font-medium text-[#0a0a0a]">{selectedCategory?.name}</p>
              </div>
            </div>

            <h2 
              className="text-xl font-bold text-[#0a0a0a] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Collection Details
            </h2>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Title *</Label>
                <Input
                  placeholder="e.g., Birthday Party Fund for Rahul"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  maxLength={100}
                  data-testid="title-input"
                />
                <p className="text-xs text-zinc-500 mt-1">{title.length}/100 characters</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Description *</Label>
                <Textarea
                  placeholder="Tell people what this collection is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white resize-none"
                  rows={4}
                  maxLength={1000}
                  data-testid="description-input"
                />
                <p className="text-xs text-zinc-500 mt-1">{description.length}/1000 characters</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Goal Amount *</Label>
                <div className="relative mt-2">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <Input
                    type="number"
                    placeholder="Enter target amount"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                    min="100"
                    data-testid="goal-amount-input"
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-1">Minimum ₹100</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Visibility</Label>
                <RadioGroup 
                  value={visibility} 
                  onValueChange={setVisibility}
                  className="mt-3 space-y-3"
                >
                  <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    visibility === 'public' ? 'border-[#002FA7] bg-[#002FA7]/5' : 'border-zinc-200'
                  }`}>
                    <RadioGroupItem value="public" id="public" data-testid="visibility-public" />
                    <Label htmlFor="public" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-500" />
                        <span className="font-medium">Public</span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Visible on homepage and search</p>
                    </Label>
                  </div>
                  <div className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    visibility === 'private' ? 'border-[#002FA7] bg-[#002FA7]/5' : 'border-zinc-200'
                  }`}>
                    <RadioGroupItem value="private" id="private" data-testid="visibility-private" />
                    <Label htmlFor="private" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-zinc-500" />
                        <span className="font-medium">Private</span>
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">Only accessible via share link</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Deadline (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full mt-2 h-12 rounded-xl bg-[#f5f5f7] border-transparent justify-start text-left font-normal hover:bg-[#f5f5f7]"
                      data-testid="deadline-picker"
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 text-zinc-400" />
                      {deadline ? format(deadline, "PPP") : "Select a deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="rounded-full px-6 border-zinc-300"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-8 py-6 font-semibold flex-1"
                data-testid="next-step-2"
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Organizer Details */}
        {step === 3 && (
          <div className="max-w-xl animate-fade-in">
            <h2 
              className="text-xl font-bold text-[#0a0a0a] mb-6"
              style={{ fontFamily: 'Bricolage Grotesque' }}
            >
              Your Details
            </h2>

            <div className="space-y-5">
              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Your Name *</Label>
                <Input
                  placeholder="Enter your full name"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="mt-2 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  data-testid="organizer-name-input"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Email Address *</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  className="mt-2 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  data-testid="organizer-email-input"
                />
                <p className="text-xs text-zinc-500 mt-1">We'll send collection updates here</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-[#0a0a0a]">Phone Number (Optional)</Label>
                <Input
                  type="tel"
                  placeholder="Enter 10-digit phone number"
                  value={organizerPhone}
                  onChange={(e) => setOrganizerPhone(e.target.value)}
                  className="mt-2 h-12 rounded-xl bg-[#f5f5f7] border-transparent focus:border-[#002FA7] focus:bg-white"
                  pattern="[0-9]{10}"
                  data-testid="organizer-phone-input"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="mt-8 p-6 bg-[#f5f5f7] rounded-2xl">
              <h3 className="font-semibold text-[#0a0a0a] mb-4">Collection Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Title</span>
                  <span className="font-medium text-[#0a0a0a] text-right max-w-[200px] truncate">{title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Category</span>
                  <span className="font-medium text-[#0a0a0a] capitalize">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Goal Amount</span>
                  <span className="font-medium text-[#0a0a0a]">₹{parseFloat(goalAmount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Visibility</span>
                  <span className="font-medium text-[#0a0a0a] capitalize">{visibility}</span>
                </div>
                {deadline && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Deadline</span>
                    <span className="font-medium text-[#0a0a0a]">{format(deadline, "PPP")}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="rounded-full px-6 border-zinc-300"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-[#FF5F00] hover:bg-[#E05400] text-white rounded-full px-8 py-6 font-semibold flex-1"
                disabled={loading}
                data-testid="create-collection-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Create Collection
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
