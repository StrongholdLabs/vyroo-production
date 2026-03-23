import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";

const CookiePolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            Back to Home
          </Link>

          <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-2">
            Cookie Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Effective Date: March 21, 2026
          </p>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <p>
                This Cookie Policy explains how Stronghold Labs ("we," "us," or
                "our") uses cookies and similar tracking technologies on Vyroo
                (vyroo.ai). This policy should be read alongside our{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
                , which provides more detail on how we handle your personal data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                1. What Are Cookies?
              </h2>
              <p>
                Cookies are small text files placed on your device by a website
                or application. They are widely used to make websites work
                efficiently, remember your preferences, and provide information
                to the site operators. Cookies can be "session" cookies (which
                expire when you close your browser) or "persistent" cookies
                (which remain on your device for a set period or until you
                delete them). We also use similar technologies such as
                localStorage, which stores data locally in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                2. Cookies We Use
              </h2>

              <h3 className="text-sm font-medium text-foreground mt-5 mb-3">
                2.1 Essential Cookies
              </h3>
              <p className="mb-3">
                These cookies are strictly necessary for the Service to function
                and cannot be disabled. They include:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border">
                        Cookie
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border">
                        Purpose
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        sb-*-auth-token
                      </td>
                      <td className="px-4 py-2.5">
                        Supabase authentication session token. Used to keep you
                        signed in and verify your identity.
                      </td>
                      <td className="px-4 py-2.5">Session / 1 year</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        sb-*-auth-token-code-verifier
                      </td>
                      <td className="px-4 py-2.5">
                        PKCE code verifier for secure OAuth authentication
                        flows.
                      </td>
                      <td className="px-4 py-2.5">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-medium text-foreground mt-5 mb-3">
                2.2 Preference Cookies (localStorage)
              </h3>
              <p className="mb-3">
                These store your interface preferences so the application
                behaves the way you expect across sessions:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border">
                        Key
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border">
                        Purpose
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border">
                        Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2.5 font-mono text-xs">theme</td>
                      <td className="px-4 py-2.5">
                        Your selected color theme (light or dark mode).
                      </td>
                      <td className="px-4 py-2.5">Persistent</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        vyroo-sidebar-collapsed
                      </td>
                      <td className="px-4 py-2.5">
                        Whether the sidebar is collapsed or expanded.
                      </td>
                      <td className="px-4 py-2.5">Persistent</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        vyroo-workspace
                      </td>
                      <td className="px-4 py-2.5">
                        Your selected workspace vertical (e.g., general,
                        e-commerce, devtools).
                      </td>
                      <td className="px-4 py-2.5">Persistent</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2.5 font-mono text-xs">
                        vyroo-model-settings
                      </td>
                      <td className="px-4 py-2.5">
                        Your preferred AI model and generation settings.
                      </td>
                      <td className="px-4 py-2.5">Persistent</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-sm font-medium text-foreground mt-5 mb-3">
                2.3 Analytics Cookies
              </h3>
              <p>
                We may use analytics services to understand how visitors
                interact with the Service. These cookies collect information
                such as the number of visitors, which pages are visited most
                often, and how users navigate through the site. All analytics
                data is aggregated and anonymized. If we implement third-party
                analytics (such as Google Analytics or Plausible), we will
                update this section with specific details. You may opt out of
                analytics cookies through your browser settings or through any
                cookie consent banner we provide.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                3. How to Manage Cookies
              </h2>
              <p className="mb-3">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-foreground">Browser Settings:</strong>{" "}
                  Most web browsers allow you to control cookies through their
                  settings. You can set your browser to block cookies, delete
                  existing cookies, or notify you when a cookie is set. The
                  steps vary by browser — consult your browser's help
                  documentation for instructions.
                </li>
                <li>
                  <strong className="text-foreground">localStorage:</strong> You
                  can clear localStorage data through your browser's developer
                  tools (usually accessible via F12 or the browser menu under
                  "Application" or "Storage").
                </li>
                <li>
                  <strong className="text-foreground">
                    Cookie Consent Banner:
                  </strong>{" "}
                  If we display a cookie consent banner, you can use it to
                  accept or reject non-essential cookies.
                </li>
              </ul>
              <p className="mt-3">
                Please note that disabling essential cookies or clearing
                authentication data from localStorage will prevent you from
                using the Service and may log you out.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                4. Third-Party Cookies
              </h2>
              <p>
                When you authenticate via Google or GitHub OAuth, those
                providers may set their own cookies during the authentication
                flow. Similarly, Stripe may set cookies during payment
                processing. We do not control third-party cookies. Please refer
                to the respective privacy policies of Google, GitHub, and Stripe
                for information about their cookie practices.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                5. Updates to This Policy
              </h2>
              <p>
                We may update this Cookie Policy from time to time to reflect
                changes in our practices or for operational, legal, or
                regulatory reasons. We will post the updated policy on this page
                and update the effective date. We encourage you to review this
                page periodically.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                6. Contact Us
              </h2>
              <p>
                If you have any questions about our use of cookies, please
                contact us at{" "}
                <a
                  href="mailto:privacy@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  privacy@vyroo.ai
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <span>&middot;</span>
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CookiePolicy;
