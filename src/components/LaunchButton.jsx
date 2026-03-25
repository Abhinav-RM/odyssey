import { motion } from 'framer-motion';

export default function LaunchButton({ onClick }) {
  return (
    <section className="launch-section">
      <motion.button
        className="launch-btn"
        onClick={onClick}
        whileTap={{ scale: 0.96 }}
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        🚀&nbsp; TRAVEL
      </motion.button>
    </section>
  );
}
