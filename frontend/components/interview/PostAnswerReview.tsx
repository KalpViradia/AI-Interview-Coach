import React from "react";
import { motion } from "framer-motion";

interface PostAnswerReviewProps {
  children: React.ReactNode;
}

export function PostAnswerReview({ children }: PostAnswerReviewProps) {
  return (
    <motion.div
      key="evaluation"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex flex-col space-y-6"
    >
      {children}
    </motion.div>
  );
}
