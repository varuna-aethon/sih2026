import React, { useRef } from 'react';

export default function OtpInput({ value, onChange }) {
  const inputRefs = useRef([]);

  const handleInputChange = (index, e) => {
    const rawChar = e.target.value.slice(-1); // get last entered character
    if (!/^[0-9A-Za-z]$/.test(rawChar) && rawChar !== '') return;

    const newOtp = [...value];
    newOtp[index] = rawChar.toUpperCase();
    onChange(newOtp);

    // Auto-advance to next input if filled
    if (rawChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current is empty, delete previous and move back
        const newOtp = [...value];
        newOtp[index - 1] = '';
        onChange(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...value];
        newOtp[index] = '';
        onChange(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().slice(0, 6).toUpperCase();
    if (!pastedData) return;

    const newOtp = [...value];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    onChange(newOtp);

    // Focus last filled index or next available
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="otp-container" onPaste={handlePaste}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[i] || ''}
          onChange={(e) => handleInputChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`otp-box mono ${value[i] ? 'filled' : ''}`}
          aria-label={`Security Code Digit ${i + 1}`}
          autoComplete="off"
          size={1}
        />
      ))}
    </div>
  );
}
