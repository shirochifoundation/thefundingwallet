export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      <div className="bg-[#0a0a0a] text-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: 'Bricolage Grotesque' }}
          >
            Refund & Cancellation Policy
          </h1>
          <p className="text-zinc-400">Last updated: March 2025</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-zinc-100 prose prose-zinc max-w-none">
          
          <h2>1. Overview</h2>
          <p>
            This Refund & Cancellation Policy outlines the terms and conditions for refunds and cancellations on the FundFlow platform. We strive to ensure a fair and transparent process for all users.
          </p>

          <h2>2. Donation Refunds</h2>
          
          <h3>2.1 General Policy</h3>
          <p>
            Donations made through FundFlow are generally considered final and non-refundable. This is because:
          </p>
          <ul>
            <li>Donations are voluntary contributions made at the donor's discretion</li>
            <li>Funds may have already been withdrawn by the collection organizer</li>
            <li>The nature of crowdfunding involves pooled contributions</li>
          </ul>

          <h3>2.2 Eligible Refund Cases</h3>
          <p>
            Refunds may be considered in the following circumstances:
          </p>
          <ul>
            <li><strong>Technical Errors:</strong> Duplicate charges or incorrect amounts due to system errors</li>
            <li><strong>Fraud:</strong> If a collection is determined to be fraudulent by our team</li>
            <li><strong>Unauthorized Transactions:</strong> If a donation was made without the account holder's consent</li>
            <li><strong>Failed Transactions:</strong> If payment was deducted but not credited to the collection</li>
          </ul>

          <h3>2.3 Refund Request Process</h3>
          <p>To request a refund:</p>
          <ol>
            <li>Contact our support team at support@fundflow.app within 7 days of the transaction</li>
            <li>Provide your transaction ID, donation amount, and reason for refund</li>
            <li>Include any supporting documentation if applicable</li>
            <li>Our team will review your request within 5-7 business days</li>
          </ol>

          <h3>2.4 Refund Timeline</h3>
          <p>
            If a refund is approved:
          </p>
          <ul>
            <li>Refunds will be processed to the original payment method</li>
            <li>Credit/Debit card refunds: 5-10 business days</li>
            <li>UPI refunds: 3-5 business days</li>
            <li>Net banking refunds: 5-7 business days</li>
          </ul>

          <h2>3. Collection Cancellations</h2>

          <h3>3.1 Organizer Cancellation</h3>
          <p>
            Collection organizers may cancel their fundraiser at any time. When a collection is cancelled:
          </p>
          <ul>
            <li>No new donations can be made</li>
            <li>Existing funds can still be withdrawn (subject to KYC verification)</li>
            <li>Donors will be notified of the cancellation</li>
          </ul>

          <h3>3.2 Platform Cancellation</h3>
          <p>
            FundFlow reserves the right to cancel a collection if:
          </p>
          <ul>
            <li>It violates our Terms & Conditions</li>
            <li>Fraudulent activity is detected</li>
            <li>The collection contains prohibited content</li>
            <li>Legal requirements mandate such action</li>
          </ul>

          <h2>4. Withdrawal Cancellations</h2>
          <p>
            Withdrawal requests can be cancelled by the organizer if:
          </p>
          <ul>
            <li>The request is still in "Pending" status</li>
            <li>The request has not been approved by admin</li>
          </ul>
          <p>
            Once a withdrawal is approved and processed, it cannot be cancelled or reversed.
          </p>

          <h2>5. Platform Fee Refunds</h2>
          <p>
            Platform fees are non-refundable except in cases where:
          </p>
          <ul>
            <li>The entire collection is cancelled due to fraud</li>
            <li>Technical errors resulted in incorrect fee calculation</li>
          </ul>

          <h2>6. Dispute Resolution</h2>
          <p>
            If you disagree with a refund decision:
          </p>
          <ol>
            <li>Email us at disputes@fundflow.app with your case details</li>
            <li>Our team will conduct a secondary review</li>
            <li>Final decisions will be communicated within 10 business days</li>
          </ol>

          <h2>7. Contact Information</h2>
          <p>
            For refund and cancellation queries:
          </p>
          <ul>
            <li>Email: support@fundflow.app</li>
            <li>Phone: +91 98765 43210 (Mon-Fri, 9am-6pm IST)</li>
            <li>Response time: Within 24-48 hours</li>
          </ul>

          <h2>8. Policy Updates</h2>
          <p>
            FundFlow reserves the right to modify this policy at any time. Users will be notified of significant changes via email or platform notifications.
          </p>
        </div>
      </div>
    </div>
  );
}
