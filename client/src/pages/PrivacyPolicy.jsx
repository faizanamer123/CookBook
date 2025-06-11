import React from 'react';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
  return (
    <div className={styles.container}>
      <h1>Privacy Policy</h1>
      <div className={styles.content}>
        <section>
          <h2>1. Information We Collect</h2>
          <p>When you use CookBook, we collect:</p>
          <ul>
            <li>Your email address and basic profile information when you register</li>
            <li>Your Google account information when you sign in with Google</li>
            <li>Your recipe content and preferences</li>
            <li>Usage data to improve our service</li>
          </ul>
        </section>

        <section>
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and maintain our service</li>
            <li>Improve user experience</li>
            <li>Send you important updates</li>
            <li>Protect against unauthorized access</li>
          </ul>
        </section>

        <section>
          <h2>3. Data Security</h2>
          <p>We implement appropriate security measures to protect your personal information.</p>
        </section>

        <section>
          <h2>4. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p>Email: faizan.amer.390@gmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 