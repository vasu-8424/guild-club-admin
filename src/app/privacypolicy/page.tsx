import type { Metadata } from "next";
import Link from "next/link";
import { 
  ShieldCheck, 
  Lock, 
  Baby, 
  MapPin, 
  CreditCard, 
  Database, 
  Trash2, 
  Mail, 
  ArrowLeft, 
  Eye, 
  FileText,
  AlertCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Guild Club",
  description: "Official Privacy Policy for Guild Club mobile application (Toyverse). Learn how we handle your personal data, permissions, and children's privacy.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">Guild Club</span>
              <span className="text-xs text-indigo-400 font-medium ml-2 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/50">
                Privacy Portal
              </span>
            </div>
          </div>
          <Link
            href="/login"
            className="text-xs sm:text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>Admin Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Header Hero */}
        <div className="mb-10 text-center sm:text-left border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Play Store Compliant & Verified
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
            This Privacy Policy explains how <strong className="text-slate-200">Guild Club</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;, operated under <strong className="text-slate-200">Toyverse</strong>) collects, uses, protects, and discloses personal information through our Android mobile application and related web platforms.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
            <div><strong className="text-slate-300">Effective Date:</strong> August 1, 2026</div>
            <div>•</div>
            <div><strong className="text-slate-300">Last Updated:</strong> November 23, 2026</div>
            <div>•</div>
            <div><strong className="text-slate-300">Package:</strong> com.toyverse.app.toyverse</div>
          </div>
        </div>

        {/* Core Principles Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-3">
              <Baby className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-200 mb-1">Child Safety First</h3>
            <p className="text-xs text-slate-400">Strict parental control; we never serve targeted behavioural ads to children.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-200 mb-1">End-to-End Encryption</h3>
            <p className="text-xs text-slate-400">Data transmitted via TLS 1.3 and database protected by Postgres Row Level Security.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Trash2 className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm text-slate-200 mb-1">Account & Data Erasure</h3>
            <p className="text-xs text-slate-400">One-click account deletion directly in the app or via our privacy contact desk.</p>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-300 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-400" />
              1. Information We Collect
            </h2>
            <div className="space-y-3 text-slate-300">
              <p>
                We only collect information necessary to deliver educational toy subscriptions, club memberships, purchases, and order tracking services.
              </p>
              <ul className="list-disc list-inside space-y-2 text-slate-300 ml-1">
                <li>
                  <strong className="text-slate-100">Parent / Guardian Account Details:</strong> Name, email address, phone number, and authentication identifiers obtained through Google Sign-In or email credentials.
                </li>
                <li>
                  <strong className="text-slate-100">Child Personalization Profile (Optional):</strong> Parents may optionally provide their child&apos;s nickname/first name, age band, and learning interests to tailor toy curation and developmental recommendations. Accounts must be registered and managed solely by adults.
                </li>
                <li>
                  <strong className="text-slate-100">Delivery Address & Location Data:</strong> Postal address, landmark, city, postal code, and GPS coordinates (with your explicit permission) to verify serviceability and guide delivery couriers accurately.
                </li>
                <li>
                  <strong className="text-slate-100">Transactions & Orders:</strong> Order history, subscription plans, rented toy items, and transaction reference numbers processed through Razorpay.
                </li>
                <li>
                  <strong className="text-slate-100">Camera & Photo Uploads (Optional):</strong> If you use our AI Room Fit Advisor or upload a profile image, photos are accessed solely after your prompt permission. Room photos for dimension/fit estimations are processed ephemerally and discarded immediately after recommendation generation unless explicitly saved to your personal profile.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Baby className="w-5 h-5 text-rose-400" />
              2. Children&apos;s Privacy &amp; Parental Consent
            </h2>
            <div className="space-y-3">
              <p>
                Guild Club is designed for parents, legal guardians, and families. In strict compliance with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP Act), GDPR-K, and Google Play Families Policies:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-1">
                <li>We do not allow minors (under 18 years of age) to register accounts or make financial transactions independently.</li>
                <li>Any child information (such as age group or developmental interests) is voluntarily provided by the verified parent or guardian solely to personalize toy recommendations.</li>
                <li>We <strong className="text-slate-100">never</strong> sell children&apos;s data, track children across third-party websites or apps, or engage in targeted behavioral advertising.</li>
                <li>Parents may view, modify, or permanently delete their child&apos;s information at any time in their profile settings.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-amber-400" />
              3. Device Permissions &amp; Location Usage
            </h2>
            <div className="space-y-3">
              <p>Our Android app requests the following system permissions only when contextually needed:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-amber-400 mb-1">Location (ACCESS_FINE_LOCATION / COARSE)</div>
                  <p className="text-xs text-slate-400">Used strictly while selecting or confirming your delivery drop point on a map. We <strong className="text-slate-300">do not</strong> track your background location when the app is closed.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-indigo-400 mb-1">Notifications (POST_NOTIFICATIONS)</div>
                  <p className="text-xs text-slate-400">Used to send transactional updates on your toy orders, shipping status, subscription renewals, and security alerts. You may disable this at any time in device settings.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-emerald-400 mb-1">Camera &amp; Photo Library</div>
                  <p className="text-xs text-slate-400">Used only if you decide to take a photo of your playroom for size advisory or to upload a custom profile avatar. No background access.</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                  <div className="font-semibold text-slate-200 text-xs uppercase tracking-wider text-violet-400 mb-1">Internet &amp; Network State</div>
                  <p className="text-xs text-slate-400">Required for syncing catalog items, secure API communication with backend servers, and processing transactions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              4. Payment &amp; Financial Security
            </h2>
            <div className="space-y-3">
              <p>
                All financial transactions in Guild Club are handled through certified third-party payment gateways (<strong className="text-slate-200">Razorpay</strong>):
              </p>
              <ul className="list-disc list-inside space-y-2 ml-1">
                <li>Guild Club <strong className="text-slate-100">does not</strong> store or view your full credit card numbers, debit card details, CVV, or UPI PINs on our servers.</li>
                <li>All payment processing conforms to the Payment Card Industry Data Security Standard (PCI-DSS Level 1) and Reserve Bank of India (RBI) payment guidelines.</li>
                <li>We only retain non-sensitive transaction tokens, payment IDs, and timestamps for invoicing and receipt generation.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-cyan-400" />
              5. Third-Party Service Providers
            </h2>
            <div className="space-y-3">
              <p>We work with trusted cloud providers who adhere to rigorous data privacy and security benchmarks:</p>
              <ul className="list-disc list-inside space-y-2 ml-1">
                <li><strong className="text-slate-200">Supabase:</strong> For secure database management, user authentication, and storage, enforcing Row Level Security (RLS).</li>
                <li><strong className="text-slate-200">Google OAuth:</strong> For fast, verified sign-in with your Google account.</li>
                <li><strong className="text-slate-200">Razorpay:</strong> For secure in-app payments, UPI, net banking, and card processing.</li>
                <li><strong className="text-slate-200">Logistics &amp; Courier Partners:</strong> Only recipient name, delivery address, and phone number are shared with logistics personnel solely to execute physical package delivery.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Trash2 className="w-5 h-5 text-red-400" />
              6. Data Retention, Rights &amp; Account Deletion
            </h2>
            <div className="space-y-3">
              <p>
                In compliance with Google Play Store policies and global privacy regulations, users retain full control over their personal information:
              </p>
              <div className="bg-slate-950/80 border border-red-900/40 rounded-xl p-4 my-3">
                <h4 className="text-white font-semibold text-sm mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  How to Delete Your Account and Data
                </h4>
                <p className="text-xs text-slate-400 mb-2">
                  You can permanently delete your Guild Club account and all associated personal data using either of the following methods:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                  <li><strong className="text-slate-100">In the App:</strong> Open <span className="text-indigo-300">Profile &gt; Account Settings &gt; Delete Account</span> and confirm.</li>
                  <li><strong className="text-slate-100">Via Email:</strong> Send a deletion request from your registered email address to <a href="mailto:privacy@guildclub.com" className="text-indigo-400 underline">privacy@guildclub.com</a> or <a href="mailto:support@guildclub.com" className="text-indigo-400 underline">support@guildclub.com</a> with the subject line <em>&quot;Account Deletion Request&quot;</em>.</li>
                </ol>
                <p className="text-xs text-slate-400 mt-2">
                  Upon account deletion, your personal profile, child preferences, addresses, and session tokens are purged from active production databases within 30 days, except records strictly required for legal, tax, and auditing obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-violet-400" />
              7. Grievance Officer &amp; Contact Information
            </h2>
            <div className="space-y-3">
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy, our data practices, or would like to exercise your statutory privacy rights, please reach out to our designated Grievance Officer:
              </p>
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div><strong className="text-slate-200">Company / Brand:</strong> Guild Club (Toyverse)</div>
                <div><strong className="text-slate-200">Grievance Officer:</strong> Compliance &amp; Grievance Redressal Officer</div>
                <div><strong className="text-slate-200">Email:</strong> <a href="mailto:privacy@guildclub.com" className="text-indigo-400 underline">privacy@guildclub.com</a> / <a href="mailto:support@guildclub.com" className="text-indigo-400 underline">support@guildclub.com</a></div>
                <div><strong className="text-slate-200">Registered Hub:</strong> Essen Marvella apartments, A block, 410, Suchitra Rd, Sriram Nagar, Jeedimetla, Hyderabad, Telangana 500055, India</div>
                <div><strong className="text-slate-200">Support Phone:</strong> +91 98765 43210</div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-slate-900/40 border border-slate-800/70 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-indigo-400" />
              8. Changes to this Privacy Policy
            </h2>
            <p>
              We may update our Privacy Policy periodically to reflect changes in our legal obligations or app enhancements. When updates occur, we will revise the &quot;Last Updated&quot; date at the top of this policy and notify users via an in-app banner or email notification where required by applicable law.
            </p>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Guild Club. All rights reserved.</p>
          <p className="mt-1">
            Privacy Policy URL: <code className="text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">https://guild-club-admin-8vtm.vercel.app/privacypolicy</code>
          </p>
        </footer>
      </main>
    </div>
  );
}
