import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";

const Terms = () => {
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
            Terms of Service
          </h1>
          <p className="text-sm text-muted-foreground mb-10">
            Effective Date: March 21, 2026
          </p>

          <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using Vyroo (available at vyroo.ai), operated by
                Stronghold Labs ("we," "us," or "our"), you agree to be bound by
                these Terms of Service. If you do not agree to these terms, you
                may not access or use the Service. We reserve the right to update
                these terms at any time. Continued use of the Service after
                changes constitutes acceptance of the revised terms. We will
                notify registered users of material changes via email or
                in-product notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                2. Description of Service
              </h2>
              <p>
                Vyroo is a general-purpose AI assistant platform that provides
                conversational AI capabilities powered by multiple large language
                model (LLM) providers, including OpenAI, Anthropic, Google, and
                Meta. The Service includes features such as multi-provider AI
                chat with streaming responses, a computer panel for code editing
                and research, voice input, conversation history, connectors to
                third-party services, customizable skills, and a plugin
                architecture. Vyroo is available as a web application and as a
                desktop application via Electron.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                3. User Accounts
              </h2>
              <p className="mb-3">
                To access certain features of the Service, you must create an
                account. You may register using email, Google OAuth, or GitHub
                OAuth. You are responsible for maintaining the confidentiality of
                your account credentials and for all activities that occur under
                your account. You agree to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Provide accurate, current, and complete information during
                  registration.
                </li>
                <li>
                  Keep your account information up to date.
                </li>
                <li>
                  Notify us immediately of any unauthorized use of your account.
                </li>
                <li>
                  Not share your account credentials with any third party.
                </li>
              </ul>
              <p className="mt-3">
                You must be at least 13 years of age to create an account and
                use the Service. If you are under 18, you must have parental or
                guardian consent.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                4. Acceptable Use Policy
              </h2>
              <p className="mb-3">
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Violate any applicable local, state, national, or
                  international law or regulation.
                </li>
                <li>
                  Generate, distribute, or facilitate content that is illegal,
                  harmful, threatening, abusive, harassing, defamatory, vulgar,
                  obscene, or otherwise objectionable.
                </li>
                <li>
                  Attempt to generate content that promotes violence, terrorism,
                  exploitation of minors, or hate speech.
                </li>
                <li>
                  Use AI-generated outputs to deceive, defraud, or mislead
                  others, including but not limited to impersonation, generating
                  fake reviews, or creating disinformation.
                </li>
                <li>
                  Reverse engineer, decompile, disassemble, or attempt to
                  extract the source code or underlying models of the Service.
                </li>
                <li>
                  Interfere with or disrupt the integrity or performance of the
                  Service or its infrastructure.
                </li>
                <li>
                  Attempt to gain unauthorized access to the Service, other user
                  accounts, or connected systems.
                </li>
                <li>
                  Use the Service to develop competing AI products by
                  systematically extracting model outputs.
                </li>
                <li>
                  Circumvent any rate limits, usage quotas, or technical
                  restrictions imposed by the Service.
                </li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate accounts that
                violate this policy, at our sole discretion, with or without
                notice.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                5. Intellectual Property
              </h2>
              <p className="mb-3">
                <strong className="text-foreground">Your Content:</strong> You
                retain ownership of all content you input into the Service,
                including prompts, uploaded files, and any data you provide. By
                using the Service, you grant us a limited, non-exclusive license
                to process your content solely to provide and improve the
                Service.
              </p>
              <p className="mb-3">
                <strong className="text-foreground">AI-Generated Output:</strong>{" "}
                Subject to these Terms, you own the outputs generated by the AI
                in response to your inputs, to the extent permitted by
                applicable law. You are solely responsible for how you use
                AI-generated outputs.
              </p>
              <p>
                <strong className="text-foreground">Our Platform:</strong> The
                Service, including its software, design, branding, logos, and
                documentation, is owned by Stronghold Labs and protected by
                intellectual property laws. These Terms do not grant you any
                right, title, or interest in the Service beyond the limited
                right to use it as described herein.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                6. AI-Generated Content Disclaimer
              </h2>
              <p>
                The Service uses third-party large language models to generate
                responses. AI-generated content may be inaccurate, incomplete,
                outdated, or inappropriate. We do not guarantee the accuracy,
                reliability, or suitability of any AI-generated output. You
                should not rely on AI-generated content as a substitute for
                professional advice, including but not limited to medical, legal,
                financial, or engineering advice. You are solely responsible for
                reviewing, verifying, and determining the appropriateness of any
                AI-generated content before using it. We disclaim all liability
                for any damages resulting from reliance on AI-generated outputs.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                7. Payment and Billing
              </h2>
              <p className="mb-3">
                Vyroo offers free and paid subscription plans. Paid plans are
                billed on a monthly or annual basis through Stripe, our
                third-party payment processor. By subscribing to a paid plan,
                you agree to pay the applicable fees and authorize us to charge
                your payment method on a recurring basis.
              </p>
              <p className="mb-3">
                Subscription fees are non-refundable except as required by
                applicable law or as expressly stated in our refund policy. We
                reserve the right to change our pricing with 30 days' advance
                notice. Price changes will take effect at the start of your next
                billing cycle.
              </p>
              <p>
                You may cancel your subscription at any time through your
                account settings. Cancellation takes effect at the end of the
                current billing period. You will retain access to paid features
                until the end of your billing cycle.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                8. Third-Party Services and Connectors
              </h2>
              <p>
                The Service allows you to connect third-party services (such as
                Google, GitHub, Slack, Notion, and Shopify) via OAuth or API
                keys. When you connect a third-party service, you authorize
                Vyroo to access and process data from that service on your
                behalf. Your use of third-party services is governed by their
                respective terms of service and privacy policies. We are not
                responsible for the availability, accuracy, or practices of any
                third-party service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                9. Termination
              </h2>
              <p className="mb-3">
                You may terminate your account at any time by contacting us at
                support@vyroo.ai or through your account settings. We may
                suspend or terminate your account at any time, with or without
                cause, including for violation of these Terms.
              </p>
              <p>
                Upon termination, your right to use the Service ceases
                immediately. We may retain certain data as required by law or
                for legitimate business purposes. You may request deletion of
                your data by contacting us at support@vyroo.ai.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                10. Disclaimer of Warranties
              </h2>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY.
                TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL
                WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
                NON-INFRINGEMENT, AND ANY WARRANTIES ARISING FROM COURSE OF
                DEALING OR USAGE OF TRADE. WE DO NOT WARRANT THAT THE SERVICE
                WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES
                OR OTHER HARMFUL COMPONENTS.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                11. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, STRONGHOLD
                LABS AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, AND
                AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT
                LIMITED TO LOSS OF PROFITS, DATA, USE, OR GOODWILL, ARISING OUT
                OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE, WHETHER BASED
                ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER
                LEGAL THEORY, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY
                OF SUCH DAMAGES. OUR TOTAL AGGREGATE LIABILITY SHALL NOT EXCEED
                THE GREATER OF (A) THE AMOUNT YOU PAID US IN THE TWELVE (12)
                MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS
                ($100.00).
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                12. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless Stronghold
                Labs and its officers, directors, employees, and agents from and
                against any claims, liabilities, damages, losses, and expenses,
                including reasonable attorneys' fees, arising out of or related
                to your use of the Service, your violation of these Terms, or
                your violation of any rights of a third party.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                13. Governing Law and Dispute Resolution
              </h2>
              <p>
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Delaware, United States, without
                regard to its conflict of law provisions. Any disputes arising
                under or in connection with these Terms shall be resolved
                exclusively in the state or federal courts located in
                Wilmington, Delaware. You consent to the personal jurisdiction
                of such courts.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                14. Miscellaneous
              </h2>
              <p className="mb-3">
                <strong className="text-foreground">Severability:</strong> If
                any provision of these Terms is found to be unenforceable, the
                remaining provisions shall remain in full force and effect.
              </p>
              <p className="mb-3">
                <strong className="text-foreground">Entire Agreement:</strong>{" "}
                These Terms, together with our Privacy Policy and Cookie Policy,
                constitute the entire agreement between you and Stronghold Labs
                regarding the Service.
              </p>
              <p>
                <strong className="text-foreground">Waiver:</strong> Our failure
                to enforce any right or provision of these Terms shall not
                constitute a waiver of such right or provision.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-medium text-foreground mb-3">
                15. Contact Us
              </h2>
              <p>
                If you have any questions about these Terms, please contact us
                at{" "}
                <a
                  href="mailto:support@vyroo.ai"
                  className="text-primary hover:underline"
                >
                  support@vyroo.ai
                </a>
                .
              </p>
            </section>
          </div>

          <div className="mt-12 pt-6 border-t border-border">
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy Policy
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

export default Terms;
