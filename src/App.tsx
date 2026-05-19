import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import { AudioLines, Sparkles, Command, Mic, Square } from "lucide-react";

const AppleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12.152 6.896c-.022-2.313 1.905-3.415 1.986-3.468-1.074-1.576-2.748-1.782-3.344-1.815-1.425-.143-2.782.842-3.513.842-.731 0-1.841-.81-2.992-.788-1.517.022-2.915.885-3.69 2.235-1.562 2.709-.395 6.721 1.134 8.92 .743 1.074 1.62 2.279 2.782 2.235 1.118-.044 1.547-.723 2.894-.723 1.347 0 1.733.723 2.915.701 1.205-.022 1.951-1.096 2.682-2.148.843-1.233 1.192-2.427 1.214-2.493-.028-.011-2.336-.893-2.358-3.504L12.152 6.896zm-1.884-5.32c.621-.75 1.042-1.8 1.042-2.84.004-.15-.015-.298-.051-.436-.921.036-2.072.612-2.716 1.385-.516.611-.97 1.688-.867 2.721.157.012.316.02.476.015.823-.005 1.83-.497 2.45-1.246"/>
  </svg>
);

const VoiceVisualizer = () => {
  return (
    <div className="flex items-center gap-1 h-6">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1.5 bg-white rounded-full"
          animate={{
            height: [8, 24, 12, 20, 8],
          }}
          transition={{
            repeat: Infinity,
            duration: 0.6 + i * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Reusable animation components
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    className={className}
  >
    {children}
  </motion.div>
);

const StaggerContainer = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-100px" }}
    variants={{
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.1
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

const StaggerItem = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98] } }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export default function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [text, setText] = useState("Plan a week-long itinerary for a trip to Italy that prioritizes historical sightseeing and local food tours. I prefer to see attractions in the mornings, take naps in the afternoons, and then have nice dinners solid by nightlife in the evenings.");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      setText("");
      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const processAudio = async (audioBlob: Blob) => {
     setIsFormatting(true);
     try {
       // Decode the recorded audio blob into 16kHz raw PCM data in the browser
       const arrayBuffer = await audioBlob.arrayBuffer();
       const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
       const audioBufferDecode = await audioContext.decodeAudioData(arrayBuffer);
       const float32Data = audioBufferDecode.getChannelData(0);

       // Convert Float32 to Int16 PCM for AssemblyAI
       const int16Data = new Int16Array(float32Data.length);
       for (let i = 0; i < float32Data.length; i++) {
         let s = Math.max(-1, Math.min(1, float32Data[i]));
         int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
       }

       // Send the raw int16 binary chunk to our backend
       const res = await fetch("/api/speech-to-text", {
         method: "POST",
         headers: { "Content-Type": "application/octet-stream" },
         body: int16Data.buffer
       });
       
       const data = await res.json();
       
       if (data.text) {
         setText(data.text);
       } else if (data.transcription) {
         setText(data.transcription);
       } else if (typeof data === 'string') {
         setText(data);
       } else {
         setText(JSON.stringify(data));
       }
     } catch (e) {
       console.error("Transcription failed", e);
     } finally {
       setIsFormatting(false);
     }
  };

  if (showDemo) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="min-h-screen bg-[#f9faf5] text-[#1c1917] font-sans relative flex flex-col items-center"
      >
        {/* Demo Header */}
        <header className="w-full flex items-start justify-between px-6 py-6 md:px-10">
          <FadeIn className="flex items-center gap-2 font-pixel text-3xl">
             <AudioLines className="w-8 h-8" /> thinkwsipr
          </FadeIn>

          <StaggerContainer className="hidden md:flex items-center gap-3 mt-2">
            <StaggerItem>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#f59e0b] text-white px-5 py-2 rounded-full font-medium shadow-sm transform -rotate-2 -mt-1 border-[2px] border-black">
                Write the perfect prompt
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-transparent border border-black text-black px-5 py-2 rounded-full font-medium transition-colors">
                Message a friend
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-transparent border border-black text-black px-5 py-2 rounded-full font-medium transition-colors">
                Write a list
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-transparent border border-black text-black px-5 py-2 rounded-full font-medium transition-colors">
                Draft an email
              </motion.button>
            </StaggerItem>
          </StaggerContainer>

          <FadeIn>
            <button onClick={() => setShowDemo(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors text-gray-500 hover:text-black">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </FadeIn>
        </header>

        <main className="flex-1 flex flex-col items-center pt-24 w-full max-w-4xl px-6">
          <FadeIn delay={0.1}>
            <h1 className="font-serif text-[3.5rem] sm:text-[4.5rem] tracking-tight text-center leading-tight mb-4">
              Try writing a detailed AI prompt.
            </h1>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="text-gray-500 text-[1.1rem] md:text-[1.2rem] text-center mb-10 max-w-2xl font-medium">
              thinkwsipr makes it easy to give detailed prompts to ChatGPT, Cursor, or other AI tools.
            </p>
          </FadeIn>

          <FadeIn delay={0.3} className="bg-white rounded-[2rem] w-full p-8 md:p-12 shadow-sm border border-gray-200 min-h-[250px] flex items-start mt-4 overflow-hidden relative">
            <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               placeholder="Start speaking to type..."
               className="w-full h-full min-h-[150px] resize-none outline-none text-gray-800 text-lg md:text-[22px] leading-relaxed bg-transparent"
               disabled={isFormatting}
            />
            
            <AnimatePresence>
              {isFormatting && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                  animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/70 flex items-center justify-center"
                >
                   <div className="flex items-center gap-2 text-[#1c7483] font-medium text-lg">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      Formatting with AI...
                   </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isRecording && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-6 right-8 bg-black/5 px-4 py-2 rounded-full flex items-center gap-3"
                >
                  <div className="flex gap-1 h-3">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#1c7483] rounded-full"
                        animate={{ height: [4, 12, 6, 10, 4] }}
                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[#1c7483] uppercase tracking-wider">Listening...</span>
                </motion.div>
              )}
            </AnimatePresence>
          </FadeIn>
        </main>

        {/* Floating Actions */}
        <div className="fixed bottom-10 left-0 w-full flex justify-between items-end px-10 pointer-events-none">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-16 h-16 bg-[#f0e6fc] rounded-full border-[1.5px] border-black flex items-center justify-center pointer-events-auto hover:scale-105 transition-transform overflow-hidden shadow-sm"
          >
             <svg className="w-7 h-7 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C7 2 3 6 3 11c0 2 .5 3.5 1.5 5" />
                <path d="M8 12c0-2.5 1.5-4 4-4s4 1.5 4 4c0 1.5-.5 3-1.5 4.5" />
                <path d="M11 15c-1-1-1.5-2-1.5-3 0-1.5 1-2.5 2.5-2.5" />
                <path d="M14.5 11c0 2-2 4.5-4.5 4.5" />
                <path d="M21 11c0-4-3-7.5-7-8" />
             </svg>
          </motion.button>
          
          <div className="absolute left-1/2 -translate-x-1/2 bottom-0 pointer-events-auto">
            <motion.button 
              layout
              onClick={toggleRecording}
              disabled={isFormatting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 border-[2px] border-black transition-all ${
                isRecording 
                  ? "bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)]" 
                  : "bg-[#1c7483] hover:bg-[#165f6c]"
              } disabled:opacity-50`}
            >
              {isRecording ? (
                 <>
                   <VoiceVisualizer />
                   <Square className="w-4 h-4 fill-current" />
                   Stop & Format
                 </>
              ) : (
                 <>
                  <Mic className="w-5 h-5" />
                  Start dictating
                 </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1c1917] font-sans selection:bg-gray-200 flex flex-col items-center w-full">
      
      {/* Sticky Pill Navigation */}
      <motion.div 
        initial={{ y: -50, opacity: 0, x: "-50%" }}
        animate={{ y: 0, opacity: 1, x: "-50%" }}
        transition={{ duration: 0.6, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="fixed top-6 left-1/2 z-50"
      >
        <div className="bg-white rounded-full border border-gray-200 shadow-sm flex items-center pr-1.5 pl-5 py-1.5 gap-6">
          <div className="flex items-center gap-2 font-pixel text-2xl tracking-wide pt-1">
             <AudioLines className="w-6 h-6" /> thinkwsipr
          </div>
          <button className="bg-[#1c1917] hover:bg-black transition-colors text-white text-[13px] font-medium px-4 py-2 rounded-full flex items-center gap-2">
            <AppleIcon className="w-3.5 h-3.5 mb-0.5" />
            Download for macOS
          </button>
        </div>
      </motion.div>

      {/* Hero 1 - Full Width Background Holder */}
      <section className="w-full relative flex flex-col items-center justify-center pt-48 pb-32 px-4 bg-gray-100 overflow-hidden min-h-[70vh]">
        <motion.div 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center brightness-[0.7]"
          style={{ backgroundImage: `url('https://framerusercontent.com/images/BD0IjamMdd4pWLkZSrAyKkLeLQ.png?scale-down-to=2048&width=5760&height=4096')` }}
        ></motion.div>
        
        <div className="relative z-10 text-center flex flex-col items-center w-full max-w-4xl mx-auto">
          <FadeIn delay={0.2}>
            <h1 className="font-pixel text-[4rem] sm:text-[5rem] md:text-[6.5rem] text-white leading-none mb-6 drop-shadow-md">
              Speak to your computer
            </h1>
          </FadeIn>
          <FadeIn delay={0.4}>
            <p className="text-[17px] md:text-[19px] text-white max-w-2xl mx-auto mb-10 text-center leading-relaxed drop-shadow-md font-medium">
              <span className="font-bold">thinkwsipr</span> turns your voice into text, write anything, anywhere on your Mac, just by speaking.
            </p>
          </FadeIn>
          <FadeIn delay={0.6}>
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="bg-white text-black font-semibold shadow-md rounded-full px-7 py-3 flex items-center justify-center gap-2.5 mx-auto hover:bg-gray-50 transition-colors"
            >
              <AppleIcon className="w-5 h-5 mb-0.5" />
              Download Now for macOS
            </motion.button>
          </FadeIn>
        </div>
      </section>

      {/* Section 2 - Operate your Mac */}
      <section className="w-full max-w-6xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-10">
          <FadeIn>
            <h2 className="font-pixel text-5xl sm:text-6xl md:text-7xl max-w-xl leading-[0.9] tracking-tight">
              Operate your Mac 100x faster
            </h2>
          </FadeIn>
          <FadeIn delay={0.2} className="md:w-[420px] flex flex-col items-start gap-6 md:pb-2">
            <p className="text-gray-500 text-[17px] leading-relaxed">
              Powerful voice dictation, smart formatting, and real actions built into one seamless workflow.
            </p>
            <button className="border border-gray-300 rounded-full px-5 py-2 flex items-center gap-2 font-medium hover:bg-gray-50 transition-colors text-[14px]">
              <AppleIcon className="w-4 h-4 mb-0.5" />
              Download for macOS
            </button>
          </FadeIn>
        </div>

        {/* 3 Features Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <StaggerItem className="flex flex-col">
            <div className="bg-gray-100 rounded-3xl aspect-[1.3] w-full mb-8 relative border border-gray-100/50 overflow-hidden">
              <img src="https://framerusercontent.com/images/ScCZOdJ3xdMtIAODsZOwr3zuaEM.png?scale-down-to=512&width=704&height=504" alt="Voice Dictation" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold text-lg flex items-center gap-2.5 mb-3">
              <AudioLines className="w-5 h-5" /> Voice Dictation
            </h3>
            <p className="text-gray-500 text-[15px] mb-5 leading-relaxed flex-1">
              Speak to your slack, emails, whatsapp, notes & more.
            </p>
            <p className="text-[14px] font-semibold text-[#1c1917]">Works Everywhere</p>
          </StaggerItem>

          {/* Card 2 */}
          <StaggerItem className="flex flex-col">
            <div className="bg-gray-100 rounded-3xl aspect-[1.3] w-full mb-8 relative border border-gray-100/50 overflow-hidden">
              <img src="https://framerusercontent.com/images/zkSEZRVmJCAqnKwAWWFSR9hgA.png?scale-down-to=512&width=704&height=504" alt="AI Formatting" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold text-lg flex items-center gap-2.5 mb-3">
              <Sparkles className="w-5 h-5" /> AI Formatting
            </h3>
            <p className="text-gray-500 text-[15px] mb-5 leading-relaxed flex-1">
              Removes filler, fixes structure, and matches your tone automatically.
            </p>
            <p className="text-[14px] font-semibold text-[#1c1917]">Cleans As You Speak</p>
          </StaggerItem>

          {/* Card 3 */}
          <StaggerItem className="flex flex-col">
            <div className="bg-gray-100 rounded-3xl aspect-[1.3] w-full mb-8 relative border border-gray-100/50 overflow-hidden">
              <img src="https://framerusercontent.com/images/z5v25NwaEhmeC3RDJSoy08bY2Rs.png?scale-down-to=512&width=696&height=516" alt="Speak to Action" className="absolute inset-0 w-full h-full object-cover" />
            </div>
            <h3 className="font-semibold text-lg flex items-center gap-2.5 mb-3">
              <Command className="w-5 h-5" /> Speak to Action
            </h3>
            <p className="text-gray-500 text-[15px] mb-5 leading-relaxed flex-1">
              Reply to emails, find files, run actions just by asking.
            </p>
            <p className="text-[14px] font-semibold text-[#1c1917]">Stop clicking buttons</p>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Section 3 - Feeling Tired? */}
      <FadeIn className="w-full max-w-5xl mx-auto px-6 py-20 text-center flex flex-col items-center">
        <div className="bg-gray-100 rounded-[2.5rem] aspect-[2.2] w-full mb-14 relative border border-gray-100/50 overflow-hidden">
           <img src="https://framerusercontent.com/images/eNbv4FtaSnW4yTEodgdGlesU4.png?scale-down-to=2048&width=4480&height=1972" alt="Keyboard with Fn highlighted" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <h2 className="text-2xl md:text-[28px] font-medium mb-8 text-[#1c1917]">Feeling Tired? Press Fn</h2>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="border border-gray-300 rounded-full px-5 py-2.5 flex items-center gap-2 font-medium hover:bg-gray-50 transition-colors text-[14px]">
          <AppleIcon className="w-4 h-4 mb-0.5" />
          Download for macOS
        </motion.button>
      </FadeIn>

      {/* Section 3.5 - Try a demo */}
      <section className="w-full py-52 text-center relative overflow-hidden bg-gray-900">
         <motion.div 
           initial={{ scale: 1.1, opacity: 0 }}
           whileInView={{ scale: 1, opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 1 }}
           className="absolute inset-0 bg-cover bg-center brightness-[0.6]"
           style={{ backgroundImage: `url('https://cdn.prod.website-files.com/682f84b3838c89f8ff7667db/683c80552dab37fd47216e74_Frame%2048096435-p-2000.avif')` }}
         ></motion.div>
         
         <div className="relative z-10 flex flex-col items-center">
           <FadeIn>
             <h2 className="font-pixel text-[4.5rem] md:text-[7rem] leading-none mb-10 text-white drop-shadow-md">
               Try a demo
             </h2>
           </FadeIn>
           <FadeIn delay={0.2}>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowDemo(true)} className="bg-white text-black font-semibold shadow-md rounded-full px-10 py-4 flex items-center justify-center gap-2 mx-auto hover:bg-gray-50 transition-colors text-[16px]">
                Try demo
             </motion.button>
           </FadeIn>
         </div>
      </section>

      {/* Section 4 - 4x faster typing */}
      <section className="w-full py-40 mt-16 text-center relative overflow-hidden bg-gray-900">
         <motion.div 
           initial={{ scale: 1.1, opacity: 0 }}
           whileInView={{ scale: 1, opacity: 1 }}
           viewport={{ once: true }}
           transition={{ duration: 1 }}
           className="absolute inset-0 bg-cover bg-center brightness-[0.7]"
           style={{ backgroundImage: `url('https://framerusercontent.com/images/wUcHT2msZa9meRMKPtaIQW5k3U.png?scale-down-to=2048&width=2880&height=1600')` }}
         ></motion.div>
         
         <div className="relative z-10 flex flex-col items-center">
           <FadeIn>
             <div className="inline-flex bg-white rounded-full border border-gray-200 shadow-sm items-center pr-1.5 pl-5 py-1.5 gap-5 mb-14">
                <div className="flex items-center gap-2 font-pixel text-xl pt-1">
                  <AudioLines className="w-6 h-6" /> thinkwsipr
                </div>
                <button className="bg-[#1c1917] hover:bg-black transition-colors text-white text-[13px] font-medium px-4 py-2 rounded-full flex items-center gap-2">
                  <AppleIcon className="w-3.5 h-3.5 mb-0.5" />
                  Download for macOS
                </button>
             </div>
           </FadeIn>

           <FadeIn delay={0.2}>
             <h2 className="font-pixel text-[4.5rem] md:text-[7rem] leading-none mb-6 text-white drop-shadow-md">
               4x faster typing
             </h2>
           </FadeIn>
           <FadeIn delay={0.3}>
             <p className="text-white text-[17px] mb-12 max-w-sm mx-auto drop-shadow-md">
               Start speaking and getting things done in seconds — right from your Mac.
             </p>
           </FadeIn>
           
           <FadeIn delay={0.4}>
             <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-white text-black font-semibold shadow-md rounded-full px-6 py-3 flex items-center justify-center gap-2 mx-auto hover:bg-gray-50 transition-colors">
                <AppleIcon className="w-5 h-5 mb-0.5" />
                Download for free
             </motion.button>
           </FadeIn>
         </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-black text-white pt-24 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start mb-28">
           <div className="mb-10 md:mb-0">
             <div className="flex items-center gap-3 font-pixel text-[2.5rem] pt-1 mb-2">
               <AudioLines className="w-8 h-8" /> thinkwsipr
             </div>
             <p className="text-gray-400 text-[15px]">Created by Anubhav and Daksh</p>
           </div>
           
           <div className="flex items-center gap-3 font-pixel text-[2.5rem] pt-1 text-white/90">
               <AudioLines className="w-8 h-8" /> thinkwsipr
           </div>
        </div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-[13px] text-gray-500 border-t border-gray-800/80 pt-8">
          <p>2026 thinkwsipr All rights reserved.</p>
          <div className="flex flex-wrap justify-center md:justify-end gap-5 md:gap-8 mt-6 md:mt-0">
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Changelog</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Data privacy</a>
          </div>
        </div>
      </footer>
      
    </div>
  );
}
