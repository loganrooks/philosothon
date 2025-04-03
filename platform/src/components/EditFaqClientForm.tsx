'use client'; // Required for useFormState

import React from 'react';
import { useFormState } from 'react-dom';
import FaqForm from '@/components/FaqForm';
import { FormState, FaqItem } from '@/lib/definitions'; // Import shared types

// Wrapper component to use the hook
export default function EditFaqClientForm({ // Make default export
  initialData,
  updateAction,
}: {
  initialData: FaqItem;
  updateAction: (prevState: FormState, formData: FormData) => Promise<FormState>;
}) {
  const initialState: FormState = { message: null, success: false, errors: {} };
  const [state, dispatch] = useFormState(updateAction, initialState);

  return <FaqForm initialData={initialData} action={dispatch} state={state} />;
}