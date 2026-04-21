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

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <div className="mt-2 mb-8 flex items-center gap-2">
            <Stamp className="text-[10px]">
              Last updated · March 29, 2026
            </Stamp>
          </div>

          <H2>Who We Are</H2>
          <P>
            AO Solutions LLC ("we", "us", or "our") operates the Debrecht
            Command Center platform, an AI-powered property management data
            assistant accessible via SMS text messaging.
          </P>

          <H2>Information We Collect</H2>
          <P>
            When you interact with the Debrecht Command Center SMS service, we
            may collect the following information:
          </P>
          <ul className="mb-3 ml-5 text-[15px] leading-[1.9] text-label list-disc">
            <li>Your phone number</li>
            <li>The content of SMS messages you send and receive</li>
            <li>
              Property and financial data related to your management queries
            </li>
          </ul>

          <H2>How We Use Your Information</H2>
          <P>
            We use the information we collect solely to respond to your
            property management queries via SMS. This includes retrieving
            property data, financial summaries, occupancy information, and
            draw/invoice details relevant to your requests.
          </P>

          <H2>Data Sharing</H2>
          <P>
            We do not sell, rent, or share your personal information with
            third parties. Your data is not used for marketing purposes. We do
            not share your opt-in data or consent status with any third
            parties.
          </P>

          <H2>Data Storage and Security</H2>
          <P>
            Your data is stored securely in our Supabase database with
            appropriate technical and organizational measures to protect
            against unauthorized access, alteration, disclosure, or
            destruction.
          </P>

          <H2>Data Retention</H2>
          <P>
            We retain your data only for as long as necessary to provide our
            services and comply with legal obligations. You may request
            deletion of your data at any time by contacting us.
          </P>

          <H2>Your Rights</H2>
          <P>
            You have the right to access, correct, or delete the personal
            information we hold about you. You may opt out of SMS
            communications at any time by replying STOP to any message.
          </P>

          <H2>Contact Us</H2>
          <P>
            If you have questions about this Privacy Policy or wish to
            exercise your data rights, contact us at{" "}
            <Link href="mailto:services@ao-solutions.io">
              services@ao-solutions.io
            </Link>
            .
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
