'use client';

import React from 'react';
import Link from 'next/link';
import { deleteTheme } from '@/app/admin/themes/actions'; // Adjust path if needed

interface ThemeActionsProps {
  themeId: string;
}

export default function ThemeActions({ themeId }: ThemeActionsProps) {

  const handleDeleteSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const confirmed = window.confirm('Are you sure you want to delete this theme?');
    if (!confirmed) {
      event.preventDefault();
    }
    // If confirmed, the form submission proceeds naturally.
  };

  // Bind the themeId to the deleteTheme server action
  const deleteThemeWithId = deleteTheme.bind(null, themeId);

  return (
    <div className="flex item-center justify-center">
      <Link
        href={`/admin/themes/${themeId}/edit`}
        className="text-blue-600 hover:text-blue-800 hover:underline mr-4 transition duration-300"
      >
        Edit
      </Link>
      <form action={deleteThemeWithId} onSubmit={handleDeleteSubmit}>
        <button
          type="submit"
          className="text-red-600 hover:text-red-800 hover:underline transition duration-300"
        >
          Delete
        </button>
      </form>
    </div>
  );
}