'use client'; // Required for useFormState

import React from 'react';
import { useFormState } from 'react-dom';
import FaqForm from '@/components/FaqForm'; // Adjust import path if necessary
import { addFaqItem } from '../actions';
import { FormState } from '@/lib/definitions'; // Import shared type

export default function AddNewFaqPage() {
  const initialState: FormState = { message: null, success: false, errors: {} };
  const [state, dispatch] = useFormState(addFaqItem, initialState);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        Add New FAQ Item
      </h1>
      <div className="max-w-2xl">
        <FaqForm
          action={dispatch} // Pass the dispatch function from the hook
          state={state}     // Pass the state from the hook
        />
      </div>
    </div>
  );
}