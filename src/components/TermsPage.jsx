import React from "react";
import { T } from "../data/jobs";

const S = {
  page: {
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    background: T.bg0,
    minHeight: "100vh",
    color: T.text0,
    padding: "48px 24px",
    display: "flex",
    justifyContent: "center",
  },
  container: {
    maxWidth: 680,
    width: "100%",
  },
  brand: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 14,
    fontWeight: 700,
    color: T.gold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 32,
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 28,
    fontWeight: 700,
    color: T.text0,
    marginBottom: 8,
  },
  updated: {
    fontSize: 12,
    color: T.text2,
    marginBottom: 36,
  },
  h2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: 18,
    fontWeight: 700,
    color: T.text0,
    marginTop: 32,
    marginBottom: 12,
  },
  p: {
    fontSize: 14,
    lineHeight: 1.7,
    color: T.text1,
    marginBottom: 12,
  },
  link: {
    color: T.gold,
    textDecoration: "none",
  },
};

export default function TermsPage() {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.brand}>Debrecht Command Center</div>
        <h1 style={S.h1}>Terms and Conditions</h1>
        <p style={S.updated}>Last updated: March 29, 2026</p>

        <h2 style={S.h2}>Program Description</h2>
        <p style={S.p}>
          Debrecht Command Center SMS is an AI-powered property management data
          assistant operated by AO Solutions LLC on behalf of Debrecht
          Properties. The service allows authorized users to query property
          management data -- including occupancy, financials, draw status, and
          invoice details -- via text message.
        </p>

        <h2 style={S.h2}>Consent and Opt-In</h2>
        <p style={S.p}>
          By texting the Debrecht Command Center SMS number, you consent to
          receive automated SMS messages in response to your queries. Consent is
          not a condition of purchase of any goods or services.
        </p>

        <h2 style={S.h2}>Message Frequency</h2>
        <p style={S.p}>
          Message frequency varies based on your queries. You will receive
          responses to each message you send. No recurring marketing messages
          will be sent.
        </p>

        <h2 style={S.h2}>Message and Data Rates</h2>
        <p style={S.p}>
          Message and data rates may apply. Check with your mobile carrier for
          details on your messaging plan.
        </p>

        <h2 style={S.h2}>Opt-Out</h2>
        <p style={S.p}>
          You may opt out of SMS communications at any time by replying{" "}
          <strong style={{ color: T.text0 }}>STOP</strong> to any message. You
          will receive a confirmation message and no further messages will be
          sent unless you re-subscribe.
        </p>

        <h2 style={S.h2}>Help</h2>
        <p style={S.p}>
          For assistance, reply <strong style={{ color: T.text0 }}>HELP</strong>{" "}
          to any message, or contact us at{" "}
          <a href="mailto:services@ao-solutions.io" style={S.link}>
            services@ao-solutions.io
          </a>.
        </p>

        <h2 style={S.h2}>Privacy</h2>
        <p style={S.p}>
          Your privacy is important to us. Please review our{" "}
          <a href="/privacy" style={S.link}>
            Privacy Policy
          </a>{" "}
          for details on how we collect, use, and protect your information.
        </p>

        <h2 style={S.h2}>Liability</h2>
        <p style={S.p}>
          The information provided through the Debrecht Command Center SMS
          service is for informational purposes only. AO Solutions LLC makes no
          warranties regarding the accuracy or completeness of data provided via
          SMS and shall not be liable for any decisions made based on such
          information.
        </p>

        <h2 style={S.h2}>Modifications</h2>
        <p style={S.p}>
          We reserve the right to modify these terms at any time. Continued use
          of the SMS service after changes constitutes acceptance of the updated
          terms.
        </p>

        <h2 style={S.h2}>Contact</h2>
        <p style={S.p}>
          AO Solutions LLC, operating on behalf of Debrecht Properties.
          <br />
          Email:{" "}
          <a href="mailto:services@ao-solutions.io" style={S.link}>
            services@ao-solutions.io
          </a>
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.text2 }}>
          AO Solutions LLC
        </div>
      </div>
    </div>
  );
}
