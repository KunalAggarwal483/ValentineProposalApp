
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, Music, Star, Flower2, HeartHandshake, Volume2, VolumeX } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GoogleGenAI } from "@google/genai";

const FloatingHearts = () => {
  const [hearts, setHearts] = useState<any[]>([]);

  useEffect(() => {
    const newHearts = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * (40 - 15) + 15}px`,
      delay: `${Math.random() * 15}s`,
      duration: `${Math.random() * (20 - 10) + 10}s`,
    }));
    setHearts(newHearts);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {hearts.map((heart) => (
        <div
          key={heart.id}
          className="heart-particle text-rose-300 opacity-40"
          style={{
            left: heart.left,
            fontSize: heart.size,
            animationDelay: heart.delay,
            animationDuration: heart.duration,
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
};

export default function App() {
  const [isAccepted, setIsAccepted] = useState(false);
  const [noButtonPos, setNoButtonPos] = useState({ x: 0, y: 0 });
  const [moveCount, setMoveCount] = useState(0);
  const [sweetMessage, setSweetMessage] = useState("");
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  // Ref for the moving button to measure it
  const movingButtonRef = useRef<HTMLButtonElement>(null);
  
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const successSfxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const bgAudio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3');
    bgAudio.loop = true;
    bgAudio.volume = 0.3;
    bgAudio.crossOrigin = "anonymous";
    bgMusicRef.current = bgAudio;

    const sfxAudio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    sfxAudio.volume = 0.5;
    sfxAudio.crossOrigin = "anonymous";
    successSfxRef.current = sfxAudio;

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  const toggleMusic = () => {
    if (bgMusicRef.current) {
      if (isMuted) {
        bgMusicRef.current.play().then(() => setIsMuted(false)).catch(console.error);
      } else {
        bgMusicRef.current.pause();
        setIsMuted(true);
      }
    }
  };

  const generateSweetNote = useCallback(async () => {
    setIsLoadingMessage(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Write a very short, poetic, and romantic 2-line message for my girlfriend 'Jaanu' who just agreed to be my Valentine. Make it super sweet and charming.",
      });
      setSweetMessage(response.text || "You've made me the happiest person alive! ❤️");
    } catch (error) {
      setSweetMessage("I promise to make every day feel like Valentine's Day with you! ❤️");
    } finally {
      setIsLoadingMessage(false);
    }
  }, []);

  const moveButton = useCallback(() => {
    // Viewport dimensions
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Estimate button dimensions if ref not available yet (first move)
    // Average size of the button is around 150x60
    const btnWidth = movingButtonRef.current?.offsetWidth || 150;
    const btnHeight = movingButtonRef.current?.offsetHeight || 60;

    // Safety margin from edges
    const margin = 20;

    // Calculate valid range
    // We ensure the top-left corner is chosen such that the whole button fits
    const maxLeft = vw - btnWidth - margin;
    const maxTop = vh - btnHeight - margin;

    // Generate random coordinates within Safe Zone
    // Math.max(margin, ...) ensures we don't return negative values if screen is tiny
    const newX = Math.max(margin, Math.random() * (maxLeft - margin) + margin);
    const newY = Math.max(margin, Math.random() * (maxTop - margin) + margin);

    setNoButtonPos({ x: newX, y: newY });
    setMoveCount(prev => prev + 1);
  }, []);

  const handleNoInteraction = (e: React.MouseEvent | React.TouchEvent) => {
    // If it's a touch event, prevent default to stop scrolling/clicking through
    if (e.type === 'touchstart') {
      // e.preventDefault(); // Optional: might block scrolling if user misses button
    }
    moveButton();
  };

  const handleYesClick = () => {
    setIsAccepted(true);
    if (successSfxRef.current) {
      successSfxRef.current.play().catch(() => {});
    }
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff4d6d', '#ff758f', '#ffb3c1', '#ffffff']
    });
    generateSweetNote();
  };

  const getNoButtonText = () => {
    const texts = [
      "No", "Are you sure?", "Think again!", "Puh-lease?", 
      "You're misclicking!", "Try the other one!", "Calculated mistake?", 
      "Wait, what?", "Jaanu, please!", "Not an option!"
    ];
    return texts[Math.min(moveCount, texts.length - 1)];
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-rose-100 via-pink-50 to-rose-200 overflow-hidden px-4">
      <FloatingHearts />

      {/* Music Toggle */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={toggleMusic}
        className="fixed top-6 right-6 z-[100] p-3 bg-white/40 backdrop-blur-md border border-rose-200 rounded-full shadow-lg text-rose-500 hover:bg-rose-100 transition-all focus:outline-none"
      >
        {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6 animate-pulse" />}
      </motion.button>

      {/* MOVING NO BUTTON - Rendered at Root Level to avoid Transform Context Issues */}
      {/* Only show this fixed button when moveCount > 0 and not accepted */}
      {!isAccepted && moveCount > 0 && (
        <motion.button
          ref={movingButtonRef}
          initial={{ scale: 0 }}
          animate={{ scale: 1, x: noButtonPos.x, y: noButtonPos.y }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20,
            x: { duration: 0 }, // Instant position update for responsiveness
            y: { duration: 0 }
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 9999, // Highest z-index to ensure visibility
          }}
          onMouseEnter={handleNoInteraction}
          onTouchStart={handleNoInteraction}
          onClick={handleNoInteraction}
          className="px-8 py-4 bg-gray-200 text-gray-600 rounded-full font-bold text-xl shadow-xl whitespace-nowrap min-w-[120px] border-2 border-gray-300"
        >
          {getNoButtonText()}
        </motion.button>
      )}

      <AnimatePresence mode="wait">
        {!isAccepted ? (
          <motion.div
            key="proposal"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="z-10 w-full max-w-lg bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12 border-4 border-rose-200 text-center relative"
          >
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-rose-500 p-4 rounded-full shadow-lg border-4 border-white">
              <Heart className="w-12 h-12 text-white fill-current animate-pulse" />
            </div>

            <motion.h1 className="mt-8 text-4xl md:text-5xl font-romantic text-rose-600 font-bold mb-4">
              Hi Jaanu ❤️
            </motion.h1>

            <p className="text-xl text-gray-700 font-medium mb-8 leading-relaxed">
              Every moment with you feels like a dream I never want to wake up from. 
              My heart beats just for you.
              <br />
              <span className="font-bold text-rose-500 text-2xl mt-4 block">
                Will you be my Valentine?
              </span>
            </p>

            <div className="flex flex-col md:flex-row items-center justify-center gap-6 relative min-h-[100px]">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleYesClick}
                className="px-10 py-4 bg-rose-500 text-white rounded-full font-bold text-xl shadow-lg hover:bg-rose-600 transition-colors flex items-center gap-2 group z-20"
              >
                YES! <Heart className="w-5 h-5 fill-current group-hover:scale-125 transition-transform" />
              </motion.button>

              {/* ORIGINAL NO BUTTON (Shows initially) */}
              {moveCount === 0 && (
                <button
                  onMouseEnter={handleNoInteraction}
                  onTouchStart={handleNoInteraction}
                  className="px-8 py-4 bg-gray-200 text-gray-600 rounded-full font-bold text-xl shadow-md whitespace-nowrap min-w-[120px]"
                >
                  No
                </button>
              )}

              {/* PLACEHOLDER BUTTON (Keeps layout stable when button moves out) */}
              {moveCount > 0 && (
                <button
                  className="px-8 py-4 bg-transparent text-transparent rounded-full font-bold text-xl shadow-none whitespace-nowrap min-w-[120px] pointer-events-none select-none border-0"
                  aria-hidden="true"
                >
                  No
                </button>
              )}
            </div>

            <div className="mt-12 flex justify-center gap-4 text-rose-300">
              <Sparkles className="w-6 h-6 animate-bounce" />
              <Flower2 className="w-6 h-6 animate-spin-slow" />
              <Music className="w-6 h-6 animate-pulse" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 w-full max-w-2xl text-center"
          >
            <div className="bg-white/90 backdrop-blur-lg rounded-[2rem] shadow-2xl p-10 md:p-16 border-8 border-double border-rose-300 relative overflow-hidden">
              <div className="flex justify-center mb-6">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                  <HeartHandshake className="w-24 h-24 text-rose-500" />
                </motion.div>
              </div>

              <h2 className="text-5xl md:text-6xl font-romantic text-rose-600 mb-6">
                Yay! I Knew It! 💖
              </h2>

              <p className="text-2xl text-rose-800 font-medium mb-8">
                You've made me the happiest person in the world, Jaanu.
              </p>

              <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100 italic text-gray-600 min-h-[100px] flex items-center justify-center">
                {isLoadingMessage ? (
                  <div className="flex gap-2"><div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-75"></div></div>
                ) : (
                  <p className="text-xl">"{sweetMessage}"</p>
                )}
              </div>

              <div className="mt-10 grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden shadow-md aspect-square">
                    <img src={`https://picsum.photos/seed/${i + 200}/300/300`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>

              <p className="mt-8 text-rose-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 fill-current" /> Together Forever <Heart className="w-4 h-4 fill-current" />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-4 right-4 text-rose-300 opacity-30 text-xs pointer-events-none">
        Made with ❤️ for Jaanu
      </div>
    </div>
  );
}
