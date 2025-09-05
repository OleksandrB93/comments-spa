import React, { useRef, useState, useEffect } from "react";

interface CaptchaProps {
  onValidate: (isValid: boolean) => void;
}

const Captcha: React.FC<CaptchaProps> = ({ onValidate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaText, setCaptchaText] = useState("");

  // Generate random characters
  const generateCaptcha = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let text = "";
    for (let i = 0; i < 6; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(text);
    return text;
  };

  // Draw text on canvas
  const drawCaptcha = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // text
    ctx.font = "24px Arial";
    ctx.fillStyle = "#333";
    ctx.setTransform(1, Math.random() * 0.3, Math.random() * 0.3, 1, 0, 0); // some distorted text
    ctx.fillText(text, 10, 30);

    // noise (lines)
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(0,0,0,${Math.random()})`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }
  };

  useEffect(() => {
    const text = generateCaptcha();
    drawCaptcha(text);
  }, []);

  const [inputValue, setInputValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onValidate(value === captchaText);
  };

  const handleRefresh = () => {
    const text = generateCaptcha();
    drawCaptcha(text);
    setInputValue("");
    onValidate(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <canvas ref={canvasRef} width={150} height={50} />
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter captcha"
          value={inputValue}
          onChange={handleChange}
          className="w-full border rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={handleRefresh}
          className="px-3 py-1 bg-gray-500 rounded"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

export default Captcha;
