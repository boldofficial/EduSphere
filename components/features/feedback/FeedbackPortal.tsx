'use client';

import { FeedbackWidget } from './FeedbackWidget';
import { FeedbackNudge } from './FeedbackNudge';

export function FeedbackPortal() {
  return (
    <>
      <FeedbackWidget />
      <FeedbackNudge />
    </>
  );
}
