import React from 'react';
import styles from './PrivacyPolicy.module.css';

const PrivacyPolicy = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Privacy Policy</h1>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Information We Collect</h2>
          <p className={styles.text}>When you use CookBook, we collect:</p>
          <ul className={styles.list}>
            <li>Your email address and basic profile information when you register</li>
            <li>Your Google account information when you sign in with Google</li>
            <li>Your recipe content and preferences</li>
            <li>Usage data to improve our service</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. How We Use Your Information</h2>
          <p className={styles.text}>We use your information to:</p>
          <ul className={styles.list}>
            <li>Provide and maintain our service</li>
            <li>Improve user experience</li>
            <li>Send you important updates</li>
            <li>Protect against unauthorized access</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. Data Security</h2>
          <p className={styles.text}>We implement appropriate security measures to protect your personal information.</p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Contact Us</h2>
          <p className={styles.text}>If you have any questions about this Privacy Policy, please contact us at:</p>
          <p className={styles.contact}>Email: faizan.amer.390@gmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 