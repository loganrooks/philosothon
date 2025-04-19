'use client';

import React, { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { createRegistration } from '../actions'; // Assuming the action exists

// Define types for form data and steps if needed (optional for minimal pass)
// interface FormData { ... }

const initialState = {
  success: false,
  message: '', // Initialize message as an empty string
  errors: null,
};

// Placeholder component to satisfy initial test import
export function RegistrationForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({}); // Basic state for form data
  const [state, formAction] = useFormState(createRegistration, initialState);
  const { pending } = useFormStatus();

  const totalSteps = 4; // Assuming 4 steps based on test

  const handleNext = () => {
    // Add validation logic here later if needed by tests
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    // Basic handler, needs expansion for checkboxes etc.
    setFormData(prev => ({
      ...prev,
      [name]: value, // Directly using value for simplicity now
    }));
  };


  // Minimal rendering based on step to pass tests
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <h2>Step 1: Basic Information</h2>
            <label htmlFor="full_name">Full Name</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              onChange={handleChange}
              value={(formData as any).full_name || ''} // Basic value binding
              required
            />
            {/* Add other step 1 fields as tests require */}
          </div>
        );
      case 2:
        return <h2>Step 2: Availability & Background</h2>;
      case 3:
        return <h2>Step 3: Theme Preferences</h2>;
      case 4:
        return <h2>Step 4: Workshop Preferences & Confirmation</h2>;
      default:
        return <div>Unknown Step</div>;
    }
  };

  return (
    <form action={formAction}>
      {renderStepContent()}

      {/* Display general messages */}
      {state?.message && !state.success && <p style={{ color: 'red' }}>{state.message}</p>}
      {state?.message && state.success && <p style={{ color: 'green' }}>{state.message}</p>}


      <div style={{ marginTop: '20px' }}>
        {currentStep > 1 && (
          <button type="button" onClick={handlePrevious} disabled={pending}>
            Previous
          </button>
        )}
        {currentStep < totalSteps && (
          <button type="button" onClick={handleNext} disabled={pending}>
            Next
          </button>
        )}
        {currentStep === totalSteps && (
          <button type="submit" disabled={pending}>
            {pending ? 'Submitting...' : 'Submit Registration'}
          </button>
        )}
      </div>
    </form>
  );
}