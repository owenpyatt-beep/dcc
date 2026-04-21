import React from "react";
import { Stamp } from "./ui/Typography";
import { LED } from "./ui/LED";

function H2({ children }) {
  return (
    <h2 className="mt-10 mb-3 text-[20px] font-bold text-ink tracking-tight emboss">
      {children}
    </h2>
  );
}

function P({ children }) {
  return (
    <p className="text-[15px] leading-[1.75] text-label mb-3">{children}</p>
  );
}

function Link({ href, children }) {
  return (
    <a
      href={href}
      className="text-accent underline decoration-accent/30 underline-offset-2 hover:decoration-accent"
    >
      {children}
    </a>
  );
}

function Kbd({ children }) {
  return (
    <span className="inline-flex items-center rounded-md bg-chassis px-2 py-0.5 shadow-recessed-sm font-mono text-[11px] font-bold text-ink">
      {children}
    </span>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-chassis py-12 px-6">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg font-extrabold text-white text-sm"
            style={{
              background: "linear-gradient(135deg, #ff4757 0%, #c1323e 100%)",
              boxShadow:
                "3px 3px 8px rgba(166,50,60,0.45), -2px -2px 6px rgba(255,120,130,0.35), inset 1px 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            D
          </div>
          <div>
            <div className="text-[12px] font-bold text-ink leading-tight">
              Debrecht
            </div>
            <Stamp className="text-[8px]">Command Center</Stamp>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-md bg-chassis px-2.5 py-1 shadow-recessed-sm">
            <LED color="green" size={7} pulse />
            <Stamp className="text-[9px]">Legal</Stamp>
          </span>
        </div>

        <div className="rounded-3xl bg-chassis shadow-card screws p-10 md:p-12">
          <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-tight text-ink emboss leading-tight">
            Terms &amp; Conditions
          </h1>
          <div className="mt-2 mb-8 flex items-center gap-2">
            <Stamp className="text-[10px]">
              Last updated · March 29, 2026
            </Stamp>
          </div>

          <H2>Program Description</H2>
          <P>
            Debrecht Command Center SMS is an AI-powered property management
            data assistant operated by AO Solutions LLC on behalf of Debrecht
            Properties. The service allows authorized users to query property
            management data — including occupancy, financials, draw status, and
            invoice details — via text message.
          </P>

          <H2>Consent and Opt-In</H2>
          <P>
            By texting the Debrecht Command Center SMS number, you consent to
            receive automated SMS messages in response to your queries. Consent
            is not a condition of purchase of any goods or services.
          </P>

          <H2>Message Frequency</H2>
          <P>
            Message frequency varies based on your queries. You will receive
            responses to each message you send. No recurring marketing messages
            will be sent.
          </P>

          <H2>Message and Data Rates</H2>
          <P>
            Message and data rates may apply. Check with your mobile carrier
            for details on your messaging plan.
          </P>

          <H2>Opt-Out</H2>
          <P>
            You may opt out of SMS communications at any time by replying{" "}
            <Kbd>STOP</Kbd> to any message. You will receive a confirmation
            message and no further messages will be sent unless you
            re-subscribe.
          </P>

          <H2>Help</H2>
          <P>
            For assistance, reply <Kbd>HELP</Kbd> to any message, or contact
            us at{" "}
            <Link href="mailto:services@ao-solutions.io">
              services@ao-solutions.io
            </Link>
            .
          </P>

          <H2>Privacy</H2>
          <P>
            Your privacy is important to us. Please review our{" "}
            <Link href="/privacy">Privacy Policy</Link> for details on how we
            collect, use, and protect your information.
          </P>

          <H2>Liability</H2>
          <P>
            The information provided through the Debrecht Command Center SMS
            service is for informational purposes only. AO Solutions LLC makes
            no warranties regarding the accuracy or completeness of data
            provided via SMS and shall not be liable for any decisions made
            based on such information.
          </P>

          <H2>Modifications</H2>
          <P>
            We reserve the right to modify these terms at any time. Continued
            use of the SMS service after changes constitutes acceptance of the
            updated terms.
          </P>

          <H2>Contact</H2>
          <P>
            AO Solutions LLC, operating on behalf of Debrecht Properties.
            <br />
            Email:{" "}
            <Link href="mailto:services@ao-solutions.io">
              services@ao-solutions.io
            </Link>
          </P>

          <div className="mt-12 pt-6 border-t border-[rgba(74,85,104,0.1)] flex items-center justify-between">
            <Stamp className="text-[9px]">AO Solutions LLC</Stamp>
            <Stamp className="text-[9px] text-label/60">v1.0</Stamp>
          </div>
        </div>
      </div>
    </div>
  );
}
