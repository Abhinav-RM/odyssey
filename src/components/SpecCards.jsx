import { motion } from 'framer-motion';

const specs = [
  {
    label: 'Propulsion',
    value: 'DUAL ION DRIVE',
    desc: 'Twin magneto-plasma thrusters generating 4.2MN of continuous thrust with 98.7% fuel efficiency.',
    direction: 'left',
  },
  {
    label: 'Max Velocity',
    value: '0.12c',
    desc: 'Peak cruise velocity at 12% the speed of light. Relativistic shielding engaged above 0.08c.',
    direction: 'right',
  },
  {
    label: 'Hull Composite',
    value: 'TITANIUM-X7',
    desc: 'Woven carbon-titanium lattice with self-healing nano-membrane. Rated for 2400K re-entry temps.',
    direction: 'left',
  },
  {
    label: 'Crew Capacity',
    value: '6 OPERATORS',
    desc: 'Full life-support for 18-month deep space missions. Cryo-stasis pods for extended voyages.',
    direction: 'right',
  },
];

const cardVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction === 'left' ? -80 : 80,
  }),
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export default function SpecCards() {
  return (
    <section className="specs-section">
      <motion.div
        className="specs-header"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
      >
        <h2>VANGUARD</h2>
        <div className="accent-line" />
      </motion.div>

      <div className="specs-grid">
        {specs.map((spec, i) => (
          <motion.div
            key={spec.label}
            className="spec-card"
            custom={spec.direction}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="spec-label">{spec.label}</div>
            <div className="spec-value">{spec.value}</div>
            <div className="spec-desc">{spec.desc}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
