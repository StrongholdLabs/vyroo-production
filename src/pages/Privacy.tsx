import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";

const Privacy = () => {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Effective Date: March 21, 2026
          </p>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <p>
                Stronghold Labs ("we," "us," or "our") operates Vyroo (vyroo.ai),
                a general-purpose AI assistant platform. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your
                information when you use our Service. By using Vyroo, you
                consent to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                1. Information We Collect
              </h2>

              <h3 className="text-sm font-medium text-foreground mt-4 mb-2">
                1.1 Account Information
              </h3>
              <p>
                When you create an account, we collect your name, email address,
                and profile information. If you sign up via Google or GitHub
                OAuth, we receive your public profile data from those providers,
                including your name, email address, and avatar.
              </p>

              <h3 className="text-sm font-medium text-foreground mt-4 mb-2">
                1.2 Conversation Data
              </h3>
              <p>
                We store the messages you send and the AI-generated responses
                within the Service. This includes text prompts, uploaded files,
                conversation metadata (titles, timestamps), and any structured
                data generated during your interactions (steps, tool calls,
                follow-up suggestions).
              </p>

              <h3 className="text-sm font-medium text-foreground mt-4 mb-2">
                1.3 Usage Data
              </h3>
              <p>
                We automatically collect information about how you interact with
                the Service, including pages visited, features used, model
                selections, session duration, device type, browser type,
                operating system, IP address, and referring URLs.
              </p>

              <h3 className="text-sm font-medium text-foreground mt-4 mb-2">
                1.4 Connector Data
              </h3>
              <p>
                If you connect third-party services (Google, GitHub, Slack,
                Notion, Shopify, etc.), we store encrypted OAuth tokens or API
                keys to maintain those connections. We may temporarily process
                data from connected services to provide AI-powered features, but
                we do not permanently store third-party data beyond what is
                needed for the connection itself.
              </p>

              <h3 className="text-sm font-medium text-foreground mt-4 mb-2">
                1.5 Payment Information
              </h3>
              <p>
                Payment processing is handled by Stripe. We do not directly
                store your credit card numbers or bank account details. Stripe
                may share with us limited billing information such as your name,
                billing address, and the last four digits of your card for
                record-keeping purposes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                2. How We Use Your Information
              </h2>
              <p className="mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Provide, operate, and maintain the Service, including
                  processing your AI conversations and delivering responses.
                </li>
                <li>
                  Improve and optimize the Service, including analyzing usage
                  patterns, debugging issues, and developing new features.
                </li>
                <li>
                  Personalize your experience, including remembering your
                  preferences, model settings, and conversation history.
                </li>
                <li>
                  Process payments and manage your subscription.
                </li>
                <li>
                  Communicate with you, including sending service-related
                  notifications, updates, and security alerts.
                </li>
                <li>
                  Enforce our Terms of Service and protect against misuse,
                  fraud, and abuse.
                </li>
                <li>
                  Comply with legal obligations and respond to lawful requests
                  from public authorities.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                3. AI Data Handling
              </h2>
              <p className="mb-3">
                Vyroo is a multi-provider AI platform. When you send a message,
                your conversation data is transmitted to one or more third-party
                LLM providers for processing, depending on your model selection:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-foreground">OpenAI</strong> (for GPT
                  models) — governed by OpenAI's usage policies and data
                  processing terms.
                </li>
                <li>
                  <strong className="text-foreground">Anthropic</strong> (for
                  Claude models) — governed by Anthropic's usage policies and
                  data processing terms.
                </li>
                <li>
                  <strong className="text-foreground">Google</strong> (for
                  Gemini models) — governed by Google's Cloud AI terms and
                  privacy policies.
                </li>
                <li>
                  <strong className="text-foreground">Meta / Together AI</strong>{" "}
                  (for Llama models) — governed by Together AI's terms and
                  Meta's Llama license.
                </li>
              </ul>
              <p className="mt-3">
                We send only the data necessary to generate a response (your
                messages and relevant conversation context). We use API-tier
                access to these providers, which means your data is generally
                not used by providers to train their models. However, we
                encourage you to review each provider's data handling practices
                directly. We do not use your conversation data to train our own
                AI models.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                4. Data Storage and Security
              </h2>
              <p className="mb-3">
                Your data is stored using Supabase, a managed cloud
                infrastructure platform. All data is encrypted at rest and in
                transit using industry-standard encryption protocols (AES-256
                for storage, TLS 1.2+ for transmission). We implement
                row-level security (RLS) policies to ensure that users can only
                access their own data.
              </p>
              <p>
                While we take reasonable measures to protect your data, no
                method of electronic transmission or storage is 100% secure.
                We cannot guarantee absolute security of your information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                5. Cookies and Tracking Technologies
              </h2>
              <p>
                We use cookies and similar technologies to maintain your session,
                remember your preferences (such as theme and sidebar state), and
                understand how the Service is used. For detailed information
                about the cookies we use, please see our{" "}
                <Link
                  to="/cookies"
                  className="text-primary hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                6. Third-Party Services
              </h2>
              <p className="mb-3">
                We use the following third-party services to operate the
                platform:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-foreground">Supabase</strong> —
                  Authentication, database, and serverless functions hosting.
                </li>
                <li>
                  <strong className="text-foreground">Vercel</strong> — Web
                  application hosting and deployment.
                </li>
                <li>
                  <strong className="text-foreground">Stripe</strong> — Payment
                  processing and subscription management.
                </li>
                <li>
                  <strong className="text-foreground">LLM Providers</strong>{" "}
                  (OpenAI, Anthropic, Google, Together AI) — AI response
                  generation.
                </li>
              </ul>
              <p className="mt-3">
                Each of these services has its own privacy policy. We encourage
                you to review their policies to understand how they handle your
                data.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                7. Data Retention
              </h2>
              <p className="mb-3">
                We retain your account information and conversation data for as
                long as your account is active or as needed to provide the
                Service. You may delete individual conversations at any time
                through the application. If you delete your account, we will
                delete or anonymize your personal data within 30 days, except
                where retention is required by law or for legitimate business
                purposes (such as resolving disputes or enforcing our
                agreements).
              </p>
              <p>
                Usage logs and analytics data are retained in anonymized or
                aggregated form for up to 24 months for the purpose of service
                improvement.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                8. Your Rights
              </h2>
              <p className="mb-3">
                Depending on your jurisdiction, you may have the following
                rights regarding your personal data:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong className="text-foreground">Access:</strong> Request a
                  copy of the personal data we hold about you.
                </li>
                <li>
                  <strong className="text-foreground">Correction:</strong>{" "}
                  Request correction of inaccurate or incomplete data.
                </li>
                <li>
                  <strong className="text-foreground">Deletion:</strong> Request
                  deletion of your personal data, subject to certain legal
                  exceptions.
                </li>
                <li>
                  <strong className="text-foreground">Export:</strong> Request a
                  portable copy of your data in a structured, commonly used
                  format.
                </li>
                <li>
                  <strong className="text-foreground">Restriction:</strong>{" "}
                  Request restriction of processing of your personal data in
                  certain circumstances.
                </li>
                <li>
                  <strong className="text-foreground">Objection:</strong> Object
                  to processing of your personal data for certain purposes.
                </li>
                <li>
                  <strong className="text-foreground">Withdrawal of Consent:</strong>{" "}
                  Withdraw consent where processing is based on your consent,
                  without affecting the lawfulness of prior processing.
                </li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a
                  href="mailto:privacy@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  privacy@vyroo.ai
                </a>
                . We will respond to your request within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                9. Children's Privacy
              </h2>
              <p>
                The Service is not intended for children under the age of 13.
                We do not knowingly collect personal information from children
                under 13. If we become aware that we have collected personal
                data from a child under 13, we will take steps to delete that
                information promptly. If you believe a child under 13 has
                provided us with personal data, please contact us at{" "}
                <a
                  href="mailto:privacy@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  privacy@vyroo.ai
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                10. GDPR Compliance
              </h2>
              <p className="mb-3">
                If you are located in the European Economic Area (EEA), United
                Kingdom, or Switzerland, the following additional provisions
                apply:
              </p>
              <p className="mb-3">
                <strong className="text-foreground">Legal Basis for Processing:</strong>{" "}
                We process your personal data on the following legal bases:
                performance of a contract (to provide the Service), legitimate
                interests (to improve the Service, ensure security, and prevent
                fraud), consent (where you have opted in, such as for marketing
                communications), and compliance with legal obligations.
              </p>
              <p className="mb-3">
                <strong className="text-foreground">International Data Transfers:</strong>{" "}
                Your data may be transferred to and processed in the United
                States, where our servers and third-party providers are located.
                We rely on Standard Contractual Clauses (SCCs) and other legally
                approved transfer mechanisms to ensure adequate protection of
                your data.
              </p>
              <p>
                <strong className="text-foreground">Data Protection Authority:</strong>{" "}
                You have the right to lodge a complaint with your local data
                protection authority if you believe your data has been processed
                in a manner inconsistent with applicable data protection law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                11. California Privacy Rights
              </h2>
              <p>
                If you are a California resident, you may have additional rights
                under the California Consumer Privacy Act (CCPA), including the
                right to know what personal information we collect, the right to
                request deletion, and the right to opt out of the sale of
                personal information. We do not sell your personal information.
                To exercise your California privacy rights, contact us at{" "}
                <a
                  href="mailto:privacy@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  privacy@vyroo.ai
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                12. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                notify you of material changes by posting the new policy on this
                page and updating the effective date. For significant changes, we
                will provide notice via email or in-product notification. Your
                continued use of the Service after changes constitutes
                acceptance of the revised policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                13. Contact Us
              </h2>
              <p>
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at{" "}
                <a
                  href="mailto:privacy@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  privacy@vyroo.ai
                </a>
                .
              </p>
              <p className="mt-3">
                Stronghold Labs
                <br />
                Email:{" "}
                <a
                  href="mailto:privacy@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  privacy@vyroo.ai
                </a>
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms of Service
              </Link>
              <span>&middot;</span>
              <Link to="/cookies" className="hover:text-foreground transition-colors">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Privacy;
