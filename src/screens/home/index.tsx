import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "../../../constants";
import { Button } from "../../components/ui/button";
import { Pen, Eraser, X, Brain } from 'lucide-react';
import axios from "axios";
import '../../index.css';

type StrokeWidth = 'Thin' | 'Medium' | 'Thick';
type Tool = 'pen' | 'eraser';

const STROKE_MAP: Record<StrokeWidth, number> = {
  Thin: 2,
  Medium: 5,
  Thick: 10,
};

const ERASER_MAP: Record<StrokeWidth, number> = {
  Thin: 10,
  Medium: 20,
  Thick: 40,
};

interface AnalysisResult {
  expr: string;
  result: string;
  mental_health_rating?: number;
  isError?: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState("rgb(0,0,0)");
  const [stroke, setStroke] = useState<StrokeWidth>('Thin');

  const [dicOfVars, setDictOfVars] = useState({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    setAnalysisResult(null);
    setShowResultModal(false);
  }

  useEffect(() => {
    document.body.className = 'bg-gray-100';
    const canvas = canvasRef.current;
    const mainEl = mainContainerRef.current;

    const setCanvasSize = () => {
      if (canvas && mainEl) {
        const style = getComputedStyle(mainEl);
        const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        const paddingY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
        
        canvas.width = mainEl.clientWidth - paddingX;
        canvas.height = mainEl.clientHeight - paddingY;
        
        clearCanvas();
      }
    };
    
    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  const sendData = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setAnalysisResult({ expr: "Analyzing...", result: "Please wait while the AI processes your drawing."});
      setShowResultModal(true);
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/calculate`,
          {
            image: canvas.toDataURL("image/png"),
            dict_of_vars: dicOfVars,
          }
        );
        
        const resp = await response.data;
        if (resp.data && resp.data.length > 0) {
            const firstResult = resp.data[0];
            setAnalysisResult({ 
                expr: firstResult.expr, 
                result: firstResult.result,
                mental_health_rating: firstResult.mental_health_rating
            });

            resp.data.forEach((data: { assign: boolean, expr: string, result: string, mental_health_rating?: number }) => {
                if (data.assign) {
                    setDictOfVars((prev) => ({ ...prev, [data.expr]: data.result }));
                }
            });
        } else {
            setAnalysisResult({ expr: "Interpretation Error", result: "Could not interpret the drawing. Please try again.", isError: true });
        }

      } catch (error) {
        setAnalysisResult({ expr: "Network Error", result: "An error occurred while anaylzing the image.", isError: true });
        console.error("Error sending data:", error);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setAnalysisResult(null);
    setShowResultModal(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        if(e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        if(e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const offsetX = clientX - rect.left;
    const offsetY = clientY - rect.top;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      if (tool === 'pen') {
        // Pen tool - draw with selected color
        ctx.lineWidth = STROKE_MAP[stroke];
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
      } else if (tool === 'eraser') {
        ctx.lineWidth = ERASER_MAP[stroke];
        ctx.strokeStyle = "white";
        ctx.lineCap = "round";
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke()
      }
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 7) return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' };
    if (rating >= 5) return { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200' };
    return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' };
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return 'Excellent';
    if (rating >= 7) return 'Good';
    if (rating >= 5) return 'Moderate';
    if (rating >= 3) return 'Poor';
    return 'Critical';
  };

  return (
    <div className="h-dvh bg-gradient-to-br from-purple-200 via-blue-100 to-pink-100 flex flex-col p-4">
      <div className="flex-1 flex flex-col gap-4 min-h-0">

      {/* Top section: Title */}
            <div className="flex flex-col items-center justify-center mt-3 text-xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Draw What You Feel!</h1>
                <p className="text-sm text-gray-500">Create sketches and let AI decode their meaning</p>
            </div>

        {/* Unified header and toolbar */}
        <header className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            {/* Toolbar Section - Centered with proper div structure */}
            <div className="flex w-full justify-evenly items-center">
                {/* Left Section: Tools */}
                <div className="flex items-center gap-3 py-2">
                    <Button
                        variant={tool === 'pen' ? 'default' : 'outline'}
                        onClick={() => setTool('pen')}
                        className={`flex items-center gap-2 px-8 py-2 ${
                            tool === 'pen' 
                                ? "bg-gray-800 text-white hover:bg-gray-700" 
                                : "text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <Pen size={16} />
                        Pen
                    </Button>
                    
                    <Button
                        variant={tool === 'eraser' ? 'default' : 'outline'}
                        onClick={() => setTool('eraser')}
                        className={`flex items-center gap-2 px-5 py-2 ${
                            tool === 'eraser' 
                                ? "bg-gray-800 text-white hover:bg-gray-700" 
                                : "text-gray-600 border-gray-300 hover:bg-gray-50"
                        }`}
                    >
                        <Eraser size={16} />
                        Eraser
                    </Button>

                    <Button
                        onClick={clearCanvas}
                        variant="outline"
                        className="px-4 py-2 text-gray-500 border-gray-300 hover:bg-gray-50"
                        disabled={false}
                    >
                        Reset
                    </Button>
                </div>

                {/* Center Section: Colors (only show when pen tool is selected) */}
                {tool === 'pen' && (
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-gray-700">colors:</span>
                        <div className="flex items-center gap-2 ml-2">
                            {SWATCHES.map((swatchColor) => (
                                <div
                                    key={swatchColor}
                                    onClick={() => setColor(swatchColor)}
                                    className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-200 ${
                                        color === swatchColor 
                                            ? 'border-gray-800 ring-2 ring-gray-300' 
                                            : 'border-gray-200 hover:border-gray-400'
                                    }`}
                                    style={{ backgroundColor: swatchColor }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Right Section: Analyze Button and Stroke Controls */}
                <div className="flex items-center gap-4">
                    <Button 
                        onClick={sendData} 
                        className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-2 font-medium"
                    >
                        Analyse
                    </Button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Stroke:</span>
                        <div className="flex items-center gap-1 ml-2">
                            {(['Thin', 'Medium', 'Thick'] as StrokeWidth[]).map((strokeWidth) => (
                                <label key={strokeWidth} className="flex items-center cursor-pointer">
                                    <input
                                        type="radio"
                                        name="stroke"
                                        checked={stroke === strokeWidth}
                                        onChange={() => setStroke(strokeWidth)}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                        stroke === strokeWidth 
                                            ? 'border-gray-800 bg-gray-800' 
                                            : 'border-gray-300 hover:border-gray-400'
                                    }`}>
                                        {stroke === strokeWidth && (
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        )}
                                    </div>
                                    <span className={`ml-2 text-sm ${
                                        stroke === strokeWidth ? 'text-gray-800 font-medium' : 'text-gray-600'
                                    }`}>
                                        {strokeWidth}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </header>

        {/* Main canvas area */}
        <main ref={mainContainerRef} className="flex-1 min-h-0">
            <canvas
            ref={canvasRef}
            id="canvas"
            className="bg-white rounded-lg w-full h-full border-2 border-gray-200 touch-none"
            onMouseDown={startDrawing}
            onMouseOut={stopDrawing}
            onMouseUp={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            />
        </main>

        {/* Result Modal */}
        {showResultModal && analysisResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden ${
              analysisResult.isError ? 'border-red-200' : 'border-blue-200'
            } border-2`}>
              
              {/* Close Button */}
              <button 
                onClick={() => setShowResultModal(false)}
                className="absolute top-4 right-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>

              {/* Rating Circle - Top Right */}
              {analysisResult.mental_health_rating && (
                <div className="absolute top-4 right-16 z-10">
                  <div className={`w-16 h-16 rounded-full ${getRatingColor(analysisResult.mental_health_rating).bg} flex items-center justify-center shadow-lg`}>
                    <div>
                      <div className="text-white font-bold text-lg">{analysisResult.mental_health_rating}</div>
                      <div className="text-white text-xs opacity-90">/10</div>
                    </div>
                  </div>
                  <div className={`text-xs font-medium text-center mt-1 ${getRatingColor(analysisResult.mental_health_rating).text}`}>
                    {getRatingLabel(analysisResult.mental_health_rating)}
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-3 mb-3">
                  {analysisResult.isError ? (
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <X size={20} className="text-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Brain size={20} className="text-blue-600" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {analysisResult.isError ? 'Analysis Error' : 'AI Analysis Result'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {analysisResult.isError ? 'Something went wrong' : 'Your drawing has been analyzed'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <div className={`p-4 rounded-lg ${
                  analysisResult.isError 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <h3 className="font-semibold text-gray-800 mb-2">
                    {analysisResult.expr}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {analysisResult.result}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setShowResultModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={clearCanvas}
                    className="flex-1 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    New Drawing
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
