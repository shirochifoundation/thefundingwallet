export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Bricolage Grotesque' }}
          >
            Privacy Policy
          </h1>
          <p className="text-zinc-400">Last updated: March 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-zinc-100 prose prose-zinc max-w-none">
          
          <h2>1. Introduction</h2>
          <p>
            FundFlow ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>

          <h2>2. Information We Collect</h2>
          
          <h3>2.1 Personal Information</h3>
          <p>We may collect the following personal information:</p>
          <ul>
            <li>Name and email address</li>
            <li>Phone number</li>
            <li>Payment information (processed securely via Razorpay)</li>
            <li>KYC documents (PAN, Aadhaar, Bank details) for withdrawal verification</li>
            <li>Profile information you provide</li>
          </ul>

          <h3>2.2 Usage Information</h3>
          <p>We automatically collect:</p>
          <ul>
            <li>Device and browser information</li>
            <li>IP address and location data</li>
            <li>Pages visited and actions taken on the platform</li>
            <li>Time and date of visits</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our services</li>
            <li>Process donations and withdrawals</li>
            <li>Verify your identity for KYC compliance</li>
            <li>Communicate with you about your account and transactions</li>
            <li>Improve our platform and user experience</li>
            <li>Prevent fraud and ensure security</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Information Sharing</h2>
          <p>We may share your information with:</p>
          <ul>
            <li><strong>Payment Processors:</strong> Razorpay for processing payments</li>
            <li><strong>Service Providers:</strong> Third parties who assist in operating our platform</li>
            <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
          </ul>
          <p>
            We do not sell your personal information to third parties.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </p>
          <ul>
            <li>Encryption of sensitive data</li>
            <li>Secure socket layer (SSL) technology</li>
            <li>Regular security assessments</li>
            <li>Access controls and authentication</li>
          </ul>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. KYC documents are retained as per regulatory requirements.
          </p>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data (subject to legal requirements)</li>
            <li>Object to processing of your data</li>
            <li>Withdraw consent where applicable</li>
          </ul>

          <h2>8. Cookies</h2>
          <p>
            We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. Essential cookies are required for the platform to function properly.
          </p>

          <h2>9. Third-Party Links</h2>
          <p>
            Our platform may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
          </p>

          <h2>10. Children's Privacy</h2>
          <p>
            FundFlow is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated revision date.
          </p>

          <h2>12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <ul>
            <li>Email: privacy@fundflow.app</li>
            <li>Address: Mumbai, Maharashtra, India</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
