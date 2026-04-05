import { useState, useEffect } from 'react';

export const Timer = ({ deadline, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!deadline) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = new Date(deadline).getTime() - now;

      if (distance <= 0) {
        setTimeLeft(0);
        onExpire && onExpire();
        return;
      }

      setTimeLeft(Math.floor(distance / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, onExpire]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = timeLeft <= 60; // Last minute

  return (
    <div className={`timer ${isUrgent ? 'urgent' : ''}`}>
      <div className="timer-display">
        {formatTime(timeLeft)}
      </div>
      <div className="timer-label">
        {timeLeft === 0 ? 'Expired' : 'Time Left'}
      </div>
    </div>
  );
};