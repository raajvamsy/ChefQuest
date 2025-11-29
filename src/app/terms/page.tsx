export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-border-gray/30 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-primary mb-2">Terms and Conditions</h1>
        <p className="text-sm text-text-medium mb-8">Last updated: November 29, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-text-dark">
          <p>
            Please read these terms and conditions carefully before using Our Service.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Interpretation and Definitions</h2>

          <h3 className="text-xl font-semibold text-text-dark mt-6 mb-3">Definitions</h3>
          <p>For the purposes of these Terms and Conditions:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to ChefQuest.</li>
            <li><strong>Service</strong> refers to the Website and mobile application.</li>
            <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
            <li><strong>Account</strong> means a unique account created for You to access our Service.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Account Creation and Use</h2>
          <p>
            <strong>Users can create an account on ChefQuest using Google OAuth authentication or as a demo user.</strong>
          </p>
          
          <h3 className="text-xl font-semibold text-text-dark mt-6 mb-3">Account Requirements</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be at least 13 years old to create an account</li>
            <li>You must provide accurate information during account creation</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You may not share your account credentials with others</li>
            <li>You may have only one account per email address</li>
          </ul>

          <h3 className="text-xl font-semibold text-text-dark mt-6 mb-3">Account Types</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google Account</strong> - Full access to all features using your Google credentials</li>
            <li><strong>Demo Account</strong> - Limited access for trying out the service without authentication</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Acceptable Use</h2>
          <p>By accessing or using the Service, You agree to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the Service only for lawful purposes</li>
            <li>Not attempt to gain unauthorized access to any part of the Service</li>
            <li>Not use the Service to transmit harmful or malicious code</li>
            <li>Not abuse or overload our AI recipe generation features</li>
            <li>Not scrape or data mine the Service</li>
            <li>Respect intellectual property rights</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">User Content</h2>
          <p>
            When you use ChefQuest, you may create, save, and share recipes and collections. By doing so:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>You retain all rights to your content</li>
            <li>You grant us permission to store and display your content as necessary to provide the Service</li>
            <li>You are responsible for the accuracy of information you provide</li>
            <li>We reserve the right to remove content that violates these terms</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">AI-Generated Content</h2>
          <p>
            ChefQuest uses AI (Google Gemini) to generate recipes and provide cooking guidance:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>AI-generated recipes are provided for informational purposes only</li>
            <li>We do not guarantee the accuracy, safety, or suitability of AI-generated recipes</li>
            <li>Always use your judgment and follow proper food safety practices</li>
            <li>We are not liable for any issues arising from following AI-generated recipes</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Service Availability</h2>
          <p>
            We strive to provide continuous service, but:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>The Service is provided "AS IS" and "AS AVAILABLE"</li>
            <li>We may modify, suspend, or discontinue any part of the Service at any time</li>
            <li>We do not guarantee uninterrupted or error-free service</li>
            <li>Scheduled maintenance may temporarily affect availability</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Termination</h2>
          <p>
            We may terminate or suspend Your access immediately, without prior notice, if You:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Breach these Terms and Conditions</li>
            <li>Engage in fraudulent or illegal activity</li>
            <li>Abuse the Service or harm other users</li>
          </ul>
          <p className="mt-4">
            You may also delete your account at any time from your profile settings.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We are not liable for any indirect, incidental, or consequential damages</li>
            <li>We are not responsible for food allergies, dietary restrictions, or health issues</li>
            <li>You use the Service at your own risk</li>
            <li>Our total liability shall not exceed the amount you paid to use the Service (if any)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Food Safety Disclaimer</h2>
          <p className="font-semibold text-error">
            IMPORTANT: ChefQuest provides recipe suggestions and cooking guidance, but you are solely 
            responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Verifying ingredient safety and freshness</li>
            <li>Following proper food handling and cooking procedures</li>
            <li>Accounting for allergies and dietary restrictions</li>
            <li>Ensuring food is cooked to safe temperatures</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Links to Other Websites</h2>
          <p>
            Our Service may contain links to third-party websites. We have no control over and assume no 
            responsibility for the content, privacy policies, or practices of any third party websites.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Changes to These Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, 
            we will make reasonable efforts to provide at least 30 days' notice prior to any new terms 
            taking effect.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of India, 
            without regard to its conflict of law provisions.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about these Terms and Conditions, you can contact us at:{" "}
            <a href="mailto:support@chefquest.com" className="text-primary hover:underline">
              support@chefquest.com
            </a>
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-border-gray/30">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            ← Back to ChefQuest
          </a>
        </div>
      </div>
    </div>
  );
}
