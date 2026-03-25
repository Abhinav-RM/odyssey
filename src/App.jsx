import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ScrollExplode from './components/ScrollExplode';
import SpecCards from './components/SpecCards';
import LaunchButton from './components/LaunchButton';
import FlightScene from './components/FlightScene';

function App() {
  const [mode, setMode] = useState('HANGAR'); // HANGAR | TRANSITIONING | FLIGHT
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [triggerReassemble, setTriggerReassemble] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const scrollContainerRef = useRef(null);

  const handleLoadComplete = useCallback(() => {
    setAssetsLoaded(true);
  }, []);

  const handleLaunch = useCallback(() => {
    setTriggerReassemble(true);
  }, []);

  const handleReassembleComplete = useCallback(() => {
    setShowOverlay(true);
    setMode('TRANSITIONING');

    setTimeout(() => {
      setMode('FLIGHT');
      setTimeout(() => {
        setShowOverlay(false);
      }, 800);
    }, 1200);
  }, []);

  // Return to hangar from anywhere
  const returnToHangar = useCallback(() => {
      setShowOverlay(true);
      setTimeout(() => {
        setMode('HANGAR');
        setTriggerReassemble(false);
        setShowOverlay(false);
      }, 800);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {mode === 'HANGAR' && (
          <motion.div
            key="hangar"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="scroll-container" ref={scrollContainerRef} style={{ height: '600vh' }}>
              <ScrollExplode
                onLoadComplete={handleLoadComplete}
                triggerReassemble={triggerReassemble}
                onReassembleComplete={handleReassembleComplete}
                scrollContainerRef={scrollContainerRef}
              />
            </div>

            {assetsLoaded && (
              <>
                <SpecCards />
                <LaunchButton onClick={handleLaunch} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {mode === 'FLIGHT' && (
          <motion.div
            key="flight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          >
            <FlightScene onBack={returnToHangar} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transition overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            className="transition-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default App;

