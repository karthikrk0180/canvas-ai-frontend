import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "../../../constants";
import { ColorSwatch, Group } from "@mantine/core";
import { Button } from "../../components/ui/button"; // Adjust the path as needed
// import Draggable from "react-draggable";
import axios from "axios";
import '../../index.css';
import React from "react";

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const draggableRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255,255,255)");
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GeneratedResult>();
  const [dicOfVars, setDictOfVars] = useState({});

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size to full screen minus 20px padding
        canvas.width = window.innerWidth - 40; // 20px padding on each side
        canvas.height = window.innerHeight - 40; // 20px padding on each side
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }

    return () => {
      // Cleanup code if necessary
    };
  }, []);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setResult(undefined);
      setDictOfVars({});
      setReset(false);
    }
  }, [reset]);

  const renderResponseToCanvas = (expression: string, answer: string) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Set text properties
        ctx.fillStyle = "white"; // Set text color
        ctx.font = "24px Arial"; // Set font size and family
        ctx.fillText(`Expression: ${expression}`, 10, 30); // Draw expression
        ctx.fillText(`Answer: ${answer}`, 10, 60); // Draw answer
      }
    }
  };

  useEffect(() => {
    if (result) {
      renderResponseToCanvas(result.expression, result.answer);
    }
  }, [result]);

  const sendData = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/calculate`,
          {
            image: canvas.toDataURL("image/png"),
            dict_of_vars: dicOfVars,
          }
        );

        const resp = await response.data;

        resp.data.forEach((data: Response) => {
          if (data.assign) {
            setDictOfVars((prev) => ({
              ...prev,
              [data.expr]: data.result,
            }));
          }

          setTimeout(() => {
            setResult({
              expression: data.expr,
              answer: data.result,
            });
          }, 200);
        });
      } catch (error) {
        console.error("Error sending data:", error); // Log errors if any
      }
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.background = "black";
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = color;
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 p-5 items-center justify-evenly">
        <Button
          onClick={() => setReset(true)}
          className="border border-black p-2 bg-white text-black hover:bg-black hover:text-white"
          variant="default"
        >
          Reset
        </Button>

        <Group className="space-x-2">
          {SWATCHES.map((swatchColor: string) => (
            <ColorSwatch
              key={swatchColor}
              color={swatchColor}
              onClick={() => setColor(swatchColor)}
              size={32}
            />
          ))}
        </Group>

        <Button
          onClick={sendData}
          className="border border-black p-2 bg-white text-black hover:bg-black hover:text-white"
          variant="default"
        >
          Calculate
        </Button>
      </div>

      <div className="flex justify-center items-center min-h-screen">
        <canvas
          ref={canvasRef}
          id="canvas"
          className="rounded-lg bg-black border-2 border-gray-600"
          onMouseDown={startDrawing}
          onMouseOut={stopDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          style={{ 
            width: `calc(100vw - 40px)`, // 20px padding from each side
            height: `calc(100vh - 40px)`  // 20px padding from each side
          }} 
        />
      </div>
    </>
  );
}
