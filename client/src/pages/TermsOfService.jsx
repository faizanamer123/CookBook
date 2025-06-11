import React from 'react';
import styles from './TermsOfService.module.css';

const TermsOfService = () => {
  return (
    <div className={styles.container}>
      <h1>Terms of Service</h1>
      <div className={styles.content}>
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing and using CookBook, you accept and agree to be bound by the terms and conditions of this agreement.</p>
        </section>

        <section>
          <h2>2. Use License</h2>
          <p>Permission is granted to temporarily use CookBook for personal, non-commercial purposes only.</p>
        </section>

        <section>
          <h2>3. User Content</h2>
          <p>You are responsible for the content you post on CookBook, including recipes and comments.</p>
        </section>

        <section>
          <h2>4. Privacy</h2>
          <p>Your use of CookBook is also governed by our Privacy Policy.</p>
        </section>

        <section>
          <h2>5. Contact Information</h2>
          <p>If you have any questions about these Terms, please contact us at:</p>
          <p>Email: faizan.amer.390@gmail.com</p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService; 