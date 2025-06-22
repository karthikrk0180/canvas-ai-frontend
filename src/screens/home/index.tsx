import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "../../../constants";
import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "../../components/ui/button";
import { Pen } from 'lucide-react';
import axios from "axios";
import '../../index.css';

type StrokeWidth = 'Thin' | 'Medium' | 'Thick';

const STROKE_MAP: Record<StrokeWidth, number> = {
  Thin: 2,
  Medium: 5,
  Thick: 10,
};

interface AnalysisResult {
  expr: string;
  result: string;
  isError?: boolean;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [color, setColor] = useState("rgb(0,0,0)");
  const [stroke, setStroke] = useState<StrokeWidth>('Thin');

  const [dicOfVars, setDictOfVars] = useState({});
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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
            setAnalysisResult({ expr: firstResult.expr, result: firstResult.result });

            resp.data.forEach((data: { assign: boolean, expr: string, result: string }) => {
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
      ctx.lineWidth = STROKE_MAP[stroke];
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
    }
  };

  return (
    <div className="h-dvh bg-gray-100 flex flex-col p-4">
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Unified header and toolbar */}
        <header className="bg-white rounded-lg shadow-md border border-gray-200 p-4 space-y-4">
            {/* Top section: Title and Result */}
            <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Drawing Canvas</h1>
                    <p className="text-sm text-gray-500">Sketch your ideas and use AI to analyze your drawings</p>
                </div>
                {analysisResult && (
                    <div className={`text-sm rounded-lg p-3 w-full md:w-1/2 lg:w-1/3 ${
                        analysisResult.isError 
                        ? 'bg-red-50 border-red-200 text-red-700' 
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                    }`}>
                        <p className="font-semibold">{analysisResult.expr}</p>
                        <p>{analysisResult.result}</p>
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />

            {/* Bottom section: Toolbar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:gap-x-6">
                <div className="flex items-center gap-2">
                    <Pen size={20} className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">Pen Tool</span>
                </div>
                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">Colors:</span>
                    <Group>
                        {SWATCHES.map((swatchColor) => (
                        <ColorSwatch
                            key={swatchColor}
                            color={swatchColor}
                            onClick={() => setColor(swatchColor)}
                            size={24}
                            className={`cursor-pointer rounded-full transition-all duration-200 ${
                            color === swatchColor ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-white' : 'hover:opacity-80'
                            }`}
                        />
                        ))}
                    </Group>
                </div>
                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 hidden sm:inline">Stroke:</span>
                    {(['Thin', 'Medium', 'Thick'] as StrokeWidth[]).map((strokeWidth) => (
                        <Button 
                            key={strokeWidth}
                            variant={stroke === strokeWidth ? 'default': 'outline'}
                            size="sm"
                            onClick={() => setStroke(strokeWidth)}
                            className={stroke === strokeWidth 
                                ? "bg-blue-500 text-white border-blue-500" 
                                : "text-gray-600 border-gray-200 hover:bg-gray-50"}
                        >
                            {strokeWidth}
                        </Button>
                    ))}
                </div>
                <div className="flex-grow"></div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={clearCanvas}
                        variant="outline"
                    >
                        Reset
                    </Button>
                    <Button onClick={sendData} className="bg-blue-500 text-white hover:bg-blue-600">
                        Calculate
                    </Button>
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
      </div>
    </div>
  );
}
