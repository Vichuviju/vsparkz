import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import api from '../lib/api';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null); // null = checking, true = ok, false = not connected
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
  const healthUrl = apiBase.replace(/\/api\/?$/, '') + '/api/health';

  const checkBackend = async () => {
    setBackendStatus(null);
    try {
      const res = await fetch(healthUrl, { cache: 'no-store' });
      const data = await res.json();
      setBackendStatus(res.ok && data?.ok === true);
    } catch {
      setBackendStatus(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  // Mouse parallax motion values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor parallax
  const springX = useSpring(mouseX, { stiffness: 60, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 20 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const xVal = (e.clientX - rect.left - width / 2) / 25; // range ~ -15 to 15
    const yVal = (e.clientY - rect.top - height / 2) / 25;
    mouseX.set(xVal);
    mouseY.set(yVal);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const iconRefs = useRef([]);
  const physicsState = useRef([
    { x: 12, y: -20, vx: 0.08, vy: 1.1, rotation: 12, vRotation: 0.6 },
    { x: 24, y: -45, vx: -0.12, vy: 0.7, rotation: 35, vRotation: -0.8 },
    { x: 36, y: -30, vx: 0.15, vy: 1.4, rotation: 65, vRotation: 0.4 },
    { x: 48, y: -65, vx: -0.08, vy: 0.9, rotation: 105, vRotation: -0.5 },
    { x: 60, y: -40, vx: 0.1, vy: 1.2, rotation: 145, vRotation: 0.7 },
    { x: 72, y: -75, vx: -0.18, vy: 1.0, rotation: 185, vRotation: -0.3 },
    { x: 84, y: -50, vx: 0.14, vy: 1.3, rotation: 225, vRotation: 0.5 },
    { x: 92, y: -90, vx: -0.06, vy: 0.8, rotation: 265, vRotation: -0.7 },
  ]);

  const physicsIcons = [
    {
      bg: "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      shadow: "0 10px 20px rgba(220, 39, 67, 0.3)",
      svg: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      )
    },
    {
      bg: "#1877F2",
      shadow: "0 10px 20px rgba(24, 119, 242, 0.3)",
      svg: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
        </svg>
      )
    },
    {
      bg: "#25D366",
      shadow: "0 10px 20px rgba(37, 211, 102, 0.3)",
      svg: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403 0 9.797-4.394 9.8-9.8.001-2.615-1.012-5.074-2.855-6.918-1.843-1.844-4.298-2.858-6.914-2.859-5.406 0-9.8 4.394-9.803 9.8-.001 1.562.417 3.09 1.21 4.475l-.994 3.633 3.731-.982z" />
        </svg>
      )
    },
    {
      bg: "#ffffff",
      shadow: "0 10px 20px rgba(0, 0, 0, 0.08)",
      svg: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
          <path d="M16.5 3L5.5 22H11L22 3H16.5Z" fill="#FBBC05" />
          <path d="M5.5 22L16.5 3H11L0 22H5.5Z" fill="#4285F4" />
        </svg>
      )
    },
    {
      bg: "#000000",
      shadow: "0 10px 20px rgba(0, 0, 0, 0.4)",
      svg: (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.86-.74-3.99-1.72-.08-.07-.17-.17-.25-.26V14c0 2.22-.62 4.57-2.23 6.13-1.61 1.57-3.99 2.23-6.22 1.97-2.23-.26-4.38-1.57-5.54-3.53-1.16-1.97-1.31-4.57-.46-6.66.85-2.09 2.73-3.73 4.96-4.17 1.05-.21 2.15-.17 3.2.08V1.7c-1.28-.24-2.61-.26-3.91.03-1.89.41-3.66 1.49-4.81 3.09-1.15 1.6-1.57 3.66-1.28 5.66.29 2 .12 4.09.91 5.97 1.16 2.77 3.73 4.81 6.78 5.25 3.05.44 6.22-.62 8.08-3.09 1.86-2.47 2.15-5.83 1.28-8.83-.87-3-3.23-5.36-6.28-5.81V.02z" />
        </svg>
      )
    },
    {
      bg: "#0A66C2",
      shadow: "0 10px 20px rgba(10, 102, 194, 0.3)",
      svg: (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      )
    },
    {
      bg: "#FF0000",
      shadow: "0 10px 20px rgba(255, 0, 0, 0.3)",
      svg: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163c-.272-1.022-1.074-1.826-2.097-2.099C19.537 3.5 12 3.5 12 3.5s-7.537 0-9.401.564C2.576 4.337 1.774 5.141 1.502 6.163.937 8.03.937 12 .937 12s0 3.97.565 5.837c.272 1.022 1.074 1.826 2.097 2.099C4.463 20.5 12 20.5 12 20.5s7.537 0 9.401-.564c1.023-.273 1.825-1.077 2.097-2.099.565-1.867.565-5.837.565-5.837s0-3.97-.565-5.837zm-14.28 9.53V8.307L15.348 12l-6.13 3.693z" />
        </svg>
      )
    },
    {
      bg: "#4A154B",
      shadow: "0 10px 20px rgba(74, 21, 75, 0.3)",
      svg: (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.523H8.823a2.528 2.528 0 0 1-2.52-2.523zm0-6.303A2.528 2.528 0 0 1 8.823 6.34a2.528 2.528 0 0 1 2.52 2.522v2.52H8.823a2.528 2.528 0 0 1-2.52-2.52zm0-1.26a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.52 2.522v5.043a2.528 2.528 0 0 1-2.52 2.522 2.528 2.528 0 0 1-2.52-2.522V7.602zm11.341 1.26a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.522 2.522 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52 2.52h-5.043a2.528 2.528 0 0 1-2.52-2.52 2.528 2.528 0 0 1 2.52-2.522h5.043a2.528 2.528 0 0 1 2.52 2.522zm0 6.303a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.52-2.523v-2.52h2.52a2.528 2.528 0 0 1 2.52 2.52zm0 1.26a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.52-2.523v-5.043a2.528 2.528 0 0 1 2.52-2.522 2.528 2.528 0 0 1 2.52 2.522v5.043z" />
        </svg>
      )
    }
  ];

  const handleIconHover = (idx) => {
    const item = physicsState.current[idx];
    if (item) {
      item.vy = -5.0 - Math.random() * 3.0; // Jump up
      item.vx = (Math.random() - 0.5) * 4.0; // Side scatter
      item.vRotation = (Math.random() - 0.5) * 15; // Extra spin
    }
  };

  useEffect(() => {
    let animationFrameId;
    const gravity = 0.12;
    const bounce = -0.62;
    const friction = 0.98;

    const updatePhysics = () => {
      physicsState.current.forEach((item, idx) => {
        item.vy += gravity;
        item.x += item.vx;
        item.y += item.vy;
        item.rotation += item.vRotation;

        // Bounce off bottom (at 93% height)
        if (item.y > 93) {
          item.y = 93;
          item.vy = item.vy * bounce;
          item.vx *= friction;
          item.vRotation *= 0.85;

          // Add subtle automated jump if resting
          if (Math.abs(item.vy) < 0.15 && Math.random() < 0.006) {
            item.vy = -2.5 - Math.random() * 2.5;
            item.vx = (Math.random() - 0.5) * 2.0;
            item.vRotation = (Math.random() - 0.5) * 8;
          }
        }

        // Bounce off sides
        if (item.x < 4) {
          item.x = 4;
          item.vx = -item.vx * 0.7;
        } else if (item.x > 96) {
          item.x = 96;
          item.vx = -item.vx * 0.7;
        }

        // DOM Update
        const el = iconRefs.current[idx];
        if (el) {
          el.style.left = `${item.x}%`;
          el.style.top = `${item.y}%`;
          el.style.transform = `translate(-50%, -50%) rotate(${item.rotation}deg)`;
        }
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    updatePhysics();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);



  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;
      let msg = data?.message || data?.errors?.email?.[0];
      if (status === 500) {
        msg = msg || (typeof data === 'string' ? 'Server error. See details below.' : 'Server error (500). Ensure backend is running (cd backend && php artisan serve) and database is set up (php artisan migrate && php artisan db:seed).');
      } else if (err.code === 'ERR_NETWORK' || !status) {
        msg = 'Cannot reach API. Start the backend: cd backend && php artisan serve';
      }
      setError(msg || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row items-stretch justify-between overflow-hidden bg-slate-950 text-gray-800 relative select-none">
      
      {/* Decorative background blurs / overlays */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-5 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-300/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-200/10 rounded-full blur-3xl pointer-events-none" />

      {/* LEFT PANEL: Animated Illustration and Dashboard Workspace */}
      <div 
        className="hidden lg:flex flex-[1.2] relative flex-col justify-between p-12 overflow-hidden select-none z-10"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Loop video background (contained to left panel) */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover object-top opacity-85 z-0"
        >
          <source src="/PixVerse_V6_Image_Text_540P_Create_an_ultrapre.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-slate-950/20 z-0 pointer-events-none" />
        
        {/* Top brand indicator */}
        <div className="flex items-center gap-3 z-10">
          <img src="/logo/logo1.png" alt="V-Sparkz" className="h-10 w-10 object-contain" />
          <span className="text-xl font-bold tracking-tight text-white">
            V-Sparkz <span className="text-blue-400 font-semibold">Digital</span>
          </span>
        </div>

        {/* Central visual container with absolute positioned floating cards */}
        <div className="relative w-full h-[550px] flex items-center justify-center z-10">
          
          {/* FLOATING ELEMENTS: Interactive Dashboard Cards (Draggable, magnetic to mouse) */}
          
          {/* 1. Total Reach Card */}
          <motion.div 
            className="absolute top-12 left-6 bg-white/30 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 w-44 z-30 cursor-grab active:cursor-grabbing select-none"
            drag
            dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
            whileHover={{ scale: 1.05, rotate: 1 }}
            style={{ x: springX, y: springY }}
          >
            {/* Bobbing effect wrapped inside */}
            <div className="float-slow">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-medium text-slate-400">Total Reach</span>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">+32.5%</span>
              </div>
              <div className="text-xl font-bold text-slate-800">24.8K</div>
              <div className="h-6 mt-2 flex items-end gap-1">
                <div className="w-full h-[30%] bg-blue-100 rounded-sm"></div>
                <div className="w-full h-[45%] bg-blue-200 rounded-sm"></div>
                <div className="w-full h-[35%] bg-blue-100 rounded-sm"></div>
                <div className="w-full h-[60%] bg-blue-300 rounded-sm"></div>
                <div className="w-full h-[80%] bg-blue-500 rounded-sm"></div>
              </div>
            </div>
          </motion.div>

          {/* 2. Conversions Card */}
          <motion.div 
            className="absolute top-52 left-[-16px] bg-white/30 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 w-40 z-30 cursor-grab active:cursor-grabbing select-none"
            drag
            dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
            whileHover={{ scale: 1.05, rotate: -1 }}
            style={{ x: springX, y: springY }}
          >
            <div className="float-medium">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-medium text-slate-400">Conversions</span>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">+28.1%</span>
              </div>
              <div className="text-xl font-bold text-slate-800">2.35K</div>
              <div className="h-5 mt-2 flex items-end gap-1">
                <div className="w-full h-[40%] bg-cyan-300 rounded-sm"></div>
                <div className="w-full h-[70%] bg-cyan-400 rounded-sm"></div>
                <div className="w-full h-[50%] bg-cyan-300 rounded-sm"></div>
                <div className="w-full h-[90%] bg-cyan-500 rounded-sm"></div>
              </div>
            </div>
          </motion.div>

          {/* 3. Traffic Card */}
          <motion.div 
            className="absolute top-8 right-16 bg-white/30 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 w-44 z-30 cursor-grab active:cursor-grabbing select-none"
            drag
            dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
            whileHover={{ scale: 1.05, rotate: 1.5 }}
            style={{ x: springX, y: springY }}
          >
            <div className="float-rotate">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-medium text-slate-400">Traffic</span>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">+18.2%</span>
              </div>
              <div className="text-xl font-bold text-slate-800">18.6K</div>
              <div className="h-6 mt-2 flex items-end gap-1">
                <div className="w-full h-[20%] bg-indigo-100 rounded-sm"></div>
                <div className="w-full h-[40%] bg-indigo-200 rounded-sm"></div>
                <div className="w-full h-[60%] bg-indigo-300 rounded-sm"></div>
                <div className="w-full h-[50%] bg-indigo-200 rounded-sm"></div>
                <div className="w-full h-[90%] bg-indigo-500 rounded-sm"></div>
              </div>
            </div>
          </motion.div>

          {/* 4. Top Channels Pie Chart Card */}
          <motion.div 
            className="absolute bottom-8 right-[-10px] bg-white/30 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/20 w-52 z-30 cursor-grab active:cursor-grabbing select-none"
            drag
            dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
            dragElastic={0.1}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
            whileHover={{ scale: 1.05, rotate: -1 }}
            style={{ x: springX, y: springY }}
          >
            <div className="float-slow">
              <div className="text-[11px] font-semibold text-slate-500 mb-2">Top Channels</div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[conic-gradient(#3b82f6_0%_48%,#10b981_48%_76%,#f59e0b_76%_100%)] relative flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-white"></div>
                </div>
                <div className="text-[10px] space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-slate-600">Social Media (48%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">SEO (28%)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    <span className="text-slate-600">Paid Ads (24%)</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* FLOATING SOCIAL ICONS & SYMBOLS (Draggable, parallax magnetic) */}
          
          {/* Instagram Icon */}
          <motion.div 
            className="absolute top-28 left-[220px] w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 p-0.5 shadow-md z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, rotate: 10 }}
            style={{ x: springX, y: springY }}
          >
            <div className="float-fast w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <svg className="w-6 h-6 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </div>
          </motion.div>

          {/* Facebook Icon */}
          <motion.div 
            className="absolute top-48 left-16 w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, rotate: -10 }}
            style={{ x: springX, y: springY }}
          >
            <svg className="float-slow w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
            </svg>
          </motion.div>

          {/* Google Ads Icon */}
          <motion.div 
            className="absolute top-[280px] left-[180px] w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg border border-slate-100 z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, rotate: 12 }}
            style={{ x: springX, y: springY }}
          >
            <svg className="float-medium w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M16.5 3L5.5 22H11L22 3H16.5Z" fill="#FBBC05" />
              <path d="M5.5 22L16.5 3H11L0 22H5.5Z" fill="#4285F4" />
            </svg>
          </motion.div>

          {/* Message Bubble Icon */}
          <motion.div 
            className="absolute top-[160px] right-[240px] w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center shadow-sm z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, y: -5 }}
            style={{ x: springX, y: springY }}
          >
            <svg className="float-fast w-5 h-5 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
          </motion.div>

          {/* Mail Envelope Icon */}
          <motion.div 
            className="absolute top-2 right-[270px] w-11 h-11 rounded-xl bg-blue-500 flex items-center justify-center shadow-md z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, rotate: -5 }}
            style={{ x: springX, y: springY }}
          >
            <svg className="float-slow w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </motion.div>

          {/* Target Icon */}
          <motion.div 
            className="absolute top-[180px] right-24 w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-md z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, rotate: 180 }}
            transition={{ type: "spring", stiffness: 200 }}
            style={{ x: springX, y: springY }}
          >
            <svg className="float-medium w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 6.364A9 9 0 113 12a9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
            </svg>
          </motion.div>

          {/* Paper Airplane Icon */}
          <motion.div 
            className="absolute top-2 right-4 w-12 h-12 flex items-center justify-center z-30 cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, right: 50, top: -50, bottom: 50 }}
            whileHover={{ scale: 1.15, x: 5, y: -5 }}
            style={{ x: springX, y: springY }}
          >
            <svg className="float-rotate w-8 h-8 text-blue-500 fill-current drop-shadow-md" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </motion.div>

        </div>

        {/* Bottom tagline / footer info */}
        <div className="z-10">
          <h2 className="text-3xl font-extrabold text-white tracking-tight leading-none mb-2">Back to Work ⚡</h2>
          <p className="text-slate-300 font-medium text-sm">New ideas. New goals. Big impact.</p>
        </div>

      </div>

      {/* RIGHT PANEL: Sleek Login Form and Interface */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:max-w-2xl bg-white shadow-2xl lg:border-l lg:border-slate-200/50 relative z-10">
        <div className="w-full max-w-md space-y-8">
          
          {/* Logo & Mobile Brand */}
          <div className="text-center lg:text-left space-y-4">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <img src="/logo/logo1.png" alt="V-Sparkz" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold tracking-tight text-slate-800">
                V-Sparkz <span className="text-blue-600 font-semibold">Digital</span>
              </span>
            </div>
            
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Sign In</h1>
            <p className="text-slate-500 font-medium text-sm">Welcome back! Access your marketing portal below.</p>
          </div>

          {/* Backend Connection status banner */}
          <div className="p-4 rounded-2xl bg-[#eef4f8] border border-slate-200/40 text-sm">
            {backendStatus === null && (
              <div className="flex items-center gap-2 text-blue-500">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                <span className="font-semibold">Verifying connection to server...</span>
              </div>
            )}
            {backendStatus === true && (
              <div className="flex items-center gap-2 text-emerald-600">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                <span className="font-semibold">Local MySQL Server Connected</span>
              </div>
            )}
            {backendStatus === false && (
              <div className="space-y-2 text-rose-600">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full" />
                  <p className="font-semibold">Server Offline</p>
                </div>
                <p className="text-xs text-rose-500">Please start the PHP backend by running the local runner batch file:</p>
                <code className="block text-xs bg-rose-50 p-2 rounded border border-rose-100 font-mono text-rose-700">backend/run-backend.bat</code>
                <button type="button" onClick={checkBackend} className="text-xs font-semibold underline text-blue-600 hover:text-blue-700 mt-2 block">Retry connection</button>
              </div>
            )}
          </div>

          {/* FORM ELEMENT */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm font-medium leading-relaxed">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Email Address</label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@vsparkzdigital.com"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-slate-800 placeholder-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-400">Password</label>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-slate-800 placeholder-slate-400 font-medium transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </button>
          </form>

          <div className="pt-6 text-center border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} V-Sparkz Digital. All rights reserved.</p>
          </div>

        </div>
      </div>

      {/* Physics-based Falling and Bouncing 3D Social Icons at the Bottom (Overlaying the entire screen) */}
      <div className="absolute inset-0 pointer-events-none z-30">
        {physicsIcons.map((icon, idx) => (
          <div
            key={idx}
            ref={(el) => (iconRefs.current[idx] = el)}
            className="absolute w-12 h-12 rounded-2xl shadow-xl flex items-center justify-center cursor-pointer pointer-events-auto border border-white/20 select-none transition-shadow hover:shadow-2xl active:scale-95"
            style={{
              background: icon.bg,
              boxShadow: icon.shadow,
              top: '-50px',
              left: '50%',
            }}
            onMouseEnter={() => handleIconHover(idx)}
          >
            {icon.svg}
          </div>
        ))}
      </div>

    </div>
  );
}
