import React from 'react';
import { Check } from 'lucide-react';
import { useT } from '../i18n/useT';

const STEPS = ['Delivery Address', 'Payment Method', 'Order Summary'];

// step: 1-3 = that step is current; 4 = everything finished.
const CheckoutStepper = ({ step }) => {
  const { t } = useT();
  return (
  <ol className="stepper" aria-label={t('step.aria')}>
    {STEPS.map((label, i) => {
      const n = i + 1;
      const state = n < step ? 'done' : n === step ? 'current' : 'todo';
      return (
        <li key={label} className={`stepper-item ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="stepper-dot">{state === 'done' ? <Check size={14} strokeWidth={3} /> : n}</span>
          <span className="stepper-label">{t(`step.${i}`)}</span>
        </li>
      );
    })}
  </ol>
  );
};

export default CheckoutStepper;
