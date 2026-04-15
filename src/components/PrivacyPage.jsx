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

export default function PrivacyPage() {
  return (
    <div style={S.page}>
      <div style={S.container}>
        <div style={S.brand}>Debrecht Command Center</div>
        <h1 style={S.h1}>Privacy Policy</h1>
        <p style={S.updated}>Last updated: March 29, 2026</p>

        <h2 style={S.h2}>Who We Are</h2>
        <p style={S.p}>
          AO Solutions LLC ("we", "us", or "our") operates the Debrecht Command
          Center platform, an AI-powered property management data assistant
          accessible via SMS text messaging.
        </p>

        <h2 style={S.h2}>Information We Collect</h2>
        <p style={S.p}>
          When you interact with the Debrecht Command Center SMS service, we may
          collect the following information:
        </p>
        <ul style={{ ...S.p, paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Your phone number</li>
          <li style={{ marginBottom: 6 }}>The content of SMS messages you send to and receive from our service</li>
          <li style={{ marginBottom: 6 }}>Property and financial data related to your management queries</li>
        </ul>

        <h2 style={S.h2}>How We Use Your Information</h2>
        <p style={S.p}>
          We use the information we collect solely to respond to your property
          management queries via SMS. This includes retrieving property data,
          financial summaries, occupancy information, and draw/invoice details
          relevant to your requests.
        </p>

        <h2 style={S.h2}>Data Sharing</h2>
        <p style={S.p}>
          We do not sell, rent, or share your personal information with third
          parties. Your data is not used for marketing purposes. We do not share
          your opt-in data or consent status with any third parties.
        </p>

        <h2 style={S.h2}>Data Storage and Security</h2>
        <p style={S.p}>
          Your data is stored securely in our Supabase database with appropriate
          technical and organizational measures to protect against unauthorized
          access, alteration, disclosure, or destruction.
        </p>

        <h2 style={S.h2}>Data Retention</h2>
        <p style={S.p}>
          We retain your data only for as long as necessary to provide our
          services and comply with legal obligations. You may request deletion of
          your data at any time by contacting us.
        </p>

        <h2 style={S.h2}>Your Rights</h2>
        <p style={S.p}>
          You have the right to access, correct, or delete the personal
          information we hold about you. You may opt out of SMS communications at
          any time by replying STOP to any message.
        </p>

        <h2 style={S.h2}>Contact Us</h2>
        <p style={S.p}>
          If you have questions about this Privacy Policy or wish to exercise
          your data rights, contact us at{" "}
          <a href="mailto:services@ao-solutions.io" style={S.link}>
            services@ao-solutions.io
          </a>.
        </p>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: `1px solid ${T.border}`, fontSize: 12, color: T.text2 }}>
          AO Solutions LLC
        </div>
      </div>
    </div>
  );
}
