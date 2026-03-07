export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Bricolage Grotesque' }}
          >
            Terms & Conditions
          </h1>
          <p className="text-zinc-400">Last updated: March 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-zinc-100 prose prose-zinc max-w-none">
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using FundFlow ("the Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            FundFlow is a crowdfunding platform that enables users to create and manage fundraising campaigns ("Collections") for various purposes including but not limited to celebrations, emergencies, community causes, and personal needs.
          </p>

          <h2>3. User Eligibility</h2>
          <p>
            To use FundFlow, you must:
          </p>
          <ul>
            <li>Be at least 18 years of age</li>
            <li>Have a valid email address and phone number</li>
            <li>Provide accurate and complete information during registration</li>
            <li>Not be prohibited from using the service under applicable laws</li>
          </ul>

          <h2>4. User Accounts</h2>
          <p>
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>

          <h2>5. Collection Guidelines</h2>
          <p>
            When creating a Collection, you agree to:
          </p>
          <ul>
            <li>Provide truthful and accurate information about the purpose of the fundraiser</li>
            <li>Use the funds only for the stated purpose</li>
            <li>Not engage in fraudulent or misleading activities</li>
            <li>Comply with all applicable laws and regulations</li>
          </ul>

          <h2>6. Donations</h2>
          <p>
            By making a donation through FundFlow:
          </p>
          <ul>
            <li>You confirm that the payment method used belongs to you</li>
            <li>You understand that donations are voluntary contributions</li>
            <li>You acknowledge that FundFlow does not guarantee the use of funds by the organizer</li>
          </ul>

          <h2>7. Fees and Charges</h2>
          <p>
            FundFlow charges a platform fee on withdrawals. The current fee structure is:
          </p>
          <ul>
            <li>Platform fee: 2.5% of the withdrawal amount</li>
            <li>Payment gateway fees may apply as per the payment provider's terms</li>
          </ul>

          <h2>8. Withdrawals</h2>
          <p>
            To withdraw funds from your Collection:
          </p>
          <ul>
            <li>You must complete KYC verification</li>
            <li>Withdrawals are subject to admin approval</li>
            <li>Processing time may vary based on verification requirements</li>
          </ul>

          <h2>9. Prohibited Activities</h2>
          <p>
            You may not use FundFlow for:
          </p>
          <ul>
            <li>Illegal activities or purposes</li>
            <li>Fraud, scams, or deceptive practices</li>
            <li>Harassment, hate speech, or discriminatory content</li>
            <li>Activities that violate third-party rights</li>
            <li>Spam or unauthorized advertising</li>
          </ul>

          <h2>10. Intellectual Property</h2>
          <p>
            All content, trademarks, and intellectual property on FundFlow are owned by or licensed to us. You may not use, copy, or distribute any content without our prior written consent.
          </p>

          <h2>11. Limitation of Liability</h2>
          <p>
            FundFlow is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform.
          </p>

          <h2>12. Indemnification</h2>
          <p>
            You agree to indemnify and hold harmless FundFlow, its officers, directors, and employees from any claims, damages, or expenses arising from your use of the platform or violation of these terms.
          </p>

          <h2>13. Modifications</h2>
          <p>
            We reserve the right to modify these Terms at any time. Continued use of FundFlow after changes constitutes acceptance of the modified terms.
          </p>

          <h2>14. Governing Law</h2>
          <p>
            These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
          </p>

          <h2>15. Contact</h2>
          <p>
            For questions about these Terms, please contact us at:
          </p>
          <ul>
            <li>Email: legal@fundflow.app</li>
            <li>Address: Mumbai, Maharashtra, India</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
