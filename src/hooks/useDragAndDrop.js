import { useState, useRef } from 'react';

export const useDragAndDrop = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef();

  const handleMouseDown = (e, item) => {
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setDraggedItem(item);
    
    const handleMouseMove = (e) => {
      if (dragRef.current) {
        const containerRect = dragRef.current.getBoundingClientRect();
        dragRef.current.style.left = `${e.clientX - containerRect.left - offset.x}px`;
        dragRef.current.style.top = `${e.clientY - containerRect.top - offset.y}px`;
      }
    };

    const handleMouseUp = (e) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      setDraggedItem(null);
      
      if (dragRef.current) {
        const containerRect = e.currentTarget.closest('.game-board').getBoundingClientRect();
        const finalPosition = {
          x: e.clientX - containerRect.left - offset.x,
          y: e.clientY - containerRect.top - offset.y
        };
        
        return finalPosition;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    draggedItem,
    dragRef,
    handleMouseDown
  };
};