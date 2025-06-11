import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUtensils, FaHeart } from 'react-icons/fa';
import { MdOutlineRestaurantMenu } from 'react-icons/md';
import { motion, useScroll, useTransform } from 'framer-motion';
import styles from './Landing.module.css';

const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  return (
    <div className={styles.container}>
      {/* Hero Section with Parallax */}
      <section className={styles.hero}>
        <motion.div 
          className={styles.heroBackground}
          style={{ opacity, scale }}
        >
          <div className={styles.overlay} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className={styles.heroContent}
        >
          <motion.h1 
            className={styles.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            Discover, Create, and Share
            <span className={styles.highlight}> Your Favorite Recipes</span>
          </motion.h1>
          <motion.p 
            className={styles.subtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            Join our community of food enthusiasts and explore a world of culinary possibilities
          </motion.p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            className={styles.getStartedButton}
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
          >
            Get Started
            <span className={styles.buttonArrow}>→</span>
          </motion.button>
        </motion.div>
      </section>

      {/* Features Section with Cards */}
      <section className={styles.features}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={styles.sectionTitle}
        >
          Why Choose Us
        </motion.h2>
        <div className={styles.featureGrid}>
          {[
            {
              title: 'Discover Recipes',
              description: 'Explore thousands of recipes from around the world',
              icon: <FaSearch className={styles.featureIcon} />,
              image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
            },
            {
              title: 'Create & Share',
              description: 'Share your culinary creations with our community',
              icon: <FaUtensils className={styles.featureIcon} />,
              image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
            },
            {
              title: 'Save Favorites',
              description: 'Keep your favorite recipes organized in one place',
              icon: <FaHeart className={styles.featureIcon} />,
              image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80'
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={styles.featureCard}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
            >
              <div className={styles.featureImage}>
                <img src={feature.image} alt={feature.title} />
                <div className={styles.featureOverlay} />
              </div>
              <div className={styles.featureContent}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action Section with Gradient */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={styles.cta}
      >
        <div className={styles.ctaContent}>
          <motion.h2 
            className={styles.ctaTitle}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Ready to Start Your Culinary Journey?
          </motion.h2>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            className={styles.ctaButton}
            onClick={() => navigate('/login')}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Join Now
            <span className={styles.buttonArrow}>→</span>
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
};

export default Landing; 