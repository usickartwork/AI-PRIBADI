import React from "react";
import { PieceSymbol, Color } from "chess.js";

interface PieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

export const ChessPieceIcon: React.FC<PieceProps> = ({ type, color, className = "w-full h-full p-1" }) => {
  const isWhite = color === "w";
  const fill = isWhite ? "#ffffff" : "#18181b";
  const stroke = isWhite ? "#27272a" : "#fafafa";
  const innerDetail = isWhite ? "#e4e4e7" : "#3f3f46";

  switch (type) {
    case "p": // PAWN
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none">
          <circle cx="22.5" cy="12" r="6" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M19 18c-3 3-5 7-5 13h17c0-6-2-10-5-13" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M11 36h23c0-3-4-5-11.5-5S11 33 11 36z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M12 39h21v2H12z" fill={fill} stroke={stroke} strokeWidth="1.8" />
        </svg>
      );

    case "r": // ROOK
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none">
          <path d="M12 38h21v3H12z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M13 35h19c0-3-3-4-4-5H17c-1 1-4 2-4 5z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M16 17h13l-1.5 13h-10L16 17z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path d="M14 11h3v4h4v-4h3v4h4v-4h3v6H14v-6z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="22.5" cy="23" r="1.5" fill={innerDetail} />
        </svg>
      );

    case "n": // KNIGHT
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none">
          <path d="M11.5 38.5h22v2.5h-22z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <path
            d="M13 36c0-3 3-4 6-5 0-3-2-5-4-8-1-1.5-1.5-4 1-6 2-1.5 6-1 8 1 2 2 4 5 4 8 2 0 5 1 5 4 0 3-3 4-5 5-2 1-5 1-8 1H13z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
          />
          <circle cx="20" cy="18" r="1.5" fill={stroke} />
          <path d="M26 25c1.5-1 3-1 4.5 0" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "b": // BISHOP
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none">
          <circle cx="22.5" cy="9.5" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path
            d="M17 38h11v2.5H17zM15 35.5h15c0-2-2-3-4-4.5-1.5-1-1.5-3-1.5-5 3-2 5-6 5-10 0-4-3-7-7-7s-7 3-7 7c0 4 2 8 5 10 0 2 0 4-1.5 5-2 1.5-4 2.5-4 4.5z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
          />
          <path d="M22.5 16v10M19 19.5h7" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "q": // QUEEN
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none">
          <circle cx="10" cy="14" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="16" cy="10" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="22.5" cy="8.5" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="29" cy="10" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="35" cy="14" r="2" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path
            d="M11 17l4 11h15l4-11-6 6-5.5-9-5.5 9-6-6z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M14 31h17l-1 5H15l-1-5zM11.5 38.5h22v2.5h-22z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="22.5" cy="24" r="2" fill={innerDetail} />
        </svg>
      );

    case "k": // KING
      return (
        <svg viewBox="0 0 45 45" className={className} fill="none">
          <path d="M22.5 7v6M19.5 9.5h6" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path
            d="M14.5 16c0 0 3-2 8-2s8 2 8 2c2 3 2.5 7 1 10-1.5 3-4 4.5-4 5.5h-10c0-1-2.5-2.5-4-5.5-1.5-3-1-7 1-10z"
            fill={fill}
            stroke={stroke}
            strokeWidth="1.8"
          />
          <path d="M14 34h17l-1 4H15l-1-4zM11.5 40.5h22v2.5h-22z" fill={fill} stroke={stroke} strokeWidth="1.8" />
          <circle cx="22.5" cy="22" r="2.5" fill={innerDetail} />
        </svg>
      );

    default:
      return null;
  }
};
