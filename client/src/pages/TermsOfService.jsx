import React from 'react';
import styles from './TermsOfService.module.css';

const TermsOfService = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Terms of Service</h1>
        
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Acceptance of Terms</h2>
          <p className={styles.text}>
            By accessing and using CookBook, you accept and agree to be bound by the terms and conditions of this agreement.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Use License</h2>
          <p className={styles.text}>
            Permission is granted to temporarily use CookBook for personal, non-commercial purposes only.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. User Content</h2>
          <p className={styles.text}>
            You are responsible for the content you post on CookBook, including recipes and comments.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Privacy</h2>
          <p className={styles.text}>
            Your use of CookBook is also governed by our <a href="/privacy" className={styles.link}>Privacy Policy</a>.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Contact Information</h2>
          <p className={styles.text}>If you have any questions about these Terms, please contact us at:</p>
          <p className={styles.contact}>Email: faizan.amer.390@gmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService; 