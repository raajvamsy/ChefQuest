export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background-light to-background-muted py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-border-gray/30 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-primary mb-2">Privacy Policy</h1>
        <p className="text-sm text-text-medium mb-8">Last updated: November 29, 2025</p>

        <div className="prose prose-sm max-w-none space-y-6 text-text-dark">
          <p>
            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure 
            of Your information when You use the Service and tells You about Your privacy rights and how the 
            law protects You.
          </p>

          <p>
            <strong>ChefQuest uses Google OAuth only for user authentication. We do not track, store, or share 
            any personal information beyond what is necessary for authentication purposes.</strong>
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">What We Collect</h2>
          
          <h3 className="text-xl font-semibold text-text-dark mt-6 mb-3">Google Sign-In Information</h3>
          <p>
            When you sign in with Google, we collect only the following information:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Email address</strong> - Used to identify your account</li>
            <li><strong>Name</strong> - Used to personalize your experience</li>
            <li><strong>Profile picture</strong> - Used to display your avatar (optional)</li>
          </ul>

          <h3 className="text-xl font-semibold text-text-dark mt-6 mb-3">Recipe and Cooking Data</h3>
          <p>
            When you use ChefQuest, we store:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Recipes you search for and view</li>
            <li>Recipes you save to collections</li>
            <li>Cooking session data (when you use cooking mode)</li>
            <li>Your dietary preferences (vegetarian/non-vegetarian)</li>
          </ul>
          <p className="mt-4">
            <strong>This data is stored solely to provide you with a personalized cooking experience and is never 
            shared with third parties.</strong>
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">What We Don't Track</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not use cookies for tracking purposes</li>
            <li>We do not use analytics tools to track your behavior</li>
            <li>We do not sell or share your data with advertisers</li>
            <li>We do not track your location</li>
            <li>We do not access your camera or photos without your explicit permission when using AI features</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">How We Use Your Information</h2>
          <p>We use your information only to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authenticate your identity when you sign in</li>
            <li>Provide personalized recipe recommendations</li>
            <li>Save your recipe collections and preferences</li>
            <li>Enable cooking mode features (step-by-step guidance, timers)</li>
            <li>Improve our AI-powered recipe generation</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Camera and Image Access</h2>
          <p>
            ChefQuest includes AI-powered features that can analyze images:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Camera access is only requested when you choose to use visual validation features</li>
            <li>Images are processed in real-time and are not stored on our servers</li>
            <li>You can use ChefQuest without ever granting camera access</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Data Storage</h2>
          <p>
            Your data is securely stored using Supabase, a trusted database provider. We implement 
            industry-standard security measures to protect your information.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Google OAuth</strong> - For authentication only</li>
            <li><strong>Supabase</strong> - For secure data storage</li>
            <li><strong>Google Gemini AI</strong> - For recipe generation (no personal data is sent)</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Delete your account and all associated data</li>
            <li>Export your data</li>
            <li>Opt out of any service at any time</li>
          </ul>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Children's Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 13. We do not knowingly collect 
            personally identifiable information from anyone under the age of 13.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Changes to This Privacy Policy</h2>
          <p>
            We may update Our Privacy Policy from time to time. We will notify You of any changes by 
            posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>

          <h2 className="text-2xl font-semibold text-text-dark mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, you can contact us at:{" "}
            <a href="mailto:support@chefquest.com" className="text-primary hover:underline">
              support@chefquest.com
            </a>
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-border-gray/30 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
          >
            ← Back to Home
          </a>
          <a
            href="/login"
            className="px-6 py-2.5 bg-primary text-white rounded-full font-semibold hover:bg-primary-dark transition-all"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
